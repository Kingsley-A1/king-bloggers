import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { postReactions } from "@/db/schema";
import type { ReactionCounts, ReactionSummary, ReactionValue } from "@/lib/reactions";

// Re-export shared types from the client-safe module
export {
  REACTION_CONFIG,
  emptyReactionCounts,
  getTopReactions,
  type ReactionCounts,
  type ReactionSummary,
  type ReactionValue,
} from "@/lib/reactions";

/**
 * Get rich reaction summary for a post in a single optimized query.
 * Returns counts for each reaction type and user's reaction.
 */
export async function getReactionSummary(
  postId: string,
  userId?: string | null
): Promise<ReactionSummary> {
  const result = await db
    .select({
      upCount: sql<number>`COUNT(CASE WHEN ${postReactions.value} = 'up' THEN 1 END)`.mapWith(Number),
      downCount: sql<number>`COUNT(CASE WHEN ${postReactions.value} = 'down' THEN 1 END)`.mapWith(Number),
      fireCount: sql<number>`COUNT(CASE WHEN ${postReactions.value} = 'fire' THEN 1 END)`.mapWith(Number),
      gemCount: sql<number>`COUNT(CASE WHEN ${postReactions.value} = 'gem' THEN 1 END)`.mapWith(Number),
      crownCount: sql<number>`COUNT(CASE WHEN ${postReactions.value} = 'crown' THEN 1 END)`.mapWith(Number),
      insightfulCount: sql<number>`COUNT(CASE WHEN ${postReactions.value} = 'insightful' THEN 1 END)`.mapWith(Number),
      lolCount: sql<number>`COUNT(CASE WHEN ${postReactions.value} = 'lol' THEN 1 END)`.mapWith(Number),
      myValue: userId
        ? sql<string | null>`MAX(CASE WHEN ${postReactions.userId} = ${userId} THEN ${postReactions.value}::text END)`
        : sql<null>`NULL`,
    })
    .from(postReactions)
    .where(eq(postReactions.postId, postId));

  const row = result[0];
  
  const counts: ReactionCounts = {
    up: row?.upCount ?? 0,
    down: row?.downCount ?? 0,
    fire: row?.fireCount ?? 0,
    gem: row?.gemCount ?? 0,
    crown: row?.crownCount ?? 0,
    insightful: row?.insightfulCount ?? 0,
    lol: row?.lolCount ?? 0,
  };

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return {
    counts,
    total,
    myValue: (row?.myValue as ReactionValue | undefined) ?? null,
  };
}
