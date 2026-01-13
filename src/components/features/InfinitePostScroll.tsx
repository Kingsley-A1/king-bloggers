"use client";

import * as React from "react";
import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, Eye, Calendar, ArrowUp } from "lucide-react";

import { Container } from "@/components/layout/Container";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { SectionHeader } from "@/components/features/SectionHeader";
import { ReactionBar } from "@/components/features/ReactionBarV2";
import { ShareBar } from "@/components/features/ShareBar";
import { BookmarkButton } from "@/components/features/BookmarkButton";
import { FollowButton } from "@/components/features/FollowButton";
import { CommentSection } from "@/components/features/CommentSection";
import { cn } from "@/lib/utils";
import type { ReactionCounts, ReactionValue } from "@/lib/reactions";

// ============================================
// 👑 KING BLOGGERS - Infinite Post Scroll
// ============================================
// Instagram-style endless post viewing
// Scroll to see more posts, never leave the feed
// ============================================

export interface InfinitePost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  category: string;
  coverImageUrl: string | null;
  videoUrl: string | null;
  authorId: string;
  authorName: string | null;
  authorEmail: string;
  authorImage: string | null;
  authorRole: "reader" | "blogger";
  viewCount: number;
  createdAt: string;
  // Reactions
  reactionCounts: ReactionCounts;
  myReaction: ReactionValue | null;
  bookmarked: boolean;
  following: boolean;
  isOwnPost: boolean;
  // Comments
  commentCount: number;
}

interface InfinitePostScrollProps {
  initialPost: InfinitePost;
  currentUrl: string;
  userId?: string;
  canComment: boolean;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    tech: "Tech",
    art_culture: "Art & Culture",
    entertainment: "Entertainment",
    sport: "Sport",
    health: "Health",
    self_growth: "Self Growth",
    finances: "Finances",
    politics: "Politics",
    economics: "Economics",
    religion: "Religion",
  };
  return labels[category] ?? category;
}

function getBadgeVariant(category: string): "tech" | "art" | "politics" {
  switch (category) {
    case "tech":
      return "tech";
    case "art_culture":
      return "art";
    default:
      return "politics";
  }
}

