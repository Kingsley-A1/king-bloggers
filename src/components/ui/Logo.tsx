import * as React from "react";
import Image from "next/image";

import { cn } from "../../lib/utils";

export type LogoVariant = "full" | "icon";

export type LogoProps = {
  size?: number;
  variant?: LogoVariant;
  className?: string;
};

export function Logo({ size = 32, variant = "full", className }: LogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <div
        className="relative shrink-0 overflow-hidden rounded-xl border border-foreground/10 bg-foreground/5 shadow-inner"
        style={{ width: size, height: size }}
      >
        <Image
          src="/icons/logo.png"
          alt="King Bloggers"
          fill
          sizes={`${size}px`}
          className="object-contain"
          priority
        />
      </div>
      {variant === "full" ? (
        <div className="leading-tight">
          <div className="text-base font-black tracking-wide">King Bloggers</div>
          <div className="hidden sm:block text-xs opacity-60">Tech, Art, Culture & Power</div>
        </div>
      ) : null}
    </div>
  );
}
