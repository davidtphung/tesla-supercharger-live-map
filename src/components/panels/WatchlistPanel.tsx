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
      className={embedded ? "space-y-4" : "glass scroll-thin max-h-64 space-y-4 overflow-y-auto rounded-xl p-4"}
      aria-label="Saved stations"
    >
      <div className="section-label flex items-center gap-2 !mb-0" style={{ color: "var(--accent)" }}>
        <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
        Watchlist
      </div>

      {watched.length === 0 ? (
        <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Save stations from the detail panel to track occupancy here.
        </p>
      ) : (
        <ul className="space-y-2">
          {watched.map((s) => (
            <li
              key={s.station_id}
              className="flex items-center justify-between gap-2 rounded-xl px-2 py-1"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              <button
                type="button"
                onClick={() => setSelected(s.station_id)}
                className="min-h-[44px] min-w-0 flex-1 rounded-lg px-2 py-2 text-left"
              >
                <div className="truncate text-[13px]" style={{ color: "var(--text)" }}>
                  {s.station_name}
                </div>
                <div className="font-mono text-[11px]" style={{ color: "var(--text-muted)" }}>
                  {s.stall_available} avail · {s.stall_occupied} occ · {s.current_power_kw} kW
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
          <div className="section-label flex items-center gap-2 !mb-0" style={{ color: "#d96bff" }}>
            <Route className="h-3.5 w-3.5" aria-hidden="true" />
            Saved routes
          </div>
          <ul className="space-y-2">
            {routes.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-xl px-3 py-2"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
              >
                <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
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