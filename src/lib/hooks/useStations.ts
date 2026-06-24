"use client";

import { useCallback, useEffect, useState } from "react";
import type { StationsPayload } from "@/lib/schema/station";

export function useStations(refreshIntervalMs = 60_000) {
  const [data, setData] = useState<StationsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStations = useCallback(async (force = false) => {
    try {
      setError(null);
      const res = await fetch(`/api/stations${force ? "?force=1" : ""}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`Failed to load stations (${res.status})`);
      const payload = (await res.json()) as StationsPayload;
      setData(payload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStations();
    const id = setInterval(() => void fetchStations(), refreshIntervalMs);
    return () => clearInterval(id);
  }, [fetchStations, refreshIntervalMs]);

  return { data, loading, error, refresh: () => fetchStations(true) };
}