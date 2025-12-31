import Link from "next/link";
import * as React from "react";

import { cn } from "../../lib/utils";
import { Badge } from "../ui/Badge";
import { GlassCard } from "../ui/GlassCard";
import { Avatar } from "../ui/Avatar";

export type PostCardProps = {
  href: string;
  title: string;
  excerpt?: string;
  authorName?: string;
  authorAvatarUrl?: string | null;
  readTime: string;
  imageUrl?: string | null;
  badge?: {
    label: string;
    variant?: React.ComponentProps<typeof Badge>["variant"];
  };
  className?: string;
};

export function PostCard({
  href,
  title,
  excerpt,
  authorName = "King Bloggers",
  authorAvatarUrl,
  readTime,
  imageUrl,
  badge,
  className,
}: PostCardProps) {
  return (
    <Link href={href} className={cn("block", className)}>
      <GlassCard className="overflow-hidden">
        {imageUrl ? (
          <div className="aspect-[16/9] w-full overflow-hidden bg-foreground/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
          </div>
        ) : null}

        <div className="p-6 md:p-8 space-y-4">
          <div className="flex items-center justify-between gap-4">
            {badge ? (
              <Badge variant={badge.variant}>{badge.label}</Badge>
            ) : (
              <span />
            )}
            <span className="text-xs font-mono text-foreground/50">
              {readTime}
            </span>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl md:text-2xl font-black tracking-tight">
              {title}
            </h3>
            {excerpt ? (
              <p className="text-foreground/60 line-clamp-3">{excerpt}</p>
            ) : null}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Avatar
              src={authorAvatarUrl ?? undefined}
              name={authorName}
              size={36}
            />
            <div>
              <div className="text-sm font-bold">{authorName}</div>
              <div className="text-xs text-foreground/50">Read more</div>
            </div>
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}
