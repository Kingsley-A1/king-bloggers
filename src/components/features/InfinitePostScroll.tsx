"use client";

import * as React from "react";
import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, Eye, Calendar, ArrowUp, Heart } from "lucide-react";

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
import { setReaction } from "@/app/actions/reactions";
import { REACTION_CONFIG } from "@/lib/reactions";
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

type MediaItem =
  | { type: "image"; src: string }
  | { type: "video"; src: string };

const VIDEO_EXT_RE = /\.(mp4|webm|mov|ogg)(\?.*)?$/i;

const ALLOWED_NEXT_IMAGE_HOSTS = new Set([
  "pub-2aa1172cadf14ba89fb907ce9a9bcaa1.r2.dev",
  "lh3.googleusercontent.com",
  "images.unsplash.com",
]);

function canUseNextImage(src: string) {
  if (src.startsWith("/")) return true;
  try {
    const u = new URL(src);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    return ALLOWED_NEXT_IMAGE_HOSTS.has(u.hostname);
  } catch {
    return false;
  }
}

function decodeHtmlEntitiesLoose(input: string) {
  let out = input;
  // Handle doubly-encoded entities like &amp;amp;#x2F;
  for (let i = 0; i < 3; i++) {
    const next = out.replace(/&amp;/g, "&");
    if (next === out) break;
    out = next;
  }

  out = out
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    )
    .replace(/&#([0-9]+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");

  return out;
}

function sanitizeMediaSrc(raw: string): string | null {
  const decoded = decodeHtmlEntitiesLoose(raw);
  const compact = decoded.replace(/\s+/g, "").trim();
  if (!compact) return null;
  if (compact.startsWith("//")) return `https:${compact}`;
  if (compact.startsWith("http://") || compact.startsWith("https://"))
    return compact;
  if (compact.startsWith("/")) return compact;
  return null;
}

function inferMediaTypeFromUrl(url: string): MediaItem["type"] {
  return VIDEO_EXT_RE.test(url) ? "video" : "image";
}

// ============================================
// 👑 PREMIUM SWIPEABLE MEDIA CAROUSEL
// ============================================
// IG-style: swipe left/right, dot indicators
// Double-tap to like, long-press for reactions
// ============================================

const POSITIVE_REACTIONS: ReactionValue[] = [
  "fire",
  "crown",
  "gem",
  "insightful",
  "lol",
  "up",
];

interface SwipeableMediaCarouselProps {
  media: MediaItem[];
  postTitle: string;
  postId: string;
  initialReactionCounts: ReactionCounts;
  initialMyReaction: ReactionValue | null;
  isFirst: boolean;
  onReactionChange?: (
    counts: ReactionCounts,
    myValue: ReactionValue | null
  ) => void;
}

