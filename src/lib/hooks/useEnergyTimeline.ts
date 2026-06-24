"use client";

import { useCallback, useEffect, useState } from "react";
import type { EnergySnapshot } from "@/lib/scoring/energy-flow";

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

export function useEnergyTimeline({
  stationId = null,
  hours = 24,
  pollMs = 30_000,
}: {
  stationId?: string | null;
  hours?: number;
  pollMs?: number;
}) {
  const [snapshots, setSnapshots] = useState<EnergySnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const url = stationId
        ? `/api/timeline/${stationId}?hours=${hours}`
        : `/api/energy/network?hours=${hours}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Energy timeline ${response.status}`);
      const data = (await response.json()) as { snapshots?: EnergySnapshot[] };
      setSnapshots((data.snapshots ?? []).map(normalizeSnapshot));
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

  return { snapshots, loading, error, refresh };
}