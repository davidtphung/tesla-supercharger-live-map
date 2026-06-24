"use client";

import { Bookmark, Route, Trash2 } from "lucide-react";
import type { StationRecord } from "@/lib/schema/station";
import { useWatchlistStore } from "@/store/watchlist";
import { useFilterStore } from "@/store/filters";

export function WatchlistPanel({ stations }: { stations: StationRecord[] }) {
  const { stationIds, routes, removeStation, removeRoute } = useWatchlistStore();
  const setSelected = useFilterStore((s) => s.setSelectedStationId);
  const byId = new Map(stations.map((s) => [s.station_id, s]));
  const watched = stationIds
    .map((id) => byId.get(id))
    .filter(Boolean) as StationRecord[];

  return (
    <div className="panel scroll-thin max-h-64 space-y-3 overflow-y-auto p-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        <Bookmark className="h-3.5 w-3.5 text-sky-400" />
        Watchlist
      </div>

      {watched.length === 0 ? (
        <p className="text-xs text-slate-500">
          Save stations from the detail drawer to track occupancy here.
        </p>
      ) : (
        <ul className="space-y-1">
          {watched.map((s) => (
            <li
              key={s.station_id}
              className="flex items-center justify-between gap-2 rounded-md bg-slate-900/50 px-2 py-1.5"
            >
              <button
                type="button"
                onClick={() => setSelected(s.station_id)}
                className="min-w-0 flex-1 text-left text-xs text-slate-200"
              >
                <div className="truncate">{s.station_name}</div>
                <div className="text-slate-500">
                  {s.stall_available}/{s.stall_total} free · {s.occupancy_status}
                </div>
              </button>
              <button
                type="button"
                onClick={() => removeStation(s.station_id)}
                className="text-slate-500 hover:text-red-400"
                aria-label="Remove from watchlist"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {routes.length > 0 && (
        <>
          <div className="flex items-center gap-2 pt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <Route className="h-3.5 w-3.5 text-violet-400" />
            Saved routes
          </div>
          <ul className="space-y-1">
            {routes.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-md bg-slate-900/50 px-2 py-1.5 text-xs"
              >
                <span className="text-slate-300">
                  {r.name} · {r.stationIds.length} stops
                </span>
                <button
                  type="button"
                  onClick={() => removeRoute(r.id)}
                  className="text-slate-500 hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}