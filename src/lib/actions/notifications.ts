"use server";

import { and, count, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  notifications,
  users,
  posts,
  type NotificationType,
} from "@/db/schema";
import { auth } from "@/lib/auth";

// ============================================
// 👑 KING BLOGGERS V2 - Notifications System
// ============================================
// Real-time alerts to pull users back
// ============================================

export interface NotificationWithDetails {
  id: string;
  type: NotificationType;
  message: string | null;
  read: boolean;
  createdAt: Date;
  actor: {
    id: string;
    name: string | null;
    email: string | null;
    imageUrl: string | null;
  } | null;
  post: {
    id: string;
    title: string | null;
    slug: string | null;
  } | null;
}

/**
 * Get notifications for current user
 */
export async function getMyNotifications(
  limit = 20
): Promise<NotificationWithDetails[]> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return [];

  const rows = await db
    .select({
      id: notifications.id,
      type: notifications.type,
      message: notifications.message,
      read: notifications.read,
      createdAt: notifications.createdAt,
      actorId: users.id,
      actorName: users.name,
      actorEmail: users.email,
      actorImage: users.imageUrl,
      postId: posts.id,
      postTitle: posts.title,
      postSlug: posts.slug,
    })
    .from(notifications)
    .leftJoin(users, eq(notifications.actorId, users.id))
    .leftJoin(posts, eq(notifications.postId, posts.id))
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    message: row.message,
    read: row.read,
    createdAt: row.createdAt,
    actor: row.actorId
      ? {
          id: row.actorId,
          name: row.actorName,
          email: row.actorEmail,
          imageUrl: row.actorImage,
        }
      : null,
    post: row.postId
      ? {
          id: row.postId,
          title: row.postTitle,
          slug: row.postSlug,
        }
      : null,
  }));
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(): Promise<number> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return 0;

  try {
    const [result] = await db
      .select({ count: count() })
      .from(notifications)
      .where(
        and(eq(notifications.userId, userId), eq(notifications.read, false))
      );

    return result?.count ?? 0;
  } catch {
    // If DB is temporarily down, don't break the whole page.
    return 0;
  }
}

/**
 * Mark notifications as read
 */
export async function markAsRead(
  notificationIds: string[]
): Promise<{ ok: boolean }> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return { ok: false };

  if (notificationIds.length === 0) return { ok: true };

  await db
    .update(notifications)
    .set({ read: true })
    .where(
      and(
        eq(notifications.userId, userId),
        sql`${notifications.id} = ANY(${notificationIds})`
      )
    );

  return { ok: true };
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<{ ok: boolean }> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return { ok: false };

  await db
    .update(notifications)
    .set({ read: true })
    .where(eq(notifications.userId, userId));

  return { ok: true };
}

/**
 * Delete a notification
 */
export async function deleteNotification(
  notificationId: string
): Promise<{ ok: boolean }> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return { ok: false };

  await db
    .delete(notifications)
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      )
    );

  return { ok: true };
}

/**
 * Create a notification (internal use)
 */
export async function createNotification(input: {
  userId: string;
  type: NotificationType;
  actorId?: string;
  postId?: string;
  message?: string;
}): Promise<{ ok: boolean }> {
  try {
    // Don't notify yourself
    if (input.actorId && input.userId === input.actorId) {
      return { ok: true };
    }

    await db.insert(notifications).values({
      userId: input.userId,
      type: input.type,
      actorId: input.actorId ?? null,
      postId: input.postId ?? null,
      message: input.message ?? null,
    });

    return { ok: true };
  } catch {
    return { ok: false };
  }
}
