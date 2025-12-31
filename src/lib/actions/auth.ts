"use server";

import { z } from "zod";
import { and, desc, eq, sql } from "drizzle-orm";
import { hash } from "bcryptjs";

import { db } from "@/db";
import { comments, users } from "@/db/schema";
import { auth, signIn } from "@/lib/auth";
import { rateLimit, rateLimitError } from "@/lib/rate-limit";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8),
  role: z.enum(["reader", "blogger"]).default("reader"),
  state: z.string().trim().min(2).optional(),
  lga: z.string().trim().min(2).optional(),
});

export async function registerUser(input: unknown) {
  // Rate limit check - prevent brute force registration attempts
  const { limited, retryAfterMs } = await rateLimit("register");
  if (limited) {
    return { ok: false as const, error: rateLimitError(retryAfterMs) };
  }

  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid registration payload." };
  }

  const { name, email, password, role, state, lga } = parsed.data;
  const passwordHash = await hash(password, 12);

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(sql`lower(${users.email})`, email))
    .limit(1);

  if (existing[0]) {
    return { ok: false as const, error: "Email already registered." };
  }

  const inserted = await db
    .insert(users)
    .values({
      email,
      name: name ?? null,
      passwordHash,
      role,
      state: state ?? null,
      lga: lga ?? null,
    })
    .returning({ id: users.id });

  const userId = inserted[0]?.id;
  if (!userId) {
    return { ok: false as const, error: "Failed to create account." };
  }

  return { ok: true as const, userId };
}

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8),
  redirectTo: z.string().optional(),
});

export async function loginUser(input: unknown) {
  // Rate limit check - prevent brute force login attempts
  const { limited, retryAfterMs } = await rateLimit("login");
  if (limited) {
    return { ok: false as const, error: rateLimitError(retryAfterMs) };
  }

  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid login payload." };
  }

  const { email, password, redirectTo } = parsed.data;

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: redirectTo ?? "/",
    });
    return { ok: true as const };
  } catch (error) {
    void error;
    return { ok: false as const, error: "Invalid email or password." };
  }
}

const updateProfileSchema = z.object({
  state: z.string().trim().min(2).nullable().optional(),
  lga: z.string().trim().min(2).nullable().optional(),
});

export async function updateReaderProfile(input: unknown) {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false as const, error: "Unauthorized." };
  }

  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid profile payload." };
  }

  await db
    .update(users)
    .set({
      state: parsed.data.state ?? null,
      lga: parsed.data.lga ?? null,
    })
    .where(and(eq(users.id, session.user.id), eq(users.role, "reader")));

  return { ok: true as const };
}

export async function getMyCommentHistory() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const rows = await db
    .select({
      id: comments.id,
      body: comments.body,
      createdAt: comments.createdAt,
      postId: comments.postId,
    })
    .from(comments)
    .where(eq(comments.authorId, session.user.id))
    .orderBy(desc(comments.createdAt))
    .limit(50);

  return rows;
}
