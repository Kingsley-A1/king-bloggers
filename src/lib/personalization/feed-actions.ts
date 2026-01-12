"use server";

import {
  getForYouFeed,
  getFollowingFeed,
  getTrendingFeed,
} from "@/lib/personalization/for-you-query";
import { listPublishedPosts } from "@/lib/queries/posts";

import type { FeedType, RankedPost } from "@/lib/personalization/types";

// ============================================
// 👑 KING BLOGGERS - Feed Actions
// ============================================
// Server actions for personalized feeds
// ============================================

/**
 * Load more posts for any feed type
 */
export async function loadFeed(
  feedType: FeedType,
  cursor?: string
): Promise<{
  items: RankedPost[];
  nextCursor?: string;
  hasMore: boolean;
}> {
  switch (feedType) {
    case "for-you":
      return getForYouFeed({ cursor, limit: 12 });

    case "following":
      return getFollowingFeed({ cursor, limit: 12 });

    case "trending":
      return getTrendingFeed({ cursor, limit: 12 });

    case "latest":
    default: {
      const result = await listPublishedPosts({ cursor, limit: 12 });
      return {
        items: result.items.map((post) => ({
          id: post.id,
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt,
          category: post.category,
          authorId: "",
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
        })),
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
      };
    }
  }
}
