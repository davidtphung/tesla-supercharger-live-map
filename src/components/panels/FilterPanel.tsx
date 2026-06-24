"use client";

import type { EnergyPortfolioType, OccupancyStatus } from "@/lib/schema/station";
import { useFilterStore } from "@/store/filters";
import { SearchBar } from "@/components/panels/SearchBar";
import { FilterChip } from "@/components/ui/FilterChip";

const OCCUPANCY_OPTIONS: OccupancyStatus[] = [
  "available",
  "busy",
  "full",
  "down",
  "closed",
];

const ENERGY_OPTIONS: EnergyPortfolioType[] = [
  "solar",
  "battery",
  "grid",
  "hybrid",
  "unknown",
];

const REGIONS = [
  "North America",
  "Europe",
  "Asia Pacific",
  "Middle East",
  "Africa",
];

export function FilterPanel({
  regionsInData,
  embedded = false,
}: {
  regionsInData: string[];
  embedded?: boolean;
}) {
  const filters = useFilterStore();
  const regionOptions = [...new Set([...REGIONS, ...regionsInData])].sort();
  const activeCount =
    filters.occupancy.length +
    filters.energyPortfolio.length +
    filters.regions.length +
    (filters.minPowerKw > 0 ? 1 : 0) +
    (filters.showHeatmap ? 1 : 0) +
    (!filters.showOnlyOpen ? 1 : 0);

  return (
    <div
      className={
        embedded
          ? "space-y-5"
          : "glass scroll-thin max-h-[min(72dvh,640px)] space-y-5 overflow-y-auto rounded-xl p-4 md:max-h-[calc(100dvh-10rem)]"
      }
      role="search"
      aria-label="Station filters"
    >
      <div>
        <label htmlFor="station-search" className="section-label">
          Search
        </label>
        <SearchBar id="station-search" />
      </div>

      {activeCount > 0 && (
        <p className="font-mono text-[11px] tracking-wide" style={{ color: "var(--text-faint)" }} aria-live="polite">
          {activeCount} filter{activeCount === 1 ? "" : "s"} active
        </p>
      )}

      <fieldset className="border-0 p-0">
        <legend className="section-label">Occupancy</legend>
        <div className="flex flex-wrap gap-2" role="group">
          {OCCUPANCY_OPTIONS.map((status) => (
            <FilterChip
              key={status}
              label={status}
              pressed={filters.occupancy.includes(status)}
              onPress={() => filters.toggleOccupancy(status)}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="border-0 p-0">
        <legend className="section-label">Energy portfolio</legend>
        <div className="flex flex-wrap gap-2" role="group">
          {ENERGY_OPTIONS.map((type) => (
            <FilterChip
              key={type}
              label={type}
              tone="amber"
              pressed={filters.energyPortfolio.includes(type)}
              onPress={() => filters.toggleEnergy(type)}
            />
          ))}
        </div>
        <label className="field-check mt-2">
          <input
            type="checkbox"
            checked={filters.emphasizeEnergyLayer}
            onChange={(e) => filters.setEmphasizeEnergyLayer(e.target.checked)}
          />
          Color markers by energy type
        </label>
      </fieldset>

      <fieldset className="border-0 p-0">
        <legend className="section-label">Region</legend>
        <div className="flex flex-wrap gap-2" role="group">
          {regionOptions.map((region) => (
            <FilterChip
              key={region}
              label={region}
              tone="violet"
              pressed={filters.regions.includes(region)}
              onPress={() => filters.toggleRegion(region)}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="border-0 p-0">
        <legend className="section-label" id="power-range-label">
          Minimum power
        </legend>
        <input
          type="range"
          min={0}
          max={350}
          step={25}
          value={filters.minPowerKw}
          onChange={(e) => filters.setMinPowerKw(Number(e.target.value))}
          className="h-11 w-full"
          style={{ accentColor: "var(--accent-strong)" }}
          aria-labelledby="power-range-label"
          aria-valuemin={0}
          aria-valuemax={350}
          aria-valuenow={filters.minPowerKw}
        />
        <div className="mt-2 font-mono text-[12px]" style={{ color: "var(--text-muted)" }}>
          {filters.minPowerKw === 0 ? "Any" : `≥ ${filters.minPowerKw} kW`}
        </div>
      </fieldset>

      <fieldset className="space-y-1 border-0 p-0">
        <legend className="section-label">Map layers</legend>
        <label className="field-check">
          <input
            type="checkbox"
            checked={filters.showHeatmap}
            onChange={(e) => filters.setShowHeatmap(e.target.checked)}
          />
          Congestion heat map
        </label>
        <label className="field-check">
          <input
            type="checkbox"
            checked={filters.showOnlyOpen}
            onChange={(e) => filters.setShowOnlyOpen(e.target.checked)}
          />
          Open stations only
        </label>
      </fieldset>

      <button
        type="button"
        onClick={() => filters.reset()}
        className="w-full min-h-[44px] rounded-xl border py-3 text-[13px] font-medium transition hover:opacity-90"
        style={{
          borderColor: "var(--border-strong)",
          color: "var(--text-secondary)",
          background: "var(--bg-card)",
        }}
      >
        Reset filters
      </button>
    </div>
  );
}