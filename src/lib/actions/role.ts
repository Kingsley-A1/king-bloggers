"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";

// ============================================
// 👑 KING BLOGGERS - Role Upgrade Action
// ============================================
// Allow readers to upgrade to blogger status
// ============================================

export async function upgradeToBlooger() {
  const session = await auth();

  if (!session?.user?.id) {
    return { ok: false, error: "You must be logged in" };
  }

  try {
    // Update user role to blogger
    await db
      .update(users)
      .set({ role: "blogger" })
      .where(eq(users.id, session.user.id));

    // Revalidate paths that show user role
    revalidatePath("/blogger/dashboard");
    revalidatePath("/profile");
    revalidatePath("/");

    return { ok: true };
  } catch (error) {
    console.error("Failed to upgrade role:", error);
    return { ok: false, error: "Failed to upgrade. Please try again." };
  }
}

/**
 * Check if current user is a blogger
 */
export async function checkUserRole() {
  const session = await auth();

  if (!session?.user?.id) {
    return { ok: false, role: null };
  }

  try {
    const [user] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    return { ok: true, role: user?.role ?? "reader" };
  } catch {
    return { ok: false, role: "reader" };
  }
}
