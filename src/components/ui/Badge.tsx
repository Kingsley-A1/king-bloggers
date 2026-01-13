import * as React from "react";

import { cn } from "../../lib/utils";

// ============================================
// 👑 KING BLOGGERS - Badge Component
// ============================================
// Sovereign Gold (#D4AF37): ONLY for badges, awards, and premium markers
// ============================================

export type BadgeVariant =
  | "tech"
  | "art"
  | "politics"
  | "draft"
  | "published"
  | "gold"
  | "secondary"
  | "sport"
  | "health"
  | "growth"
  | "finance";

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export function Badge({ className, variant = "tech", ...props }: BadgeProps) {
  const styles =
    variant === "tech"
      ? "border-king-orange/30 bg-king-orange/10 text-foreground"
      : variant === "art"
      ? "border-king-gold/30 bg-king-gold/10 text-foreground"
      : variant === "politics"
      ? "border-foreground/20 bg-foreground/5 text-foreground/80"
      : variant === "draft"
      ? "border-foreground/15 bg-foreground/5 text-foreground/60"
      : variant === "gold"
      ? "border-king-gold/40 bg-king-gold/15 text-king-gold"
      : variant === "secondary"
      ? "border-foreground/20 bg-foreground/10 text-foreground/70"
      : variant === "sport"
      ? "border-emerald-500/30 bg-emerald-500/10 text-foreground"
      : variant === "health"
      ? "border-rose-500/30 bg-rose-500/10 text-foreground"
      : variant === "growth"
      ? "border-violet-500/30 bg-violet-500/10 text-foreground"
      : variant === "finance"
      ? "border-cyan-500/30 bg-cyan-500/10 text-foreground"
      : "border-king-orange/30 bg-king-orange/10 text-foreground";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-widest",
        styles,
        className
      )}
      {...props}
    />
  );
}
