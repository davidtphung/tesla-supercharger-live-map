"use client";

import { useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { MobileToolbar } from "@/components/layout/MobileToolbar";
import { SuperchargerMap } from "@/components/map/SuperchargerMap";
import { AboutPanel } from "@/components/panels/AboutPanel";
import { DataPanel } from "@/components/panels/DataPanel";
import { FilterPanel } from "@/components/panels/FilterPanel";
import { WatchlistPanel } from "@/components/panels/WatchlistPanel";
import { StationDetailDrawer } from "@/components/panels/StationDetailDrawer";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { PanelTabs } from "@/components/ui/PanelTabs";
import { filterStations } from "@/lib/filter-stations";
import { useStations } from "@/lib/hooks/useStations";
import { aggregateEnergyFlow } from "@/lib/scoring/energy-flow";
import { aggregateNetworkStats } from "@/lib/scoring/power";
import { useFilterStore } from "@/store/filters";
import { useUiStore } from "@/store/ui";

export function AppShell() {
  const { data, loading, error, refresh } = useStations(15_000);
  const filters = useFilterStore();
  const { mobileSheet, closeMobileSheet, panelTab, setPanelTab } = useUiStore();

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

  const liveStats = useMemo(
    () => aggregateNetworkStats(filtered),
    [filtered]
  );

  const liveEnergy = useMemo(
    () => aggregateEnergyFlow(filtered.filter((s) => s.station_status === "OPEN")),
    [filtered]
  );

  const announceText = selectedStation
    ? `${selectedStation.station_name}. ${selectedStation.stall_available} available, ${selectedStation.stall_occupied} occupied, ${selectedStation.current_power_kw} kilowatts charging. Status: ${selectedStation.occupancy_status}.`
    : "";

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden" style={{ background: "var(--bg)" }}>
      <SuperchargerMap
        stations={filtered}
        selectedStationId={filters.selectedStationId}
        showHeatmap={filters.showHeatmap}
        emphasizeEnergy={filters.emphasizeEnergyLayer}
        onSelectStation={(id) => {
          closeMobileSheet();
          filters.setSelectedStationId(id);
        }}
      />

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announceText}
      </div>

      <Header
        loading={loading}
        fetchedAt={data?.meta.fetched_at}
        source={data?.meta.source}
        confidence={data?.meta.confidence}
        stationCount={filtered.length}
        liveStats={liveStats}
        panelTab={panelTab}
        onPanelTabChange={setPanelTab}
        onRefresh={refresh}
      />

      <aside
        className="pointer-events-none absolute bottom-3 left-3 top-[calc(15.5rem+var(--safe-top))] z-20 hidden w-[min(320px,calc(100vw-1.5rem))] flex-col gap-2 md:bottom-4 md:left-4 md:flex md:gap-3 lg:top-[calc(16rem+var(--safe-top))] lg:w-[min(340px,calc(100vw-2rem))]"
        aria-label="Map controls"
      >
        <div className="pointer-events-auto">
          <FilterPanel regionsInData={regionsInData} />
        </div>
        <div className="pointer-events-auto hidden lg:block">
          <PanelTabs active={panelTab} onChange={setPanelTab} />
        </div>
        <div className="pointer-events-auto hidden lg:block">
          {panelTab === "data" ? (
            <DataPanel
              stations={filtered}
              networkStations={stations}
              liveStats={liveStats}
              liveEnergy={liveEnergy}
              selectedStationId={filters.selectedStationId}
              fetchedAt={data?.meta.fetched_at}
              source={data?.meta.source}
              confidence={data?.meta.confidence}
            />
          ) : (
            <AboutPanel />
          )}
        </div>
        <div className="pointer-events-auto hidden md:block lg:hidden">
          <DataPanel
            stations={filtered}
            networkStations={stations}
            liveStats={liveStats}
            liveEnergy={liveEnergy}
            selectedStationId={filters.selectedStationId}
            fetchedAt={data?.meta.fetched_at}
            source={data?.meta.source}
            confidence={data?.meta.confidence}
          />
        </div>
        <div className="pointer-events-auto hidden md:block">
          <WatchlistPanel stations={stations} />
        </div>
      </aside>

      <BottomSheet
        open={mobileSheet === "filters"}
        title="Filters"
        onClose={closeMobileSheet}
      >
        <FilterPanel regionsInData={regionsInData} embedded />
      </BottomSheet>

      <BottomSheet
        open={mobileSheet === "data"}
        title="Data"
        onClose={closeMobileSheet}
      >
        <DataPanel
          stations={filtered}
          networkStations={stations}
          liveStats={liveStats}
          liveEnergy={liveEnergy}
          selectedStationId={filters.selectedStationId}
          fetchedAt={data?.meta.fetched_at}
          source={data?.meta.source}
          confidence={data?.meta.confidence}
          embedded
        />
      </BottomSheet>

      <BottomSheet
        open={mobileSheet === "watchlist"}
        title="Saved stations"
        onClose={closeMobileSheet}
      >
        <WatchlistPanel stations={stations} embedded />
      </BottomSheet>

      <BottomSheet
        open={mobileSheet === "about"}
        title="About"
        onClose={closeMobileSheet}
      >
        <AboutPanel embedded />
      </BottomSheet>

      <StationDetailDrawer
        station={selectedStation}
        onClose={() => filters.setSelectedStationId(null)}
      />

      <MobileToolbar onShowMap={() => filters.setSelectedStationId(null)} />

      {error && (
        <div
          role="alert"
          className="pointer-events-auto absolute bottom-[calc(76px+var(--safe-bottom))] left-1/2 z-30 max-w-[92vw] -translate-x-1/2 rounded-xl border px-4 py-3 text-[13px] md:bottom-4"
          style={{
            borderColor: "color-mix(in srgb, var(--danger) 40%, transparent)",
            background: "color-mix(in srgb, var(--danger) 15%, var(--glass-bg))",
            color: "var(--danger)",
          }}
        >
          {error}
        </div>
      )}

      <footer
        className="pointer-events-none absolute inset-x-0 bottom-[calc(68px+var(--safe-bottom))] z-10 hidden px-4 pb-2 pt-6 text-center text-[10px] tracking-[0.08em] md:block md:bottom-0"
        style={{
          color: "var(--text-faint)",
          background: "linear-gradient(to top, var(--bg), transparent)",
        }}
      >
        Metadata from{" "}
        <a
          className="pointer-events-auto underline underline-offset-2"
          href="https://supercharge.info"
          target="_blank"
          rel="noopener noreferrer"
        >
          supercharge.info
        </a>
        . Occupancy is modeled unless Tesla Fleet API is configured. · Built by{" "}
        <a
          className="pointer-events-auto underline underline-offset-2"
          href="https://x.com/davidtphung"
          target="_blank"
          rel="noopener noreferrer me"
          style={{ color: "var(--accent)" }}
        >
          David T Phung
        </a>
      </footer>
    </div>
  );
}