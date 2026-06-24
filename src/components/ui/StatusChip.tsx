import clsx from "clsx";
import type { EnergyPortfolioType, OccupancyStatus } from "@/lib/schema/station";
import { ENERGY_COLORS, OCCUPANCY_COLORS } from "@/lib/utils/colors";

const OCCUPANCY_LABELS: Record<OccupancyStatus, string> = {
  available: "Available",
  busy: "Busy",
  full: "Full",
  down: "Down",
  closed: "Closed",
  unknown: "Unknown",
};

const ENERGY_LABELS: Record<EnergyPortfolioType, string> = {
  solar: "Solar",
  battery: "Battery",
  grid: "Grid",
  hybrid: "Hybrid",
  unknown: "Unknown",
};

export function OccupancyChip({ status }: { status: OccupancyStatus }) {
  return (
    <span
      className="chip"
      style={{
        backgroundColor: `${OCCUPANCY_COLORS[status]}22`,
        color: OCCUPANCY_COLORS[status],
        border: `1px solid ${OCCUPANCY_COLORS[status]}55`,
      }}
    >
      {OCCUPANCY_LABELS[status]}
    </span>
  );
}

export function EnergyChip({ type }: { type: EnergyPortfolioType }) {
  return (
    <span
      className="chip"
      style={{
        backgroundColor: `${ENERGY_COLORS[type]}22`,
        color: ENERGY_COLORS[type],
        border: `1px solid ${ENERGY_COLORS[type]}55`,
      }}
    >
      {ENERGY_LABELS[type]}
    </span>
  );
}

export function BoolChip({
  label,
  active,
  color = "#38bdf8",
}: {
  label: string;
  active: boolean;
  color?: string;
}) {
  return (
    <span
      className={clsx("chip", !active && "opacity-40")}
      style={{
        backgroundColor: `${color}22`,
        color,
        border: `1px solid ${color}55`,
      }}
    >
      {label}
    </span>
  );
}