"use client";

import { ExternalLink } from "lucide-react";
import type { StationRecord } from "@/lib/schema/station";
import {
  BoolChip,
  EnergyChip,
  OccupancyChip,
} from "@/components/ui/StatusChip";
import { EnergyFlowPanel } from "@/components/panels/EnergyFlowPanel";
import { formatCount, formatPower, formatRelativeTime, formatTimestamp } from "@/lib/utils/format";

export function StationDetailContent({ station }: { station: StationRecord }) {
  const operational = Math.max(station.stall_total - station.stall_down, 1);
  const utilization = Math.round((station.stall_occupied / operational) * 100);

  return (
    <>
      <p className="mb-4 text-[13px]" style={{ color: "var(--text-muted)" }}>
        {[station.city, station.state, station.country].filter(Boolean).join(", ")}
      </p>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <div
          className="rounded-xl p-3"
          style={{
            background: "color-mix(in srgb, var(--gold) 12%, transparent)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="section-label mb-1" style={{ color: "var(--gold)" }}>
            Watts in
          </div>
          <div className="font-mono text-xl font-bold tabular-nums" style={{ color: "var(--gold)" }}>
            {formatPower(station.power_in_kw)}
          </div>
          <p className="mt-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
            Grid {formatPower(station.grid_in_kw)} · Solar {formatPower(station.solar_in_kw)}
          </p>
        </div>
        <div
          className="rounded-xl p-3"
          style={{
            background: "color-mix(in srgb, var(--accent-cyan) 12%, transparent)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="section-label mb-1" style={{ color: "var(--accent-cyan)" }}>
            Watts out
          </div>
          <div className="font-mono text-xl font-bold tabular-nums" style={{ color: "var(--accent-cyan)" }}>
            {formatPower(station.power_out_kw)}
          </div>
          <p className="mt-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
            {formatCount(station.stall_occupied)} stalls · {utilization}% use
          </p>
        </div>
      </div>

      <div className="mb-4">
        <EnergyFlowPanel
          stationId={station.station_id}
          liveFlow={{
            power_in_kw: station.power_in_kw,
            power_out_kw: station.power_out_kw,
            solar_in_kw: station.solar_in_kw,
            grid_in_kw: station.grid_in_kw,
            battery_net_kw: station.battery_net_kw,
          }}
          title="Energy history"
          hours={24}
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-2" role="list" aria-label="Station status">
        <OccupancyChip status={station.occupancy_status} />
        <EnergyChip type={station.energy_portfolio_type} />
        <BoolChip label="Solar" active={station.solar_present} color="var(--gold)" />
        <BoolChip label="Battery" active={station.battery_present} color="var(--accent-cyan)" />
        <BoolChip label="Hybrid" active={station.hybrid} color="var(--success)" />
      </div>

      <div className="mb-3">
        <div className="mb-1.5 flex justify-between text-[11px]" style={{ color: "var(--text-muted)" }}>
          <span>Stall utilization</span>
          <span className="font-mono tabular-nums">{utilization}%</span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full"
          style={{ background: "var(--bg-card)" }}
          role="progressbar"
          aria-valuenow={utilization}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Stall utilization"
        >
          <div className="flex h-full">
            <div
              className="h-full"
              style={{
                width: `${(station.stall_occupied / operational) * 100}%`,
                background: "var(--warning)",
              }}
            />
            <div
              className="h-full"
              style={{
                width: `${(station.stall_available / operational) * 100}%`,
                background: "var(--success)",
              }}
            />
          </div>
        </div>
        <div className="mt-1.5 flex justify-between text-[10px]" style={{ color: "var(--text-faint)" }}>
          <span>{station.stall_occupied} occupied</span>
          <span>{station.stall_available} available</span>
        </div>
      </div>

      <div
        className="mb-5 grid grid-cols-3 gap-2"
        role="group"
        aria-label="Stall availability"
      >
        <StatBlock label="Available" value={station.stall_available} tone="success" />
        <StatBlock label="Occupied" value={station.stall_occupied} tone="warning" />
        <StatBlock label="Down" value={station.stall_down} tone="muted" />
      </div>

      <dl className="space-y-3 text-[13px]">
        <DetailRow label="Total stalls" value={String(station.stall_total)} />
        <DetailRow label="Charging now" value={formatPower(station.current_power_kw)} mono />
        <DetailRow label="Max power" value={formatPower(station.max_power_kw)} mono />
        <DetailRow label="Congestion" value={`${station.congestion_score} / 100`} mono />
        <DetailRow label="Reliability" value={`${station.reliability_score} / 100`} mono />
        <DetailRow label="Status" value={station.station_status} />
        <DetailRow label="Energy confidence" value={station.energy_portfolio_confidence} />
        {station.facility_name && <DetailRow label="Facility" value={station.facility_name} />}
        {station.address && <DetailRow label="Address" value={station.address} />}
        {station.date_opened && <DetailRow label="Opened" value={station.date_opened} />}
        <DetailRow label="Last updated" value={formatRelativeTime(station.last_updated)} />
        <DetailRow label="Snapshot time" value={formatTimestamp(station.last_updated)} mono />
      </dl>

      {station.notes && (
        <p
          className="mt-4 rounded-xl p-3 text-[13px] leading-relaxed"
          style={{
            background: "var(--bg-card)",
            color: "var(--text-muted)",
            border: "1px solid var(--border)",
          }}
        >
          {station.notes}
        </p>
      )}

      <div
        className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-[11px]"
        style={{ borderColor: "var(--border)", color: "var(--text-faint)" }}
      >
        <span>Source: {station.source_name}</span>
        <a
          href={station.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center gap-1 hover:underline"
          style={{ color: "var(--accent)" }}
        >
          Attribution <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>
    </>
  );
}

function StatBlock({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "success" | "warning" | "muted";
}) {
  const color =
    tone === "success"
      ? "var(--success)"
      : tone === "warning"
        ? "var(--warning)"
        : "var(--text-secondary)";

  return (
    <div
      className="stat-block stat-glow"
      style={{
        background: `color-mix(in srgb, ${color} 12%, transparent)`,
        border: "1px solid var(--border)",
      }}
    >
      <div className="value" style={{ color }}>
        {value}
      </div>
      <div className="label">{label}</div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div
      className="flex justify-between gap-4 border-b pb-3"
      style={{ borderColor: "var(--border)" }}
    >
      <dt style={{ color: "var(--text-muted)" }}>{label}</dt>
      <dd
        className={`max-w-[58%] text-right ${mono ? "font-mono tabular-nums" : ""}`}
        style={{ color: "var(--text)" }}
      >
        {value}
      </dd>
    </div>
  );
}