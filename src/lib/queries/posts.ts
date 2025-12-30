import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { posts, users } from "@/db/schema";

export type PostCategory = typeof posts.$inferSelect.category;

export type PublishedPostListItem = {
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  coverImageUrl: string | null;
  videoUrl?: string | null;
  category: PostCategory;
  createdAt: Date;
  authorEmail: string;
};

export async function listPublishedPosts(input?: { category?: PostCategory; limit?: number }) {
  const limit = input?.limit ?? 30;

  const where = input?.category
    ? and(eq(posts.status, "published"), eq(posts.category, input.category))
    : eq(posts.status, "published");

  const rows = await db
    .select({
      slug: posts.slug,
      title: posts.title,
      excerpt: posts.excerpt,
      content: posts.content,
      coverImageUrl: posts.coverImageUrl,
      videoUrl: posts.videoUrl,
      category: posts.category,
      createdAt: posts.createdAt,
      authorEmail: users.email,
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(where)
    .orderBy(desc(posts.createdAt))
    .limit(limit);

  return rows satisfies PublishedPostListItem[];
}

export async function getPublishedPostBySlug(slug: string) {
  const rows = await db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      excerpt: posts.excerpt,
      content: posts.content,
      coverImageUrl: posts.coverImageUrl,
      videoUrl: posts.videoUrl,
      category: posts.category,
      createdAt: posts.createdAt,
      authorEmail: users.email,
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(and(eq(posts.slug, slug), eq(posts.status, "published")))
    .limit(1);

  return rows[0] ?? null;
}

export function readTimeFromContent(content: string) {
  const words = content
    .replace(/<[^>]*>/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

export function labelForCategory(category: PostCategory) {
  switch (category) {
    case "tech":
      return "Tech";
    case "art_culture":
      return "Art & Culture";
    case "entertainment":
      return "Entertainment";
    case "politics":
      return "Politics";
    case "economics":
      return "Economics";
    case "religion":
      return "Religion";
    default:
      return category;
  }
}

export function badgeVariantForCategory(category: PostCategory) {
  switch (category) {
    case "tech":
      return "tech" as const;
    case "politics":
      return "politics" as const;
    case "art_culture":
      return "art" as const;
    default:
      return "tech" as const;
  }
}
