"use client";

import { BarChart3, Info } from "lucide-react";

export type PanelTab = "data" | "about";

export function PanelTabs({
  active,
  onChange,
  compact = false,
}: {
  active: PanelTab;
  onChange: (tab: PanelTab) => void;
  compact?: boolean;
}) {
  const tabs: Array<{ id: PanelTab; label: string; icon: typeof BarChart3 }> = [
    { id: "data", label: "Data", icon: BarChart3 },
    { id: "about", label: "About", icon: Info },
  ];

  return (
    <div
      className={compact ? "segmented w-full" : "segmented"}
      role="tablist"
      aria-label="Panel sections"
    >
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          role="tab"
          className="segmented-btn"
          aria-selected={active === id}
          aria-controls={`panel-${id}`}
          onClick={() => onChange(id)}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}