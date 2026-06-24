"use client";

import { BatteryCharging, CircleCheck, PlugZap, Users } from "lucide-react";
import type { NetworkLiveStats } from "@/lib/scoring/power";
import { formatCount, formatPower } from "@/lib/utils/format";

export function LiveStatsBar({
  stats,
  embedded = false,
}: {
  stats: NetworkLiveStats;
  embedded?: boolean;
}) {
  return (
    <section
      className={
        embedded
          ? "grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3"
          : "grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2"
      }
      aria-label="Network live charging statistics"
    >
      <StatTile
        icon={<CircleCheck className="h-3.5 w-3.5" aria-hidden="true" />}
        label="Available"
        value={formatCount(stats.stall_available)}
        sub="stalls open"
        color="var(--success)"
      />
      <StatTile
        icon={<Users className="h-3.5 w-3.5" aria-hidden="true" />}
        label="Occupied"
        value={formatCount(stats.stall_occupied)}
        sub={`${stats.utilization_pct}% in use`}
        color="var(--warning)"
      />
      <StatTile
        icon={<BatteryCharging className="h-3.5 w-3.5" aria-hidden="true" />}
        label="Charging"
        value={formatPower(stats.current_power_kw)}
        sub="live draw"
        color="var(--accent-cyan)"
      />
      <StatTile
        icon={<PlugZap className="h-3.5 w-3.5" aria-hidden="true" />}
        label="Total stalls"
        value={formatCount(stats.stall_total)}
        sub={`${formatCount(stats.open_stations)} sites`}
        color="var(--accent)"
      />
    </section>
  );
}

function StatTile({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div
      className="rounded-lg px-2 py-2"
      style={{
        background: `color-mix(in srgb, ${color} 10%, transparent)`,
        border: "1px solid var(--border)",
      }}
    >
      <div
        className="mb-0.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
        style={{ color: "var(--text-muted)" }}
      >
        <span style={{ color }}>{icon}</span>
        {label}
        <span className="live-dot ml-auto shrink-0" aria-hidden="true" />
      </div>
      <div
        className="font-mono text-base font-bold tabular-nums sm:text-lg"
        style={{ color }}
      >
        {value}
      </div>
      <div className="text-[10px]" style={{ color: "var(--text-faint)" }}>
        {sub}
      </div>
    </div>
  );
}