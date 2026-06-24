"use client";

import { Search } from "lucide-react";
import { useFilterStore } from "@/store/filters";

export function SearchBar({ id = "station-search" }: { id?: string }) {
  const query = useFilterStore((s) => s.query);
  const setQuery = useFilterStore((s) => s.setQuery);

  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"
        aria-hidden="true"
      />
      <input
        id={id}
        type="search"
        role="searchbox"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="City, station, route, or state"
        aria-label="Search stations by city, name, route, or state"
        autoComplete="off"
        enterKeyHint="search"
        className="field-input pl-11"
      />
    </div>
  );
}