function PostView({
  post,
  currentUrl,
  canComment,
  isFirst,
}: {
  post: InfinitePost;
  currentUrl: string;
  canComment: boolean;
  isFirst: boolean;
}) {
  const url = currentUrl.replace(/\/blog\/[^/]+/, `/blog/${post.slug}`);

  return (
    <article className="mb-8 md:mb-12">
      {/* 👑 HERO MEDIA FIRST */}
      {post.coverImageUrl && (
        <div className="rounded-2xl overflow-hidden mb-4 md:mb-6">
          <div className="relative aspect-[16/9] md:aspect-[21/9] w-full bg-foreground/5">
            <Image
              src={post.coverImageUrl}
              alt={post.title}
              fill
              priority={isFirst}
              sizes="(max-width: 768px) 100vw, 1200px"
              className="object-cover"
            />
          </div>
        </div>
      )}

      <GlassCard className="p-4 md:p-8 lg:p-12">
        {/* Category & Stats */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <Badge variant={getBadgeVariant(post.category)}>
            {getCategoryLabel(post.category)}
          </Badge>
          <div className="flex items-center gap-3 text-xs font-mono text-foreground/50">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {formatCount(post.viewCount)}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(post.createdAt)}
            </span>
          </div>
        </div>

        {/* Title & Excerpt */}
        <SectionHeader
          title={post.title}
          subtitle={post.excerpt ?? undefined}
        />

        {/* Author Info */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-6 border-t border-foreground/10">
          <div className="flex items-center gap-3">
            <Avatar
              src={post.authorImage ?? undefined}
              name={post.authorName ?? post.authorEmail}
              size={48}
            />
            <div>
              <div className="font-bold">{post.authorName ?? "Anonymous"}</div>
              <div className="text-sm text-foreground/50">
                {post.authorRole === "blogger"
                  ? "✓ Verified Blogger"
                  : "Reader"}
              </div>
            </div>
          </div>
          {!post.isOwnPost && (
            <FollowButton
              targetUserId={post.authorId}
              initialFollowing={post.following}
            />
          )}
        </div>

        {/* Reactions & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-6 border-t border-foreground/10">
          <div className="flex items-center gap-2 md:gap-3">
            <ReactionBar
              postId={post.id}
              initialCounts={post.reactionCounts}
              initialMyValue={post.myReaction}
            />
            <BookmarkButton
              postId={post.id}
              initialBookmarked={post.bookmarked}
            />
          </div>
          <ShareBar title={post.title} url={url} />
        </div>

        {/* Post Content */}
        <div
          className="mt-8 md:mt-10 post-content"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </GlassCard>

      {/* Comments - Collapsed for infinite scroll */}
      <div className="mt-4 md:mt-6">
        <GlassCard className="p-4 md:p-6">
          <details className="group">
            <summary className="cursor-pointer flex items-center justify-between">
              <span className="font-bold">
                💬 Comments ({post.commentCount})
              </span>
              <span className="text-sm text-king-orange group-open:hidden">
                Tap to add comment
              </span>
            </summary>
            <div className="mt-4 pt-4 border-t border-foreground/10">
              <CommentSection
                postId={post.id}
                canComment={canComment}
                comments={[]}
                redirectTo={`/blog/${post.slug}`}
              />
            </div>
          </details>
        </GlassCard>
      </div>

      {/* Separator between posts */}
      <div className="flex items-center gap-4 my-8 md:my-12">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />
        <span className="text-xs text-foreground/30 font-semibold uppercase tracking-widest">
          Keep Scrolling
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />
      </div>
    </article>
  );
}

export function InfinitePostScroll({
  initialPost,
  currentUrl,
  userId,
  canComment,
}: InfinitePostScrollProps) {
  const [posts, setPosts] = useState<InfinitePost[]>([initialPost]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const loadingRef = useRef(false);
  const observerRef = useRef<HTMLDivElement>(null);

  // Load more posts
  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;

    loadingRef.current = true;
    setLoading(true);

    try {
      // Get IDs of posts we already have
      const excludeIds = posts.map((p) => p.id).join(",");
      const category = posts[posts.length - 1]?.category;

      const res = await fetch(
        `/api/infinite-posts?category=${category}&exclude=${excludeIds}&userId=${
          userId ?? ""
        }`
      );

      if (res.ok) {
        const data = await res.json();
        if (data.posts && data.posts.length > 0) {
          setPosts((prev) => [...prev, ...data.posts]);
        } else {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error("Failed to load more posts:", error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [posts, hasMore, userId]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { rootMargin: "600px", threshold: 0 }
    );

    const el = observerRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [loadMore, hasMore, loading]);

  // Show back to top button
  useEffect(() => {
    function handleScroll() {
      setShowBackToTop(window.scrollY > 1500);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <Container>
      {/* Posts */}
      {posts.map((post, index) => (
        <PostView
          key={post.id}
          post={post}
          currentUrl={currentUrl}
          canComment={canComment}
          isFirst={index === 0}
        />
      ))}

      {/* Loading trigger */}
      <div ref={observerRef} className="h-1" aria-hidden="true" />

      {/* Loading indicator */}
      {loading && (
        <div className="flex flex-col items-center gap-4 py-12">
          <Loader2 className="h-8 w-8 animate-spin text-king-orange" />
          <span className="text-sm text-foreground/50">
            Loading more posts...
          </span>
        </div>
      )}

      {/* End of feed */}
      {!hasMore && posts.length > 1 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">👑</div>
          <h3 className="text-lg font-bold mb-2">You&apos;ve seen it all!</h3>
          <p className="text-sm text-foreground/50 mb-6">
            Come back later for more sovereign content
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-king-orange text-black font-bold text-sm hover:bg-king-orange/90 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      )}

      {/* Back to top button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={cn(
          "fixed bottom-6 right-6 z-50 p-3 rounded-full bg-king-orange text-black shadow-lg transition-all",
          "hover:scale-110 active:scale-95",
          showBackToTop
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 pointer-events-none"
        )}
        aria-label="Back to top"
      >
        <ArrowUp className="h-5 w-5" />
      </button>
    </Container>
  );
}
