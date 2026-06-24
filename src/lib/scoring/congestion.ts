import type { OccupancyStatus, StationRecord } from "@/lib/schema/station";

export function deriveOccupancyStatus(
  available: number,
  occupied: number,
  down: number,
  total: number,
  stationStatus: StationRecord["station_status"]
): OccupancyStatus {
  if (stationStatus !== "OPEN") return "closed";
  if (total <= 0) return "unknown";
  if (down >= total) return "down";
  if (available <= 0) return "full";
  const utilization = occupied / Math.max(total - down, 1);
  if (utilization >= 0.85) return "busy";
  if (available > 0) return "available";
  return "unknown";
}

export function computeCongestionScore(
  available: number,
  occupied: number,
  down: number,
  total: number
): number {
  if (total <= 0) return 0;
  const operational = Math.max(total - down, 1);
  const utilization = occupied / operational;
  const scarcity = 1 - available / operational;
  return Math.round(Math.min(100, Math.max(0, utilization * 55 + scarcity * 45)));
}

export function computeReliabilityScore(
  station: Pick<
    StationRecord,
    | "station_status"
    | "stall_down"
    | "stall_total"
    | "energy_portfolio_type"
    | "battery_present"
    | "solar_present"
    | "max_power_kw"
  >
): number {
  let score = 50;
  if (station.station_status === "OPEN") score += 20;
  if (station.stall_total > 0) {
    const uptime = 1 - station.stall_down / station.stall_total;
    score += uptime * 20;
  }
  if (station.battery_present) score += 8;
  if (station.solar_present) score += 5;
  if (station.max_power_kw >= 250) score += 7;
  return Math.round(Math.min(100, Math.max(0, score)));
}