"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { formatCount } from "@/lib/utils/format";

const WIDTH = 640;
const HEIGHT = 180;
const PAD = { top: 14, right: 12, bottom: 28, left: 52 };

export function SuperchargeLineChart({
  points,
  label,
  color = "var(--accent)",
  activeIndex,
  onActiveIndexChange,
}: {
  points: Array<{ date: string; value: number }>;
  label: string;
  color?: string;
  activeIndex: number;
  onActiveIndexChange?: (index: number) => void;
}) {
  const chart = useMemo(
    () => buildLineChart(points, activeIndex, color),
    [points, activeIndex, color]
  );

  if (points.length < 2) {
    return (
      <div
        className="flex h-36 items-center justify-center rounded-lg text-[13px]"
        style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
      >
        Loading chart…
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-40 w-full"
        role="img"
        aria-label={`${label}: ${formatCount(chart.current.value)}`}
      >
        <defs>
          <linearGradient id="sc-line-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
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
              {formatCount(tick.value)}
            </text>
          </g>
        ))}

        <path d={chart.area} fill="url(#sc-line-fill)" />
        <path
          d={chart.line}
          fill="none"
          stroke={color}
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
        <circle cx={chart.cursorX} cy={chart.valueY} r="4" fill={color} />
        <circle
          cx={chart.cursorX}
          cy={chart.valueY}
          r="7"
          fill="none"
          stroke={color}
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
          max={Math.max(0, points.length - 1)}
          value={activeIndex}
          onChange={(e) => onActiveIndexChange(Number(e.target.value))}
          className="h-11 w-full"
          style={{ accentColor: color }}
          aria-label={`Scrub ${label} history`}
        />
      )}

      <p className="font-mono text-[11px]" style={{ color: "var(--text-faint)" }} aria-live="polite">
        {format(new Date(chart.current.date), "MMM d, yyyy")} · {formatCount(chart.current.value)}
      </p>
    </div>
  );
}

function buildLineChart(
  points: Array<{ date: string; value: number }>,
  activeIndex: number,
  color: string
) {
  const innerW = WIDTH - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const minVal = Math.min(...points.map((p) => p.value));
  const maxVal = Math.max(...points.map((p) => p.value));
  const range = Math.max(maxVal - minVal, 1);
  const index = Math.min(Math.max(activeIndex, 0), points.length - 1);
  const current = points[index] ?? points[points.length - 1];

  const xAt = (i: number) =>
    PAD.left + (i / Math.max(points.length - 1, 1)) * innerW;
  const yAt = (value: number) =>
    PAD.top + innerH - ((value - minVal) / range) * innerH;

  const linePts = points.map((p, i) => `${xAt(i)},${yAt(p.value)}`);
  const line = `M ${linePts.join(" L ")}`;
  const baseY = PAD.top + innerH;
  const area = `${line} L ${xAt(points.length - 1)},${baseY} L ${xAt(0)},${baseY} Z`;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
    value: Math.round(minVal + range * ratio),
    y: yAt(minVal + range * ratio),
  }));

  const xTickCount = Math.min(6, points.length);
  const xTicks = Array.from({ length: xTickCount }, (_, i) => {
    const idx = Math.round((i / Math.max(xTickCount - 1, 1)) * (points.length - 1));
    return {
      index: idx,
      x: xAt(idx),
      label: format(new Date(points[idx].date), "yyyy"),
    };
  });

  return { current, line, area, cursorX: xAt(index), valueY: yAt(current.value), yTicks, xTicks, color };
}