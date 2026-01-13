import { and, desc, eq, sql, gt } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "@/db";
import { posts, users, postViews } from "@/db/schema";
import { auth } from "@/lib/auth";

// ============================================
// 👑 KING BLOGGERS V2 - Post Queries
// ============================================
// Includes view tracking, trending, cursor pagination
// ============================================

export type PostCategory = typeof posts.$inferSelect.category;

export type UserRole = "reader" | "blogger";

export type PublishedPostListItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  coverImageUrl: string | null;
  videoUrl?: string | null;
  category: PostCategory;
  createdAt: Date;
  authorEmail: string;
  authorName?: string | null;
  authorImage?: string | null;
  authorRole: UserRole;
  viewCount: number;
  reactionCount: number;
  commentCount: number;
};

export async function listPublishedPosts(input?: {
  category?: PostCategory;
  limit?: number;
  cursor?: string; // For infinite scroll - post ID to start after
}) {
  const limit = input?.limit ?? 30;

  let where = input?.category
    ? and(eq(posts.status, "published"), eq(posts.category, input.category))
    : eq(posts.status, "published");

  // Cursor-based pagination for infinite scroll
  if (input?.cursor) {
    const cursorPost = await db
      .select({ createdAt: posts.createdAt })
      .from(posts)
      .where(eq(posts.id, input.cursor))
      .limit(1);

    if (cursorPost[0]) {
      where = and(where, sql`${posts.createdAt} < ${cursorPost[0].createdAt}`);
    }
  }

  const rows = await db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      excerpt: posts.excerpt,
      content: posts.content,
      coverImageUrl: posts.coverImageUrl,
      videoUrl: posts.videoUrl,
      category: posts.category,
      createdAt: posts.createdAt,
      authorEmail: users.email,
      authorName: users.name,
      authorImage: users.imageUrl,
      authorRole: users.role,
      viewCount: posts.viewCount,
      reactionCount: posts.reactionCount,
      commentCount: posts.commentCount,
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(where)
    .orderBy(desc(posts.createdAt))
    .limit(limit + 1); // Fetch one extra to check if there's more

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, -1) : rows;
  const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

  return {
    items: items as PublishedPostListItem[],
    nextCursor,
    hasMore,
  };
}

/**
 * Get trending posts based on engagement score
 * Score = (views * 0.3) + (reactions * 0.5) + (comments * 0.2) / age_in_hours
 */
export async function getTrendingPosts(limit = 10) {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      excerpt: posts.excerpt,
      coverImageUrl: posts.coverImageUrl,
      category: posts.category,
      createdAt: posts.createdAt,
      authorEmail: users.email,
      authorName: users.name,
      authorImage: users.imageUrl,
      authorRole: users.role,
      viewCount: posts.viewCount,
      reactionCount: posts.reactionCount,
      commentCount: posts.commentCount,
      // Trending score calculation
      trendingScore: sql<number>`
        (
          CAST(${posts.viewCount} AS FLOAT) * 0.3
          + CAST(${posts.reactionCount} AS FLOAT) * 0.5
          + CAST(${posts.commentCount} AS FLOAT) * 0.2
        )
        / CAST(GREATEST(1, EXTRACT(EPOCH FROM (NOW() - ${posts.createdAt})) / 3600) AS FLOAT)
      `.mapWith(Number),
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(and(eq(posts.status, "published"), gt(posts.createdAt, oneDayAgo)))
    .orderBy(sql`7 DESC`) // Order by trendingScore
    .limit(limit);

  return rows;
}

export async function getPublishedPostBySlug(slug: string) {
  const rows = await db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      excerpt: posts.excerpt,
      content: posts.content,
      coverImageUrl: posts.coverImageUrl,
      videoUrl: posts.videoUrl,
      category: posts.category,
      createdAt: posts.createdAt,
      authorId: posts.authorId,
      authorEmail: users.email,
      authorName: users.name,
      authorImage: users.imageUrl,
      authorRole: users.role,
      viewCount: posts.viewCount,
      reactionCount: posts.reactionCount,
      commentCount: posts.commentCount,
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(and(eq(posts.slug, slug), eq(posts.status, "published")))
    .limit(1);

  return rows[0] ?? null;
}

/**
 * Track a view for a post (deduplicated by IP)
 */
export async function trackPostView(postId: string): Promise<void> {
  try {
    const session = await auth();
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() ?? "unknown";

    // Check for recent view from same IP (within 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentView = await db
      .select({ id: postViews.id })
      .from(postViews)
      .where(
        and(
          eq(postViews.postId, postId),
          eq(postViews.viewerIp, ip),
          gt(postViews.createdAt, oneHourAgo)
        )
      )
      .limit(1);

    if (recentView[0]) {
      // Already viewed recently, don't count again
      return;
    }

    // Insert view record
    await db.insert(postViews).values({
      postId,
      viewerIp: ip,
      userId: session?.user?.id ?? null,
    });

    // Increment cached view count
    await db
      .update(posts)
      .set({ viewCount: sql`${posts.viewCount} + 1` })
      .where(eq(posts.id, postId));
  } catch {
    // Don't fail page load if view tracking fails
  }
}

export function readTimeFromContent(content: string) {
  const words = content
    .replace(/<[^>]*>/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

export function labelForCategory(category: PostCategory) {
  switch (category) {
    case "tech":
      return "Tech";
    case "art_culture":
      return "Art & Culture";
    case "entertainment":
      return "Entertainment";
    case "politics":
      return "Politics";
    case "economics":
      return "Economics";
    case "religion":
      return "Religion";
    case "sport":
      return "Sport";
    case "health":
      return "Health";
    case "self_growth":
      return "Self Growth";
    case "finances":
      return "Finances";
    default:
      return category;
  }
}

import type { BadgeVariant } from "@/components/ui/Badge";

export function badgeVariantForCategory(category: PostCategory): BadgeVariant {
  switch (category) {
    case "tech":
      return "tech";
    case "politics":
      return "politics";
    case "art_culture":
      return "art";
    case "sport":
      return "sport";
    case "health":
      return "health";
    case "self_growth":
      return "growth";
    case "finances":
      return "finance";
    case "entertainment":
      return "secondary";
    case "economics":
      return "secondary";
    case "religion":
      return "gold";
    default:
      return "tech";
  }
}

/**
 * Format view count for display (1.2K, 3.4M, etc.)
 */
export function formatCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`;
  }
  return count.toString();
}

/**
 * Get all posts by the current authenticated user (both drafts and published)
 */
export async function getUserPosts() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const rows = await db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      excerpt: posts.excerpt,
      content: posts.content,
      coverImageUrl: posts.coverImageUrl,
      category: posts.category,
      status: posts.status,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      viewCount: posts.viewCount,
      reactionCount: posts.reactionCount,
      commentCount: posts.commentCount,
    })
    .from(posts)
    .where(eq(posts.authorId, session.user.id))
    .orderBy(desc(posts.createdAt));

  return rows;
}

/**
 * Get a single post by ID for editing (only if owned by current user)
 */
export async function getPostForEdit(postId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const rows = await db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      excerpt: posts.excerpt,
      content: posts.content,
      coverImageUrl: posts.coverImageUrl,
      category: posts.category,
      status: posts.status,
    })
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.authorId, session.user.id)))
    .limit(1);

  return rows[0] ?? null;
}

/**
 * Delete a post by ID (only if owned by current user)
 */
export async function deletePost(postId: string) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  await db
    .delete(posts)
    .where(and(eq(posts.id, postId), eq(posts.authorId, session.user.id)));

  return { ok: true };
}
