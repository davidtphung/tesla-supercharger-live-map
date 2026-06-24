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
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-3 md:p-4">
      <div className="pointer-events-auto panel flex items-center gap-3 px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/15 text-sky-400">
          <Zap className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-sm font-semibold tracking-tight md:text-base">
            Tesla Supercharger Intelligence
          </h1>
          <p className="text-xs text-slate-400">
            Live occupancy · energy portfolio · congestion signals
          </p>
        </div>
        <div className="ml-2 hidden rounded-full border border-slate-700 px-2 py-0.5 text-xs text-slate-300 sm:block">
          {stationCount.toLocaleString()} stations
        </div>
      </div>

      <div className="pointer-events-auto">
        <RefreshIndicator
          loading={loading}
          fetchedAt={fetchedAt}
          source={source}
          confidence={confidence}
          onRefresh={onRefresh}
        />
      </div>
    </header>
  );
}