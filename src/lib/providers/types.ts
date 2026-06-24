import type { StationRecord, StationSnapshot, ProviderMeta } from "@/lib/schema/station";

export interface FetchOptions {
  force?: boolean;
  signal?: AbortSignal;
}

export interface MetadataAdapter {
  readonly name: string;
  fetchMetadata(options?: FetchOptions): Promise<{
    records: Partial<StationRecord>[];
    meta: Omit<ProviderMeta, "record_count">;
  }>;
}

export interface OccupancyAdapter {
  readonly name: string;
  fetchOccupancy(
    stationIds: string[],
    options?: FetchOptions
  ): Promise<{
    patches: OccupancyPatch[];
    meta: Omit<ProviderMeta, "record_count">;
  }>;
}

export interface OccupancyPatch {
  station_id: string;
  stall_available?: number;
  stall_occupied?: number;
  stall_down?: number;
  occupancy_status?: StationRecord["occupancy_status"];
  last_updated?: string;
  source_url?: string;
  source_name?: string;
}

export interface StationDataProvider {
  readonly name: string;
  fetchStations(options?: FetchOptions): Promise<{
    stations: StationRecord[];
    meta: ProviderMeta;
  }>;
  fetchStation(id: string, options?: FetchOptions): Promise<StationRecord | null>;
  fetchTimeline(stationId: string, hours?: number): Promise<StationSnapshot[]>;
}