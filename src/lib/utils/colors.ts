import type { EnergyPortfolioType, OccupancyStatus } from "@/lib/schema/station";

export const OCCUPANCY_COLORS: Record<OccupancyStatus, string> = {
  available: "#22c55e",
  busy: "#f59e0b",
  full: "#ef4444",
  down: "#6b7280",
  closed: "#374151",
  unknown: "#94a3b8",
};

export const ENERGY_COLORS: Record<EnergyPortfolioType, string> = {
  solar: "#fbbf24",
  battery: "#38bdf8",
  grid: "#a78bfa",
  hybrid: "#34d399",
  unknown: "#64748b",
};

export function markerColor(
  occupancy: OccupancyStatus,
  energy: EnergyPortfolioType,
  emphasizeEnergy: boolean
): string {
  return emphasizeEnergy ? ENERGY_COLORS[energy] : OCCUPANCY_COLORS[occupancy];
}

export function congestionHeatColor(score: number): string {
  if (score >= 80) return "rgba(239, 68, 68, 0.65)";
  if (score >= 60) return "rgba(245, 158, 11, 0.55)";
  if (score >= 40) return "rgba(250, 204, 21, 0.45)";
  return "rgba(34, 197, 94, 0.35)";
}