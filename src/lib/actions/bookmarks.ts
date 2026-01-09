"use server";

import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { bookmarks, posts, users } from "@/db/schema";
import { auth } from "@/lib/auth";

// ============================================
// 👑 KING BLOGGERS V2 - Bookmarks System
// ============================================
// Save posts for later reading
// ============================================

type BookmarkResult = 
  | { ok: true; action: "added" | "removed" }
  | { ok: false; error: string };

/**
 * Toggle bookmark status for a post
 */
export async function toggleBookmark(postId: string): Promise<BookmarkResult> {
  const session = await auth();
  const userId = session?.user?.id;
  
  if (!userId) {
    return { ok: false, error: "Sign in to save posts." };
  }

  // Check if already bookmarked
  const [existing] = await db
    .select({ id: bookmarks.id })
    .from(bookmarks)
    .where(
      and(
        eq(bookmarks.userId, userId),
        eq(bookmarks.postId, postId)
      )
    )
    .limit(1);

  if (existing) {
    // Remove bookmark
    await db.delete(bookmarks).where(eq(bookmarks.id, existing.id));
    return { ok: true, action: "removed" };
  }

  // Add bookmark
  await db.insert(bookmarks).values({ userId, postId });
  return { ok: true, action: "added" };
}

/**
 * Check if current user has bookmarked a post
 */
export async function isBookmarked(postId: string): Promise<boolean> {
  const session = await auth();
  const userId = session?.user?.id;
  
  if (!userId) return false;

  const [existing] = await db
    .select({ id: bookmarks.id })
    .from(bookmarks)
    .where(
      and(
        eq(bookmarks.userId, userId),
        eq(bookmarks.postId, postId)
      )
    )
    .limit(1);

  return !!existing;
}

/**
 * Get all bookmarked posts for current user
 */
export async function getMyBookmarks() {
  const session = await auth();
  const userId = session?.user?.id;
  
  if (!userId) return [];

  const rows = await db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      excerpt: posts.excerpt,
      category: posts.category,
      coverImageUrl: posts.coverImageUrl,
      createdAt: posts.createdAt,
      authorName: users.name,
      authorEmail: users.email,
      bookmarkedAt: bookmarks.createdAt,
    })
    .from(bookmarks)
    .innerJoin(posts, eq(bookmarks.postId, posts.id))
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(eq(bookmarks.userId, userId))
    .orderBy(desc(bookmarks.createdAt))
    .limit(50);

  return rows;
}

/**
 * Get count of bookmarks for current user
 */
export async function getBookmarkCount(): Promise<number> {
  const session = await auth();
  const userId = session?.user?.id;
  
  if (!userId) return 0;

  const [result] = await db
    .select({ count: db.$count(bookmarks) })
    .from(bookmarks)
    .where(eq(bookmarks.userId, userId));

  return result?.count ?? 0;
}
