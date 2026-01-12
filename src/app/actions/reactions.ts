"use server";

import { and, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  postReactions,
  posts,
  notifications,
  type ReactionValue,
} from "@/db/schema";
import { auth } from "@/lib/auth";

// ============================================
// 👑 KING BLOGGERS V2 - Reaction Actions
// ============================================
// Rich reactions with notifications
// ============================================

const VALID_REACTIONS: readonly ReactionValue[] = [
  "up",
  "down",
  "fire",
  "gem",
  "crown",
  "insightful",
  "lol",
] as const;

type SetReactionInput = {
  postId: string;
  value: ReactionValue | "none";
};

type SetReactionResult =
  | { ok: true; action: "added" | "removed" | "changed" }
  | { ok: false; error: string };

export async function setReaction(
  input: SetReactionInput
): Promise<SetReactionResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { ok: false, error: "Sign in to react." };
  }

  const { postId, value } = input;

  // Validate reaction value
  if (value !== "none" && !VALID_REACTIONS.includes(value)) {
    return { ok: false, error: "Invalid reaction type." };
  }

  // Get existing reaction
  const existing = await db
    .select({ id: postReactions.id, value: postReactions.value })
    .from(postReactions)
    .where(
      and(eq(postReactions.postId, postId), eq(postReactions.userId, userId))
    )
    .limit(1);

  const row = existing[0];

  // Remove reaction
  if (value === "none") {
    if (row) {
      await db.delete(postReactions).where(eq(postReactions.id, row.id));
      // Decrement reaction count
      await db
        .update(posts)
        .set({ reactionCount: sql`GREATEST(${posts.reactionCount} - 1, 0)` })
        .where(eq(posts.id, postId));
    }
    return { ok: true, action: "removed" };
  }

  // No existing reaction - add new one
  if (!row) {
    await db.insert(postReactions).values({ postId, userId, value });

    // Increment reaction count
    await db
      .update(posts)
      .set({ reactionCount: sql`${posts.reactionCount} + 1` })
      .where(eq(posts.id, postId));

    // Create notification for post author
    await createReactionNotification(postId, userId, value);

    return { ok: true, action: "added" };
  }

  // Same reaction - toggle off
  if (row.value === value) {
    await db.delete(postReactions).where(eq(postReactions.id, row.id));
    await db
      .update(posts)
      .set({ reactionCount: sql`GREATEST(${posts.reactionCount} - 1, 0)` })
      .where(eq(posts.id, postId));
    return { ok: true, action: "removed" };
  }

  // Different reaction - change it
  await db
    .update(postReactions)
    .set({ value })
    .where(eq(postReactions.id, row.id));
  return { ok: true, action: "changed" };
}

/**
 * Create a notification for the post author when someone reacts
 */
async function createReactionNotification(
  postId: string,
  actorId: string,
  reactionValue: ReactionValue
): Promise<void> {
  try {
    // Get post author
    const [post] = await db
      .select({ authorId: posts.authorId, title: posts.title })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!post || post.authorId === actorId) {
      // Don't notify if reacting to own post
      return;
    }

    const emojiMap: Record<ReactionValue, string> = {
      up: "👍",
      down: "👎",
      fire: "🔥",
      gem: "💎",
      crown: "👑",
      insightful: "💡",
      lol: "😂",
    };

    await db.insert(notifications).values({
      userId: post.authorId,
      type: "reaction",
      actorId,
      postId,
      message: `Someone reacted ${
        emojiMap[reactionValue]
      } to "${post.title.slice(0, 40)}..."`,
    });
  } catch {
    // Don't fail the reaction if notification fails
  }
}
