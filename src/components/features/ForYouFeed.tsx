"use client";

import * as React from "react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Loader2, Sparkles } from "lucide-react";

import { PostCard } from "@/components/features/PostCard";
import { PostCardSkeleton } from "@/components/features/PostCardSkeleton";
import { cn } from "@/lib/utils";
import { getSuggestedUsersToFollow } from "@/lib/actions/follows";
import { FollowButton } from "@/components/features/FollowButton";
import { Avatar } from "@/components/ui/Avatar";

import type { RankedPost, FeedType } from "@/lib/personalization/types";

// ============================================
// 👑 KING BLOGGERS - For You Feed
// ============================================
// Personalized infinite scroll with feed switching
// ============================================

const FEED_TABS: Array<{ type: FeedType; label: string }> = [
  { type: "for-you", label: "For you" },
  { type: "following", label: "Following" },
  { type: "trending", label: "Trending" },
  { type: "latest", label: "Latest" },
];

type SuggestedUser = {
  id: string;
  name: string | null;
  email: string | null;
  imageUrl: string | null;
  role: string;
};

function getBadgeVariant(category: string): "tech" | "art" | "politics" {
  switch (category) {
    case "tech":
      return "tech";
    case "art_culture":
      return "art";
    case "politics":
    case "economics":
    case "religion":
    case "entertainment":
      return "politics";
    default:
      return "tech";
  }
}

function getCategoryLabel(category: string): string {
  switch (category) {
    case "tech":
      return "Tech";
    case "art_culture":
      return "Art & Culture";
    case "politics":
      return "Politics";
    case "economics":
      return "Economics";
    case "religion":
      return "Religion";
    case "entertainment":
      return "Entertainment";
    default:
      return category;
  }
}

function formatViewCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}

export interface ForYouFeedProps {
  /** Initial posts from server */
  initialPosts: RankedPost[];
  /** Initial cursor for pagination */
  initialCursor?: string;
  /** Whether there are more posts */
  initialHasMore: boolean;
  /** Current feed type */
  initialFeedType?: FeedType;
  /** Server action to load more posts */
  loadMoreAction: (
    feedType: FeedType,
    cursor?: string
  ) => Promise<{ items: RankedPost[]; nextCursor?: string; hasMore: boolean }>;
  /** Show feed type switcher */
  showTabs?: boolean;
  /** Used to label the personalized tab, e.g. "For Ada" */
  viewerFirstName?: string | null;
}

