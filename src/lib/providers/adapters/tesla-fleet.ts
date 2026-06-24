import type { OccupancyAdapter, OccupancyPatch } from "@/lib/providers/types";
import { withRetry } from "@/lib/cache/memory-cache";

/**
 * Tesla Fleet API occupancy adapter.
 * Requires TESLA_FLEGET_TOKEN env var — see https://developer.tesla.com/docs/fleet-api
 *
 * Uses charging site search as a regional probe; merges into station patches when matched.
 */
export const teslaFleetAdapter: OccupancyAdapter = {
  name: "tesla-fleet",

  async fetchOccupancy(_stationIds, options) {
    const token = process.env.TESLA_FLEET_TOKEN;
    if (!token) {
      return {
        patches: [],
        meta: {
          source: "tesla-fleet",
          fetched_at: new Date().toISOString(),
          stale_after_ms: 5 * 60 * 1000,
          confidence: "high",
        },
      };
    }

    try {
      const response = await withRetry(async () => {
        const res = await fetch(
          "https://fleet-api.prd.na.vn.cloud.tesla.com/api/1/charging/sites/search",
          {
            method: "POST",
            signal: options?.signal,
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              latitude: 39.8283,
              longitude: -98.5795,
              radius: 5000,
              limit: 50,
            }),
          }
        );
        if (!res.ok) throw new Error(`Tesla Fleet API ${res.status}`);
        return res;
      });

      const data = (await response.json()) as {
        response?: {
          results?: Array<{
            location_id?: string;
            name?: string;
            available_stalls?: number;
            total_stalls?: number;
          }>;
        };
      };

      const patches: OccupancyPatch[] =
        data.response?.results?.map((site) => ({
          station_id: site.location_id ?? site.name ?? "",
          stall_available: site.available_stalls ?? 0,
          stall_occupied: Math.max(
            0,
            (site.total_stalls ?? 0) - (site.available_stalls ?? 0)
          ),
          stall_down: 0,
          last_updated: new Date().toISOString(),
          source_url: "https://developer.tesla.com/docs/fleet-api",
          source_name: "tesla-fleet",
        })) ?? [];

      return {
        patches: patches.filter((p) => p.station_id),
        meta: {
          source: "tesla-fleet",
          fetched_at: new Date().toISOString(),
          stale_after_ms: 5 * 60 * 1000,
          confidence: "high",
        },
      };
    } catch {
      return {
        patches: [],
        meta: {
          source: "tesla-fleet",
          fetched_at: new Date().toISOString(),
          stale_after_ms: 5 * 60 * 1000,
          confidence: "high",
        },
      };
    }
  },
};