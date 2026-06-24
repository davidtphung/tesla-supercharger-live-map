"use client";

import { ExternalLink } from "lucide-react";
import type { StationRecord } from "@/lib/schema/station";
import {
  BoolChip,
  EnergyChip,
  OccupancyChip,
} from "@/components/ui/StatusChip";
import { formatPower, formatRelativeTime, formatTimestamp } from "@/lib/utils/format";

export function StationDetailContent({ station }: { station: StationRecord }) {
  return (
    <>
      <p className="mb-4 text-[15px] text-slate-400">
        {[station.city, station.state, station.country].filter(Boolean).join(", ")}
      </p>

      <div
        className="mb-4 flex flex-wrap gap-2"
        role="list"
        aria-label="Station status"
      >
        <OccupancyChip status={station.occupancy_status} />
        <EnergyChip type={station.energy_portfolio_type} />
        <BoolChip label="Solar" active={station.solar_present} color="#fbbf24" />
        <BoolChip label="Battery" active={station.battery_present} color="#38bdf8" />
        <BoolChip label="Hybrid" active={station.hybrid} color="#34d399" />
      </div>

      <div
        className="mb-5 grid grid-cols-3 gap-2 text-center"
        role="group"
        aria-label="Stall availability"
      >
        <StatBlock
          label="Available"
          value={station.stall_available}
          tone="emerald"
        />
        <StatBlock
          label="Occupied"
          value={station.stall_occupied}
          tone="amber"
        />
        <StatBlock label="Down" value={station.stall_down} tone="slate" />
      </div>

      <dl className="space-y-3 text-[15px]">
        <DetailRow label="Total stalls" value={String(station.stall_total)} />
        <DetailRow label="Max power" value={formatPower(station.max_power_kw)} />
        <DetailRow label="Congestion" value={`${station.congestion_score} out of 100`} />
        <DetailRow label="Reliability" value={`${station.reliability_score} out of 100`} />
        <DetailRow label="Status" value={station.station_status} />
        <DetailRow
          label="Energy confidence"
          value={station.energy_portfolio_confidence}
        />
        {station.facility_name && (
          <DetailRow label="Facility" value={station.facility_name} />
        )}
        {station.address && <DetailRow label="Address" value={station.address} />}
        {station.date_opened && (
          <DetailRow label="Opened" value={station.date_opened} />
        )}
        <DetailRow
          label="Last updated"
          value={formatRelativeTime(station.last_updated)}
        />
        <DetailRow
          label="Snapshot time"
          value={formatTimestamp(station.last_updated)}
        />
      </dl>

      {station.notes && (
        <p className="mt-4 rounded-xl bg-slate-900/70 p-3 text-[15px] text-slate-400">
          {station.notes}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-4 text-[13px] text-slate-500">
        <span>Source: {station.source_name}</span>
        <a
          href={station.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center gap-1 text-sky-400 hover:underline"
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
  tone: "emerald" | "amber" | "slate";
}) {
  const colors = {
    emerald: "bg-emerald-500/10 text-emerald-400",
    amber: "bg-amber-500/10 text-amber-400",
    slate: "bg-slate-500/10 text-slate-300",
  };

  return (
    <div className={`rounded-xl px-2 py-4 ${colors[tone]}`}>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="mt-1 text-[13px] text-slate-400">{label}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-800/80 pb-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="max-w-[58%] text-right text-slate-200">{value}</dd>
    </div>
  );
}