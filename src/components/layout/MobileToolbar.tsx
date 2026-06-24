"use client";

import { BarChart3, Bookmark, Map, SlidersHorizontal } from "lucide-react";
import { useUiStore, type MobileSheet } from "@/store/ui";

const ITEMS: Array<{
  id: Exclude<MobileSheet, "none">;
  label: string;
  icon: typeof Map;
}> = [
  { id: "filters", label: "Filters", icon: SlidersHorizontal },
  { id: "insights", label: "Insights", icon: BarChart3 },
  { id: "watchlist", label: "Saved", icon: Bookmark },
];

export function MobileToolbar({
  onShowMap,
}: {
  onShowMap: () => void;
}) {
  const { mobileSheet, toggleMobileSheet, closeMobileSheet } = useUiStore();

  return (
    <nav
      className="mobile-toolbar"
      aria-label="Primary navigation"
    >
      {ITEMS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          className="toolbar-btn"
          aria-current={mobileSheet === id ? "page" : undefined}
          aria-expanded={mobileSheet === id}
          onClick={() => toggleMobileSheet(id)}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
          <span>{label}</span>
        </button>
      ))}
      <button
        type="button"
        className="toolbar-btn"
        aria-current={mobileSheet === "none" ? "page" : undefined}
        onClick={() => {
          closeMobileSheet();
          onShowMap();
        }}
      >
        <Map className="h-5 w-5" aria-hidden="true" />
        <span>Map</span>
      </button>
    </nav>
  );
}