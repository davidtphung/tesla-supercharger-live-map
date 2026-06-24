"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import {
  aggregateChangesByYear,
  type StatusBreakdownRow,
  type StatusBucketCounts,
} from "@/lib/providers/adapters/supercharge-charts";
import { useSuperchargeCharts } from "@/lib/hooks/useSuperchargeCharts";
import { SuperchargeLineChart } from "@/components/charts/SuperchargeLineChart";
import { formatCount } from "@/lib/utils/format";

export function SuperchargeChartsPanel({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const { data, loading, error } = useSuperchargeCharts(60_000);
  const [stallIndex, setStallIndex] = useState(-1);

  const worldRow = data?.statusBreakdown?.find((row) => row.label === "World");

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

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Stat
          label="Open stalls"
          value={formatCount(latestStalls)}
          color="var(--success)"
        />
        <Stat
          label="Open sites"
          value={formatCount(worldRow?.open.sites ?? 0)}
          color="var(--success)"
        />
        <Stat
          label="Construction"
          value={formatCount(worldRow?.construction.sites ?? 0)}
          color="var(--warning)"
        />
        <Stat
          label="Planned"
          value={formatCount(worldRow?.plan.sites ?? 0)}
          color="var(--accent)"
        />
        <Stat
          label="Closed"
          value={formatCount(worldRow?.closed.sites ?? 0)}
          color="var(--text-secondary)"
        />
      </div>

      {data?.statusBreakdown && data.statusBreakdown.length > 0 && (
        <StatusBreakdownTable rows={data.statusBreakdown} />
      )}

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

function StatusBreakdownTable({ rows }: { rows: StatusBreakdownRow[] }) {
  return (
    <div>
      <h4 className="section-label">Sites by status</h4>
      <div
        className="overflow-x-auto rounded-lg"
        style={{ border: "1px solid var(--border)", background: "var(--bg-card)" }}
      >
        <table className="w-full min-w-[320px] text-left text-[11px]">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              <th className="px-3 py-2 font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--text-muted)" }}>
                Region
              </th>
              <StatusHeader label="Open" color="var(--success)" />
              <StatusHeader label="Constr" color="var(--warning)" />
              <StatusHeader label="Plan" color="var(--accent)" />
              <StatusHeader label="Closed" color="var(--text-secondary)" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.label}
                style={{
                  borderBottom: "1px solid var(--border)",
                  fontWeight: row.label === "World" ? 600 : 400,
                }}
              >
                <td className="px-3 py-2" style={{ color: "var(--text-secondary)" }}>
                  {row.label}
                </td>
                <StatusCell counts={row.open} color="var(--success)" />
                <StatusCell counts={row.construction} color="var(--warning)" />
                <StatusCell counts={row.plan} color="var(--accent)" />
                <StatusCell counts={row.closed} color="var(--text-secondary)" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[10px]" style={{ color: "var(--text-faint)" }}>
        Site counts from supercharge.info. Open includes expanding; Constr includes permit; Plan includes voting; Closed includes temp and permanent closures.
      </p>
    </div>
  );
}

function StatusHeader({ label, color }: { label: string; color: string }) {
  return (
    <th
      className="px-3 py-2 text-right font-semibold uppercase tracking-[0.08em]"
      style={{ color }}
    >
      {label}
    </th>
  );
}

function StatusCell({
  counts,
  color,
}: {
  counts: StatusBucketCounts;
  color: string;
}) {
  return (
    <td className="px-3 py-2 text-right tabular-nums">
      <div className="font-mono font-semibold" style={{ color }}>
        {formatCount(counts.sites)}
      </div>
      {counts.stalls > 0 && (
        <div className="text-[10px]" style={{ color: "var(--text-faint)" }}>
          {formatCount(counts.stalls)} stalls
        </div>
      )}
    </td>
  );
}