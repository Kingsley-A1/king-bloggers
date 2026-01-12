"use server";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { userInterests, type PostCategory } from "@/db/schema";
import { auth } from "@/lib/auth";

// ============================================
// 👑 KING BLOGGERS - Onboarding Actions
// ============================================
// Save user interests after registration
// ============================================

const VALID_CATEGORIES: PostCategory[] = [
  "tech",
  "art_culture",
  "entertainment",
  "sport",
  "health",
  "politics",
  "economics",
  "religion",
];

const INITIAL_INTEREST_SCORE = 500; // Start with medium interest

/**
 * Save user's selected interests from onboarding
 */
export async function saveUserInterests(
  categories: string[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Not authenticated" };
    }

    const userId = session.user.id;

    // Validate categories
    const validCategories = categories.filter((c): c is PostCategory =>
      VALID_CATEGORIES.includes(c as PostCategory)
    );

    if (validCategories.length === 0) {
      return { ok: false, error: "No valid categories selected" };
    }

    // Delete existing interests (fresh start from onboarding)
    await db.delete(userInterests).where(eq(userInterests.userId, userId));

    // Insert new interests
    await db.insert(userInterests).values(
      validCategories.map((category) => ({
        userId,
        category,
        interestScore: INITIAL_INTEREST_SCORE,
      }))
    );

    return { ok: true };
  } catch (error) {
    console.error("Failed to save user interests:", error);
    return { ok: false, error: "Failed to save interests" };
  }
}

/**
 * Check if user has completed onboarding
 */
export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    const session = await auth();
    if (!session?.user?.id) return true; // Non-authenticated users skip

    const interests = await db
      .select({ id: userInterests.id })
      .from(userInterests)
      .where(eq(userInterests.userId, session.user.id))
      .limit(1);

    return interests.length > 0;
  } catch {
    return true; // On error, skip onboarding
  }
}
