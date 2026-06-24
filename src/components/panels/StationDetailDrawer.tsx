"use client";

import { useEffect, useId, useRef } from "react";
import { Bookmark, X } from "lucide-react";
import type { StationRecord } from "@/lib/schema/station";
import { StationDetailContent } from "@/components/panels/StationDetailContent";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { IconButton } from "@/components/ui/IconButton";
import { useIsDesktop } from "@/lib/hooks/useMediaQuery";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";
import { useWatchlistStore } from "@/store/watchlist";

export function StationDetailDrawer({
  station,
  onClose,
}: {
  station: StationRecord | null;
  onClose: () => void;
}) {
  const isDesktop = useIsDesktop();
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const { stationIds, toggleStation } = useWatchlistStore();
  useFocusTrap(panelRef, Boolean(station && isDesktop));

  useEffect(() => {
    if (!station || isDesktop) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [station, isDesktop, onClose]);

  if (!station) return null;

  const watched = stationIds.includes(station.station_id);

  const actions = (
    <div className="flex shrink-0 gap-2">
      <IconButton
        label={watched ? "Remove from watchlist" : "Add to watchlist"}
        onClick={() => toggleStation(station.station_id)}
        variant={watched ? "accent" : "default"}
        aria-pressed={watched}
      >
        <Bookmark className="h-5 w-5" fill={watched ? "currentColor" : "none"} />
      </IconButton>
      {isDesktop && (
        <IconButton label="Close station details" onClick={onClose}>
          <X className="h-5 w-5" />
        </IconButton>
      )}
    </div>
  );

  if (!isDesktop) {
    return (
      <BottomSheet
        open
        title={station.station_name}
        onClose={onClose}
        className="sheet-panel sheet-panel-detail"
      >
        <div className="mb-3 flex justify-end">{actions}</div>
        <StationDetailContent station={station} />
      </BottomSheet>
    );
  }

  return (
    <aside
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="panel pointer-events-auto absolute bottom-4 right-4 z-30 w-[min(420px,calc(100vw-2rem))] max-h-[min(78dvh,720px)] scroll-thin overflow-y-auto p-5 shadow-2xl"
      style={{
        top: "auto",
        paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
        paddingRight: "max(1rem, env(safe-area-inset-right))",
      }}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2
          id={titleId}
          className="font-display text-lg font-semibold leading-tight text-slate-100"
        >
          {station.station_name}
        </h2>
        {actions}
      </div>
      <StationDetailContent station={station} />
    </aside>
  );
}