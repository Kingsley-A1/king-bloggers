"use client";

import * as React from "react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { PostCard } from "@/components/features/PostCard";
import { PostCardSkeleton } from "@/components/features/PostCardSkeleton";
import type { BadgeVariant } from "@/components/ui/Badge";

// ============================================
// 👑 KING BLOGGERS V2 - Infinite Scroll Feed
// ============================================
// TikTok-style endless content discovery
// ============================================

export interface InfinitePostItem {
  id?: string;
  slug: string;
  title: string;
  excerpt?: string;
  content: string;
  coverImageUrl?: string | null;
  category: string;
  authorEmail: string;
  authorName?: string | null;
  authorImage?: string | null;
  authorRole?: "reader" | "blogger";
  viewCount: string;
  reactionCount: number;
  badge: {
    label: string;
    variant: BadgeVariant;
  };
  readTime: string;
}

export interface InfiniteFeedProps {
  /** Initial posts loaded server-side */
  initialPosts: InfinitePostItem[];
  /** Cursor for next page */
  initialCursor?: string;
  /** Whether there are more posts */
  initialHasMore: boolean;
  /** Server action to load more posts */
  loadMoreAction: (cursor: string) => Promise<{
    items: InfinitePostItem[];
    nextCursor?: string;
    hasMore: boolean;
  }>;
}

export function InfiniteFeed({
  initialPosts,
  initialCursor,
  initialHasMore,
  loadMoreAction,
}: InfiniteFeedProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [cursor, setCursor] = useState(initialCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isPending, startTransition] = useTransition();
  const observerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const loadMore = useCallback(() => {
    if (!cursor || !hasMore || loadingRef.current) return;

    loadingRef.current = true;
    startTransition(async () => {
      try {
        const result = await loadMoreAction(cursor);
        setPosts((prev) => [...prev, ...result.items]);
        setCursor(result.nextCursor);
        setHasMore(result.hasMore);
      } finally {
        loadingRef.current = false;
      }
    });
  }, [cursor, hasMore, loadMoreAction]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isPending) {
          loadMore();
        }
      },
      {
        rootMargin: "400px", // Start loading before user reaches bottom
        threshold: 0,
      }
    );

    const el = observerRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [loadMore, hasMore, isPending]);

  if (posts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Post Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 stagger-reveal">
        {posts.map((p) => (
          <PostCard
            key={p.slug}
            href={`/blog/${p.slug}`}
            title={p.title}
            excerpt={p.excerpt}
            badge={p.badge}
            readTime={p.readTime}
            authorName={p.authorName ?? p.authorEmail.split("@")[0]}
            authorAvatarUrl={p.authorImage}
            authorRole={p.authorRole ?? "reader"}
            imageUrl={p.coverImageUrl}
            viewCount={p.viewCount}
            reactionCount={p.reactionCount}
          />
        ))}
      </div>

      {/* Skeleton loaders while loading */}
      {isPending && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Load more trigger (invisible sentinel) */}
      <div ref={observerRef} className="h-1" aria-hidden="true" />

      {/* Loading indicator */}
      {isPending && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-king-orange" />
        </div>
      )}

      {/* End of feed */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8">
          <span className="text-sm text-foreground/50">
            👑 You&apos;ve reached the throne room. No more content.
          </span>
        </div>
      )}
    </div>
  );
}
