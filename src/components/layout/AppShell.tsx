"use client";

import { useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { SuperchargerMap } from "@/components/map/SuperchargerMap";
import { FilterPanel } from "@/components/panels/FilterPanel";
import { SummaryCards } from "@/components/panels/SummaryCards";
import { WatchlistPanel } from "@/components/panels/WatchlistPanel";
import { TimelinePlayer } from "@/components/panels/TimelinePlayer";
import { StationDetailDrawer } from "@/components/panels/StationDetailDrawer";
import { filterStations } from "@/lib/filter-stations";
import { useStations } from "@/lib/hooks/useStations";
import { useFilterStore } from "@/store/filters";

export function AppShell() {
  const { data, loading, error, refresh } = useStations(60_000);
  const filters = useFilterStore();

  const stations = useMemo(() => data?.stations ?? [], [data?.stations]);
  const filtered = useMemo(
    () => filterStations(stations, filters),
    [stations, filters]
  );

  const selectedStation = useMemo(
    () =>
      filtered.find((s) => s.station_id === filters.selectedStationId) ??
      stations.find((s) => s.station_id === filters.selectedStationId) ??
      null,
    [filtered, stations, filters.selectedStationId]
  );

  const regionsInData = useMemo(
    () => [...new Set(stations.map((s) => s.region))],
    [stations]
  );

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#0a0e17]">
      <SuperchargerMap
        stations={filtered}
        selectedStationId={filters.selectedStationId}
        showHeatmap={filters.showHeatmap}
        emphasizeEnergy={filters.emphasizeEnergyLayer}
        onSelectStation={filters.setSelectedStationId}
      />

      <Header
        loading={loading}
        fetchedAt={data?.meta.fetched_at}
        source={data?.meta.source}
        confidence={data?.meta.confidence}
        stationCount={filtered.length}
        onRefresh={refresh}
      />

      <div className="pointer-events-none absolute bottom-3 left-3 top-20 z-20 flex w-[min(320px,calc(100vw-1.5rem))] flex-col gap-2 md:bottom-4 md:left-4 md:top-24">
        <div className="pointer-events-auto">
          <FilterPanel regionsInData={regionsInData} />
        </div>
        <div className="pointer-events-auto hidden lg:block">
          <SummaryCards stations={filtered} />
        </div>
        <div className="pointer-events-auto hidden md:block">
          <WatchlistPanel stations={stations} />
        </div>
        <div className="pointer-events-auto hidden xl:block">
          <TimelinePlayer stationId={filters.selectedStationId} />
        </div>
      </div>

      <StationDetailDrawer
        station={selectedStation}
        onClose={() => filters.setSelectedStationId(null)}
      />

      {error && (
        <div className="pointer-events-auto absolute bottom-3 left-1/2 z-30 -translate-x-1/2 rounded-lg border border-red-500/40 bg-red-950/80 px-4 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      <footer className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-[#0a0e17] to-transparent px-4 pb-2 pt-6 text-center text-[10px] text-slate-600">
        Station metadata from{" "}
        <a
          className="pointer-events-auto underline"
          href="https://supercharge.info"
          target="_blank"
          rel="noopener noreferrer"
        >
          supercharge.info
        </a>
        . Occupancy uses modeled refresh cycles unless Tesla Fleet API is configured.
      </footer>
    </div>
  );
}