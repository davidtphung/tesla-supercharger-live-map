"use client";

import type { DataConfidence, StationRecord } from "@/lib/schema/station";
import type { EnergyFlow } from "@/lib/scoring/energy-flow";
import type { NetworkLiveStats } from "@/lib/scoring/power";
import { formatRelativeTime } from "@/lib/utils/format";
import { EnergyFlowPanel } from "@/components/panels/EnergyFlowPanel";
import { LiveStatsBar } from "@/components/panels/LiveStatsBar";
import { SummaryCards } from "@/components/panels/SummaryCards";
import { SuperchargeChartsPanel } from "@/components/panels/SuperchargeChartsPanel";
import { TimelinePlayer } from "@/components/panels/TimelinePlayer";

export function DataPanel({
  stations,
  networkStations,
  liveStats,
  liveEnergy,
  selectedStationId,
  fetchedAt,
  source,
  confidence,
  embedded = false,
}: {
  stations: StationRecord[];
  networkStations?: StationRecord[];
  liveStats: NetworkLiveStats;
  liveEnergy?: EnergyFlow;
  selectedStationId: string | null;
  fetchedAt?: string;
  source?: string;
  confidence?: DataConfidence;
  embedded?: boolean;
}) {
  return (
    <div
      id="panel-data"
      role="tabpanel"
      aria-label="Live data"
      className={
        embedded
          ? "space-y-4"
          : "glass scroll-thin max-h-[calc(100vh-14rem)] space-y-3 overflow-y-auto rounded-xl p-4"
      }
    >
      <div>
        <h2 className="section-label">Live network</h2>
        <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Stall availability, watts in/out, and charging draw — refreshed every 15 seconds.
        </p>
      </div>

      <SuperchargeChartsPanel stations={networkStations ?? stations} embedded />

      <LiveStatsBar stats={liveStats} embedded />

      <EnergyFlowPanel
        title="Energy flow"
        hours={24}
        liveFlow={liveEnergy}
      />

      <SummaryCards stations={stations} />

      <TimelinePlayer stationId={selectedStationId} />

      <section
        className="rounded-xl p-3 text-[11px]"
        style={{
          border: "1px solid var(--border)",
          background: "var(--bg-card)",
          color: "var(--text-faint)",
        }}
      >
        <h3 className="section-label">Feed status</h3>
        <dl className="mt-2 space-y-1 font-mono">
          <div className="flex justify-between gap-3">
            <dt>Updated</dt>
            <dd style={{ color: "var(--text-secondary)" }}>
              {fetchedAt ? formatRelativeTime(fetchedAt) : "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>Source</dt>
            <dd className="max-w-[58%] truncate text-right" style={{ color: "var(--text-secondary)" }}>
              {source ?? "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>Confidence</dt>
            <dd style={{ color: "var(--text-secondary)" }}>{confidence ?? "—"}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}