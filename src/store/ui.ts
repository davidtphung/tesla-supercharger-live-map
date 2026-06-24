import { create } from "zustand";

export type MobileSheet = "none" | "filters" | "insights" | "watchlist";

interface UiState {
  mobileSheet: MobileSheet;
  setMobileSheet: (sheet: MobileSheet) => void;
  closeMobileSheet: () => void;
  toggleMobileSheet: (sheet: Exclude<MobileSheet, "none">) => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  mobileSheet: "none",
  setMobileSheet: (mobileSheet) => set({ mobileSheet }),
  closeMobileSheet: () => set({ mobileSheet: "none" }),
  toggleMobileSheet: (sheet) =>
    set({
      mobileSheet: get().mobileSheet === sheet ? "none" : sheet,
    }),
}));