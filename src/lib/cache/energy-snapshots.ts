import { cacheGet, cacheSet } from "@/lib/cache/memory-cache";
import type { EnergySnapshot } from "@/lib/scoring/energy-flow";

const NETWORK_KEY = "energy:network:live:v1";
const STATION_PREFIX = "energy:station:live:";
const MAX_NETWORK_POINTS = 288; // 24h at 5-min effective resolution
const MAX_STATION_POINTS = 192;
const TTL_MS = 24 * 60 * 60 * 1000;

function sameBucket(a: string, b: string, bucketMs = 60_000): boolean {
  return (
    Math.floor(new Date(a).getTime() / bucketMs) ===
    Math.floor(new Date(b).getTime() / bucketMs)
  );
}

function appendSnapshot(
  existing: EnergySnapshot[],
  snapshot: EnergySnapshot,
  max: number
): EnergySnapshot[] {
  const next = [...existing];
  const last = next[next.length - 1];
  if (last && sameBucket(last.timestamp, snapshot.timestamp)) {
    next[next.length - 1] = snapshot;
  } else {
    next.push(snapshot);
  }
  return next.slice(-max);
}

export function recordNetworkEnergySnapshot(snapshot: EnergySnapshot) {
  const existing = cacheGet<EnergySnapshot[]>(NETWORK_KEY) ?? [];
  cacheSet(NETWORK_KEY, appendSnapshot(existing, snapshot, MAX_NETWORK_POINTS), TTL_MS);
}

export function recordStationEnergySnapshot(stationId: string, snapshot: EnergySnapshot) {
  const key = `${STATION_PREFIX}${stationId}`;
  const existing = cacheGet<EnergySnapshot[]>(key) ?? [];
  cacheSet(key, appendSnapshot(existing, snapshot, MAX_STATION_POINTS), TTL_MS);
}

export function getNetworkEnergySnapshots(): EnergySnapshot[] {
  return cacheGet<EnergySnapshot[]>(NETWORK_KEY) ?? [];
}

export function getStationEnergySnapshots(stationId: string): EnergySnapshot[] {
  return cacheGet<EnergySnapshot[]>(`${STATION_PREFIX}${stationId}`) ?? [];
}

export function mergeEnergyHistory(
  recorded: EnergySnapshot[],
  modeled: EnergySnapshot[]
): EnergySnapshot[] {
  if (recorded.length === 0) return modeled;

  const cutoff = new Date(recorded[0].timestamp).getTime();
  const older = modeled.filter((p) => new Date(p.timestamp).getTime() < cutoff);
  return [...older, ...recorded];
}