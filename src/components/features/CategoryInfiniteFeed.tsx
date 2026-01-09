"use client";

import { useCallback } from "react";
import { InfiniteFeed, type InfinitePostItem } from "@/components/features/InfiniteFeed";
import { loadMoreCategoryPosts } from "@/app/actions/feed";

// ============================================
// 👑 KING BLOGGERS V2 - Category Infinite Feed
// ============================================
// Wrapper for InfiniteFeed with bound category
// ============================================

type CategoryFeedCategory = "tech" | "politics" | "religion" | "economics" | "art_culture" | "entertainment";

export function CategoryInfiniteFeed({
  category,
  initialPosts,
  initialCursor,
  initialHasMore,
}: {
  category: CategoryFeedCategory;
  initialPosts: InfinitePostItem[];
  initialCursor?: string;
  initialHasMore: boolean;
}) {
  // Bind the category to the load more action
  const loadMore = useCallback(
    (cursor: string) => loadMoreCategoryPosts(category, cursor),
    [category]
  );

  return (
    <InfiniteFeed
      initialPosts={initialPosts}
      initialCursor={initialCursor}
      initialHasMore={initialHasMore}
      loadMoreAction={loadMore}
    />
  );
}
