import * as React from "react";

import { cn } from "../../lib/utils";

export type SectionHeaderProps = {
  title: string;
  subtitle?: React.ReactNode;
  className?: string;
  centered?: boolean;
};

export function SectionHeader({
  title,
  subtitle,
  className,
  centered,
}: SectionHeaderProps) {
  return (
    <header
      className={cn(
        "space-y-3",
        centered && "text-center flex flex-col items-center",
        className
      )}
    >
      <h1 className="text-3xl md:text-5xl font-black tracking-tight text-sovereign">
        {title}
      </h1>
      <div className="h-[2px] w-20 bg-king-orange rounded-full" />
      {subtitle ? (
        <p
          className={cn("max-w-2xl text-foreground/60", centered && "mx-auto")}
        >
          {subtitle}
        </p>
      ) : null}
    </header>
  );
}
