"use client";

import { Search } from "lucide-react";
import { useFilterStore } from "@/store/filters";

export function SearchBar() {
  const query = useFilterStore((s) => s.query);
  const setQuery = useFilterStore((s) => s.setQuery);

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search city, station, route, state…"
        className="w-full rounded-lg border border-slate-700 bg-slate-900/80 py-2 pl-9 pr-3 text-sm text-slate-100 outline-none ring-sky-500/0 transition focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20"
      />
    </div>
  );
}