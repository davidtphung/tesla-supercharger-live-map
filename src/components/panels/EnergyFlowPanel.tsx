"use client";

import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { EnergyFlowChart } from "@/components/charts/EnergyFlowChart";
import { useEnergyTimeline } from "@/lib/hooks/useEnergyTimeline";
import type { EnergyFlow } from "@/lib/scoring/energy-flow";
import { formatPower, formatTimestamp } from "@/lib/utils/format";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";

export function EnergyFlowPanel({
  stationId = null,
  liveFlow,
  title = "Energy flow",
  hours = 24,
}: {
  stationId?: string | null;
  liveFlow?: EnergyFlow;
  title?: string;
  hours?: number;
}) {
  const { snapshots, loading, error } = useEnergyTimeline({ stationId, hours });
  const [index, setIndex] = useState(-1);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    setIndex(snapshots.length > 0 ? snapshots.length - 1 : -1);
  }, [snapshots.length, stationId]);

  useEffect(() => {
    if (reducedMotion || snapshots.length < 2) return;
    const id = setInterval(() => {
      setIndex((i) => (i < 0 ? snapshots.length - 1 : Math.min(i + 1, snapshots.length - 1)));
    }, 4000);
    return () => clearInterval(id);
  }, [reducedMotion, snapshots.length]);

  const current =
    index >= 0 && snapshots[index]
      ? snapshots[index]
      : liveFlow
        ? { timestamp: new Date().toISOString(), ...liveFlow }
        : null;

  return (
    <section className="card p-4" aria-label={`${title} live chart`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="section-label !mb-0">{title}</h3>
        <span className="hud-badge">
          <span className="live-dot" aria-hidden="true" />
          Live
        </span>
      </div>

      {current && (
        <div className="mb-3 grid grid-cols-2 gap-2">
          <FlowStat
            icon={<ArrowDownLeft className="h-3.5 w-3.5" aria-hidden="true" />}
            label="Watts in"
            value={formatPower(current.power_in_kw)}
            sub={`Grid ${formatPower(current.grid_in_kw)} · Solar ${formatPower(current.solar_in_kw)}`}
            color="var(--gold)"
          />
          <FlowStat
            icon={<ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />}
            label="Watts out"
            value={formatPower(current.power_out_kw)}
            sub="To vehicles"
            color="var(--accent-cyan)"
          />
        </div>
      )}

      {error ? (
        <p className="text-[13px]" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      ) : loading && snapshots.length === 0 ? (
        <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
          Loading energy history…
        </p>
      ) : (
        <EnergyFlowChart
          snapshots={snapshots}
          activeIndex={Math.max(0, index)}
          onActiveIndexChange={setIndex}
        />
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px]" style={{ color: "var(--text-muted)" }}>
        <Legend color="var(--gold)" label="Watts in (grid + solar + battery)" />
        <Legend color="var(--accent-cyan)" label="Watts out (vehicle charging)" />
      </div>

      {current && (
        <p className="mt-2 font-mono text-[11px]" style={{ color: "var(--text-faint)" }} aria-live="polite">
          {formatTimestamp(current.timestamp)}
          {current.battery_net_kw !== 0 && (
            <>
              {" "}
              · Battery {current.battery_net_kw > 0 ? "discharging" : "charging"}{" "}
              {formatPower(Math.abs(current.battery_net_kw))}
            </>
          )}
        </p>
      )}
    </section>
  );
}

function FlowStat({
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
      className="rounded-lg px-3 py-2.5"
      style={{
        background: `color-mix(in srgb, ${color} 10%, transparent)`,
        border: "1px solid var(--border)",
      }}
    >
      <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color }}>
        {icon}
        {label}
      </div>
      <div className="font-mono text-lg font-bold tabular-nums" style={{ color }}>
        {value}
      </div>
      <div className="text-[10px]" style={{ color: "var(--text-faint)" }}>
        {sub}
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} aria-hidden="true" />
      {label}
    </span>
  );
}