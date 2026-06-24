import { Zap } from "lucide-react";
import { LiveStatsBar } from "@/components/panels/LiveStatsBar";
import { RefreshIndicator } from "@/components/ui/RefreshIndicator";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import type { DataConfidence } from "@/lib/schema/station";
import type { NetworkLiveStats } from "@/lib/scoring/power";

export function Header({
  loading,
  fetchedAt,
  source,
  confidence,
  stationCount,
  liveStats,
  onRefresh,
}: {
  loading: boolean;
  fetchedAt?: string;
  source?: string;
  confidence?: DataConfidence;
  stationCount: number;
  liveStats: NetworkLiveStats;
  onRefresh: () => void;
}) {
  return (
    <header
      className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col gap-2 px-3 pb-2 pt-[calc(12px+var(--safe-top))] md:gap-3 md:px-4 md:pt-[calc(16px+var(--safe-top))]"
      role="banner"
    >
      <div className="flex items-start justify-between gap-2 md:gap-3">
        <div className="pointer-events-auto glass flex min-w-0 flex-1 flex-col gap-3 rounded-xl p-3 sm:p-4">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{
                background: "color-mix(in srgb, var(--accent-strong) 22%, transparent)",
                color: "var(--accent)",
              }}
              aria-hidden="true"
            >
              <Zap className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[15px] font-bold tracking-tight sm:text-base">
                <span className="gradient-text">Supercharger Intelligence</span>
              </h1>
              <p
                className="truncate text-[11px] tracking-[0.08em] uppercase"
                style={{ color: "var(--text-muted)" }}
              >
                Live stalls · charging power · congestion
              </p>
            </div>
            <div
              className="hud-badge shrink-0 tabular-nums"
              aria-label={`${stationCount.toLocaleString()} stations shown`}
            >
              <span className="live-dot" aria-hidden="true" />
              {stationCount.toLocaleString()}
            </div>
          </div>
          <LiveStatsBar stats={liveStats} />
        </div>

        <div className="pointer-events-auto flex shrink-0 flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <div className="hidden md:block">
              <ThemeToggle />
            </div>
            <div className="md:hidden">
              <ThemeToggle compact />
            </div>
            <div className="md:hidden">
              <RefreshIndicator
                loading={loading}
                fetchedAt={fetchedAt}
                onRefresh={onRefresh}
                compact
              />
            </div>
            <div className="hidden md:block">
              <RefreshIndicator
                loading={loading}
                fetchedAt={fetchedAt}
                source={source}
                confidence={confidence}
                onRefresh={onRefresh}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}