export function ForYouFeed({
  initialPosts,
  initialCursor,
  initialHasMore,
  initialFeedType = "for-you",
  loadMoreAction,
  showTabs = true,
  viewerFirstName,
}: ForYouFeedProps) {
  const [feedType, setFeedType] = useState<FeedType>(initialFeedType);
  const [posts, setPosts] = useState(initialPosts);
  const [cursor, setCursor] = useState(initialCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isPending, startTransition] = useTransition();
  const [isChangingFeed, setIsChangingFeed] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  // Load more posts
  const loadMore = useCallback(() => {
    if (!hasMore || loadingRef.current || isChangingFeed) return;

    loadingRef.current = true;
    startTransition(async () => {
      try {
        const result = await loadMoreAction(feedType, cursor);
        setPosts((prev) => [...prev, ...result.items]);
        setCursor(result.nextCursor);
        setHasMore(result.hasMore);
      } finally {
        loadingRef.current = false;
      }
    });
  }, [cursor, hasMore, feedType, loadMoreAction, isChangingFeed]);

  // Change feed type
  const changeFeed = useCallback(
    (newType: FeedType) => {
      if (newType === feedType || isChangingFeed) return;

      setIsChangingFeed(true);
      setFeedType(newType);
      setPosts([]);
      setCursor(undefined);
      setHasMore(true);

      startTransition(async () => {
        try {
          const result = await loadMoreAction(newType);
          setPosts(result.items);
          setCursor(result.nextCursor);
          setHasMore(result.hasMore);
        } finally {
          setIsChangingFeed(false);
        }
      });
    },
    [feedType, loadMoreAction, isChangingFeed]
  );

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0]?.isIntersecting &&
          hasMore &&
          !isPending &&
          !isChangingFeed
        ) {
          loadMore();
        }
      },
      { rootMargin: "400px", threshold: 0 }
    );

    const el = observerRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [loadMore, hasMore, isPending, isChangingFeed]);

  // Load follow suggestions when the Following feed is empty
  useEffect(() => {
    const shouldLoad =
      feedType === "following" &&
      !isChangingFeed &&
      !isPending &&
      posts.length === 0;

    if (!shouldLoad) return;
    if (loadingSuggestions || suggestedUsers.length > 0) return;

    setLoadingSuggestions(true);
    getSuggestedUsersToFollow(6)
      .then((users) => setSuggestedUsers(users as SuggestedUser[]))
      .catch(() => {
        // ignore
      })
      .finally(() => setLoadingSuggestions(false));
  }, [feedType, isChangingFeed, isPending, posts.length, loadingSuggestions, suggestedUsers.length]);

  return (
    <div className="space-y-6">
      {/* Feed Type Tabs */}
      {showTabs && (
        <div className="glass-card p-1.5 flex gap-1 overflow-x-auto scrollbar-hide">
          {FEED_TABS.map((tab) => {
            const isActive = feedType === tab.type;
            const label =
              tab.type === "for-you" && viewerFirstName
                ? `For ${viewerFirstName}`
                : tab.label;
            return (
              <button
                key={tab.type}
                type="button"
                onClick={() => changeFeed(tab.type)}
                disabled={isChangingFeed}
                className={cn(
                  "flex items-center px-3.5 py-2 rounded-lg text-sm font-bold transition-all",
                  "whitespace-nowrap active:scale-95",
                  isActive
                    ? "bg-king-orange text-black"
                    : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* Feed Header */}
      <div className="flex items-center gap-2 text-sm text-foreground/50">
        <Sparkles className="w-4 h-4 text-king-orange" />
        <span>
          {feedType === "for-you" && "Personalized for you"}
          {feedType === "following" && "From people you follow"}
          {feedType === "trending" && "Trending now"}
          {feedType === "latest" && "Most recent"}
        </span>
      </div>

      {/* Loading State (changing feeds) */}
      {isChangingFeed && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isChangingFeed && posts.length === 0 && !isPending && (
        <div className="glass-card p-12 text-center">
          <div className="text-4xl mb-4">{feedType === "following" ? "👥" : "✨"}</div>
          <h3 className="text-lg font-bold mb-2">
            {feedType === "following" ? "Your Following feed is empty" : "No posts yet"}
          </h3>
          <p className="text-sm text-foreground/60">
            {feedType === "following"
              ? "Follow a few bloggers to start seeing their posts here."
              : "Be the first to post!"}
          </p>

          {feedType === "following" && (
            <div className="mt-8 text-left max-w-xl mx-auto">
              <div className="text-sm font-bold mb-3">Suggested for you</div>

              {loadingSuggestions ? (
                <div className="text-sm text-foreground/60">Loading suggestions…</div>
              ) : suggestedUsers.length === 0 ? (
                <div className="text-sm text-foreground/60">
                  Explore the feed to discover bloggers to follow.
                </div>
              ) : (
                <div className="space-y-2">
                  {suggestedUsers.map((u) => {
                    const displayName = u.name ?? u.email ?? "Blogger";
                    return (
                      <div
                        key={u.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-foreground/10 bg-foreground/5 px-4 py-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar
                            src={u.imageUrl ?? undefined}
                            name={u.name ?? undefined}
                            alt={displayName}
                            size={40}
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-sm truncate">{displayName}</div>
                            <div className="text-xs text-foreground/60 truncate">
                              {u.role === "blogger" ? "Blogger" : "Creator"}
                            </div>
                          </div>
                        </div>

                        <FollowButton
                          targetUserId={u.id}
                          initialFollowing={false}
                          className="shrink-0"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Post Grid */}
      {!isChangingFeed && posts.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 stagger-reveal">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              postId={post.id}
              href={`/blog/${post.slug}`}
              title={post.title}
              excerpt={post.excerpt ?? undefined}
              badge={{
                label: getCategoryLabel(post.category),
                variant: getBadgeVariant(post.category),
              }}
              readTime="5 min"
              authorName={post.authorName ?? post.authorEmail}
              authorAvatarUrl={post.authorImage}
              authorRole={post.authorRole}
              imageUrl={post.coverImageUrl}
              viewCount={formatViewCount(post.viewCount)}
              reactionCount={post.reactionCount}
            />
          ))}
        </div>
      )}

      {/* Loading More */}
      {isPending && !isChangingFeed && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Load More Trigger */}
      <div ref={observerRef} className="h-1" aria-hidden="true" />

      {/* Loading Spinner */}
      {isPending && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-king-orange" />
        </div>
      )}

      {/* End of Feed */}
      {!hasMore && posts.length > 0 && !isChangingFeed && (
        <div className="text-center py-8">
          <span className="text-sm text-foreground/50">
            👑 You&apos;ve reached the end. Check back later for more!
          </span>
        </div>
      )}
    </div>
  );
}
