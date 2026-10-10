"use client";

// Sparkline — mini courbe de tendance pour les KPI cards.
// SVG pur, léger, sans library.

import { cn } from "@/lib/utils";

interface Props {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;        // aire sous la courbe
  className?: string;
}

export function Sparkline({
  data,
  width = 80,
  height = 28,
  color = "#10B981",
  fill = true,
  className,
}: Props) {
  if (!data || data.length === 0) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const stepX = data.length > 1 ? width / (data.length - 1) : width;

  const points = data.map((v, i) => ({
    x: i * stepX,
    y: height - ((v - min) / range) * (height - 4) - 2,
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

  const gradId = `spark-grad-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <svg width={width} height={height} className={cn("overflow-visible", className)}>
      {fill && (
        <>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d={areaPath} fill={`url(#${gradId})`} />
        </>
      )}
      <path d={linePath} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      {/* point final */}
      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={1.8} fill={color} />
    </svg>
  );
}
