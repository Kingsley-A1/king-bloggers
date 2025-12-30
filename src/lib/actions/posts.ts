"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "../../db";
import { posts } from "../../db/schema";
import { auth } from "../auth";

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function requireBlogger() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "blogger") {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

const createPostSchema = z.object({
  title: z.string().trim().min(3),
  content: z.string().trim().min(1),
  category: z.enum([
    "tech",
    "art_culture",
    "entertainment",
    "politics",
    "economics",
    "religion",
  ]),
  excerpt: z.string().trim().max(500).optional(),
  coverImageUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
});

export async function createPost(input: unknown) {
  const authorId = await requireBlogger();

  const parsed = createPostSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid post payload." };
  }

  const baseSlug = slugify(parsed.data.title) || "post";
  const candidateSlug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;

  const inserted = await db
    .insert(posts)
    .values({
      authorId,
      title: parsed.data.title,
      slug: candidateSlug,
      excerpt: parsed.data.excerpt ?? null,
      content: parsed.data.content,
      category: parsed.data.category,
      coverImageUrl: parsed.data.coverImageUrl ?? null,
      videoUrl: parsed.data.videoUrl ?? null,
      status: "draft",
    })
    .returning({ id: posts.id, slug: posts.slug });

  const row = inserted[0];
  if (!row) return { ok: false as const, error: "Failed to create post." };

  return { ok: true as const, postId: row.id, slug: row.slug };
}

const updatePostSchema = z.object({
  postId: z.string().uuid(),
  title: z.string().trim().min(3).optional(),
  excerpt: z.string().trim().max(500).nullable().optional(),
  content: z.string().trim().min(1).optional(),
  category: z
    .enum([
      "tech",
      "art_culture",
      "entertainment",
      "politics",
      "economics",
      "religion",
    ])
    .optional(),
  coverImageUrl: z.string().url().nullable().optional(),
  videoUrl: z.string().url().nullable().optional(),
});

export async function updatePost(input: unknown) {
  const authorId = await requireBlogger();

  const parsed = updatePostSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid update payload." };
  }

  const { postId, ...patch } = parsed.data;

  const updated = await db
    .update(posts)
    .set({
      ...patch,
      updatedAt: new Date(),
    })
    .where(and(eq(posts.id, postId), eq(posts.authorId, authorId)))
    .returning({ id: posts.id });

  if (!updated[0]) {
    return { ok: false as const, error: "Post not found." };
  }

  return { ok: true as const };
}

const publishSchema = z.object({
  postId: z.string().uuid(),
});

export async function publishPost(input: unknown) {
  const authorId = await requireBlogger();

  const parsed = publishSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid publish payload." };
  }

  const updated = await db
    .update(posts)
    .set({ status: "published", updatedAt: new Date() })
    .where(and(eq(posts.id, parsed.data.postId), eq(posts.authorId, authorId)))
    .returning({ id: posts.id, slug: posts.slug });

  const row = updated[0];
  if (!row) return { ok: false as const, error: "Post not found." };

  return { ok: true as const, slug: row.slug };
}
