import type { EnergyPortfolioType, OccupancyStatus } from "@/lib/schema/station";
import { SPACEX } from "@/lib/theme/tokens";

export const OCCUPANCY_COLORS: Record<OccupancyStatus, string> = {
  available: SPACEX.success,
  busy: SPACEX.warning,
  full: SPACEX.danger,
  down: "#6b7280",
  closed: "#4b5563",
  unknown: SPACEX.accent,
};

export const ENERGY_COLORS: Record<EnergyPortfolioType, string> = {
  solar: SPACEX.gold,
  battery: SPACEX.cyan,
  grid: SPACEX.blue,
  hybrid: "#00c853",
  unknown: "#6b7280",
};

export function markerColor(
  occupancy: OccupancyStatus,
  energy: EnergyPortfolioType,
  emphasizeEnergy: boolean
): string {
  return emphasizeEnergy ? ENERGY_COLORS[energy] : OCCUPANCY_COLORS[occupancy];
}

export function congestionHeatColor(score: number): string {
  if (score >= 80) return "rgba(244, 67, 54, 0.6)";
  if (score >= 60) return "rgba(255, 152, 0, 0.5)";
  if (score >= 40) return "rgba(245, 166, 35, 0.4)";
  return "rgba(0, 200, 83, 0.32)";
}