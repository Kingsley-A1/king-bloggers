import { and, eq, sql } from "drizzle-orm";

import { AnalyticsChart } from "@/components/features/AnalyticsChart";
import { SectionHeader } from "@/components/features/SectionHeader";
import { StatCard } from "@/components/features/StatCard";
import { Container } from "@/components/layout/Container";
import { GlassCard } from "@/components/ui/GlassCard";
import { db } from "@/db";
import { comments, posts } from "@/db/schema";
import { auth } from "@/lib/auth";

function isoDay(d: Date) {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default async function BloggerDashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return (
      <main className="min-h-screen py-10 md:py-14">
        <Container>
          <GlassCard className="p-8 md:p-12">
            <SectionHeader
              title="Dashboard"
              subtitle="You must be logged in."
            />
          </GlassCard>
        </Container>
      </main>
    );
  }

  const [totals] = await db
    .select({
      totalPosts: sql<number>`count(*)`.mapWith(Number),
      publishedPosts:
        sql<number>`sum(case when ${posts.status} = 'published' then 1 else 0 end)`.mapWith(
          Number
        ),
      draftPosts:
        sql<number>`sum(case when ${posts.status} = 'draft' then 1 else 0 end)`.mapWith(
          Number
        ),
    })
    .from(posts)
    .where(eq(posts.authorId, userId));

  const [commentTotals] = await db
    .select({ totalComments: sql<number>`count(*)`.mapWith(Number) })
    .from(comments)
    .innerJoin(posts, eq(comments.postId, posts.id))
    .where(eq(posts.authorId, userId));

  const start = new Date();
  start.setUTCDate(start.getUTCDate() - 9);
  start.setUTCHours(0, 0, 0, 0);

  const activityRows = await db
    .select({
      day: sql<string>`date_trunc('day', ${posts.createdAt})::string`.mapWith(
        String
      ),
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(posts)
    .where(and(eq(posts.authorId, userId), sql`${posts.createdAt} >= ${start}`))
    .groupBy(sql`1`)
    .orderBy(sql`1`);

  const activityMap = new Map<string, number>();
  for (const r of activityRows) {
    const key = isoDay(new Date(r.day));
    activityMap.set(key, r.count);
  }

  const points: number[] = [];
  for (let i = 0; i < 10; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    points.push(activityMap.get(isoDay(d)) ?? 0);
  }

  return (
    <main className="min-h-screen py-10 md:py-14">
      <Container>
        <GlassCard className="p-8 md:p-12">
          <SectionHeader
            title="Dashboard"
            subtitle="Live stats from your posts and their engagement."
          />
        </GlassCard>

        <section className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Total Posts"
            value={String(totals?.totalPosts ?? 0)}
          />
          <StatCard
            label="Published"
            value={String(totals?.publishedPosts ?? 0)}
          />
          <StatCard
            label="Comments"
            value={String(commentTotals?.totalComments ?? 0)}
          />
        </section>

        <div className="mt-8 glass-card p-6 md:p-8">
          <div className="text-xs font-mono text-foreground/50">
            Last 10 days (posts created)
          </div>
          <div className="mt-4">
            <AnalyticsChart points={points} />
          </div>
        </div>
      </Container>
    </main>
  );
}
