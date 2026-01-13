import Link from "next/link";
import * as React from "react";

import { cn } from "../../lib/utils";

export type CategoryPillProps = {
  label: string;
  href: string;
  active?: boolean;
  className?: string;
};

export function CategoryPill({
  label,
  href,
  active = false,
  className,
}: CategoryPillProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap",
        "rounded-full border px-3 py-2 md:px-4 text-[11px] md:text-xs font-bold uppercase tracking-wide md:tracking-widest transition-colors",
        "backdrop-blur-xl shrink-0",
        active
          ? "border-king-orange/40 bg-king-orange/10 text-king-orange"
          : "border-foreground/10 bg-foreground/5 text-foreground/70 hover:bg-foreground/10 hover:border-foreground/20",
        "active:scale-95",
        className
      )}
    >
      {label}
    </Link>
  );
}
