"use server";

import { eq, sql, desc, and, notInArray, inArray } from "drizzle-orm";

import { db } from "@/db";
import {
  posts,
  users,
  follows,
  readingHistory,
  userInterests,
  userAuthorAffinity,
  type PostCategory,
} from "@/db/schema";
import { auth } from "@/lib/auth";

import type { RankedPost } from "./types";

// ============================================
// 👑 KING BLOGGERS - For You Feed Query
// ============================================
// Personalized content ranking for maximum engagement
// ============================================

/**
 * Scoring weights for personalized ranking
 */
const RANKING_WEIGHTS = {
  categoryInterest: 0.40,  // How much they like this category
  authorAffinity: 0.25,    // How much they like this author
  qualityScore: 0.25,      // Post's overall quality/engagement
  freshness: 0.10,         // Recency boost
} as const;

/**
 * Get personalized "For You" feed for the current user.
 * Falls back to trending for anonymous users.
 */
export async function getForYouFeed(input?: {
  limit?: number;
  cursor?: string;
}): Promise<{
  items: RankedPost[];
  nextCursor?: string;
  hasMore: boolean;
}> {
  const session = await auth();
  const userId = session?.user?.id;
  const limit = input?.limit ?? 12;

  // Anonymous users get trending feed
  if (!userId) {
    return getTrendingFeed({ limit, cursor: input?.cursor });
  }

  // Get user's interest profile
  const interestRows = await db
    .select({
      category: userInterests.category,
      score: userInterests.score,
    })
    .from(userInterests)
    .where(eq(userInterests.userId, userId));

  const interestMap = new Map<PostCategory, number>();
  for (const row of interestRows) {
    interestMap.set(row.category, row.score);
  }

  // Get user's author affinities
  const affinityRows = await db
    .select({
      authorId: userAuthorAffinity.authorId,
      score: userAuthorAffinity.score,
    })
    .from(userAuthorAffinity)
    .where(eq(userAuthorAffinity.userId, userId));

  const affinityMap = new Map<string, number>();
  for (const row of affinityRows) {
    affinityMap.set(row.authorId, row.score);
  }

  // Get IDs of posts user has already read (completed)
  const readPostIds = await db
    .select({ postId: readingHistory.postId })
    .from(readingHistory)
    .where(
      and(
        eq(readingHistory.userId, userId),
        eq(readingHistory.completed, true)
      )
    );
  const excludeIds = readPostIds.map((r) => r.postId);

  // Get followed author IDs for boost
  const followedRows = await db
    .select({ followingId: follows.followingId })
    .from(follows)
    .where(eq(follows.followerId, userId));
  const followedIds = new Set(followedRows.map((r) => r.followingId));

  // Build cursor condition
  let cursorCondition = sql`1=1`;
  if (input?.cursor) {
    const [cursorPost] = await db
      .select({ createdAt: posts.createdAt })
      .from(posts)
      .where(eq(posts.id, input.cursor))
      .limit(1);
    if (cursorPost) {
      cursorCondition = sql`${posts.createdAt} < ${cursorPost.createdAt}`;
    }
  }

  // Fetch candidate posts
  const candidatesQuery = db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      excerpt: posts.excerpt,
      category: posts.category,
      authorId: posts.authorId,
      authorEmail: users.email,
      authorName: users.name,
      authorImage: users.imageUrl,
      authorRole: users.role,
      coverImageUrl: posts.coverImageUrl,
      viewCount: posts.viewCount,
      reactionCount: posts.reactionCount,
      commentCount: posts.commentCount,
      createdAt: posts.createdAt,
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(
      and(
        eq(posts.status, "published"),
        cursorCondition,
        excludeIds.length > 0 ? notInArray(posts.id, excludeIds) : sql`1=1`
      )
    )
    .orderBy(desc(posts.createdAt))
    .limit(100); // Fetch more candidates for ranking

  const candidates = await candidatesQuery;

  // Calculate scores and rank
  const now = Date.now();
  const rankedPosts: RankedPost[] = candidates.map((post) => {
    // Category interest score (0-1)
    const categoryScore = (interestMap.get(post.category) ?? 0) / 1000;

    // Author affinity score (0-1) + follow boost
    let authorScore = (affinityMap.get(post.authorId) ?? 0) / 1000;
    if (followedIds.has(post.authorId)) {
      authorScore = Math.min(1, authorScore + 0.5); // 50% boost for followed
    }

    // Quality score based on engagement
    const engagementScore = 
      (post.viewCount * 0.1) + 
      (post.reactionCount * 5) + 
      (post.commentCount * 10);
    const hoursOld = (now - post.createdAt.getTime()) / (1000 * 60 * 60);
    const qualityScore = Math.min(1, engagementScore / (Math.sqrt(hoursOld + 1) * 100));

    // Freshness score (1 for new, decays over 48 hours)
    const freshnessScore = Math.max(0, 1 - hoursOld / 48);

    // Calculate total weighted score
    const totalScore =
      categoryScore * RANKING_WEIGHTS.categoryInterest +
      authorScore * RANKING_WEIGHTS.authorAffinity +
      qualityScore * RANKING_WEIGHTS.qualityScore +
      freshnessScore * RANKING_WEIGHTS.freshness;

    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      category: post.category,
      authorId: post.authorId,
      authorEmail: post.authorEmail,
      authorName: post.authorName,
      authorImage: post.authorImage,
      authorRole: post.authorRole,
      coverImageUrl: post.coverImageUrl,
      viewCount: post.viewCount,
      reactionCount: post.reactionCount,
      createdAt: post.createdAt,
      categoryScore,
      authorScore,
      qualityScore,
      freshnessScore,
      totalScore,
    };
  });

  // Sort by total score (descending)
  rankedPosts.sort((a, b) => b.totalScore - a.totalScore);

  // Apply diversification (don't show 3+ from same author in a row)
  const diversified = diversifyFeed(rankedPosts, limit);

  // Pagination
  const hasMore = diversified.length > limit;
  const items = hasMore ? diversified.slice(0, limit) : diversified;
  const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

  return { items, nextCursor, hasMore };
}

