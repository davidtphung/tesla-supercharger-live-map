"use client";

import { Bookmark, ExternalLink, X } from "lucide-react";
import type { StationRecord } from "@/lib/schema/station";
import {
  BoolChip,
  EnergyChip,
  OccupancyChip,
} from "@/components/ui/StatusChip";
import { formatPower, formatRelativeTime, formatTimestamp } from "@/lib/utils/format";
import { useWatchlistStore } from "@/store/watchlist";

export function StationDetailDrawer({
  station,
  onClose,
}: {
  station: StationRecord | null;
  onClose: () => void;
}) {
  const { stationIds, toggleStation } = useWatchlistStore();

  if (!station) return null;

  const watched = stationIds.includes(station.station_id);

  return (
    <aside className="panel pointer-events-auto absolute bottom-3 right-3 z-30 w-[min(420px,calc(100vw-1.5rem))] scroll-thin max-h-[70vh] overflow-y-auto p-4 shadow-2xl md:bottom-4 md:right-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold leading-tight text-slate-100">
            {station.station_name}
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            {[station.city, station.state, station.country].filter(Boolean).join(", ")}
          </p>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => toggleStation(station.station_id)}
            className={`rounded-md border p-1.5 transition ${
              watched
                ? "border-sky-500/50 text-sky-400"
                : "border-slate-700 text-slate-400 hover:border-slate-500"
            }`}
            aria-label="Toggle watchlist"
          >
            <Bookmark className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-700 p-1.5 text-slate-400 hover:border-slate-500"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        <OccupancyChip status={station.occupancy_status} />
        <EnergyChip type={station.energy_portfolio_type} />
        <BoolChip label="Solar" active={station.solar_present} color="#fbbf24" />
        <BoolChip label="Battery" active={station.battery_present} color="#38bdf8" />
        <BoolChip label="Hybrid" active={station.hybrid} color="#34d399" />
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-emerald-500/10 px-2 py-3">
          <div className="text-xl font-semibold text-emerald-400">
            {station.stall_available}
          </div>
          <div className="text-xs text-slate-400">Available</div>
        </div>
        <div className="rounded-lg bg-amber-500/10 px-2 py-3">
          <div className="text-xl font-semibold text-amber-400">
            {station.stall_occupied}
          </div>
          <div className="text-xs text-slate-400">Occupied</div>
        </div>
        <div className="rounded-lg bg-slate-500/10 px-2 py-3">
          <div className="text-xl font-semibold text-slate-300">
            {station.stall_down}
          </div>
          <div className="text-xs text-slate-400">Down</div>
        </div>
      </div>

      <dl className="space-y-2 text-sm">
        <Row label="Total stalls" value={String(station.stall_total)} />
        <Row label="Max power" value={formatPower(station.max_power_kw)} />
        <Row label="Congestion" value={`${station.congestion_score}/100`} />
        <Row label="Reliability" value={`${station.reliability_score}/100`} />
        <Row label="Status" value={station.station_status} />
        <Row
          label="Energy confidence"
          value={station.energy_portfolio_confidence}
        />
        {station.facility_name && (
          <Row label="Facility" value={station.facility_name} />
        )}
        {station.address && <Row label="Address" value={station.address} />}
        {station.date_opened && (
          <Row label="Opened" value={station.date_opened} />
        )}
        <Row label="Last updated" value={formatRelativeTime(station.last_updated)} />
        <Row label="Snapshot time" value={formatTimestamp(station.last_updated)} />
      </dl>

      {station.notes && (
        <p className="mt-3 rounded-lg bg-slate-900/60 p-2 text-xs text-slate-400">
          {station.notes}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3 text-xs text-slate-500">
        <span>
          Source: {station.source_name}
        </span>
        <a
          href={station.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sky-400 hover:underline"
        >
          Attribution <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </aside>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-800/80 pb-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right text-slate-200">{value}</dd>
    </div>
  );
}