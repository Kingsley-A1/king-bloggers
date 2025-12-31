import * as React from "react";

import { cn } from "../../lib/utils";

export type AvatarProps = {
  src?: string | null;
  alt?: string;
  name?: string | null;
  size?: number;
  className?: string;
};

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);

  if (parts.length === 0) return "?";

  const letters = parts.map((p) => p[0]?.toUpperCase()).filter(Boolean);
  return letters.join("");
}

export function Avatar({
  src,
  alt = "Avatar",
  name,
  size = 40,
  className,
}: AvatarProps) {
  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center overflow-hidden rounded-full",
        "border border-foreground/10 bg-foreground/5 backdrop-blur-xl",
        className
      )}
      style={{ width: size, height: size }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <span className="text-xs font-black tracking-widest text-foreground/70">
          {name ? initialsFromName(name) : "KB"}
        </span>
      )}
    </div>
  );
}
