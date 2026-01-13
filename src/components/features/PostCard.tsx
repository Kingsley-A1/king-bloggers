import Link from "next/link";
import Image from "next/image";
import * as React from "react";
import { Eye, ArrowRight } from "lucide-react";

import { cn } from "../../lib/utils";
import { Badge } from "../ui/Badge";
import { GlassCard } from "../ui/GlassCard";
import { Avatar } from "../ui/Avatar";
import { ReactionBar } from "./ReactionBarV2";
import type { ReactionCounts, ReactionValue } from "@/lib/reactions";

// ============================================
// 👑 KING BLOGGERS V3 - PostCard Component
// ============================================
// With inline reactions, improved mobile layout
// and prominent "Read More" CTA
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
  commentCount?: number;
  postId?: string;
  // 👑 NEW: For interactive reactions
  reactionCounts?: ReactionCounts;
  myReaction?: ReactionValue | null;
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
  commentCount,
  postId,
  reactionCounts,
  myReaction,
  className,
}: PostCardProps) {
  const hasInteractiveReactions = postId && reactionCounts;

  return (
    <div className={cn("block group", className)}>
      <GlassCard className="overflow-hidden h-full flex flex-col transition-transform duration-300 hover:scale-[1.02]">
        {/* Clickable Image Area */}
        <Link href={href}>
          {imageUrl ? (
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-foreground/5">
              <Image
                src={imageUrl}
                alt={title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.04]"
              />

              {/* Subtle legibility layer */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-black/0 to-black/0" />

              {/* Overlay stats */}
              {viewCount && (
                <div className="absolute bottom-2 right-2 flex items-center gap-2">
                  <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 text-white text-xs backdrop-blur-sm">
                    <Eye className="h-3 w-3" />
                    {viewCount}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-[4/3] w-full bg-gradient-to-br from-king-orange/20 to-king-gold/10 flex items-center justify-center relative">
              <span className="text-4xl opacity-30">📝</span>
              {viewCount && (
                <div className="absolute bottom-2 right-2 flex items-center gap-2">
                  <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/40 text-white text-xs backdrop-blur-sm">
                    <Eye className="h-3 w-3" />
                    {viewCount}
                  </span>
                </div>
              )}
            </div>
          )}
        </Link>

        <div className="p-4 md:p-6 space-y-3 flex-1 flex flex-col">
          {/* Badge & Read Time */}
          <div className="flex items-center justify-between gap-3">
            {badge ? (
              <Badge variant={badge.variant}>{badge.label}</Badge>
            ) : (
              <span />
            )}
            <span className="text-xs font-mono text-foreground/50">
              {readTime}
            </span>
          </div>

          {/* Title & Excerpt - Clickable */}
          <Link href={href} className="space-y-2 flex-1 block">
            <h3 className="text-lg md:text-xl font-black tracking-tight line-clamp-2 group-hover:text-king-orange transition-colors">
              {title}
            </h3>
            {excerpt ? (
              <p className="text-sm text-foreground/60 line-clamp-2">
                {excerpt}
              </p>
            ) : null}
          </Link>

          {/* 👑 INTERACTIVE REACTIONS - Click without navigating */}
          <div
            className="py-2 border-t border-foreground/10"
            onClick={(e) => e.stopPropagation()}
          >
            {hasInteractiveReactions ? (
              <ReactionBar
                postId={postId}
                initialCounts={reactionCounts}
                initialMyValue={myReaction ?? null}
                compact
              />
            ) : (
              <div className="flex items-center gap-3 text-xs text-foreground/50">
                <span>❤️ {reactionCount ?? 0}</span>
                <span>💬 {commentCount ?? 0}</span>
              </div>
            )}
          </div>

          {/* Author & Read More */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative flex-shrink-0">
                <Avatar
                  src={authorAvatarUrl ?? undefined}
                  name={authorName}
                  size={32}
                />
                <span
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-black border-2 border-background",
                    authorRole === "blogger"
                      ? "bg-emerald-500 text-white"
                      : "bg-king-orange text-black"
                  )}
                  title={
                    authorRole === "blogger" ? "Verified Blogger" : "Reader"
                  }
                >
                  {authorRole === "blogger" ? "B" : "R"}
                </span>
              </div>
              <span className="text-sm font-bold truncate">{authorName}</span>
            </div>

            {/* 👑 PROMINENT READ MORE BUTTON */}
            <Link
              href={href}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-king-orange/10 text-king-orange text-xs font-bold group-hover:bg-king-orange group-hover:text-black transition-all flex-shrink-0"
            >
              Read
              <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
