"use server";

import { and, desc, eq, inArray, notInArray, sql } from "drizzle-orm";

import { db } from "@/db";
import { follows, notifications, posts, userInterests, users } from "@/db/schema";
import { auth } from "@/lib/auth";

// ============================================
// 👑 KING BLOGGERS V2 - Follow System
// ============================================
// Social connections for content discovery
// ============================================

type FollowResult =
  | { ok: true; action: "followed" | "unfollowed" }
  | { ok: false; error: string };

/**
 * Toggle follow status for a user
 */
export async function toggleFollow(
  targetUserId: string
): Promise<FollowResult> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { ok: false, error: "Sign in to follow users." };
  }

  if (userId === targetUserId) {
    return { ok: false, error: "You cannot follow yourself." };
  }

  // Check if already following
  const existing = await db
    .select({ id: follows.id })
    .from(follows)
    .where(
      and(eq(follows.followerId, userId), eq(follows.followingId, targetUserId))
    )
    .limit(1);

  if (existing[0]) {
    // Unfollow
    await db.delete(follows).where(eq(follows.id, existing[0].id));
    return { ok: true, action: "unfollowed" };
  }

  // Follow
  await db.insert(follows).values({
    followerId: userId,
    followingId: targetUserId,
  });

  // Create notification
  try {
    await db.insert(notifications).values({
      userId: targetUserId,
      type: "follow",
      actorId: userId,
      // Message should not include actor identity; UI already has actor details.
      message: "started following you",
    });
  } catch {
    // Don't fail the follow if notification fails
  }

  return { ok: true, action: "followed" };
}

export type SuggestedUser = {
  id: string;
  name: string | null;
  email: string | null;
  imageUrl: string | null;
  role: string;
};

/**
 * Suggested users to follow for the current user.
 * Uses interest categories when available; falls back to popular recent authors.
 */
export async function getSuggestedUsersToFollow(
  limit = 6
): Promise<SuggestedUser[]> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return [];

  const followedRows = await db
    .select({ followingId: follows.followingId })
    .from(follows)
    .where(eq(follows.followerId, userId));
  const followedIds = followedRows.map((r) => r.followingId);

  const interests = await db
    .select({ category: userInterests.category })
    .from(userInterests)
    .where(eq(userInterests.userId, userId))
    .orderBy(desc(userInterests.score))
    .limit(3);
  const categories = interests.map((r) => r.category);

  const baseWhere = and(
    sql`${users.id} <> ${userId}`,
    followedIds.length > 0 ? notInArray(users.id, followedIds) : sql`1=1`
  );

  // Interest-based: authors who publish in your top categories
  if (categories.length > 0) {
    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        imageUrl: users.imageUrl,
        role: users.role,
        postCount: sql<number>`COUNT(${posts.id})`.mapWith(Number),
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(
        and(
          baseWhere,
          eq(posts.status, "published"),
          inArray(posts.category, categories)
        )
      )
      .groupBy(users.id)
      .orderBy(desc(sql`COUNT(${posts.id})`))
      .limit(limit);

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      imageUrl: r.imageUrl,
      role: r.role,
    }));
  }

  // Fallback: recent bloggers / users with published posts
  const fallback = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      imageUrl: users.imageUrl,
      role: users.role,
    })
    .from(users)
    .where(baseWhere)
    .orderBy(desc(users.createdAt))
    .limit(limit);

  return fallback;
}

/**
 * Check if current user follows a target user
 */
export async function isFollowing(targetUserId: string): Promise<boolean> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId || userId === targetUserId) {
    return false;
  }

  const [existing] = await db
    .select({ id: follows.id })
    .from(follows)
    .where(
      and(eq(follows.followerId, userId), eq(follows.followingId, targetUserId))
    )
    .limit(1);

  return !!existing;
}

/**
 * Get follow stats for a user
 */
export async function getFollowStats(userId: string): Promise<{
  followers: number;
  following: number;
}> {
  const [result] = await db
    .select({
      followers:
        sql<number>`(SELECT COUNT(*) FROM ${follows} WHERE following_id = ${userId})`.mapWith(
          Number
        ),
      following:
        sql<number>`(SELECT COUNT(*) FROM ${follows} WHERE follower_id = ${userId})`.mapWith(
          Number
        ),
    })
    .from(sql`(SELECT 1)`);

  return {
    followers: result?.followers ?? 0,
    following: result?.following ?? 0,
  };
}

/**
 * Get list of user IDs that the current user follows
 */
export async function getFollowingIds(): Promise<string[]> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return [];

  const rows = await db
    .select({ followingId: follows.followingId })
    .from(follows)
    .where(eq(follows.followerId, userId));

  return rows.map((r) => r.followingId);
}
