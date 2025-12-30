"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";

const updateMyProfileSchema = z.object({
  name: z.string().trim().min(2).max(80).nullable().optional(),
  role: z.enum(["reader", "blogger"]).optional(),
  state: z.string().trim().min(2).max(80).nullable().optional(),
  lga: z.string().trim().min(2).max(120).nullable().optional(),
  imageUrl: z.string().trim().url().nullable().optional(),
});

export type UpdateMyProfileResult =
  | { ok: true; roleChanged: boolean }
  | { ok: false; error: string };

export async function updateMyProfile(input: unknown): Promise<UpdateMyProfileResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Unauthorized." };
  }

  const parsed = updateMyProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid profile payload." };
  }

  const [current] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!current) {
    return { ok: false, error: "Account not found. Please register." };
  }

  const next = parsed.data;

  await db
    .update(users)
    .set({
      name: next.name ?? null,
      role: next.role ?? current.role,
      state: next.state ?? null,
      lga: next.lga ?? null,
      imageUrl: next.imageUrl ?? null,
    })
    .where(eq(users.id, session.user.id));

  return { ok: true, roleChanged: Boolean(next.role && next.role !== current.role) };
}
