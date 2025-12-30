import * as React from "react";

import { cn } from "../../lib/utils";

export type SpinnerProps = {
  size?: number;
  className?: string;
};

export function Spinner({ size = 18, className }: SpinnerProps) {
  return (
    <span
      className={cn("inline-flex items-center justify-center", className)}
      aria-label="Loading"
      role="status"
    >
      <span
        className="animate-spin rounded-full border-2 border-king-orange/30 border-t-king-orange shadow-[0_0_24px_rgba(255,140,0,0.25)]"
        style={{ width: size, height: size }}
      />
    </span>
  );
}
