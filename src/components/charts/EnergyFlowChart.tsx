"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import type { EnergySnapshot } from "@/lib/scoring/energy-flow";
import { formatPower } from "@/lib/utils/format";

const WIDTH = 640;
const HEIGHT = 200;
const PAD = { top: 12, right: 12, bottom: 28, left: 48 };

export function EnergyFlowChart({
  snapshots,
  activeIndex,
  onActiveIndexChange,
}: {
  snapshots: EnergySnapshot[];
  activeIndex: number;
  onActiveIndexChange?: (index: number) => void;
}) {
  const chart = useMemo(() => buildChart(snapshots, activeIndex), [snapshots, activeIndex]);

  if (snapshots.length < 2) {
    return (
      <div
        className="flex h-40 items-center justify-center rounded-lg text-[13px]"
        style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
      >
        Collecting energy history…
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-44 w-full"
        role="img"
        aria-label={`Energy flow chart. Watts in ${formatPower(chart.current.power_in_kw)}, watts out ${formatPower(chart.current.power_out_kw)}`}
      >
        <defs>
          <linearGradient id="energy-in-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--gold)" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="energy-out-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {chart.yTicks.map((tick) => (
          <g key={tick.value}>
            <line
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={tick.y}
              y2={tick.y}
              stroke="var(--border)"
              strokeDasharray="4 4"
              opacity={0.6}
            />
            <text
              x={PAD.left - 6}
              y={tick.y + 4}
              textAnchor="end"
              fontSize="10"
              fill="var(--text-faint)"
              fontFamily="var(--font-mono)"
            >
              {tick.label}
            </text>
          </g>
        ))}

        <path d={chart.inArea} fill="url(#energy-in-fill)" />
        <path d={chart.outArea} fill="url(#energy-out-fill)" />
        <path
          d={chart.inLine}
          fill="none"
          stroke="var(--gold)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d={chart.outLine}
          fill="none"
          stroke="var(--accent-cyan)"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        <line
          x1={chart.cursorX}
          x2={chart.cursorX}
          y1={PAD.top}
          y2={HEIGHT - PAD.bottom}
          stroke="var(--accent)"
          strokeWidth="1.5"
          opacity={0.8}
        />
        <circle cx={chart.cursorX} cy={chart.inY} r="4" fill="var(--gold)" />
        <circle cx={chart.cursorX} cy={chart.outY} r="4" fill="var(--accent-cyan)" />
        <circle
          cx={chart.cursorX}
          cy={chart.inY}
          r="7"
          fill="none"
          stroke="var(--gold)"
          strokeWidth="1.5"
          opacity={0.5}
          className="live-pulse"
        />

        {chart.xTicks.map((tick) => (
          <text
            key={tick.index}
            x={tick.x}
            y={HEIGHT - 8}
            textAnchor="middle"
            fontSize="10"
            fill="var(--text-faint)"
            fontFamily="var(--font-mono)"
          >
            {tick.label}
          </text>
        ))}
      </svg>

      {onActiveIndexChange && (
        <input
          type="range"
          min={0}
          max={Math.max(0, snapshots.length - 1)}
          value={activeIndex}
          onChange={(e) => onActiveIndexChange(Number(e.target.value))}
          className="h-11 w-full"
          style={{ accentColor: "var(--accent-strong)" }}
          aria-label="Scrub energy history"
        />
      )}
    </div>
  );
}

function buildChart(snapshots: EnergySnapshot[], activeIndex: number) {
  const innerW = WIDTH - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const maxVal = Math.max(
    1,
    ...snapshots.map((s) => Math.max(s.power_in_kw, s.power_out_kw))
  );
  const index = Math.min(Math.max(activeIndex, 0), snapshots.length - 1);
  const current = snapshots[index] ?? snapshots[snapshots.length - 1];

  const xAt = (i: number) =>
    PAD.left + (i / Math.max(snapshots.length - 1, 1)) * innerW;
  const yAt = (value: number) =>
    PAD.top + innerH - (value / maxVal) * innerH;

  const inPoints = snapshots.map((s, i) => `${xAt(i)},${yAt(s.power_in_kw)}`);
  const outPoints = snapshots.map((s, i) => `${xAt(i)},${yAt(s.power_out_kw)}`);
  const baseY = PAD.top + innerH;

  const inLine = `M ${inPoints.join(" L ")}`;
  const outLine = `M ${outPoints.join(" L ")}`;
  const inArea = `${inLine} L ${xAt(snapshots.length - 1)},${baseY} L ${xAt(0)},${baseY} Z`;
  const outArea = `${outLine} L ${xAt(snapshots.length - 1)},${baseY} L ${xAt(0)},${baseY} Z`;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
    ratio,
    value: maxVal * ratio,
    y: yAt(maxVal * ratio),
    label: formatPower(maxVal * ratio).replace(" ", ""),
  }));

  const xTickCount = Math.min(6, snapshots.length);
  const xTicks = Array.from({ length: xTickCount }, (_, i) => {
    const idx = Math.round((i / Math.max(xTickCount - 1, 1)) * (snapshots.length - 1));
    return {
      index: idx,
      x: xAt(idx),
      label: format(new Date(snapshots[idx].timestamp), "HH:mm"),
    };
  });

  return {
    current,
    inLine,
    outLine,
    inArea,
    outArea,
    cursorX: xAt(index),
    inY: yAt(current.power_in_kw),
    outY: yAt(current.power_out_kw),
    yTicks,
    xTicks,
  };
}