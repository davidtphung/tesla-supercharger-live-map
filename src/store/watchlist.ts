import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WatchlistState {
  stationIds: string[];
  routes: Array<{ id: string; name: string; stationIds: string[] }>;
  addStation: (id: string) => void;
  removeStation: (id: string) => void;
  toggleStation: (id: string) => void;
  addRoute: (name: string, stationIds: string[]) => void;
  removeRoute: (id: string) => void;
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set) => ({
      stationIds: [],
      routes: [],
      addStation: (id) =>
        set((s) =>
          s.stationIds.includes(id)
            ? s
            : { stationIds: [...s.stationIds, id] }
        ),
      removeStation: (id) =>
        set((s) => ({
          stationIds: s.stationIds.filter((x) => x !== id),
        })),
      toggleStation: (id) =>
        set((s) => ({
          stationIds: s.stationIds.includes(id)
            ? s.stationIds.filter((x) => x !== id)
            : [...s.stationIds, id],
        })),
      addRoute: (name, stationIds) =>
        set((s) => ({
          routes: [
            ...s.routes,
            { id: crypto.randomUUID(), name, stationIds },
          ],
        })),
      removeRoute: (id) =>
        set((s) => ({
          routes: s.routes.filter((r) => r.id !== id),
        })),
    }),
    { name: "tesla-sc-watchlist" }
  )
);