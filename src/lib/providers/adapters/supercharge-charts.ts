import { cacheGet, cacheSet, withRetry } from "@/lib/cache/memory-cache";

const BASE = "https://supercharge.info/service/supercharge";
const CACHE_KEY = "supercharge:charts:v1";
const CACHE_TTL_MS = 10 * 60 * 1000;

export interface StallCountPoint {
  date: string;
  stallCount: number;
}

export type StatusChartBucket = "open" | "construction" | "plan" | "closed";

export interface StatusBucketCounts {
  sites: number;
  stalls: number;
}

export interface StatusBreakdownRow {
  label: string;
  open: StatusBucketCounts;
  construction: StatusBucketCounts;
  plan: StatusBucketCounts;
  closed: StatusBucketCounts;
}

interface SuperchargeSiteRef {
  status: string;
  stallCount?: number;
  address?: { region?: string };
}

export interface SuperchargeChartsPayload {
  stallHistory: StallCountPoint[];
  changesByDate: Record<string, Record<string, number>>;
  statusBreakdown: StatusBreakdownRow[];
  lastModified: string;
  fetched_at: string;
  source: string;
}

const EMPTY_BUCKET: StatusBucketCounts = { sites: 0, stalls: 0 };

export function mapStatusToChartBucket(status: string): StatusChartBucket | null {
  if (status === "OPEN" || status === "EXPANDING") return "open";
  if (status === "CONSTRUCTION" || status === "PERMIT") return "construction";
  if (status === "PLAN" || status === "VOTING") return "plan";
  if (status === "CLOSED_TEMP" || status === "CLOSED_PERM") return "closed";
  return null;
}

function emptyRowCounts(): Record<StatusChartBucket, StatusBucketCounts> {
  return {
    open: { ...EMPTY_BUCKET },
    construction: { ...EMPTY_BUCKET },
    plan: { ...EMPTY_BUCKET },
    closed: { ...EMPTY_BUCKET },
  };
}

export function aggregateStatusBreakdown(sites: SuperchargeSiteRef[]): StatusBreakdownRow[] {
  const world = emptyRowCounts();
  const byRegion: Record<string, Record<StatusChartBucket, StatusBucketCounts>> = {};

  for (const site of sites) {
    const bucket = mapStatusToChartBucket(site.status);
    if (!bucket) continue;

    const stalls = site.stallCount ?? 0;
    world[bucket].sites += 1;
    world[bucket].stalls += stalls;

    const region = site.address?.region ?? "Unknown";
    if (!byRegion[region]) byRegion[region] = emptyRowCounts();
    byRegion[region][bucket].sites += 1;
    byRegion[region][bucket].stalls += stalls;
  }

  const regionOrder = ["North America", "Europe", "Asia Pacific", "South America"];
  const rows: StatusBreakdownRow[] = [
    { label: "World", ...world },
    ...regionOrder
      .filter((region) => byRegion[region])
      .map((region) => ({ label: region, ...byRegion[region] })),
  ];

  for (const [region, counts] of Object.entries(byRegion)) {
    if (!regionOrder.includes(region)) {
      rows.push({ label: region, ...counts });
    }
  }

  return rows;
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

  const [stallHistory, changesByDate, dbInfo, allSites] = await Promise.all([
    fetchJson<StallCountPoint[]>("/site/stallCount"),
    fetchJson<Record<string, Record<string, number>>>("/changesByDate"),
    fetchJson<{ lastModifiedString?: string; lastModified?: number }>("/databaseInfo"),
    fetchJson<SuperchargeSiteRef[]>("/allSites"),
  ]);

  const payload: SuperchargeChartsPayload = {
    stallHistory,
    changesByDate,
    statusBreakdown: aggregateStatusBreakdown(allSites),
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