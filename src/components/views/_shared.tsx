"use client";

// Composants UI partagés entre les vues — palette SAVERDEV.

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function ViewHeader({
  title,
  description,
  icon: Icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">{title}</h2>
          {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  hint,
  trend,
  trendValue,
  variant = "default",
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  hint?: string;
  trend?: "up" | "down" | "flat";
  trendValue?: string;
  variant?: "default" | "primary" | "success" | "warning" | "danger";
}) {
  const variantClasses: Record<string, string> = {
    default: "border-border",
    primary: "border-primary/30 bg-primary/[0.04]",
    success: "border-emerald-200 bg-emerald-50/50",
    warning: "border-amber-200 bg-amber-50/50",
    danger: "border-red-200 bg-red-50/50",
  };
  const iconBg: Record<string, string> = {
    default: "bg-muted text-muted-foreground",
    primary: "bg-primary/15 text-primary",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-red-100 text-red-700",
  };

  return (
    <Card className={cn("relative overflow-hidden", variantClasses[variant])}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[0.7rem] uppercase tracking-wider font-medium text-muted-foreground truncate">
              {label}
            </p>
            <p className="text-xl sm:text-2xl font-bold mt-1 text-foreground tabular-nums">{value}</p>
            {hint && <p className="text-[0.7rem] text-muted-foreground mt-1">{hint}</p>}
            {trend && trendValue && (
              <div className="flex items-center gap-1 mt-1.5 text-[0.7rem] font-medium">
                {trend === "up" && <TrendingUp className="h-3 w-3 text-emerald-600" />}
                {trend === "down" && <TrendingDown className="h-3 w-3 text-red-600" />}
                {trend === "flat" && <Minus className="h-3 w-3 text-muted-foreground" />}
                <span
                  className={cn(
                    trend === "up" && "text-emerald-700",
                    trend === "down" && "text-red-700",
                    trend === "flat" && "text-muted-foreground"
                  )}
                >
                  {trendValue}
                </span>
              </div>
            )}
          </div>
          {Icon && (
            <div className={cn("h-9 w-9 shrink-0 rounded-lg flex items-center justify-center", iconBg[variant])}>
              <Icon className="h-4.5 w-4.5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      {Icon && (
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {description && <p className="text-xs text-muted-foreground mt-1 max-w-sm">{description}</p>}
    </div>
  );
}
