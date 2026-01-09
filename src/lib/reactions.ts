// ============================================
// 👑 KING BLOGGERS V2 - Reaction Types & Config
// ============================================
// Shared between client and server components
// ============================================

/** All possible reaction values */
export type ReactionValue = "up" | "down" | "fire" | "gem" | "crown" | "insightful" | "lol";

/** All available reaction types with their display info */
export const REACTION_CONFIG = {
  up: { emoji: "👍", label: "Like", color: "text-blue-500" },
  down: { emoji: "👎", label: "Dislike", color: "text-gray-500" },
  fire: { emoji: "🔥", label: "Fire", color: "text-orange-500" },
  gem: { emoji: "💎", label: "Gem", color: "text-cyan-400" },
  crown: { emoji: "👑", label: "Crown", color: "text-yellow-500" },
  insightful: { emoji: "💡", label: "Insightful", color: "text-amber-400" },
  lol: { emoji: "😂", label: "LOL", color: "text-pink-500" },
} as const satisfies Record<ReactionValue, { emoji: string; label: string; color: string }>;

/** Reaction counts by type */
export type ReactionCounts = Record<ReactionValue, number>;

/** Full reaction summary for a post */
export interface ReactionSummary {
  counts: ReactionCounts;
  total: number;
  myValue: ReactionValue | null;
}

/** Create empty reaction counts object */
export function emptyReactionCounts(): ReactionCounts {
  return {
    up: 0,
    down: 0,
    fire: 0,
    gem: 0,
    crown: 0,
    insightful: 0,
    lol: 0,
  };
}

/**
 * Get top N reaction types for a post (for compact display)
 */
export function getTopReactions(counts: ReactionCounts, limit = 3): Array<{ type: ReactionValue; count: number }> {
  return Object.entries(counts)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([type, count]) => ({ type: type as ReactionValue, count }));
}
