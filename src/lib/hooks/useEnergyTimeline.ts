"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { EnergyFlow, EnergySnapshot } from "@/lib/scoring/energy-flow";

function normalizeSnapshot(
  row: Partial<EnergySnapshot> & { timestamp: string }
): EnergySnapshot {
  return {
    timestamp: row.timestamp,
    power_in_kw: row.power_in_kw ?? 0,
    power_out_kw: row.power_out_kw ?? 0,
    solar_in_kw: row.solar_in_kw ?? 0,
    grid_in_kw: row.grid_in_kw ?? 0,
    battery_net_kw: row.battery_net_kw ?? 0,
  };
}

function mergeLivePoint(
  snapshots: EnergySnapshot[],
  liveFlow?: EnergyFlow | null
): EnergySnapshot[] {
  if (!liveFlow) return snapshots;
  const live: EnergySnapshot = {
    timestamp: new Date().toISOString(),
    ...liveFlow,
  };
  if (snapshots.length === 0) return [live];

  const next = [...snapshots];
  const last = next[next.length - 1];
  const sameMinute =
    Math.floor(new Date(last.timestamp).getTime() / 60_000) ===
    Math.floor(Date.now() / 60_000);

  if (sameMinute) {
    next[next.length - 1] = live;
  } else {
    next.push(live);
  }
  return next;
}

export function useEnergyTimeline({
  stationId = null,
  liveFlow = null,
  hours = 24,
  pollMs = 15_000,
}: {
  stationId?: string | null;
  liveFlow?: EnergyFlow | null;
  hours?: number;
  pollMs?: number;
}) {
  const [snapshots, setSnapshots] = useState<EnergySnapshot[]>([]);
  const [current, setCurrent] = useState<EnergySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const url = stationId
        ? `/api/energy/station/${stationId}?hours=${hours}`
        : `/api/energy/network?hours=${hours}`;
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error(`Energy timeline ${response.status}`);
      const data = (await response.json()) as {
        snapshots?: EnergySnapshot[];
        current?: EnergySnapshot;
      };
      setSnapshots((data.snapshots ?? []).map(normalizeSnapshot));
      setCurrent(data.current ? normalizeSnapshot(data.current) : null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load energy timeline");
    } finally {
      setLoading(false);
    }
  }, [stationId, hours]);

  useEffect(() => {
    setLoading(true);
    void refresh();
    const id = setInterval(() => void refresh(), pollMs);
    return () => clearInterval(id);
  }, [refresh, pollMs]);

  const liveSnapshots = useMemo(
    () => mergeLivePoint(snapshots, liveFlow ?? current),
    [snapshots, liveFlow, current]
  );

  const liveCurrent = useMemo(() => {
    if (liveFlow) {
      return { timestamp: new Date().toISOString(), ...liveFlow };
    }
    return liveSnapshots[liveSnapshots.length - 1] ?? current;
  }, [liveFlow, liveSnapshots, current]);

  return {
    snapshots: liveSnapshots,
    current: liveCurrent,
    loading,
    error,
    refresh,
  };
}