function SwipeableMediaCarousel({
  media,
  postTitle,
  postId,
  initialReactionCounts,
  initialMyReaction,
  isFirst,
  onReactionChange,
}: SwipeableMediaCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [counts, setCounts] = useState(initialReactionCounts);
  const [myValue, setMyValue] = useState(initialMyReaction);
  const [busy, setBusy] = useState(false);

  const carouselRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef(0);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Sync with parent if controlled
  useEffect(() => {
    setCounts(initialReactionCounts);
    setMyValue(initialMyReaction);
  }, [initialReactionCounts, initialMyReaction]);

  // Handle scroll to update active index
  const handleScroll = useCallback(() => {
    if (!carouselRef.current) return;
    const scrollLeft = carouselRef.current.scrollLeft;
    const width = carouselRef.current.offsetWidth;
    const newIndex = Math.round(scrollLeft / width);
    if (newIndex !== activeIndex && newIndex >= 0 && newIndex < media.length) {
      setActiveIndex(newIndex);
    }
  }, [activeIndex, media.length]);

  // Scroll to specific slide
  const scrollToIndex = useCallback((index: number) => {
    if (!carouselRef.current) return;
    const width = carouselRef.current.offsetWidth;
    carouselRef.current.scrollTo({ left: width * index, behavior: "smooth" });
  }, []);

  // Handle reaction
  const handleReaction = useCallback(
    async (nextValue: ReactionValue) => {
      if (busy) return;

      const prev = myValue;
      const prevCounts = { ...counts };

      let nextMy: ReactionValue | null = nextValue;
      if (prev === nextValue) nextMy = null;

      const newCounts = { ...counts };
      if (prev) newCounts[prev] = Math.max(0, newCounts[prev] - 1);
      if (nextMy) newCounts[nextMy] = newCounts[nextMy] + 1;

      setCounts(newCounts);
      setMyValue(nextMy);
      onReactionChange?.(newCounts, nextMy);

      setBusy(true);
      const res = await setReaction({ postId, value: nextMy ?? "none" });
      setBusy(false);

      if (!res.ok) {
        setCounts(prevCounts);
        setMyValue(prev);
        onReactionChange?.(prevCounts, prev);
      }
    },
    [busy, counts, myValue, postId, onReactionChange]
  );

  // Double-tap to like
  const handleDoubleTap = useCallback(() => {
    setShowLikeAnimation(true);
    setTimeout(() => setShowLikeAnimation(false), 800);

    // If not already liked with fire, add fire reaction
    if (myValue !== "fire") {
      void handleReaction("fire");
    }
  }, [myValue, handleReaction]);

  // Handle touch/click events for double-tap and long-press
  const handleTouchStart = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      const now = Date.now();
      const pos =
        "touches" in e
          ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
          : { x: e.clientX, y: e.clientY };
      touchStartRef.current = pos;

      // Double-tap detection
      if (now - lastTapRef.current < 300) {
        handleDoubleTap();
        lastTapRef.current = 0;
        return;
      }
      lastTapRef.current = now;

      // Long-press detection
      longPressTimerRef.current = setTimeout(() => {
        setShowReactionPicker(true);
      }, 500);
    },
    [handleDoubleTap]
  );

  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    // Cancel long-press if user moves finger significantly (swiping)
    if (touchStartRef.current && longPressTimerRef.current) {
      const dx = Math.abs(e.touches[0].clientX - touchStartRef.current.x);
      const dy = Math.abs(e.touches[0].clientY - touchStartRef.current.y);
      if (dx > 10 || dy > 10) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    };
  }, []);

  if (media.length === 0) return null;

  return (
    <div className="relative rounded-2xl overflow-hidden border border-foreground/10 bg-foreground/5 select-none">
      {/* Carousel Container */}
      <div
        ref={carouselRef}
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        className={cn(
          "w-full overflow-x-auto overscroll-x-contain",
          "flex snap-x snap-mandatory scroll-smooth",
          "touch-pan-x touch-pan-y",
          "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        )}
        aria-label="Post media carousel"
      >
        {media.map((m, idx) => (
          <div
            key={`${m.type}:${m.src}:${idx}`}
            className="relative min-w-full flex-shrink-0 snap-center"
          >
            <div className="relative aspect-[4/5] sm:aspect-[16/10] md:aspect-[16/9] w-full bg-black/20">
              {m.type === "image" ? (
                canUseNextImage(m.src) ? (
                  <Image
                    src={m.src}
                    alt={`${postTitle} - image ${idx + 1}`}
                    fill
                    priority={isFirst && idx === 0}
                    sizes="(max-width: 768px) 100vw, 1200px"
                    className="object-contain"
                    draggable={false}
                  />
                ) : (
                  <img
                    src={m.src}
                    alt={`${postTitle} - image ${idx + 1}`}
                    className="absolute inset-0 h-full w-full object-contain"
                    draggable={false}
                    loading={isFirst && idx === 0 ? "eager" : "lazy"}
                    referrerPolicy="no-referrer"
                  />
                )
              ) : (
                <video
                  src={m.src}
                  controls
                  playsInline
                  preload={isFirst && idx === 0 ? "metadata" : "none"}
                  className="absolute inset-0 h-full w-full object-contain"
                />
              )}
              {/* Subtle gradient for legibility */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10" />
            </div>
          </div>
        ))}
      </div>

      {/* Like Animation Overlay */}
      {showLikeAnimation && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <Heart
            className="h-24 w-24 text-red-500 fill-red-500 animate-ping"
            style={{ animationDuration: "0.6s" }}
          />
        </div>
      )}

      {/* Reaction Picker Overlay */}
      {showReactionPicker && (
        <div
          className="absolute inset-0 bg-black/60 flex items-center justify-center z-30"
          onClick={() => setShowReactionPicker(false)}
        >
          <div
            className={cn(
              "flex items-center gap-2 p-3 rounded-full",
              "bg-black/80 backdrop-blur-xl border border-white/20",
              "animate-in zoom-in-75 duration-200"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {POSITIVE_REACTIONS.map((type) => {
              const isActive = myValue === type;
              return (
                <button
                  key={type}
                  onClick={() => {
                    void handleReaction(type);
                    setShowReactionPicker(false);
                  }}
                  disabled={busy}
                  className={cn(
                    "p-2 rounded-full transition-all duration-200",
                    "hover:bg-white/20 active:scale-90",
                    isActive && "bg-king-orange/30 ring-2 ring-king-orange"
                  )}
                  title={REACTION_CONFIG[type].label}
                  aria-label={REACTION_CONFIG[type].label}
                >
                  <span className="text-3xl">
                    {REACTION_CONFIG[type].emoji}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="absolute bottom-8 text-white/60 text-sm">
            Tap outside to close
          </p>
        </div>
      )}

      {/* Dot Indicators */}
      {media.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10">
          {media.map((_, idx) => (
            <button
              key={idx}
              onClick={() => scrollToIndex(idx)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                idx === activeIndex
                  ? "bg-white w-6"
                  : "bg-white/40 hover:bg-white/60"
              )}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}

      {/* Slide Counter */}
      {media.length > 1 && (
        <div className="absolute top-4 right-4 z-10 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-mono">
          {activeIndex + 1} / {media.length}
        </div>
      )}

      {/* Hint Text */}
      <div className="absolute bottom-12 left-4 z-10 flex flex-col gap-0.5 text-[10px] text-white/50">
        <span>Double-tap to like</span>
        <span>Hold for reactions</span>
      </div>
    </div>
  );
}

function normalizeText(input: string) {
  return input
    .replace(/\s+/g, " ")
    .replace(/\u00A0/g, " ")
    .trim()
    .toLowerCase();
}

function dedupeExactDoubleHtml(html: string): string {
  const trimmed = html.trim();
  if (trimmed.length < 40) return html;
  if (trimmed.length % 2 !== 0) return html;
  const half = trimmed.slice(0, trimmed.length / 2);
  const other = trimmed.slice(trimmed.length / 2);
  if (normalizeText(half) === normalizeText(other)) return half;
  return html;
}

function extractMediaBlocksFromHtml(html: string): {
  cleanedHtml: string;
  media: MediaItem[];
} {
  if (typeof window === "undefined") {
    const media: MediaItem[] = [];
    let cleaned = html;

    // <img ... src="..." ...>
    cleaned = cleaned.replace(
      /<img[^>]*\ssrc\s*=\s*['"]([^'"]+)['"][^>]*>/gi,
      (_m, rawSrc: string) => {
        const src = sanitizeMediaSrc(rawSrc);
        if (src) media.push({ type: "image", src });
        return "";
      }
    );

    // <video src="...">...</video>
    cleaned = cleaned.replace(
      /<video[^>]*\ssrc\s*=\s*['"]([^'"]+)['"][^>]*>[\s\S]*?<\/video>/gi,
      (_m, rawSrc: string) => {
        const src = sanitizeMediaSrc(rawSrc);
        if (src) media.push({ type: "video", src });
        return "";
      }
    );

    // <video ...><source src="..." /></video>
    cleaned = cleaned.replace(
      /<video[^>]*>[\s\S]*?<source[^>]*\ssrc\s*=\s*['"]([^'"]+)['"][^>]*>[\s\S]*?<\/video>/gi,
      (_m, rawSrc: string) => {
        const src = sanitizeMediaSrc(rawSrc);
        if (src) media.push({ type: "video", src });
        return "";
      }
    );

    // Remove empty paragraphs created by stripping tags
    cleaned = cleaned.replace(/<p>(\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, "");

    return { cleanedHtml: cleaned, media };
  }
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const body = doc.body;
    const media: MediaItem[] = [];

    // Extract ALL images and videos from content - they go into the carousel
    const allMedia = Array.from(body.querySelectorAll("img, video"));
    for (const el of allMedia) {
      if (el.tagName.toLowerCase() === "img") {
        const rawSrc = (el as HTMLImageElement).getAttribute("src");
        const src = rawSrc ? sanitizeMediaSrc(rawSrc) : null;
        if (src) media.push({ type: "image", src });
      } else {
        const rawSrc = (el as HTMLVideoElement).getAttribute("src");
        const src = rawSrc ? sanitizeMediaSrc(rawSrc) : null;
        if (src) media.push({ type: "video", src });
      }
      // Remove the element from content
      el.remove();
    }

    // Also clean up any empty paragraphs/divs that contained only media
    const emptyContainers = Array.from(body.querySelectorAll("p, div"));
    for (const container of emptyContainers) {
      const text = normalizeText(container.textContent ?? "");
      if (text.length === 0 && container.children.length === 0) {
        container.remove();
      }
    }

    return { cleanedHtml: body.innerHTML, media };
  } catch {
    return { cleanedHtml: html, media: [] };
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

  // Track reaction state locally for sync between carousel and reaction bar
  const [reactionCounts, setReactionCounts] = useState(post.reactionCounts);
  const [myReaction, setMyReaction] = useState(post.myReaction);
  const [isExpanded, setIsExpanded] = useState(false);

  const contentOnce = React.useMemo(
    () => dedupeExactDoubleHtml(post.content),
    [post.content]
  );
  const extracted = React.useMemo(
    () => extractMediaBlocksFromHtml(contentOnce),
    [contentOnce]
  );

  const heroMedia = React.useMemo(() => {
    const items: MediaItem[] = [];
    if (post.coverImageUrl) {
      const src = sanitizeMediaSrc(post.coverImageUrl);
      if (src) items.push({ type: inferMediaTypeFromUrl(src), src });
    }
    if (post.videoUrl) {
      const src = sanitizeMediaSrc(post.videoUrl);
      if (src) items.push({ type: "video", src });
    }

    // Add extracted content media, but avoid duplicates (esp. cover image)
    for (const m of extracted.media) {
      if (items.some((x) => x.type === m.type && x.src === m.src)) continue;
      items.push(m);
    }
    return items;
  }, [post.coverImageUrl, post.videoUrl, extracted.media]);

  // Handle reaction sync from carousel
  const handleReactionChange = useCallback(
    (counts: ReactionCounts, myValue: ReactionValue | null) => {
      setReactionCounts(counts);
      setMyReaction(myValue);
    },
    []
  );

  return (
    <article className="mb-8 md:mb-12">
      {/* 👑 PREMIUM SWIPEABLE MEDIA CAROUSEL */}
      {heroMedia.length > 0 && (
        <div className="mb-4 md:mb-6">
          <SwipeableMediaCarousel
            media={heroMedia}
            postTitle={post.title}
            postId={post.id}
            initialReactionCounts={reactionCounts}
            initialMyReaction={myReaction}
            isFirst={isFirst}
            onReactionChange={handleReactionChange}
          />
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

        {/* Title Only - No excerpt duplication */}
        <SectionHeader title={post.title} />

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

        {/* Post Content - Collapsible with Read More */}
        {isExpanded ? (
          <div
            className="mt-8 md:mt-10 post-content"
            dangerouslySetInnerHTML={{ __html: extracted.cleanedHtml }}
          />
        ) : (
          <div className="mt-8 md:mt-10">
            <div
              className="post-content line-clamp-6 overflow-hidden"
              dangerouslySetInnerHTML={{ __html: extracted.cleanedHtml }}
            />
            <button
              onClick={() => setIsExpanded(true)}
              className="mt-4 text-king-orange font-semibold text-sm hover:underline flex items-center gap-1"
            >
              Read more →
            </button>
          </div>
        )}

        {/* Reactions & Actions (End of reading) */}
        <div className="flex flex-col gap-3 mt-8 pt-6 border-t border-foreground/10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 md:gap-3">
              <ReactionBar
                postId={post.id}
                initialCounts={reactionCounts}
                initialMyValue={myReaction}
              />
              <BookmarkButton
                postId={post.id}
                initialBookmarked={post.bookmarked}
              />
            </div>
            <ShareBar title={post.title} url={url} />
          </div>
          <p className="text-xs text-foreground/50">
            Share is most powerful after reading.
          </p>
        </div>
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
