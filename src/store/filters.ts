import { create } from "zustand";
import type { StationFilters } from "@/lib/schema/station";
import { DEFAULT_FILTERS } from "@/lib/schema/station";

interface FilterState extends StationFilters {
  selectedStationId: string | null;
  emphasizeEnergyLayer: boolean;
  setQuery: (query: string) => void;
  toggleOccupancy: (status: StationFilters["occupancy"][number]) => void;
  toggleEnergy: (type: StationFilters["energyPortfolio"][number]) => void;
  toggleRegion: (region: string) => void;
  setMinPowerKw: (kw: number) => void;
  setShowHeatmap: (show: boolean) => void;
  setShowOnlyOpen: (show: boolean) => void;
  setSelectedStationId: (id: string | null) => void;
  setEmphasizeEnergyLayer: (v: boolean) => void;
  reset: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  ...DEFAULT_FILTERS,
  selectedStationId: null,
  emphasizeEnergyLayer: false,
  setQuery: (query) => set({ query }),
  toggleOccupancy: (status) =>
    set((s) => ({
      occupancy: s.occupancy.includes(status)
        ? s.occupancy.filter((x) => x !== status)
        : [...s.occupancy, status],
    })),
  toggleEnergy: (type) =>
    set((s) => ({
      energyPortfolio: s.energyPortfolio.includes(type)
        ? s.energyPortfolio.filter((x) => x !== type)
        : [...s.energyPortfolio, type],
    })),
  toggleRegion: (region) =>
    set((s) => ({
      regions: s.regions.includes(region)
        ? s.regions.filter((x) => x !== region)
        : [...s.regions, region],
    })),
  setMinPowerKw: (minPowerKw) => set({ minPowerKw }),
  setShowHeatmap: (showHeatmap) => set({ showHeatmap }),
  setShowOnlyOpen: (showOnlyOpen) => set({ showOnlyOpen }),
  setSelectedStationId: (selectedStationId) => set({ selectedStationId }),
  setEmphasizeEnergyLayer: (emphasizeEnergyLayer) => set({ emphasizeEnergyLayer }),
  reset: () => set({ ...DEFAULT_FILTERS, selectedStationId: null, emphasizeEnergyLayer: false }),
}));