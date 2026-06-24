import {
  getNetworkEnergySnapshots,
  getStationEnergySnapshots,
  mergeEnergyHistory,
  recordNetworkEnergySnapshot,
  recordStationEnergySnapshot,
} from "@/lib/cache/energy-snapshots";
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
  OccupancyPatch,
  StationDataProvider,
} from "@/lib/providers/types";
import type {
  StationRecord,
  StationSnapshot,
  StationsPayload,
} from "@/lib/schema/station";
import {
  computeCongestionScore,
  computeReliabilityScore,
  deriveOccupancyStatus,
} from "@/lib/scoring/congestion";
import {
  aggregateEnergyFlow,
  buildNetworkEnergyTimeline,
  estimateEnergyFlow,
} from "@/lib/scoring/energy-flow";
import {
  aggregateNetworkStats,
  estimateCurrentPowerKw,
} from "@/lib/scoring/power";
import type { OccupancySource } from "@/lib/schema/station";

const STATIONS_CACHE_KEY = "stations:composite:v3";
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
    current_power_kw: partial.current_power_kw ?? 0,
    power_out_kw: partial.power_out_kw ?? 0,
    power_in_kw: partial.power_in_kw ?? 0,
    solar_in_kw: partial.solar_in_kw ?? 0,
    grid_in_kw: partial.grid_in_kw ?? 0,
    battery_net_kw: partial.battery_net_kw ?? 0,
    occupancy_source: partial.occupancy_source ?? "unknown",
    notes: partial.notes,
    facility_name: partial.facility_name,
    date_opened: partial.date_opened,
    station_status,
  };

  const withScores = {
    ...base,
    reliability_score: computeReliabilityScore(base),
    congestion_score: computeCongestionScore(
      base.stall_available,
      base.stall_occupied,
      base.stall_down,
      base.stall_total
    ),
  };

  const current_power_kw = estimateCurrentPowerKw(withScores);
  const energy = estimateEnergyFlow(withScores, partial.last_updated);

  return {
    ...withScores,
    current_power_kw,
    ...energy,
  };
}

function applyLiveOccupancy(stations: StationRecord[]): StationRecord[] {
  const patches = modelOccupancyForStations(stations, 1);
  return applyOccupancyPatches(stations, patches).map((s) => finalizeStation(s));
}

function recordEnergySnapshots(stations: StationRecord[]) {
  const ts = new Date().toISOString();
  const network = aggregateEnergyFlow(stations);
  recordNetworkEnergySnapshot({ timestamp: ts, ...network });

  for (const station of stations.slice(0, 300)) {
    recordStationEnergySnapshot(station.station_id, {
      timestamp: ts,
      power_out_kw: station.power_out_kw,
      power_in_kw: station.power_in_kw,
      solar_in_kw: station.solar_in_kw,
      grid_in_kw: station.grid_in_kw,
      battery_net_kw: station.battery_net_kw,
    });
  }
}

function withLiveMeta(stations: StationRecord[], meta: StationsPayload["meta"]) {
  const network = aggregateNetworkStats(stations);
  const energy = aggregateEnergyFlow(stations);
  return {
    stations,
    meta: {
      ...meta,
      fetched_at: new Date().toISOString(),
      network_stats: {
        stall_available: network.stall_available,
        stall_occupied: network.stall_occupied,
        stall_total: network.stall_total,
        stall_down: network.stall_down,
        current_power_kw: network.current_power_kw,
        power_in_kw: energy.power_in_kw,
        power_out_kw: energy.power_out_kw,
        utilization_pct: network.utilization_pct,
      },
    },
  };
}

