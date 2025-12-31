import * as React from "react";

import { cn } from "../../lib/utils";
import { GlassCard } from "../ui/GlassCard";

export type StatTrend = {
  direction: "up" | "down";
  label: string;
};

export type StatCardProps = {
  label: string;
  value: string;
  icon?: React.ReactNode;
  trend?: StatTrend;
  className?: string;
};

export function StatCard({
  label,
  value,
  icon,
  trend,
  className,
}: StatCardProps) {
  return (
    <GlassCard className={cn("p-6", className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-foreground/50">{label}</div>
          <div className="mt-2 text-3xl font-black tracking-tight">{value}</div>
        </div>
        {icon ? (
          <div className="rounded-2xl border border-foreground/10 bg-foreground/5 p-3 text-foreground/70">
            {icon}
          </div>
        ) : null}
      </div>

      {trend ? (
        <div className="mt-4 text-xs font-mono">
          <span
            className={cn(
              "inline-flex items-center gap-2",
              trend.direction === "up"
                ? "text-king-orange"
                : "text-foreground/60"
            )}
          >
            <span
              className={cn(
                "inline-block h-2 w-2 rounded-full",
                trend.direction === "up" ? "bg-king-orange" : "bg-foreground/30"
              )}
            />
            {trend.label}
          </span>
        </div>
      ) : null}
    </GlassCard>
  );
}
