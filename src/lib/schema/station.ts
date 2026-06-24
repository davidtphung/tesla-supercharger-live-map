export type OccupancyStatus =
  | "available"
  | "busy"
  | "full"
  | "down"
  | "closed"
  | "unknown";

export type EnergyPortfolioType =
  | "solar"
  | "battery"
  | "grid"
  | "hybrid"
  | "unknown";

export type DataConfidence = "high" | "medium" | "low";

export type OccupancySource = "tesla-fleet" | "modeled-occupancy" | "unknown";

export type StationStatus =
  | "OPEN"
  | "CONSTRUCTION"
  | "PLAN"
  | "PERMIT"
  | "CLOSED";

export interface StationRecord {
  station_id: string;
  station_name: string;
  latitude: number;
  longitude: number;
  country: string;
  region: string;
  state?: string;
  city?: string;
  address?: string;
  stall_total: number;
  stall_available: number;
  stall_occupied: number;
  stall_down: number;
  max_power_kw: number;
  occupancy_status: OccupancyStatus;
  energy_portfolio_type: EnergyPortfolioType;
  energy_portfolio_confidence: DataConfidence;
  solar_present: boolean;
  battery_present: boolean;
  grid_tied: boolean;
  hybrid: boolean;
  source_url: string;
  source_name: string;
  last_updated: string;
  reliability_score: number;
  congestion_score: number;
  current_power_kw: number;
  occupancy_source: OccupancySource;
  notes?: string;
  facility_name?: string;
  date_opened?: string;
  station_status: StationStatus;
}

export interface StationSnapshot {
  station_id: string;
  timestamp: string;
  stall_available: number;
  stall_occupied: number;
  stall_down: number;
  occupancy_status: OccupancyStatus;
  congestion_score: number;
}

export interface NetworkStatsMeta {
  stall_available: number;
  stall_occupied: number;
  stall_total: number;
  stall_down: number;
  current_power_kw: number;
  utilization_pct: number;
}

export interface AdapterMeta {
  source: string;
  fetched_at: string;
  stale_after_ms: number;
  confidence: DataConfidence;
}

export interface ProviderMeta extends AdapterMeta {
  record_count: number;
  network_stats: NetworkStatsMeta;
}

export interface StationsPayload {
  stations: StationRecord[];
  meta: ProviderMeta;
}

export interface StationFilters {
  query: string;
  occupancy: OccupancyStatus[];
  energyPortfolio: EnergyPortfolioType[];
  regions: string[];
  minPowerKw: number;
  showHeatmap: boolean;
  showOnlyOpen: boolean;
}

export const DEFAULT_FILTERS: StationFilters = {
  query: "",
  occupancy: [],
  energyPortfolio: [],
  regions: [],
  minPowerKw: 0,
  showHeatmap: false,
  showOnlyOpen: true,
};