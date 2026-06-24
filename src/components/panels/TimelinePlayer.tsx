"use client";

import { useEffect, useMemo, useState } from "react";
import { Pause, Play } from "lucide-react";
import type { StationSnapshot } from "@/lib/schema/station";
import { formatTimestamp } from "@/lib/utils/format";
import { IconButton } from "@/components/ui/IconButton";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";

export function TimelinePlayer({ stationId }: { stationId: string | null }) {
  const [snapshots, setSnapshots] = useState<StationSnapshot[]>([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

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
    if (!playing || snapshots.length < 2 || reducedMotion) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % snapshots.length);
    }, 800);
    return () => clearInterval(id);
  }, [playing, snapshots.length, reducedMotion]);

  const current = snapshots[index];
  const maxOccupied = useMemo(
    () => Math.max(1, ...snapshots.map((s) => s.stall_occupied)),
    [snapshots]
  );

  if (!stationId) {
    return (
      <div className="panel p-4 text-[15px] text-slate-500">
        Select a station to replay occupancy changes.
      </div>
    );
  }

  return (
    <section className="panel space-y-3 p-4" aria-label="Occupancy timeline">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[13px] font-semibold uppercase tracking-wide text-slate-400">
          Timeline playback
        </h3>
        <IconButton
          label={playing ? "Pause timeline" : "Play timeline"}
          onClick={() => setPlaying((p) => !p)}
          aria-pressed={playing}
        >
          {playing ? (
            <Pause className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Play className="h-5 w-5" aria-hidden="true" />
          )}
        </IconButton>
      </div>

      {current ? (
        <>
          <p className="text-[15px] text-slate-300" aria-live="polite">
            {formatTimestamp(current.timestamp)} · {current.occupancy_status}
          </p>
          <div
            className="flex h-20 items-end gap-1"
            role="img"
            aria-label={`Occupancy chart, ${current.stall_occupied} stalls occupied`}
          >
            {snapshots.map((s, i) => (
              <div
                key={s.timestamp}
                className="flex-1 rounded-t bg-sky-500/30 transition-colors"
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
            className="h-11 w-full accent-sky-500"
            aria-label="Scrub timeline"
            aria-valuemin={0}
            aria-valuemax={Math.max(0, snapshots.length - 1)}
            aria-valuenow={index}
          />
          <div className="grid grid-cols-3 gap-2 text-center text-[15px]">
            <div>
              <div className="text-xl font-semibold tabular-nums text-emerald-400">
                {current.stall_available}
              </div>
              <div className="text-[13px] text-slate-500">Available</div>
            </div>
            <div>
              <div className="text-xl font-semibold tabular-nums text-amber-400">
                {current.stall_occupied}
              </div>
              <div className="text-[13px] text-slate-500">Occupied</div>
            </div>
            <div>
              <div className="text-xl font-semibold tabular-nums text-slate-300">
                {current.stall_down}
              </div>
              <div className="text-[13px] text-slate-500">Down</div>
            </div>
          </div>
        </>
      ) : (
        <p className="text-[15px] text-slate-500">Loading timeline…</p>
      )}
    </section>
  );
}