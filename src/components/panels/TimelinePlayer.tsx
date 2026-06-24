"use client";

import { useEffect, useMemo, useState } from "react";
import { Pause, Play } from "lucide-react";
import type { StationSnapshot } from "@/lib/schema/station";
import { formatTimestamp } from "@/lib/utils/format";

export function TimelinePlayer({ stationId }: { stationId: string | null }) {
  const [snapshots, setSnapshots] = useState<StationSnapshot[]>([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!stationId) {
      setSnapshots([]);
      return;
    }
    void fetch(`/api/timeline/${stationId}?hours=12`)
      .then((r) => r.json())
      .then((d) => {
        setSnapshots(d.snapshots ?? []);
        setIndex(Math.max(0, (d.snapshots?.length ?? 1) - 1));
      });
  }, [stationId]);

  useEffect(() => {
    if (!playing || snapshots.length < 2) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % snapshots.length);
    }, 800);
    return () => clearInterval(id);
  }, [playing, snapshots.length]);

  const current = snapshots[index];
  const maxOccupied = useMemo(
    () => Math.max(1, ...snapshots.map((s) => s.stall_occupied)),
    [snapshots]
  );

  if (!stationId) {
    return (
      <div className="panel p-3 text-xs text-slate-500">
        Select a station to replay occupancy changes.
      </div>
    );
  }

  return (
    <div className="panel space-y-2 p-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Timeline playback
        </div>
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          className="rounded-md border border-slate-700 p-1.5 text-slate-300 hover:border-slate-500"
        >
          {playing ? (
            <Pause className="h-3.5 w-3.5" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {current ? (
        <>
          <div className="text-xs text-slate-300">
            {formatTimestamp(current.timestamp)} · {current.occupancy_status}
          </div>
          <div className="flex h-16 items-end gap-0.5">
            {snapshots.map((s, i) => (
              <div
                key={s.timestamp}
                className="flex-1 rounded-t bg-sky-500/30 transition"
                style={{
                  height: `${(s.stall_occupied / maxOccupied) * 100}%`,
                  backgroundColor:
                    i === index ? "rgba(56,189,248,0.85)" : undefined,
                }}
                title={`${s.stall_occupied} occupied`}
              />
            ))}
          </div>
          <input
            type="range"
            min={0}
            max={Math.max(0, snapshots.length - 1)}
            value={index}
            onChange={(e) => setIndex(Number(e.target.value))}
            className="w-full accent-sky-500"
          />
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <div className="text-emerald-400">{current.stall_available}</div>
              <div className="text-slate-500">Available</div>
            </div>
            <div>
              <div className="text-amber-400">{current.stall_occupied}</div>
              <div className="text-slate-500">Occupied</div>
            </div>
            <div>
              <div className="text-slate-400">{current.stall_down}</div>
              <div className="text-slate-500">Down</div>
            </div>
          </div>
        </>
      ) : (
        <p className="text-xs text-slate-500">Loading timeline…</p>
      )}
    </div>
  );
}