"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "../../db";
import { comments, posts, notifications } from "../../db/schema";
import { auth } from "../auth";
import { sanitizeText } from "../sanitize";

// ============================================
// 👑 KING BLOGGERS - Comments Actions
// ============================================
// SEC-004: ✅ Comment body sanitized before storage
// Notifications: ✅ Post authors notified on comments
// ============================================

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

  // SEC-004: Sanitize comment body to prevent XSS
  const sanitizedBody = sanitizeText(parsed.data.body);

  await db.insert(comments).values({
    postId: parsed.data.postId,
    authorId: session.user.id,
    body: sanitizedBody,
  });

  // Create notification for post author
  await createCommentNotification(
    parsed.data.postId,
    session.user.id,
    sanitizedBody
  );

  if (parsed.data.redirectTo) revalidatePath(parsed.data.redirectTo);
}

/**
 * Create a notification for the post author when someone comments
 */
async function createCommentNotification(
  postId: string,
  actorId: string,
  commentBody: string
): Promise<void> {
  try {
    // Get post author
    const [post] = await db
      .select({ authorId: posts.authorId, title: posts.title })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!post || post.authorId === actorId) {
      // Don't notify if commenting on own post
      return;
    }

    const preview = commentBody.length > 50 
      ? commentBody.slice(0, 50) + "..." 
      : commentBody;

    await db.insert(notifications).values({
      userId: post.authorId,
      type: "comment",
      actorId,
      postId,
      message: `commented: "${preview}"`,
    });
  } catch {
    // Don't fail the comment if notification fails
  }
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
