import { create } from "zustand";
import type { PanelTab } from "@/components/ui/PanelTabs";

export type MobileSheet = "none" | "filters" | "data" | "watchlist" | "about";

interface UiState {
  mobileSheet: MobileSheet;
  panelTab: PanelTab;
  setMobileSheet: (sheet: MobileSheet) => void;
  setPanelTab: (tab: PanelTab) => void;
  closeMobileSheet: () => void;
  toggleMobileSheet: (sheet: Exclude<MobileSheet, "none">) => void;
  openPanelTab: (tab: PanelTab) => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  mobileSheet: "none",
  panelTab: "data",
  setMobileSheet: (mobileSheet) => set({ mobileSheet }),
  setPanelTab: (panelTab) => set({ panelTab }),
  closeMobileSheet: () => set({ mobileSheet: "none" }),
  toggleMobileSheet: (sheet) => {
    const isOpen = get().mobileSheet === sheet;
    set({
      mobileSheet: isOpen ? "none" : sheet,
      panelTab: sheet === "about" ? "about" : sheet === "data" ? "data" : get().panelTab,
    });
  },
  openPanelTab: (tab) =>
    set({
      panelTab: tab,
      mobileSheet: tab,
    }),
}));