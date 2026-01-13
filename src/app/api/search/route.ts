import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { posts, users } from "@/db/schema";
import { and, eq, ilike, or, desc } from "drizzle-orm";

// ============================================
// 👑 KING BLOGGERS - Search API
// ============================================

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ posts: [] });
    }

    const searchPattern = `%${query}%`;

    const results = await db
      .select({
        id: posts.id,
        slug: posts.slug,
        title: posts.title,
        excerpt: posts.excerpt,
        category: posts.category,
        coverImageUrl: posts.coverImageUrl,
        viewCount: posts.viewCount,
        createdAt: posts.createdAt,
        authorName: users.name,
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .where(
        and(
          eq(posts.status, "published"),
          or(
            ilike(posts.title, searchPattern),
            ilike(posts.excerpt, searchPattern),
            ilike(posts.content, searchPattern)
          )
        )
      )
      .orderBy(desc(posts.createdAt))
      .limit(20);

    return NextResponse.json({
      posts: results.map((r) => ({
        id: r.id,
        slug: r.slug,
        title: r.title,
        excerpt: r.excerpt,
        category: r.category,
        coverImageUrl: r.coverImageUrl,
        viewCount: r.viewCount,
        createdAt: r.createdAt.toISOString(),
        authorName: r.authorName,
      })),
    });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
