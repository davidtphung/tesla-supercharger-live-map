import type { StationFilters, StationRecord } from "@/lib/schema/station";

export function filterStations(
  stations: StationRecord[],
  filters: StationFilters
): StationRecord[] {
  const q = filters.query.trim().toLowerCase();

  return stations.filter((s) => {
    if (filters.showOnlyOpen && s.station_status !== "OPEN") return false;
    if (filters.minPowerKw > 0 && s.max_power_kw < filters.minPowerKw) return false;
    if (
      filters.occupancy.length > 0 &&
      !filters.occupancy.includes(s.occupancy_status)
    )
      return false;
    if (
      filters.energyPortfolio.length > 0 &&
      !filters.energyPortfolio.includes(s.energy_portfolio_type)
    )
      return false;
    if (filters.regions.length > 0 && !filters.regions.includes(s.region))
      return false;

    if (!q) return true;
    const haystack = [
      s.station_name,
      s.city,
      s.state,
      s.country,
      s.region,
      s.facility_name,
      s.address,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function topBusiest(stations: StationRecord[], n = 5): StationRecord[] {
  return [...stations]
    .filter((s) => s.station_status === "OPEN")
    .sort((a, b) => b.congestion_score - a.congestion_score)
    .slice(0, n);
}

export function topPower(stations: StationRecord[], n = 5): StationRecord[] {
  return [...stations]
    .filter((s) => s.station_status === "OPEN")
    .sort((a, b) => b.max_power_kw - a.max_power_kw)
    .slice(0, n);
}

export function topResilient(stations: StationRecord[], n = 5): StationRecord[] {
  return [...stations]
    .filter((s) => s.station_status === "OPEN")
    .sort((a, b) => b.reliability_score - a.reliability_score)
    .slice(0, n);
}