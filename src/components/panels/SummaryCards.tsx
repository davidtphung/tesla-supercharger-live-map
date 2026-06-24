"use client";

import { Activity, BatteryCharging, Shield } from "lucide-react";
import type { StationRecord } from "@/lib/schema/station";
import {
  topBusiest,
  topPower,
  topResilient,
} from "@/lib/filter-stations";
import { useFilterStore } from "@/store/filters";

function MiniList({
  title,
  icon,
  stations,
  metric,
}: {
  title: string;
  icon: React.ReactNode;
  stations: StationRecord[];
  metric: (s: StationRecord) => string;
}) {
  const setSelected = useFilterStore((s) => s.setSelectedStationId);

  return (
    <section className="panel p-4" aria-labelledby={`list-${title.replace(/\s/g, "-")}`}>
      <h3
        id={`list-${title.replace(/\s/g, "-")}`}
        className="mb-3 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-slate-400"
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
              className="flex min-h-[44px] w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left text-[15px] transition hover:bg-slate-800/80 focus-visible:bg-slate-800/80"
            >
              <span className="truncate text-slate-200">{s.station_name}</span>
              <span className="shrink-0 tabular-nums text-slate-500">{metric(s)}</span>
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
        title="Busiest now"
        icon={<Activity className="h-4 w-4 text-amber-400" aria-hidden="true" />}
        stations={topBusiest(stations)}
        metric={(s) => `${s.congestion_score}%`}
      />
      <MiniList
        title="Highest power"
        icon={<BatteryCharging className="h-4 w-4 text-sky-400" aria-hidden="true" />}
        stations={topPower(stations)}
        metric={(s) => `${s.max_power_kw} kW`}
      />
      <MiniList
        title="Most resilient"
        icon={<Shield className="h-4 w-4 text-emerald-400" aria-hidden="true" />}
        stations={topResilient(stations)}
        metric={(s) => `${s.reliability_score}`}
      />
    </div>
  );
}