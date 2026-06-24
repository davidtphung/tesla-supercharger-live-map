"use client";

import { useCallback, useEffect, useState } from "react";
import type { SuperchargeChartsPayload } from "@/lib/providers/adapters/supercharge-charts";

export function useSuperchargeCharts(pollMs = 60_000) {
  const [data, setData] = useState<SuperchargeChartsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (force = false) => {
    try {
      const url = force ? "/api/supercharge/charts?force=1" : "/api/supercharge/charts";
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Charts ${res.status}`);
      setData((await res.json()) as SuperchargeChartsPayload);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load supercharge.info charts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), pollMs);
    return () => clearInterval(id);
  }, [refresh, pollMs]);

  return { data, loading, error, refresh };
}