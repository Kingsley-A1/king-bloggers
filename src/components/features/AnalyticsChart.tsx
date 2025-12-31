import * as React from "react";

import { cn } from "../../lib/utils";

export type AnalyticsChartProps = {
  points: number[];
  className?: string;
};

function toPolyline(points: number[], width: number, height: number) {
  if (points.length === 0) return "";
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = Math.max(1, max - min);

  return points
    .map((p, i) => {
      const x = (i / Math.max(1, points.length - 1)) * width;
      const y = height - ((p - min) / range) * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

export function AnalyticsChart({ points, className }: AnalyticsChartProps) {
  const width = 320;
  const height = 120;
  const line = toPolyline(points, width, height);

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/5 p-4",
        className
      )}
    >
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-28">
        <defs>
          <linearGradient id="kingLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FF8C00" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#FFA500" stopOpacity="0.7" />
          </linearGradient>
        </defs>
        <polyline
          fill="none"
          stroke="url(#kingLine)"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={line}
        />
      </svg>
    </div>
  );
}
