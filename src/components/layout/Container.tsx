import * as React from "react";

import { cn } from "../../lib/utils";

export type ContainerProps = React.HTMLAttributes<HTMLDivElement>;

export function Container({ className, ...props }: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-7xl",
        // 👑 Reduced padding on mobile for full-width content feel
        "px-3 sm:px-4 md:px-6",
        className
      )}
      {...props}
    />
  );
}
