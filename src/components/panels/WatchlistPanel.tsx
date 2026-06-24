"use client";

import { Bookmark, Route, Trash2 } from "lucide-react";
import type { StationRecord } from "@/lib/schema/station";
import { useWatchlistStore } from "@/store/watchlist";
import { useFilterStore } from "@/store/filters";
import { IconButton } from "@/components/ui/IconButton";

export function WatchlistPanel({
  stations,
  embedded = false,
}: {
  stations: StationRecord[];
  embedded?: boolean;
}) {
  const { stationIds, routes, removeStation, removeRoute } = useWatchlistStore();
  const setSelected = useFilterStore((s) => s.setSelectedStationId);
  const byId = new Map(stations.map((s) => [s.station_id, s]));
  const watched = stationIds
    .map((id) => byId.get(id))
    .filter(Boolean) as StationRecord[];

  return (
    <div
      className={
        embedded
          ? "space-y-4"
          : "panel scroll-thin max-h-64 space-y-4 overflow-y-auto p-4"
      }
      aria-label="Saved stations"
    >
      <div className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-slate-400">
        <Bookmark className="h-4 w-4 text-sky-400" aria-hidden="true" />
        Watchlist
      </div>

      {watched.length === 0 ? (
        <p className="text-[15px] leading-relaxed text-slate-500">
          Save stations from the detail panel to track occupancy here.
        </p>
      ) : (
        <ul className="space-y-2">
          {watched.map((s) => (
            <li
              key={s.station_id}
              className="flex items-center justify-between gap-2 rounded-xl bg-slate-900/50 px-2 py-1"
            >
              <button
                type="button"
                onClick={() => setSelected(s.station_id)}
                className="min-h-[44px] min-w-0 flex-1 rounded-lg px-2 py-2 text-left"
              >
                <div className="truncate text-[15px] text-slate-200">
                  {s.station_name}
                </div>
                <div className="text-[13px] text-slate-500">
                  {s.stall_available} of {s.stall_total} available ·{" "}
                  {s.occupancy_status}
                </div>
              </button>
              <IconButton
                label={`Remove ${s.station_name} from watchlist`}
                onClick={() => removeStation(s.station_id)}
                variant="ghost"
              >
                <Trash2 className="h-5 w-5" />
              </IconButton>
            </li>
          ))}
        </ul>
      )}

      {routes.length > 0 && (
        <>
          <div className="flex items-center gap-2 pt-1 text-[13px] font-semibold uppercase tracking-wide text-slate-400">
            <Route className="h-4 w-4 text-violet-400" aria-hidden="true" />
            Saved routes
          </div>
          <ul className="space-y-2">
            {routes.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-xl bg-slate-900/50 px-3 py-2"
              >
                <span className="text-[15px] text-slate-300">
                  {r.name} · {r.stationIds.length} stops
                </span>
                <IconButton
                  label={`Remove route ${r.name}`}
                  onClick={() => removeRoute(r.id)}
                  variant="ghost"
                >
                  <Trash2 className="h-5 w-5" />
                </IconButton>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}