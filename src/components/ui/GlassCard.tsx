import * as React from "react";

import { cn } from "../../lib/utils";

export type GlassCardProps = React.HTMLAttributes<HTMLDivElement>;

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn("glass-card", className)} {...props} />;
  },
);
GlassCard.displayName = "GlassCard";
