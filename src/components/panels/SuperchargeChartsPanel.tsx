"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import type { StationRecord } from "@/lib/schema/station";
import { aggregateChangesByYear } from "@/lib/providers/adapters/supercharge-charts";
import { useSuperchargeCharts } from "@/lib/hooks/useSuperchargeCharts";
import { SuperchargeLineChart } from "@/components/charts/SuperchargeLineChart";
import { formatCount } from "@/lib/utils/format";

function countByStatus(stations: StationRecord[]) {
  const counts: Record<string, number> = {
    OPEN: 0,
    CONSTRUCTION: 0,
    PLAN: 0,
    PERMIT: 0,
    CLOSED: 0,
  };

  for (const s of stations) {
    const key =
      s.station_status === "CLOSED"
        ? "CLOSED"
        : s.station_status === "PLAN"
          ? "PLAN"
          : s.station_status === "PERMIT"
            ? "PERMIT"
            : s.station_status === "CONSTRUCTION"
              ? "CONSTRUCTION"
              : s.station_status === "OPEN"
                ? "OPEN"
                : "OTHER";
    counts[key] = (counts[key] ?? 0) + 1;
  }

  return counts;
}

export function SuperchargeChartsPanel({
  stations,
  embedded = false,
}: {
  stations: StationRecord[];
  embedded?: boolean;
}) {
  const { data, loading, error } = useSuperchargeCharts(60_000);
  const [stallIndex, setStallIndex] = useState(-1);

  const statusCounts = useMemo(() => countByStatus(stations), [stations]);
  const openSites = statusCounts.OPEN ?? 0;

  const stallPoints = useMemo(
    () =>
      (data?.stallHistory ?? []).map((p) => ({
        date: p.date,
        value: p.stallCount,
      })),
    [data?.stallHistory]
  );

  const latestStalls = stallPoints.at(-1)?.value ?? 0;
  const yearlyChanges = useMemo(
    () => (data ? aggregateChangesByYear(data.changesByDate) : []),
    [data]
  );
  const recentYears = yearlyChanges.slice(-8);
  const maxYearTotal = Math.max(
    1,
    ...recentYears.map((y) => y.open + y.construction + y.plan + y.closed)
  );

  useEffect(() => {
    setStallIndex(stallPoints.length > 0 ? stallPoints.length - 1 : -1);
  }, [stallPoints.length]);

  return (
    <section
      className={
        embedded
          ? "space-y-4"
          : "card space-y-4 p-4"
      }
      aria-label="supercharge.info network charts"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="section-label flex items-center gap-2 !mb-1">
            supercharge.info charts
            <span className="live-dot" aria-hidden="true" />
          </h3>
          <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
            Live network growth from{" "}
            <a
              href="https://supercharge.info/charts"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:underline"
              style={{ color: "var(--accent)" }}
            >
              supercharge.info/charts
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          </p>
        </div>
        {data?.lastModified && (
          <span className="hud-badge shrink-0 text-[10px]">
            {data.lastModified}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Open stalls" value={formatCount(latestStalls)} color="var(--success)" />
        <Stat label="Open sites" value={formatCount(openSites)} color="var(--accent)" />
        <Stat
          label="Construction"
          value={formatCount(statusCounts.CONSTRUCTION ?? 0)}
          color="var(--warning)"
        />
        <Stat label="Planned" value={formatCount(statusCounts.PLAN ?? 0)} color="var(--text-secondary)" />
      </div>

      {error && (
        <p className="text-[13px]" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}

      {loading && !data ? (
        <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
          Loading supercharge.info chart data…
        </p>
      ) : (
        <>
          <div>
            <h4 className="section-label">Open Supercharger stalls (world)</h4>
            <SuperchargeLineChart
              points={stallPoints}
              label="Open stalls"
              color="var(--success)"
              activeIndex={Math.max(0, stallIndex)}
              onActiveIndexChange={setStallIndex}
            />
          </div>

          <div>
            <h4 className="section-label">Network changes by year</h4>
            <div
              className="flex h-32 items-end gap-1.5 rounded-lg p-3"
              style={{ border: "1px solid var(--border)", background: "var(--bg-card)" }}
              role="img"
              aria-label="Yearly supercharger status changes"
            >
              {recentYears.map((year) => {
                const total = year.open + year.construction + year.plan + year.closed;
                const scale = total / maxYearTotal;
                return (
                  <div key={year.year} className="flex flex-1 flex-col items-center gap-1">
                    <div className="flex h-24 w-full items-end justify-center gap-0.5">
                      <Bar height={scale * (year.open / Math.max(total, 1))} color="var(--success)" title={`${year.open} open`} />
                      <Bar height={scale * (year.construction / Math.max(total, 1))} color="var(--warning)" title={`${year.construction} construction`} />
                      <Bar height={scale * (year.plan / Math.max(total, 1))} color="var(--accent)" title={`${year.plan} planned`} />
                    </div>
                    <span className="font-mono text-[10px]" style={{ color: "var(--text-faint)" }}>
                      {year.year}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-[10px]" style={{ color: "var(--text-muted)" }}>
              <Legend color="var(--success)" label="Open" />
              <Legend color="var(--warning)" label="Construction" />
              <Legend color="var(--accent)" label="Planned" />
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      className="rounded-lg px-2.5 py-2"
      style={{
        background: `color-mix(in srgb, ${color} 10%, transparent)`,
        border: "1px solid var(--border)",
      }}
    >
      <div className="text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--text-muted)" }}>
        {label}
      </div>
      <div className="font-mono text-lg font-bold tabular-nums" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

function Bar({
  height,
  color,
  title,
}: {
  height: number;
  color: string;
  title: string;
}) {
  return (
    <div
      className="w-2 rounded-t"
      style={{
        height: `${Math.max(height * 100, 2)}%`,
        background: color,
      }}
      title={title}
    />
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} aria-hidden="true" />
      {label}
    </span>
  );
}