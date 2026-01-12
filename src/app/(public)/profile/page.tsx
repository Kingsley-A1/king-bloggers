import { count, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { comments, users, posts } from "@/db/schema";
import { ProfileClient } from "./ProfileClient";

// ============================================
// 👑 KING BLOGGERS - Universal Profile Page
// ============================================
// Mobile-first profile for all users
// ============================================

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=%2Fprofile");
  }

  const [me] = await db
    .select({
      email: users.email,
      role: users.role,
      name: users.name,
      state: users.state,
      lga: users.lga,
      imageUrl: users.imageUrl,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!me) {
    redirect("/login?callbackUrl=%2Fprofile");
  }

  // Get comment count
  const [commentResult] = await db
    .select({ count: count() })
    .from(comments)
    .where(eq(comments.authorId, session.user.id));

  // Get post count
  const [postResult] = await db
    .select({ count: count() })
    .from(posts)
    .where(eq(posts.authorId, session.user.id));

  return (
    <ProfileClient
      initial={{
        email: me.email,
        role: me.role,
        name: me.name ?? null,
        state: me.state ?? null,
        lga: me.lga ?? null,
        imageUrl: me.imageUrl ?? null,
      }}
      commentCount={commentResult?.count ?? 0}
      postCount={postResult?.count ?? 0}
    />
  );
}
