import { cacheGet, cacheSet } from "@/lib/cache/memory-cache";
import { superchargeInfoAdapter } from "@/lib/providers/adapters/supercharge-info";
import {
  applyOccupancyPatches,
  modelOccupancyForStations,
} from "@/lib/providers/adapters/modeled-occupancy";
import { teslaFleetAdapter } from "@/lib/providers/adapters/tesla-fleet";
import type {
  MetadataAdapter,
  OccupancyAdapter,
  StationDataProvider,
} from "@/lib/providers/types";
import type { StationRecord, StationSnapshot } from "@/lib/schema/station";
import {
  computeCongestionScore,
  computeReliabilityScore,
  deriveOccupancyStatus,
} from "@/lib/scoring/congestion";

const STATIONS_CACHE_KEY = "stations:composite:v1";
const TIMELINE_CACHE_PREFIX = "timeline:";
const CACHE_TTL_MS = 15 * 60 * 1000;

function finalizeStation(partial: Partial<StationRecord>): StationRecord {
  const stall_total = partial.stall_total ?? 0;
  const stall_available = partial.stall_available ?? 0;
  const stall_occupied = partial.stall_occupied ?? 0;
  const stall_down = partial.stall_down ?? 0;
  const station_status = partial.station_status ?? "OPEN";

  const base: StationRecord = {
    station_id: partial.station_id ?? "",
    station_name: partial.station_name ?? "Unknown",
    latitude: partial.latitude ?? 0,
    longitude: partial.longitude ?? 0,
    country: partial.country ?? "Unknown",
    region: partial.region ?? "Unknown",
    state: partial.state,
    city: partial.city,
    address: partial.address,
    stall_total,
    stall_available,
    stall_occupied,
    stall_down,
    max_power_kw: partial.max_power_kw ?? 0,
    occupancy_status:
      partial.occupancy_status ??
      deriveOccupancyStatus(
        stall_available,
        stall_occupied,
        stall_down,
        stall_total,
        station_status
      ),
    energy_portfolio_type: partial.energy_portfolio_type ?? "unknown",
    energy_portfolio_confidence: partial.energy_portfolio_confidence ?? "low",
    solar_present: partial.solar_present ?? false,
    battery_present: partial.battery_present ?? false,
    grid_tied: partial.grid_tied ?? false,
    hybrid: partial.hybrid ?? false,
    source_url: partial.source_url ?? "",
    source_name: partial.source_name ?? "unknown",
    last_updated: partial.last_updated ?? new Date().toISOString(),
    reliability_score: 0,
    congestion_score: 0,
    notes: partial.notes,
    facility_name: partial.facility_name,
    date_opened: partial.date_opened,
    station_status,
  };

  return {
    ...base,
    reliability_score: computeReliabilityScore(base),
    congestion_score: computeCongestionScore(
      base.stall_available,
      base.stall_occupied,
      base.stall_down,
      base.stall_total
    ),
  };
}

export class CompositeStationProvider implements StationDataProvider {
  readonly name = "composite";

  constructor(
    private metadataAdapter: MetadataAdapter = superchargeInfoAdapter,
    private occupancyAdapters: OccupancyAdapter[] = [
      teslaFleetAdapter,
    ],
    private fallbackModeled = true
  ) {}

  async fetchStations(options?: import("@/lib/providers/types").FetchOptions) {
    if (!options?.force) {
      const cached = cacheGet<{
        stations: StationRecord[];
        meta: { source: string; fetched_at: string; stale_after_ms: number; confidence: "high" | "medium" | "low"; record_count: number };
      }>(STATIONS_CACHE_KEY);
      if (cached) return cached;
    }

    const { records, meta: metadataMeta } =
      await this.metadataAdapter.fetchMetadata(options);

    let stations = records
      .filter((r) => r.latitude && r.longitude)
      .map((r) => finalizeStation(r));

    const ids = stations.map((s) => s.station_id);
    let occupancyConfidence: "high" | "medium" | "low" = "low";
    let occupancySource = "modeled-occupancy";
    const allPatches = [];

    for (const adapter of this.occupancyAdapters) {
      const { patches, meta } = await adapter.fetchOccupancy(ids, options);
      if (patches.length > 0) {
        allPatches.push(...patches);
        occupancyConfidence = meta.confidence;
        occupancySource = meta.source;
      }
    }

    if (allPatches.length === 0 && this.fallbackModeled) {
      allPatches.push(...modelOccupancyForStations(stations));
      occupancyConfidence = "low";
      occupancySource = "modeled-occupancy";
    }

    stations = applyOccupancyPatches(stations, allPatches).map((s) =>
      finalizeStation({
        ...s,
        source_name: `${s.source_name}+${occupancySource}`,
      })
    );

    this.recordTimelineSnapshots(stations);

    const payload = {
      stations,
      meta: {
        source: `${metadataMeta.source}+${occupancySource}`,
        fetched_at: new Date().toISOString(),
        stale_after_ms: CACHE_TTL_MS,
        confidence: occupancyConfidence,
        record_count: stations.length,
      },
    };

    cacheSet(STATIONS_CACHE_KEY, payload, CACHE_TTL_MS);
    return payload;
  }

  async fetchStation(
    id: string,
    options?: import("@/lib/providers/types").FetchOptions
  ) {
    const { stations } = await this.fetchStations(options);
    return stations.find((s) => s.station_id === id) ?? null;
  }

  async fetchTimeline(stationId: string, hours = 24): Promise<StationSnapshot[]> {
    const key = `${TIMELINE_CACHE_PREFIX}${stationId}`;
    const cached = cacheGet<StationSnapshot[]>(key);
    if (cached?.length) return cached.slice(-hours * 4);

    const station = await this.fetchStation(stationId);
    if (!station) return [];

    const now = Date.now();
    const snapshots: StationSnapshot[] = [];
    for (let i = hours * 4; i >= 0; i--) {
      const ts = new Date(now - i * 15 * 60 * 1000).toISOString();
      const patch = modelOccupancyForStations([{ ...station, last_updated: ts }])[0];
      snapshots.push({
        station_id: stationId,
        timestamp: ts,
        stall_available: patch.stall_available ?? 0,
        stall_occupied: patch.stall_occupied ?? 0,
        stall_down: patch.stall_down ?? 0,
        occupancy_status: patch.occupancy_status ?? "unknown",
        congestion_score: computeCongestionScore(
          patch.stall_available ?? 0,
          patch.stall_occupied ?? 0,
          patch.stall_down ?? 0,
          station.stall_total
        ),
      });
    }

    cacheSet(key, snapshots, 60 * 60 * 1000);
    return snapshots;
  }

  private recordTimelineSnapshots(stations: StationRecord[]) {
    const sample = stations.slice(0, 200);
    for (const station of sample) {
      const key = `${TIMELINE_CACHE_PREFIX}${station.station_id}`;
      const existing = cacheGet<StationSnapshot[]>(key) ?? [];
      const snapshot: StationSnapshot = {
        station_id: station.station_id,
        timestamp: station.last_updated,
        stall_available: station.stall_available,
        stall_occupied: station.stall_occupied,
        stall_down: station.stall_down,
        occupancy_status: station.occupancy_status,
        congestion_score: station.congestion_score,
      };
      const next = [...existing, snapshot].slice(-96);
      cacheSet(key, next, 24 * 60 * 60 * 1000);
    }
  }
}

export const stationProvider = new CompositeStationProvider();