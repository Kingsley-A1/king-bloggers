import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { comments, users } from "@/db/schema";

export type CommentRow = {
  id: string;
  body: string;
  createdAt: Date;
  authorEmail: string;
};

export async function listCommentsForPost(postId: string) {
  const rows = await db
    .select({
      id: comments.id,
      body: comments.body,
      createdAt: comments.createdAt,
      authorEmail: users.email,
    })
    .from(comments)
    .innerJoin(users, eq(comments.authorId, users.id))
    .where(eq(comments.postId, postId))
    .orderBy(desc(comments.createdAt))
    .limit(100);

  return rows satisfies CommentRow[];
}
