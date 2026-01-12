import Link from "next/link";
import Image from "next/image";
import * as React from "react";
import { Eye, Heart } from "lucide-react";

import { cn } from "../../lib/utils";
import { Badge } from "../ui/Badge";
import { GlassCard } from "../ui/GlassCard";
import { Avatar } from "../ui/Avatar";

// ============================================
// 👑 KING BLOGGERS V2 - PostCard Component
// ============================================
// With view counts and reaction previews
// ============================================

export type PostCardProps = {
  href: string;
  title: string;
  excerpt?: string;
  authorName?: string;
  authorAvatarUrl?: string | null;
  authorRole?: "reader" | "blogger";
  readTime: string;
  imageUrl?: string | null;
  badge?: {
    label: string;
    variant?: React.ComponentProps<typeof Badge>["variant"];
  };
  viewCount?: string;
  reactionCount?: number;
  className?: string;
};

export function PostCard({
  href,
  title,
  excerpt,
  authorName = "King Bloggers",
  authorAvatarUrl,
  authorRole = "reader",
  readTime,
  imageUrl,
  badge,
  viewCount,
  reactionCount,
  className,
}: PostCardProps) {
  return (
    <Link href={href} className={cn("block group", className)}>
      <GlassCard className="overflow-hidden h-full flex flex-col transition-transform duration-300 hover:scale-[1.02]">
        {imageUrl ? (
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-foreground/5">
            <Image
              src={imageUrl}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Overlay stats */}
            {(viewCount || reactionCount) && (
              <div className="absolute bottom-2 right-2 flex items-center gap-2">
                {viewCount && (
                  <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 text-white text-xs backdrop-blur-sm">
                    <Eye className="h-3 w-3" />
                    {viewCount}
                  </span>
                )}
                {reactionCount && reactionCount > 0 && (
                  <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 text-white text-xs backdrop-blur-sm">
                    <Heart className="h-3 w-3" />
                    {reactionCount}
                  </span>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-[16/9] w-full bg-gradient-to-br from-king-orange/20 to-king-gold/10 flex items-center justify-center relative">
            <span className="text-4xl opacity-30">📝</span>
            {/* Overlay stats for no-image cards */}
            {(viewCount || reactionCount) && (
              <div className="absolute bottom-2 right-2 flex items-center gap-2">
                {viewCount && (
                  <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/40 text-white text-xs backdrop-blur-sm">
                    <Eye className="h-3 w-3" />
                    {viewCount}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        <div className="p-6 md:p-8 space-y-4 flex-1 flex flex-col">
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

          <div className="space-y-2 flex-1">
            <h3 className="text-xl md:text-2xl font-black tracking-tight line-clamp-2 group-hover:text-king-orange transition-colors">
              {title}
            </h3>
            {excerpt ? (
              <p className="text-foreground/60 line-clamp-3">{excerpt}</p>
            ) : null}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <div className="relative">
              <Avatar
                src={authorAvatarUrl ?? undefined}
                name={authorName}
                size={36}
              />
              {/* Role Badge - B for Blogger (green), R for Reader (orange) */}
              <span
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black border-2 border-background",
                  authorRole === "blogger"
                    ? "bg-emerald-500 text-white"
                    : "bg-king-orange text-black"
                )}
                title={authorRole === "blogger" ? "Verified Blogger" : "Reader"}
              >
                {authorRole === "blogger" ? "B" : "R"}
              </span>
            </div>
            <div>
              <div className="text-sm font-bold">{authorName}</div>
              <div className="text-xs text-foreground/50">Read more →</div>
            </div>
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}
