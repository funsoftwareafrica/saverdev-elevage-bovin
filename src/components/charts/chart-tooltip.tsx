"use client";

// ChartTooltip — tooltip custom pour Recharts avec style glassmorphism SAVERDEV.
// Utilisation : <Tooltip content={<ChartTooltip />} /> dans les graphiques.

import type { TooltipProps } from "recharts";
import { formatFCFA } from "@/lib/format";

export function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border border-border/60 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl px-3 py-2 shadow-xl">
      {label && (
        <p className="text-[0.7rem] font-semibold text-muted-foreground mb-1">{label}</p>
      )}
      <div className="space-y-0.5">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span
              className="h-2 w-2 rounded-sm shrink-0"
              style={{ background: (entry.color as string) || "var(--primary)" }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-semibold tabular-nums text-foreground">
              {typeof entry.value === "number"
                ? entry.value >= 1000
                  ? formatFCFA(entry.value)
                  : entry.value
                : String(entry.value ?? "")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