function resolveOccupancySource(sourceName?: string): OccupancySource {
  if (!sourceName) return "unknown";
  if (sourceName.includes("tesla-fleet")) return "tesla-fleet";
  if (sourceName.includes("modeled-occupancy")) return "modeled-occupancy";
  return "unknown";
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
      const cached = cacheGet<StationsPayload>(STATIONS_CACHE_KEY);
      if (cached) {
        const live = withLiveMeta(applyLiveOccupancy(cached.stations), cached.meta);
        recordEnergySnapshots(live.stations);
        return live;
      }
    }

    const { records, meta: metadataMeta } =
      await this.metadataAdapter.fetchMetadata(options);

    let stations = records
      .filter((r) => r.latitude && r.longitude)
      .map((r) => finalizeStation(r));

    const ids = stations.map((s) => s.station_id);
    let occupancyConfidence: "high" | "medium" | "low" = "low";
    let occupancySource = "modeled-occupancy";
    const allPatches: OccupancyPatch[] = [];

    for (const adapter of this.occupancyAdapters) {
      const { patches, meta } = await adapter.fetchOccupancy(ids, options);
      if (patches.length > 0) {
        allPatches.push(...patches);
        occupancyConfidence = meta.confidence;
        occupancySource = meta.source;
      }
    }

    if (allPatches.length === 0 && this.fallbackModeled) {
      allPatches.push(...modelOccupancyForStations(stations, 1));
      occupancyConfidence = "low";
      occupancySource = "modeled-occupancy";
    }

    stations = applyOccupancyPatches(stations, allPatches).map((s) =>
      finalizeStation({
        ...s,
        source_name: `${s.source_name}+${occupancySource}`,
        occupancy_source: resolveOccupancySource(
          patchSourceForStation(s, allPatches) ?? occupancySource
        ),
      })
    );

    this.recordTimelineSnapshots(stations);
    recordEnergySnapshots(stations);

    const network = aggregateNetworkStats(stations);
    const energy = aggregateEnergyFlow(stations);
    const payload = {
      stations,
      meta: {
        source: `${metadataMeta.source}+${occupancySource}`,
        fetched_at: new Date().toISOString(),
        stale_after_ms: CACHE_TTL_MS,
        confidence: occupancyConfidence,
        record_count: stations.length,
        network_stats: {
          stall_available: network.stall_available,
          stall_occupied: network.stall_occupied,
          stall_total: network.stall_total,
          stall_down: network.stall_down,
          current_power_kw: network.current_power_kw,
          power_in_kw: energy.power_in_kw,
          power_out_kw: energy.power_out_kw,
          utilization_pct: network.utilization_pct,
        },
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

  async fetchNetworkEnergyTimeline(hours = 24) {
    const { stations } = await this.fetchStations();
    const recorded = getNetworkEnergySnapshots();
    const modeled = buildNetworkEnergyTimeline(stations, hours);
    const snapshots = mergeEnergyHistory(recorded, modeled);
    const current = aggregateEnergyFlow(
      stations.filter((s) => s.station_status === "OPEN")
    );
    return {
      snapshots: snapshots.slice(-hours * 4),
      current: { timestamp: new Date().toISOString(), ...current },
    };
  }

  async fetchStationEnergyTimeline(stationId: string, hours = 24) {
    const station = await this.fetchStation(stationId);
    if (!station) return { snapshots: [], current: null };

    const recorded = getStationEnergySnapshots(stationId);
    const modeled = buildNetworkEnergyTimeline([station], hours);
    const snapshots = mergeEnergyHistory(recorded, modeled);
    return {
      snapshots: snapshots.slice(-hours * 4),
      current: {
        timestamp: new Date().toISOString(),
        power_out_kw: station.power_out_kw,
        power_in_kw: station.power_in_kw,
        solar_in_kw: station.solar_in_kw,
        grid_in_kw: station.grid_in_kw,
        battery_net_kw: station.battery_net_kw,
      },
    };
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
      const flow = estimateEnergyFlow(
        {
          ...station,
          stall_occupied: patch.stall_occupied ?? 0,
        },
        ts
      );
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
        ...flow,
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
        power_out_kw: station.power_out_kw,
        power_in_kw: station.power_in_kw,
        solar_in_kw: station.solar_in_kw,
        grid_in_kw: station.grid_in_kw,
        battery_net_kw: station.battery_net_kw,
      };
      const next = [...existing, snapshot].slice(-96);
      cacheSet(key, next, 24 * 60 * 60 * 1000);
    }
  }
}

function patchSourceForStation(
  station: StationRecord,
  patches: OccupancyPatch[]
): string | undefined {
  return patches.find((p) => p.station_id === station.station_id)?.source_name;
}

export const stationProvider = new CompositeStationProvider();