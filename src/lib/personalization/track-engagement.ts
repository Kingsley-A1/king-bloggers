"use server";

import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  posts,
  readingHistory,
  userInterests,
  userAuthorAffinity,
  type PostCategory,
} from "@/db/schema";
import { auth } from "@/lib/auth";

import { ENGAGEMENT_WEIGHTS, type EngagementAction, type ReadingProgress } from "./types";

// ============================================
// 👑 KING BLOGGERS - Engagement Tracking
// ============================================
// Records user engagement to power personalization
// ============================================

const MAX_INTEREST_SCORE = 1000;
const MAX_AFFINITY_SCORE = 1000;

/**
 * Track user engagement with a post.
 * Updates interest scores and reading history.
 */
export async function trackEngagement(
  postId: string,
  action: EngagementAction
): Promise<{ ok: boolean }> {
  const session = await auth();
  const userId = session?.user?.id;
  
  if (!userId) return { ok: false };

  try {
    // Get post info for category and author
    const [post] = await db
      .select({
        category: posts.category,
        authorId: posts.authorId,
      })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!post) return { ok: false };

    const weight = ENGAGEMENT_WEIGHTS[action];

    // Update category interest
    await updateCategoryInterest(userId, post.category, weight);

    // Update author affinity (only if not the user's own post)
    if (post.authorId !== userId) {
      await updateAuthorAffinity(userId, post.authorId, weight);
    }

    return { ok: true };
  } catch (error) {
    console.error("Track engagement error:", error);
    return { ok: false };
  }
}

/**
 * Track reading progress (scroll depth + time).
 * Called periodically from client as user reads.
 */
export async function trackReadingProgress(
  progress: ReadingProgress
): Promise<{ ok: boolean }> {
  const session = await auth();
  const userId = session?.user?.id;
  
  if (!userId) return { ok: false };

  try {
    const completed = progress.scrollDepth >= 80;

    // Upsert reading history
    await db
      .insert(readingHistory)
      .values({
        userId,
        postId: progress.postId,
        scrollDepth: progress.scrollDepth,
        timeSpent: progress.timeSpent,
        completed,
      })
      .onConflictDoUpdate({
        target: [readingHistory.userId, readingHistory.postId],
        set: {
          scrollDepth: sql`GREATEST(${readingHistory.scrollDepth}, ${progress.scrollDepth})`,
          timeSpent: sql`GREATEST(${readingHistory.timeSpent}, ${progress.timeSpent})`,
          completed: sql`${readingHistory.completed} OR ${completed}`,
          updatedAt: sql`now()`,
        },
      });

    // Get post for engagement tracking
    const [post] = await db
      .select({ category: posts.category, authorId: posts.authorId })
      .from(posts)
      .where(eq(posts.id, progress.postId))
      .limit(1);

    if (post) {
      // Calculate action based on depth
      let action: EngagementAction = "view";
      if (progress.scrollDepth >= 100) action = "read_100";
      else if (progress.scrollDepth >= 75) action = "read_75";
      else if (progress.scrollDepth >= 50) action = "read_50";
      else if (progress.scrollDepth >= 25) action = "read_25";

      const weight = ENGAGEMENT_WEIGHTS[action];
      await updateCategoryInterest(userId, post.category, weight);
      
      if (post.authorId !== userId) {
        await updateAuthorAffinity(userId, post.authorId, weight);
      }
    }

    return { ok: true };
  } catch (error) {
    console.error("Track reading progress error:", error);
    return { ok: false };
  }
}

/**
 * Update user's interest in a category.
 * Uses exponential decay to prevent runaway scores.
 */
async function updateCategoryInterest(
  userId: string,
  category: PostCategory,
  weight: number
): Promise<void> {
  await db
    .insert(userInterests)
    .values({
      userId,
      category,
      score: Math.min(weight, MAX_INTEREST_SCORE),
    })
    .onConflictDoUpdate({
      target: [userInterests.userId, userInterests.category],
      set: {
        // Add weight but cap at max, with slight decay
        // Cast to integer to avoid type mismatch with decimal multiplication
        score: sql`LEAST(${MAX_INTEREST_SCORE}::int, GREATEST(0, (${userInterests.score}::numeric * 0.99 + ${weight}::numeric)::int))`,
        updatedAt: sql`now()`,
      },
    });
}

/**
 * Update user's affinity for an author.
 */
async function updateAuthorAffinity(
  userId: string,
  authorId: string,
  weight: number
): Promise<void> {
  await db
    .insert(userAuthorAffinity)
    .values({
      userId,
      authorId,
      score: Math.min(weight, MAX_AFFINITY_SCORE),
    })
    .onConflictDoUpdate({
      target: [userAuthorAffinity.userId, userAuthorAffinity.authorId],
      set: {
        // Add weight but cap at max, with slight decay
        score: sql`LEAST(${MAX_AFFINITY_SCORE}, GREATEST(0, ${userAuthorAffinity.score} * 0.99 + ${weight}))`,
        updatedAt: sql`now()`,
      },
    });
}

/**
 * Get user's interest profile for debugging/display
 */
export async function getUserInterestProfile(userId: string) {
  const interests = await db
    .select({
      category: userInterests.category,
      score: userInterests.score,
    })
    .from(userInterests)
    .where(eq(userInterests.userId, userId))
    .orderBy(sql`${userInterests.score} DESC`);

  return interests;
}
