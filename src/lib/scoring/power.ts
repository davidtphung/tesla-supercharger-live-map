import type { StationRecord } from "@/lib/schema/station";

/** Estimated aggregate draw from occupied stalls (avg ~72% of per-stall rating). */
export function estimateCurrentPowerKw(
  station: Pick<StationRecord, "stall_occupied" | "stall_total" | "max_power_kw">
): number {
  if (station.stall_total <= 0 || station.stall_occupied <= 0 || station.max_power_kw <= 0) {
    return 0;
  }
  const kwPerStall = station.max_power_kw / station.stall_total;
  return Math.round(station.stall_occupied * kwPerStall * 0.72);
}

export interface NetworkLiveStats {
  stall_available: number;
  stall_occupied: number;
  stall_total: number;
  stall_down: number;
  current_power_kw: number;
  open_stations: number;
  utilization_pct: number;
}

export function aggregateNetworkStats(stations: StationRecord[]): NetworkLiveStats {
  const open = stations.filter((s) => s.station_status === "OPEN");

  const stall_available = open.reduce((sum, s) => sum + s.stall_available, 0);
  const stall_occupied = open.reduce((sum, s) => sum + s.stall_occupied, 0);
  const stall_total = open.reduce((sum, s) => sum + s.stall_total, 0);
  const stall_down = open.reduce((sum, s) => sum + s.stall_down, 0);
  const current_power_kw = open.reduce((sum, s) => sum + s.current_power_kw, 0);
  const operational = Math.max(stall_total - stall_down, 1);

  return {
    stall_available,
    stall_occupied,
    stall_total,
    stall_down,
    current_power_kw,
    open_stations: open.length,
    utilization_pct: Math.round((stall_occupied / operational) * 100),
  };
}