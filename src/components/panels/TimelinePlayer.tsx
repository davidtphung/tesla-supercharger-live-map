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
      <div className="card p-4 text-[13px]" style={{ color: "var(--text-muted)" }}>
        Select a station to replay occupancy changes.
      </div>
    );
  }

  return (
    <section className="card p-4" aria-label="Occupancy timeline">
      <div className="flex items-center justify-between gap-3">
        <h3 className="section-label !mb-0">Timeline playback</h3>
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
          <p className="mt-3 font-mono text-[12px]" style={{ color: "var(--text-secondary)" }} aria-live="polite">
            {formatTimestamp(current.timestamp)} · {current.occupancy_status}
          </p>
          <div
            className="mt-3 flex h-20 items-end gap-1"
            role="img"
            aria-label={`Occupancy chart, ${current.stall_occupied} stalls occupied`}
          >
            {snapshots.map((s, i) => (
              <div
                key={s.timestamp}
                className="flex-1 rounded-t transition-colors"
                style={{
                  height: `${(s.stall_occupied / maxOccupied) * 100}%`,
                  backgroundColor:
                    i === index
                      ? "var(--accent)"
                      : "color-mix(in srgb, var(--accent-strong) 28%, transparent)",
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
            className="mt-3 h-11 w-full"
            style={{ accentColor: "var(--accent-strong)" }}
            aria-label="Scrub timeline"
          />
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <Metric label="Available" value={current.stall_available} color="var(--success)" />
            <Metric label="Occupied" value={current.stall_occupied} color="var(--warning)" />
            <Metric label="Down" value={current.stall_down} color="var(--text-secondary)" />
          </div>
        </>
      ) : (
        <p className="mt-3 text-[13px]" style={{ color: "var(--text-muted)" }}>
          Loading timeline…
        </p>
      )}
    </section>
  );
}

function Metric({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div>
      <div className="font-mono text-xl font-semibold tabular-nums" style={{ color }}>
        {value}
      </div>
      <div className="text-[11px] tracking-wide" style={{ color: "var(--text-muted)" }}>
        {label}
      </div>
    </div>
  );
}