// ============================================
// 👑 KING BLOGGERS - Personalization Types
// ============================================

import type { PostCategory } from "@/db/schema";

/** Actions that update user interest scores */
export type EngagementAction =
  | "view"           // Just opened the post
  | "read_25"        // Scrolled 25%
  | "read_50"        // Scrolled 50%
  | "read_75"        // Scrolled 75%
  | "read_100"       // Completed reading
  | "reaction"       // Gave any reaction
  | "reaction_strong"// Gave fire/crown/gem (high intent)
  | "bookmark"       // Saved for later
  | "comment"        // Left a comment
  | "follow_author"  // Followed the author
  | "share";         // Shared the post

/** Engagement action weights for scoring */
export const ENGAGEMENT_WEIGHTS: Record<EngagementAction, number> = {
  view: 1,
  read_25: 3,
  read_50: 8,
  read_75: 15,
  read_100: 25,
  reaction: 20,
  reaction_strong: 35,
  bookmark: 30,
  comment: 40,
  follow_author: 50,
  share: 45,
} as const;

/** User's interest profile by category */
export interface UserInterestProfile {
  userId: string;
  interests: Map<PostCategory, number>;
  topCategories: PostCategory[];
  updatedAt: Date;
}

/** Reading progress data from client */
export interface ReadingProgress {
  postId: string;
  scrollDepth: number; // 0-100
  timeSpent: number;   // seconds
}

/** Post with personalization score for ranking */
export interface RankedPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  category: PostCategory;
  authorId: string;
  authorEmail: string;
  authorName?: string | null;
  authorImage?: string | null;
  authorRole: "reader" | "blogger";
  coverImageUrl: string | null;
  viewCount: number;
  reactionCount: number;
  createdAt: Date;
  // Personalization scores
  categoryScore: number;
  authorScore: number;
  qualityScore: number;
  freshnessScore: number;
  totalScore: number;
}

/** Feed types available */
export type FeedType = "for-you" | "following" | "trending" | "latest";
