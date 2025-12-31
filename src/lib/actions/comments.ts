"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "../../db";
import { comments, posts } from "../../db/schema";
import { auth } from "../auth";
import { rateLimit, rateLimitError } from "../rate-limit";
import { sanitizeText } from "../sanitize";

const addCommentFormSchema = z.object({
  postId: z.string().uuid(),
  body: z.string().trim().min(1).max(4000),
  redirectTo: z.string().optional(),
});

export async function addComment(formData: FormData) {
  const raw = {
    postId: String(formData.get("postId") ?? ""),
    body: String(formData.get("body") ?? ""),
    redirectTo: String(formData.get("redirectTo") ?? ""),
  };

  const parsed = addCommentFormSchema.safeParse(raw);
  if (!parsed.success) return;

  const session = await auth();
  if (!session?.user?.id) return;

  // Rate limit check
  const { limited } = await rateLimit("createComment", session.user.id);
  if (limited) return;

  // Sanitize comment body to prevent XSS
  const sanitizedBody = sanitizeText(parsed.data.body);

  await db.insert(comments).values({
    postId: parsed.data.postId,
    authorId: session.user.id,
    body: sanitizedBody,
  });

  if (parsed.data.redirectTo) revalidatePath(parsed.data.redirectTo);
}

export async function listCommentsForPost(postSlug: string) {
  const postRows = await db
    .select({ id: posts.id })
    .from(posts)
    .where(and(eq(posts.slug, postSlug), eq(posts.status, "published")))
    .limit(1);

  const postId = postRows[0]?.id;
  if (!postId) return [];

  const rows = await db
    .select({
      id: comments.id,
      body: comments.body,
      createdAt: comments.createdAt,
      authorId: comments.authorId,
    })
    .from(comments)
    .where(eq(comments.postId, postId))
    .orderBy(desc(comments.createdAt))
    .limit(100);

  return rows;
}
