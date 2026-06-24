import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "dark" | "light";

interface ThemeState {
  mode: ThemeMode;
  resolved: "dark" | "light";
  setMode: (mode: ThemeMode) => void;
}

function normalizeMode(mode: unknown): ThemeMode {
  if (mode === "light") return "light";
  if (mode === "system" && typeof window !== "undefined") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return "dark";
}

function applyTheme(resolved: "dark" | "light") {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = resolved;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", resolved === "dark" ? "#000000" : "#f3f4f6");
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: "dark",
      resolved: "dark",
      setMode: (mode) => {
        applyTheme(mode);
        set({ mode, resolved: mode });
      },
    }),
    {
      name: "tesla-sc-theme",
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const mode = normalizeMode(state.mode);
        applyTheme(mode);
        state.mode = mode;
        state.resolved = mode;
      },
    }
  )
);

export function initThemeListeners() {
  if (typeof window === "undefined") return;
  const mode = normalizeMode(useThemeStore.getState().mode);
  applyTheme(mode);
  useThemeStore.setState({ mode, resolved: mode });
}