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
    <div className="panel p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {icon}
        {title}
      </div>
      <ul className="space-y-1.5">
        {stations.map((s) => (
          <li key={s.station_id}>
            <button
              type="button"
              onClick={() => setSelected(s.station_id)}
              className="flex w-full items-center justify-between gap-2 rounded-md px-1 py-1 text-left text-xs transition hover:bg-slate-800/80"
            >
              <span className="truncate text-slate-200">{s.station_name}</span>
              <span className="shrink-0 text-slate-500">{metric(s)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SummaryCards({ stations }: { stations: StationRecord[] }) {
  return (
    <div className="grid gap-2">
      <MiniList
        title="Busiest now"
        icon={<Activity className="h-3.5 w-3.5 text-amber-400" />}
        stations={topBusiest(stations)}
        metric={(s) => `${s.congestion_score}%`}
      />
      <MiniList
        title="Highest power"
        icon={<BatteryCharging className="h-3.5 w-3.5 text-sky-400" />}
        stations={topPower(stations)}
        metric={(s) => `${s.max_power_kw} kW`}
      />
      <MiniList
        title="Most resilient"
        icon={<Shield className="h-3.5 w-3.5 text-emerald-400" />}
        stations={topResilient(stations)}
        metric={(s) => `${s.reliability_score}`}
      />
    </div>
  );
}