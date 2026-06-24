import { cacheGet, cacheSet, withRetry } from "@/lib/cache/memory-cache";

const BASE = "https://supercharge.info/service/supercharge";
const CACHE_KEY = "supercharge:charts:v1";
const CACHE_TTL_MS = 10 * 60 * 1000;

export interface StallCountPoint {
  date: string;
  stallCount: number;
}

export interface SuperchargeChartsPayload {
  stallHistory: StallCountPoint[];
  changesByDate: Record<string, Record<string, number>>;
  lastModified: string;
  fetched_at: string;
  source: string;
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await withRetry(async () => {
    const response = await fetch(`${BASE}${path}`, {
      next: { revalidate: 600 },
    });
    if (!response.ok) throw new Error(`supercharge.info ${path} ${response.status}`);
    return response;
  });
  return res.json() as Promise<T>;
}

export async function fetchSuperchargeCharts(force = false): Promise<SuperchargeChartsPayload> {
  if (!force) {
    const cached = cacheGet<SuperchargeChartsPayload>(CACHE_KEY);
    if (cached) return cached;
  }

  const [stallHistory, changesByDate, dbInfo] = await Promise.all([
    fetchJson<StallCountPoint[]>("/site/stallCount"),
    fetchJson<Record<string, Record<string, number>>>("/changesByDate"),
    fetchJson<{ lastModifiedString?: string; lastModified?: number }>("/databaseInfo"),
  ]);

  const payload: SuperchargeChartsPayload = {
    stallHistory,
    changesByDate,
    lastModified: dbInfo.lastModifiedString ?? new Date().toISOString(),
    fetched_at: new Date().toISOString(),
    source: "supercharge.info",
  };

  cacheSet(CACHE_KEY, payload, CACHE_TTL_MS);
  return payload;
}

export function aggregateChangesByYear(
  changesByDate: Record<string, Record<string, number>>
): Array<{ year: number; open: number; construction: number; plan: number; closed: number }> {
  const byYear: Record<
    number,
    { open: number; construction: number; plan: number; closed: number }
  > = {};

  for (const [date, statuses] of Object.entries(changesByDate)) {
    const year = Number(date.slice(0, 4));
    if (!byYear[year]) {
      byYear[year] = { open: 0, construction: 0, plan: 0, closed: 0 };
    }
    const bucket = byYear[year];
    for (const [status, count] of Object.entries(statuses)) {
      if (status === "OPEN" || status === "EXPANDING") bucket.open += count;
      else if (status === "CONSTRUCTION" || status === "PERMIT") bucket.construction += count;
      else if (status === "PLAN" || status === "VOTING") bucket.plan += count;
      else if (status === "CLOSED_TEMP" || status === "CLOSED_PERM") bucket.closed += count;
    }
  }

  return Object.entries(byYear)
    .map(([year, counts]) => ({ year: Number(year), ...counts }))
    .sort((a, b) => a.year - b.year);
}