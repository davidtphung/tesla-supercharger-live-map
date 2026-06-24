"use client";

import type { EnergyPortfolioType, OccupancyStatus } from "@/lib/schema/station";
import { useFilterStore } from "@/store/filters";
import { SearchBar } from "@/components/panels/SearchBar";

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

export function FilterPanel({ regionsInData }: { regionsInData: string[] }) {
  const filters = useFilterStore();
  const regionOptions = [...new Set([...REGIONS, ...regionsInData])].sort();

  return (
    <div className="panel scroll-thin max-h-[calc(100vh-8rem)] space-y-4 overflow-y-auto p-4">
      <div>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Search
        </h2>
        <SearchBar />
      </div>

      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Occupancy
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {OCCUPANCY_OPTIONS.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => filters.toggleOccupancy(status)}
              className={`rounded-full border px-2.5 py-1 text-xs capitalize transition ${
                filters.occupancy.includes(status)
                  ? "border-sky-500/60 bg-sky-500/15 text-sky-300"
                  : "border-slate-700 text-slate-400 hover:border-slate-500"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Energy portfolio
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {ENERGY_OPTIONS.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => filters.toggleEnergy(type)}
              className={`rounded-full border px-2.5 py-1 text-xs capitalize transition ${
                filters.energyPortfolio.includes(type)
                  ? "border-amber-500/60 bg-amber-500/15 text-amber-200"
                  : "border-slate-700 text-slate-400 hover:border-slate-500"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
        <label className="mt-3 flex items-center gap-2 text-xs text-slate-400">
          <input
            type="checkbox"
            checked={filters.emphasizeEnergyLayer}
            onChange={(e) => filters.setEmphasizeEnergyLayer(e.target.checked)}
            className="rounded border-slate-600"
          />
          Color markers by energy type
        </label>
      </section>

      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Region
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {regionOptions.map((region) => (
            <button
              key={region}
              type="button"
              onClick={() => filters.toggleRegion(region)}
              className={`rounded-full border px-2.5 py-1 text-xs transition ${
                filters.regions.includes(region)
                  ? "border-violet-500/60 bg-violet-500/15 text-violet-200"
                  : "border-slate-700 text-slate-400 hover:border-slate-500"
              }`}
            >
              {region}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Min power (kW)
        </h3>
        <input
          type="range"
          min={0}
          max={350}
          step={25}
          value={filters.minPowerKw}
          onChange={(e) => filters.setMinPowerKw(Number(e.target.value))}
          className="w-full accent-sky-500"
        />
        <div className="mt-1 text-xs text-slate-400">
          {filters.minPowerKw === 0 ? "Any" : `≥ ${filters.minPowerKw} kW`}
        </div>
      </section>

      <section className="space-y-2">
        <label className="flex items-center gap-2 text-xs text-slate-400">
          <input
            type="checkbox"
            checked={filters.showHeatmap}
            onChange={(e) => filters.setShowHeatmap(e.target.checked)}
            className="rounded border-slate-600"
          />
          Congestion heat map
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-400">
          <input
            type="checkbox"
            checked={filters.showOnlyOpen}
            onChange={(e) => filters.setShowOnlyOpen(e.target.checked)}
            className="rounded border-slate-600"
          />
          Open stations only
        </label>
      </section>

      <button
        type="button"
        onClick={() => filters.reset()}
        className="w-full rounded-lg border border-slate-700 py-2 text-xs text-slate-400 transition hover:border-slate-500 hover:text-slate-200"
      >
        Reset filters
      </button>
    </div>
  );
}