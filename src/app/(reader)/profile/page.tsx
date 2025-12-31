import { and, desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { auth } from "../../../lib/auth";
import { db } from "../../../db";
import { comments, users } from "../../../db/schema";
import { ProfileClient } from "./ProfileClient";

export default async function ReaderProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/register?callbackUrl=%2Fprofile");
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
    redirect("/register?callbackUrl=%2Fprofile");
  }

  const history = await db
    .select({
      id: comments.id,
      body: comments.body,
      createdAt: comments.createdAt,
      postId: comments.postId,
    })
    .from(comments)
    .where(and(eq(comments.authorId, session.user.id)))
    .orderBy(desc(comments.createdAt))
    .limit(50);

  return (
    <main className="min-h-screen px-6 py-16">
      <section className="max-w-4xl mx-auto space-y-8">
        <ProfileClient
          initial={{
            email: me.email,
            role: me.role,
            name: me.name ?? null,
            state: me.state ?? null,
            lga: me.lga ?? null,
            imageUrl: me.imageUrl ?? null,
          }}
        />

        <div className="glass-card p-10">
          <h2 className="text-2xl font-black">Comment History</h2>
          <p className="mt-2 opacity-60">Your latest 50 comments.</p>

          <div className="mt-6 space-y-3">
            {history.length === 0 ? (
              <div className="rounded-2xl border border-foreground/10 bg-foreground/5 p-4 opacity-60">
                No comments yet.
              </div>
            ) : (
              history.map((c) => (
                <div
                  key={c.id}
                  className="rounded-2xl border border-foreground/10 bg-foreground/5 p-4"
                >
                  <div className="text-xs font-mono opacity-50">
                    {new Date(c.createdAt).toLocaleString()}
                  </div>
                  <div className="mt-2 whitespace-pre-wrap leading-relaxed">
                    {c.body}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
