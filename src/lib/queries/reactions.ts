import { and, count, eq } from "drizzle-orm";

import { db } from "@/db";
import { postReactions } from "@/db/schema";

export type ReactionValue = "up" | "down";

export async function getReactionSummary(postId: string, userId?: string | null) {
  const [upRow] = await db
    .select({ value: count() })
    .from(postReactions)
    .where(and(eq(postReactions.postId, postId), eq(postReactions.value, "up")));

  const [downRow] = await db
    .select({ value: count() })
    .from(postReactions)
    .where(and(eq(postReactions.postId, postId), eq(postReactions.value, "down")));

  let myValue: ReactionValue | null = null;
  if (userId) {
    const mine = await db
      .select({ value: postReactions.value })
      .from(postReactions)
      .where(and(eq(postReactions.postId, postId), eq(postReactions.userId, userId)))
      .limit(1);

    myValue = (mine[0]?.value as ReactionValue | undefined) ?? null;
  }

  return {
    up: Number(upRow?.value ?? 0),
    down: Number(downRow?.value ?? 0),
    myValue,
  };
}
