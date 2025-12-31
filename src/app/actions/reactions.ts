"use server";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { postReactions } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function setReaction(input: {
  postId: string;
  value: "up" | "down" | "none";
}) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { ok: false as const, error: "Sign in to react." };
  }

  const { postId, value } = input;

  const existing = await db
    .select({ id: postReactions.id, value: postReactions.value })
    .from(postReactions)
    .where(
      and(eq(postReactions.postId, postId), eq(postReactions.userId, userId))
    )
    .limit(1);

  const row = existing[0];

  if (value === "none") {
    if (row) {
      await db.delete(postReactions).where(eq(postReactions.id, row.id));
    }
    return { ok: true as const };
  }

  if (!row) {
    await db.insert(postReactions).values({ postId, userId, value });
    return { ok: true as const };
  }

  if (row.value === value) {
    await db.delete(postReactions).where(eq(postReactions.id, row.id));
    return { ok: true as const };
  }

  await db
    .update(postReactions)
    .set({ value })
    .where(eq(postReactions.id, row.id));
  return { ok: true as const };
}
