"use server";

import { and, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { follows, notifications, users } from "@/db/schema";
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
export async function toggleFollow(targetUserId: string): Promise<FollowResult> {
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
      and(
        eq(follows.followerId, userId),
        eq(follows.followingId, targetUserId)
      )
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
    const [actor] = await db
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    await db.insert(notifications).values({
      userId: targetUserId,
      type: "follow",
      actorId: userId,
      message: `${actor?.name ?? actor?.email ?? "Someone"} started following you`,
    });
  } catch {
    // Don't fail the follow if notification fails
  }

  return { ok: true, action: "followed" };
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
      and(
        eq(follows.followerId, userId),
        eq(follows.followingId, targetUserId)
      )
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
      followers: sql<number>`(SELECT COUNT(*) FROM ${follows} WHERE following_id = ${userId})`.mapWith(Number),
      following: sql<number>`(SELECT COUNT(*) FROM ${follows} WHERE follower_id = ${userId})`.mapWith(Number),
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
