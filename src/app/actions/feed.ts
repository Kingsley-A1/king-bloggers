"use server";

import {
  listPublishedPosts,
  badgeVariantForCategory,
  labelForCategory,
  readTimeFromContent,
  formatCount,
  type PostCategory,
} from "@/lib/queries/posts";
import type { BadgeVariant } from "@/components/ui/Badge";

// ============================================
// 👑 KING BLOGGERS V2 - Feed Actions
// ============================================
// Server actions for infinite scroll feed
// ============================================

export interface FeedPostItem {
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

function mapPostToFeedItem(p: {
  id?: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  coverImageUrl: string | null;
  category: PostCategory;
  authorEmail: string;
  authorName?: string | null;
  authorImage?: string | null;
  authorRole?: "reader" | "blogger";
  viewCount: number;
  reactionCount: number;
}): FeedPostItem {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt ?? undefined,
    content: p.content,
    coverImageUrl: p.coverImageUrl,
    category: p.category,
    authorEmail: p.authorEmail,
    authorName: p.authorName,
    authorImage: p.authorImage,
    authorRole: p.authorRole,
    viewCount: formatCount(p.viewCount),
    reactionCount: p.reactionCount,
    badge: {
      label: labelForCategory(p.category),
      variant: badgeVariantForCategory(p.category),
    },
    readTime: readTimeFromContent(p.content),
  };
}

/**
 * Load more posts for the main feed
 */
export async function loadMorePosts(cursor: string) {
  const { items, nextCursor, hasMore } = await listPublishedPosts({
    cursor,
    limit: 12,
  });

  return {
    items: items.map(mapPostToFeedItem),
    nextCursor,
    hasMore,
  };
}

/**
 * Load more posts for a specific category
 */
export async function loadMoreCategoryPosts(
  category: PostCategory,
  cursor: string
) {
  const { items, nextCursor, hasMore } = await listPublishedPosts({
    category,
    cursor,
    limit: 12,
  });

  return {
    items: items.map(mapPostToFeedItem),
    nextCursor,
    hasMore,
  };
}
