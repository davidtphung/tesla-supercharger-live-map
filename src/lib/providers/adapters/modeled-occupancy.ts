import type { OccupancyAdapter, OccupancyPatch } from "@/lib/providers/types";
import type { StationRecord } from "@/lib/schema/station";
import {
  computeCongestionScore,
  deriveOccupancyStatus,
} from "@/lib/scoring/congestion";
import { estimateCurrentPowerKw } from "@/lib/scoring/power";

/** Deterministic pseudo-live occupancy model for stations without a live feed. */
function seededRandom(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function timeBucket(minutes = 15): string {
  const d = new Date();
  const bucket =
    Math.floor(d.getTime() / (minutes * 60 * 1000)) * minutes * 60 * 1000;
  return new Date(bucket).toISOString();
}

function hourDemandMultiplier(hour: number): number {
  const peaks = [
    [7, 9, 0.75],
    [11, 13, 0.65],
    [16, 19, 0.85],
    [20, 22, 0.55],
  ];
  for (const [start, end, mult] of peaks) {
    if (hour >= start && hour < end) return mult as number;
  }
  return 0.35;
}

export function modelOccupancy(
  station: Pick<
    StationRecord,
    | "station_id"
    | "stall_total"
    | "station_status"
    | "max_power_kw"
    | "region"
    | "country"
  >,
  bucketIso = timeBucket()
): OccupancyPatch {
  if (station.station_status !== "OPEN" || station.stall_total <= 0) {
    return {
      station_id: station.station_id,
      stall_available: 0,
      stall_occupied: 0,
      stall_down: station.stall_total,
      occupancy_status: "closed",
      last_updated: new Date().toISOString(),
      source_url: "internal://modeled-occupancy",
      source_name: "modeled-occupancy",
    };
  }

  const rand = seededRandom(`${station.station_id}:${bucketIso}`);
  const hour = new Date(bucketIso).getUTCHours();
  const demand = hourDemandMultiplier(hour);
  const sizeFactor = Math.min(1, station.stall_total / 16);
  const powerFactor = station.max_power_kw >= 250 ? 1.1 : 0.9;
  const corridorBoost =
    station.country === "USA" && station.region === "North America" ? 1.05 : 1;

  const targetUtil =
    Math.min(0.95, demand * powerFactor * corridorBoost * (0.55 + rand() * 0.4));
  const downChance = rand();
  const stall_down =
    downChance > 0.97 ? Math.max(1, Math.floor(rand() * 2)) : 0;
  const operational = Math.max(station.stall_total - stall_down, 1);
  const stall_occupied = Math.min(
    operational,
    Math.max(0, Math.round(operational * targetUtil * (0.85 + sizeFactor * 0.15)))
  );
  const stall_available = Math.max(0, operational - stall_occupied);
  const occupancy_status = deriveOccupancyStatus(
    stall_available,
    stall_occupied,
    stall_down,
    station.stall_total,
    station.station_status
  );

  return {
    station_id: station.station_id,
    stall_available,
    stall_occupied,
    stall_down,
    occupancy_status,
    last_updated: new Date().toISOString(),
    source_url: "internal://modeled-occupancy",
    source_name: "modeled-occupancy",
  };
}

export const modeledOccupancyAdapter: OccupancyAdapter = {
  name: "modeled-occupancy",

  async fetchOccupancy(stationIds) {
    const patches: OccupancyPatch[] = stationIds.map((id) =>
      modelOccupancy({
        station_id: id,
        stall_total: 8,
        station_status: "OPEN",
        max_power_kw: 250,
        region: "North America",
        country: "USA",
      })
    );

    return {
      patches,
      meta: {
        source: "modeled-occupancy",
        fetched_at: new Date().toISOString(),
        stale_after_ms: 15 * 60 * 1000,
        confidence: "low",
      },
    };
  },
};

export function applyOccupancyPatches(
  stations: StationRecord[],
  patches: OccupancyPatch[]
): StationRecord[] {
  const patchMap = new Map(patches.map((p) => [p.station_id, p]));

  return stations.map((station) => {
    const patch = patchMap.get(station.station_id);
    if (!patch) return station;

    const stall_available = patch.stall_available ?? station.stall_available;
    const stall_occupied = patch.stall_occupied ?? station.stall_occupied;
    const stall_down = patch.stall_down ?? station.stall_down;
    const occupancy_status =
      patch.occupancy_status ??
      deriveOccupancyStatus(
        stall_available,
        stall_occupied,
        stall_down,
        station.stall_total,
        station.station_status
      );

    const updated = {
      ...station,
      stall_available,
      stall_occupied,
      stall_down,
      occupancy_status,
      congestion_score: computeCongestionScore(
        stall_available,
        stall_occupied,
        stall_down,
        station.stall_total
      ),
      last_updated: patch.last_updated ?? station.last_updated,
      source_url: patch.source_url ?? station.source_url,
      source_name: patch.source_name ?? station.source_name,
      occupancy_source:
        patch.source_name === "tesla-fleet"
          ? ("tesla-fleet" as const)
          : patch.source_name === "modeled-occupancy"
            ? ("modeled-occupancy" as const)
            : station.occupancy_source,
    };

    return {
      ...updated,
      current_power_kw: estimateCurrentPowerKw(updated),
    };
  });
}

export function modelOccupancyForStations(stations: StationRecord[]): OccupancyPatch[] {
  const bucket = timeBucket();
  return stations.map((s) => modelOccupancy(s, bucket));
}