/**
 * Get feed of posts from followed authors only.
 */
export async function getFollowingFeed(input?: {
  limit?: number;
  cursor?: string;
}): Promise<{
  items: RankedPost[];
  nextCursor?: string;
  hasMore: boolean;
}> {
  const session = await auth();
  const userId = session?.user?.id;
  const limit = input?.limit ?? 12;

  if (!userId) {
    return { items: [], nextCursor: undefined, hasMore: false };
  }

  // Get followed author IDs
  const followedRows = await db
    .select({ followingId: follows.followingId })
    .from(follows)
    .where(eq(follows.followerId, userId));

  const followedIds = followedRows.map((r) => r.followingId);

  if (followedIds.length === 0) {
    return { items: [], nextCursor: undefined, hasMore: false };
  }

  // Build cursor condition
  let cursorCondition = sql`1=1`;
  if (input?.cursor) {
    const [cursorPost] = await db
      .select({ createdAt: posts.createdAt })
      .from(posts)
      .where(eq(posts.id, input.cursor))
      .limit(1);
    if (cursorPost) {
      cursorCondition = sql`${posts.createdAt} < ${cursorPost.createdAt}`;
    }
  }

  const rows = await db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      excerpt: posts.excerpt,
      category: posts.category,
      authorId: posts.authorId,
      authorEmail: users.email,
      authorName: users.name,
      authorImage: users.imageUrl,
      authorRole: users.role,
      coverImageUrl: posts.coverImageUrl,
      viewCount: posts.viewCount,
      reactionCount: posts.reactionCount,
      createdAt: posts.createdAt,
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(
      and(
        eq(posts.status, "published"),
        inArray(posts.authorId, followedIds),
        cursorCondition
      )
    )
    .orderBy(desc(posts.createdAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = (hasMore ? rows.slice(0, -1) : rows).map((post) => ({
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    category: post.category,
    authorId: post.authorId,
    authorEmail: post.authorEmail,
    authorName: post.authorName,
    authorImage: post.authorImage,
    authorRole: post.authorRole,
    coverImageUrl: post.coverImageUrl,
    viewCount: post.viewCount,
    reactionCount: post.reactionCount,
    createdAt: post.createdAt,
    categoryScore: 0,
    authorScore: 1,
    qualityScore: 0,
    freshnessScore: 0,
    totalScore: 0,
  }));
  const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

  return { items, nextCursor, hasMore };
}

/**
 * Get trending posts based on engagement.
 */
export async function getTrendingFeed(input?: {
  limit?: number;
  cursor?: string;
}): Promise<{
  items: RankedPost[];
  nextCursor?: string;
  hasMore: boolean;
}> {
  const limit = input?.limit ?? 12;

  // Trending = high engagement in recent time
  const rows = await db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      excerpt: posts.excerpt,
      category: posts.category,
      authorId: posts.authorId,
      authorEmail: users.email,
      authorName: users.name,
      authorImage: users.imageUrl,
      authorRole: users.role,
      coverImageUrl: posts.coverImageUrl,
      viewCount: posts.viewCount,
      reactionCount: posts.reactionCount,
      createdAt: posts.createdAt,
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(eq(posts.status, "published"))
    .orderBy(
      desc(
        sql`(
          (
            CAST(${posts.viewCount} AS FLOAT) * 0.1
            + CAST(${posts.reactionCount} AS FLOAT) * 5
            + CAST(${posts.commentCount} AS FLOAT) * 10
          )
          / CAST(GREATEST(1, EXTRACT(EPOCH FROM (NOW() - ${posts.createdAt})) / 3600) AS FLOAT)
        )`
      )
    )
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = (hasMore ? rows.slice(0, -1) : rows).map((post) => ({
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    category: post.category,
    authorId: post.authorId,
    authorEmail: post.authorEmail,
    authorName: post.authorName,
    authorImage: post.authorImage,
    authorRole: post.authorRole,
    coverImageUrl: post.coverImageUrl,
    viewCount: post.viewCount,
    reactionCount: post.reactionCount,
    createdAt: post.createdAt,
    categoryScore: 0,
    authorScore: 0,
    qualityScore: 0,
    freshnessScore: 0,
    totalScore: 0,
  }));
  const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

  return { items, nextCursor, hasMore };
}

/**
 * Diversify feed to avoid showing too many posts from same author.
 */
function diversifyFeed(posts: RankedPost[], limit: number): RankedPost[] {
  const result: RankedPost[] = [];
  const authorCount = new Map<string, number>();
  const MAX_CONSECUTIVE = 2;

  for (const post of posts) {
    if (result.length >= limit + 1) break;

    const count = authorCount.get(post.authorId) ?? 0;
    
    // Check last few posts for same author
    const recentSameAuthor = result
      .slice(-MAX_CONSECUTIVE)
      .filter((p) => p.authorId === post.authorId).length;

    if (recentSameAuthor < MAX_CONSECUTIVE) {
      result.push(post);
      authorCount.set(post.authorId, count + 1);
    }
  }

  // If we don't have enough, fill with remaining
  if (result.length < limit + 1) {
    for (const post of posts) {
      if (result.length >= limit + 1) break;
      if (!result.includes(post)) {
        result.push(post);
      }
    }
  }

  return result;
}
