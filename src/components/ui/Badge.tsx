import * as React from "react";

import { cn } from "../../lib/utils";

export type BadgeVariant =
  | "tech"
  | "art"
  | "politics"
  | "draft"
  | "published";

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
            : "border-king-orange/30 bg-king-orange/10 text-foreground";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-widest",
        styles,
        className,
      )}
      {...props}
    />
  );
}
