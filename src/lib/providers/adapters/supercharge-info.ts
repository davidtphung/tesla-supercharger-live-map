import type { MetadataAdapter } from "@/lib/providers/types";
import type {
  DataConfidence,
  EnergyPortfolioType,
  StationRecord,
  StationStatus,
} from "@/lib/schema/station";
import { withRetry } from "@/lib/cache/memory-cache";

const SOURCE_URL = "https://supercharge.info/service/supercharge/allSites";

interface SuperchargeSite {
  id: number;
  locationId?: string;
  name: string;
  status: StationStatus;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    region?: string;
  };
  gps?: { latitude: number; longitude: number };
  stallCount: number;
  powerKilowatt: number;
  solarCanopy?: boolean;
  battery?: boolean;
  dateOpened?: string;
  facilityName?: string;
}

function deriveEnergyPortfolio(site: SuperchargeSite): {
  type: EnergyPortfolioType;
  confidence: DataConfidence;
  solar_present: boolean;
  battery_present: boolean;
  grid_tied: boolean;
  hybrid: boolean;
} {
  const solar = Boolean(site.solarCanopy);
  const battery = Boolean(site.battery);
  const grid_tied = site.status === "OPEN";

  if (solar && battery) {
    return {
      type: "hybrid",
      confidence: "high",
      solar_present: true,
      battery_present: true,
      grid_tied,
      hybrid: true,
    };
  }
  if (solar) {
    return {
      type: "solar",
      confidence: "high",
      solar_present: true,
      battery_present: false,
      grid_tied,
      hybrid: false,
    };
  }
  if (battery) {
    return {
      type: "battery",
      confidence: "high",
      solar_present: false,
      battery_present: true,
      grid_tied,
      hybrid: false,
    };
  }
  if (grid_tied && site.status === "OPEN") {
    return {
      type: "grid",
      confidence: "medium",
      solar_present: false,
      battery_present: false,
      grid_tied: true,
      hybrid: false,
    };
  }
  return {
    type: "unknown",
    confidence: "low",
    solar_present: false,
    battery_present: false,
    grid_tied: false,
    hybrid: false,
  };
}

export function normalizeSuperchargeSite(site: SuperchargeSite): Partial<StationRecord> {
  const energy = deriveEnergyPortfolio(site);
  const total = site.stallCount ?? 0;

  return {
    station_id: String(site.id),
    station_name: site.name,
    latitude: site.gps?.latitude ?? 0,
    longitude: site.gps?.longitude ?? 0,
    country: site.address?.country ?? "Unknown",
    region: site.address?.region ?? "Unknown",
    state: site.address?.state,
    city: site.address?.city,
    address: site.address?.street,
    stall_total: total,
    max_power_kw: site.powerKilowatt ?? 0,
    energy_portfolio_type: energy.type,
    energy_portfolio_confidence: energy.confidence,
    solar_present: energy.solar_present,
    battery_present: energy.battery_present,
    grid_tied: energy.grid_tied,
    hybrid: energy.hybrid,
    source_url: SOURCE_URL,
    source_name: "supercharge.info",
    facility_name: site.facilityName,
    date_opened: site.dateOpened,
    station_status: site.status,
    notes:
      site.status !== "OPEN"
        ? `Station status: ${site.status}`
        : undefined,
    stall_available: 0,
    stall_occupied: 0,
    stall_down: 0,
    occupancy_status: site.status === "OPEN" ? "unknown" : "closed",
    reliability_score: 0,
    congestion_score: 0,
    last_updated: new Date().toISOString(),
  };
}

export const superchargeInfoAdapter: MetadataAdapter = {
  name: "supercharge.info",

  async fetchMetadata(options) {
    const response = await withRetry(async () => {
      const res = await fetch(SOURCE_URL, {
        signal: options?.signal,
        headers: { Accept: "application/json" },
        next: options?.force ? { revalidate: 0 } : { revalidate: 3600 },
      });
      if (!res.ok) throw new Error(`supercharge.info ${res.status}`);
      return res;
    });

    const sites = (await response.json()) as SuperchargeSite[];
    const openSites = sites.filter(
      (s) => s.gps?.latitude && s.gps?.longitude && s.stallCount > 0
    );

    return {
      records: openSites.map(normalizeSuperchargeSite),
      meta: {
        source: "supercharge.info",
        fetched_at: new Date().toISOString(),
        stale_after_ms: 60 * 60 * 1000,
        confidence: "high" as DataConfidence,
      },
    };
  },
};