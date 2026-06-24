import { Zap } from "lucide-react";
import { RefreshIndicator } from "@/components/ui/RefreshIndicator";
import type { DataConfidence } from "@/lib/schema/station";

export function Header({
  loading,
  fetchedAt,
  source,
  confidence,
  stationCount,
  onRefresh,
}: {
  loading: boolean;
  fetchedAt?: string;
  source?: string;
  confidence?: DataConfidence;
  stationCount: number;
  onRefresh: () => void;
}) {
  return (
    <header
      className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 px-3 pb-2 pt-[calc(12px+var(--safe-top))] md:gap-3 md:px-4 md:pt-[calc(16px+var(--safe-top))]"
      role="banner"
    >
      <div className="pointer-events-auto panel flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 md:px-4 md:py-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400"
          aria-hidden="true"
        >
          <Zap className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-[17px] font-semibold tracking-tight md:text-base">
            Supercharger Intelligence
          </h1>
          <p className="hidden truncate text-[13px] text-slate-400 sm:block">
            Live occupancy · energy · congestion
          </p>
        </div>
        <div
          className="shrink-0 rounded-full border border-slate-600 px-2.5 py-1 text-[13px] font-medium text-slate-300 tabular-nums"
          aria-label={`${stationCount.toLocaleString()} stations shown`}
        >
          {stationCount.toLocaleString()}
        </div>
      </div>

      <div className="pointer-events-auto shrink-0">
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
    </header>
  );
}