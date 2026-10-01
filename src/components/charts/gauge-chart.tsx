"use client";
import { cn } from "@/lib/utils";
interface Props { value: number; size?: number; thickness?: number; label?: string; color?: string; trackColor?: string; className?: string; }
export function GaugeChart({ value, size = 180, thickness = 14, label, color = "#10B981", trackColor = "#E2E8F0", className }: Props) {
  const v = Math.max(0, Math.min(100, value));
  const radius = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = Math.PI * radius;
  const offset = circumference - (v / 100) * circumference;
  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative" style={{ width: size, height: size / 2 + 10 }}>
        <svg width={size} height={size / 2 + 10} viewBox={`0 0 ${size} ${size / 2 + 10}`}>
          <path d={`M ${thickness / 2} ${cy} A ${radius} ${radius} 0 0 1 ${size - thickness / 2} ${cy}`} fill="none" stroke={trackColor} strokeWidth={thickness} strokeLinecap="round" />
          <path d={`M ${thickness / 2} ${cy} A ${radius} ${radius} 0 0 1 ${size - thickness / 2} ${cy}`} fill="none" stroke={color} strokeWidth={thickness} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 0.8s ease-out" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <span className="text-2xl font-bold tabular-nums" style={{ color }}>{v.toFixed(0)}%</span>
        </div>
      </div>
      {label && <span className="text-[0.7rem] text-muted-foreground mt-1">{label}</span>}
    </div>
  );
}
