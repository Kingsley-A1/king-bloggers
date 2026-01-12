"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "../../db";
import { posts } from "../../db/schema";
import { auth } from "../auth";
import { rateLimit, rateLimitError } from "../rate-limit";
import { sanitizeHtml, sanitizeText } from "../sanitize";

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function requireBlogger() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  // Allow all authenticated users to create/manage posts
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

  // Rate limit check
  const { limited, retryAfterMs } = await rateLimit("createPost");
  if (limited) {
    return { ok: false as const, error: await rateLimitError(retryAfterMs) };
  }

  const parsed = createPostSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid post payload." };
  }

  // Sanitize inputs to prevent XSS attacks
  const sanitizedTitle = sanitizeText(parsed.data.title);
  const sanitizedContent = sanitizeHtml(parsed.data.content);
  const sanitizedExcerpt = parsed.data.excerpt
    ? sanitizeText(parsed.data.excerpt)
    : null;

  const baseSlug = slugify(sanitizedTitle) || "post";
  const candidateSlug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;

  const inserted = await db
    .insert(posts)
    .values({
      authorId,
      title: sanitizedTitle,
      slug: candidateSlug,
      excerpt: sanitizedExcerpt,
      content: sanitizedContent,
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

  // BE-001: Sanitize content on update to prevent XSS bypass
  const sanitizedPatch: Record<string, unknown> = {};
  if (patch.title !== undefined) {
    sanitizedPatch.title = sanitizeText(patch.title);
  }
  if (patch.content !== undefined) {
    sanitizedPatch.content = sanitizeHtml(patch.content);
  }
  if (patch.excerpt !== undefined) {
    sanitizedPatch.excerpt = patch.excerpt ? sanitizeText(patch.excerpt) : null;
  }
  if (patch.category !== undefined) {
    sanitizedPatch.category = patch.category;
  }
  if (patch.coverImageUrl !== undefined) {
    sanitizedPatch.coverImageUrl = patch.coverImageUrl;
  }
  if (patch.videoUrl !== undefined) {
    sanitizedPatch.videoUrl = patch.videoUrl;
  }

  const updated = await db
    .update(posts)
    .set({
      ...sanitizedPatch,
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

// ============================================
// BE-004: Delete Post Feature
// ============================================
const deletePostSchema = z.object({
  postId: z.string().uuid(),
});

export async function deletePost(input: unknown) {
  const authorId = await requireBlogger();

  const parsed = deletePostSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid delete payload." };
  }

  const deleted = await db
    .delete(posts)
    .where(and(eq(posts.id, parsed.data.postId), eq(posts.authorId, authorId)))
    .returning({ id: posts.id });

  if (!deleted[0]) {
    return { ok: false as const, error: "Post not found or not authorized." };
  }

  return { ok: true as const };
}
