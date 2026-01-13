import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { posts, users, postReactions } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { isBookmarked } from "@/lib/actions/bookmarks";
import { isFollowing } from "@/lib/actions/follows";
import type { ReactionCounts, ReactionValue } from "@/lib/reactions";

// ============================================
// 👑 KING BLOGGERS - Infinite Posts API
// ============================================
// Returns posts for infinite scrolling on blog pages
// Prioritizes same category, then trending
// ============================================

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? "tech";
  const excludeIds =
    searchParams.get("exclude")?.split(",").filter(Boolean) ?? [];
  const requestUserId = searchParams.get("userId") || null;

  const session = await auth();
  const userId = session?.user?.id ?? requestUserId;

  try {
    // Query posts - prioritize same category, then others
    const query = db
      .select({
        id: posts.id,
        slug: posts.slug,
        title: posts.title,
        excerpt: posts.excerpt,
        content: posts.content,
        category: posts.category,
        coverImageUrl: posts.coverImageUrl,
        videoUrl: posts.videoUrl,
        viewCount: posts.viewCount,
        createdAt: posts.createdAt,
        authorId: users.id,
        authorEmail: users.email,
        authorName: users.name,
        authorImage: users.imageUrl,
        authorRole: users.role,
      })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(
        and(
          eq(posts.status, "published"),
          excludeIds.length > 0
            ? sql`${posts.id} NOT IN (${sql.join(
                excludeIds.map((id) => sql`${id}`),
                sql`, `
              )})`
            : sql`1=1`
        )
      )
      .orderBy(
        // Prioritize same category
        sql`CASE WHEN ${posts.category} = ${category} THEN 0 ELSE 1 END`,
        desc(posts.viewCount),
        desc(posts.createdAt)
      )
      .limit(3);

    const rawPosts = await query;

    // Enrich with reaction data
    const enrichedPosts = await Promise.all(
      rawPosts.map(async (post) => {
        // Get reaction counts
        const reactionRows = await db
          .select({
            value: postReactions.value,
            count: sql<number>`COUNT(*)`.as("count"),
          })
          .from(postReactions)
          .where(eq(postReactions.postId, post.id))
          .groupBy(postReactions.value);

        const reactionCounts: ReactionCounts = {
          fire: 0,
          crown: 0,
          gem: 0,
          insightful: 0,
          lol: 0,
          up: 0,
          down: 0,
        };

        for (const row of reactionRows) {
          if (row.value in reactionCounts) {
            reactionCounts[row.value as keyof ReactionCounts] = Number(
              row.count
            );
          }
        }

        // Get user's reaction
        let myReaction: ReactionValue | null = null;
        if (userId) {
          const userReaction = await db
            .select({ value: postReactions.value })
            .from(postReactions)
            .where(
              and(
                eq(postReactions.postId, post.id),
                eq(postReactions.userId, userId)
              )
            )
            .limit(1);

          if (userReaction[0]) {
            myReaction = userReaction[0].value as ReactionValue;
          }
        }

        // Check bookmark and follow status
        const bookmarked = userId ? await isBookmarked(post.id) : false;
        const following =
          userId && post.authorId !== userId
            ? await isFollowing(post.authorId)
            : false;

        // Get comment count
        const commentCountResult = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(sql`comments`)
          .where(sql`post_id = ${post.id}`);

        const commentCount = Number(commentCountResult[0]?.count ?? 0);

        return {
          id: post.id,
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt,
          content: post.content,
          category: post.category,
          coverImageUrl: post.coverImageUrl,
          videoUrl: post.videoUrl,
          authorId: post.authorId,
          authorName: post.authorName,
          authorEmail: post.authorEmail,
          authorImage: post.authorImage,
          authorRole: post.authorRole as "reader" | "blogger",
          viewCount: post.viewCount,
          createdAt: post.createdAt.toISOString(),
          reactionCounts,
          myReaction,
          bookmarked,
          following,
          isOwnPost: userId === post.authorId,
          commentCount,
        };
      })
    );

    return NextResponse.json({ posts: enrichedPosts });
  } catch (error) {
    console.error("Error fetching infinite posts:", error);
    return NextResponse.json({ posts: [] });
  }
}
