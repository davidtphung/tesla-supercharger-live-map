"use client";

import { Activity, BatteryCharging, CircleCheck, Shield, Zap } from "lucide-react";
import type { StationRecord } from "@/lib/schema/station";
import {
  topAvailable,
  topBusiest,
  topChargingNow,
  topPower,
  topResilient,
} from "@/lib/filter-stations";
import { formatPower } from "@/lib/utils/format";
import { useFilterStore } from "@/store/filters";

function MiniList({
  title,
  icon,
  stations,
  metric,
  accent,
}: {
  title: string;
  icon: React.ReactNode;
  stations: StationRecord[];
  metric: (s: StationRecord) => string;
  accent: string;
}) {
  const setSelected = useFilterStore((s) => s.setSelectedStationId);

  if (stations.length === 0) return null;

  return (
    <section className="card stat-glow p-4" aria-labelledby={`list-${title.replace(/\s/g, "-")}`}>
      <h3
        id={`list-${title.replace(/\s/g, "-")}`}
        className="section-label mb-3 flex items-center gap-2 !normal-case"
        style={{ color: accent }}
      >
        {icon}
        {title}
      </h3>
      <ul className="space-y-1">
        {stations.map((s) => (
          <li key={s.station_id}>
            <button
              type="button"
              onClick={() => setSelected(s.station_id)}
              className="flex min-h-[44px] w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left text-[13px] transition"
              style={{ color: "var(--text)" }}
            >
              <span className="truncate">{s.station_name}</span>
              <span className="shrink-0 font-mono tabular-nums" style={{ color: "var(--text-muted)" }}>
                {metric(s)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function SummaryCards({ stations }: { stations: StationRecord[] }) {
  return (
    <div className="grid gap-3" role="region" aria-label="Station insights">
      <MiniList
        title="Most stalls available"
        accent="var(--success)"
        icon={<CircleCheck className="h-3.5 w-3.5" aria-hidden="true" />}
        stations={topAvailable(stations)}
        metric={(s) => `${s.stall_available}/${s.stall_total}`}
      />
      <MiniList
        title="Highest charging draw"
        accent="var(--accent-cyan)"
        icon={<Zap className="h-3.5 w-3.5" aria-hidden="true" />}
        stations={topChargingNow(stations)}
        metric={(s) => formatPower(s.current_power_kw)}
      />
      <MiniList
        title="Busiest now"
        accent="var(--warning)"
        icon={<Activity className="h-3.5 w-3.5" aria-hidden="true" />}
        stations={topBusiest(stations)}
        metric={(s) => `${s.stall_occupied} occ · ${s.congestion_score}%`}
      />
      <MiniList
        title="Highest power"
        accent="var(--accent)"
        icon={<BatteryCharging className="h-3.5 w-3.5" aria-hidden="true" />}
        stations={topPower(stations)}
        metric={(s) => `${s.max_power_kw} kW max`}
      />
      <MiniList
        title="Most resilient"
        accent="var(--success)"
        icon={<Shield className="h-3.5 w-3.5" aria-hidden="true" />}
        stations={topResilient(stations)}
        metric={(s) => `${s.reliability_score}`}
      />
    </div>
  );
}