import { and, eq, sql, desc } from "drizzle-orm";
import Link from "next/link";
import {
  TrendingUp,
  Eye,
  Heart,
  MessageCircle,
  FileText,
  Send,
  PenTool,
  Users,
  Crown,
} from "lucide-react";

import { AnalyticsChart } from "@/components/features/AnalyticsChart";
import { SectionHeader } from "@/components/features/SectionHeader";
import { StatCard } from "@/components/features/StatCard";
import { Container } from "@/components/layout/Container";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { db } from "@/db";
import { comments, posts, follows, users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { UpgradeButton } from "./UpgradeButton";

function isoDay(d: Date) {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
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

  // Get user info including role
  const [userInfo] = await db
    .select({ name: users.name, email: users.email, role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const userName =
    userInfo?.name || userInfo?.email?.split("@")[0] || "Blogger";
  const isReader = userInfo?.role === "reader";

  // 👑 Show upgrade prompt for readers
  if (isReader) {
    return (
      <main className="min-h-screen py-10 md:py-14">
        <Container>
          <GlassCard className="p-8 md:p-12 text-center">
            <div className="max-w-md mx-auto">
              {/* Crown Icon */}
              <div className="w-20 h-20 mx-auto rounded-full bg-king-orange/20 flex items-center justify-center mb-6">
                <Crown className="h-10 w-10 text-king-orange" />
              </div>

              <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-3">
                Become a Blogger
              </h1>

              <p className="text-foreground/60 mb-6 leading-relaxed">
                Hey {userName}! 👋 You&apos;re currently a{" "}
                <strong>Reader</strong>. Upgrade to <strong>Blogger</strong>{" "}
                status to unlock the full studio experience — publish posts,
                track analytics, and build your audience.
              </p>

              {/* Benefits */}
              <div className="grid gap-3 text-left mb-8">
                {[
                  "📝 Publish unlimited blog posts",
                  "📊 Access analytics dashboard",
                  "👥 Build your follower base",
                  "✓ Get verified blogger badge",
                ].map((benefit) => (
                  <div
                    key={benefit}
                    className="flex items-center gap-3 text-sm text-foreground/80 bg-foreground/5 rounded-lg px-4 py-3"
                  >
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>

              {/* Upgrade Button */}
              <UpgradeButton />

              <p className="mt-4 text-xs text-foreground/40">
                Free forever. No credit card required.
              </p>
            </div>
          </GlassCard>
        </Container>
      </main>
    );
  }

  // Aggregate stats
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
      totalViews: sql<number>`sum(${posts.viewCount})`.mapWith(Number),
      totalReactions: sql<number>`sum(${posts.reactionCount})`.mapWith(Number),
    })
    .from(posts)
    .where(eq(posts.authorId, userId));

  const [commentTotals] = await db
    .select({ totalComments: sql<number>`count(*)`.mapWith(Number) })
    .from(comments)
    .innerJoin(posts, eq(comments.postId, posts.id))
    .where(eq(posts.authorId, userId));

  // Follower count
  const [followerCount] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(follows)
    .where(eq(follows.followingId, userId));

  // Top performing post
  const topPost = await db
    .select({
      title: posts.title,
      slug: posts.slug,
      viewCount: posts.viewCount,
      reactionCount: posts.reactionCount,
    })
    .from(posts)
    .where(and(eq(posts.authorId, userId), eq(posts.status, "published")))
    .orderBy(desc(posts.viewCount))
    .limit(1);

  const start = new Date();
  start.setUTCDate(start.getUTCDate() - 9);
  start.setUTCHours(0, 0, 0, 0);
  const startIso = start.toISOString();

  const activityRows = await db
    .select({
      day: sql<string>`date_trunc('day', ${posts.createdAt})::text`.mapWith(
        String
      ),
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(posts)
    .where(
      and(eq(posts.authorId, userId), sql`${posts.createdAt} >= ${startIso}`)
    )
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <SectionHeader
              title={`${userName}'s Dashboard`}
              subtitle="Live stats from your posts and their engagement."
            />
            <GlassButton
              as="a"
              href="/bloggers/editor?new=true"
              variant="primary"
              className="shrink-0 gap-2"
            >
              <PenTool className="h-4 w-4" />
              New Blog
            </GlassButton>
          </div>
        </GlassCard>

        {/* Primary Stats Grid */}
        <section className="mt-8 grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Link href="/blogger/my-blogs">
            <StatCard
              label="Total Posts"
              value={String(totals?.totalPosts ?? 0)}
              icon={<FileText className="h-5 w-5 text-king-orange" />}
            />
          </Link>
          <Link href="/blogger/my-blogs?status=published">
            <StatCard
              label="Published"
              value={String(totals?.publishedPosts ?? 0)}
              icon={<Send className="h-5 w-5 text-emerald-500" />}
            />
          </Link>
          <StatCard
            label="Total Views"
            value={formatCount(totals?.totalViews ?? 0)}
            icon={<Eye className="h-5 w-5 text-blue-500" />}
          />
          <StatCard
            label="Total Reactions"
            value={formatCount(totals?.totalReactions ?? 0)}
            icon={<Heart className="h-5 w-5 text-pink-500" />}
          />
        </section>

        {/* Secondary Stats */}
        <section className="mt-4 grid gap-4 grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Comments Received"
            value={String(commentTotals?.totalComments ?? 0)}
            icon={<MessageCircle className="h-5 w-5 text-purple-500" />}
          />
          <StatCard
            label="Followers"
            value={String(followerCount?.count ?? 0)}
            icon={<Users className="h-5 w-5 text-cyan-500" />}
          />
          <StatCard
            label="Drafts"
            value={String(totals?.draftPosts ?? 0)}
            icon={<PenTool className="h-5 w-5 text-yellow-500" />}
          />
        </section>

        {/* Top Post Highlight */}
        {topPost[0] && (
          <GlassCard className="mt-8 p-6 md:p-8">
            <div className="flex items-center gap-2 text-xs font-mono text-king-orange mb-3">
              <TrendingUp className="h-4 w-4" />
              TOP PERFORMING POST
            </div>
            <Link
              href={`/blog/${topPost[0].slug}`}
              className="block hover:text-king-orange transition-colors"
            >
              <h3 className="text-xl font-bold line-clamp-1">
                {topPost[0].title}
              </h3>
            </Link>
            <div className="flex items-center gap-4 mt-3 text-sm text-foreground/60">
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {formatCount(topPost[0].viewCount)} views
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                {topPost[0].reactionCount} reactions
              </span>
            </div>
          </GlassCard>
        )}

        {/* Activity Chart */}
        <div className="mt-8 glass-card p-6 md:p-8">
          <div className="text-xs font-mono text-foreground/50">
            Last 10 days (posts created)
          </div>
          <div className="mt-4">
            <AnalyticsChart points={points} />
          </div>
        </div>

        {/* Quick Actions */}
        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <Link href="/blogger/my-blogs">
            <GlassCard className="p-6 hover:border-king-orange/50 transition-all group cursor-pointer">
              <FileText className="h-6 w-6 text-foreground/60 group-hover:text-king-orange transition-colors mb-3" />
              <h4 className="font-bold">Manage Blogs</h4>
              <p className="text-sm text-foreground/60 mt-1">
                View, edit and delete your posts
              </p>
            </GlassCard>
          </Link>
          <Link href="/bloggers/editor?new=true">
            <GlassCard className="p-6 hover:border-king-orange/50 transition-all group cursor-pointer">
              <PenTool className="h-6 w-6 text-foreground/60 group-hover:text-king-orange transition-colors mb-3" />
              <h4 className="font-bold">Write New Post</h4>
              <p className="text-sm text-foreground/60 mt-1">
                Share your thoughts with the world
              </p>
            </GlassCard>
          </Link>
          <Link href="/profile">
            <GlassCard className="p-6 hover:border-king-orange/50 transition-all group cursor-pointer">
              <Users className="h-6 w-6 text-foreground/60 group-hover:text-king-orange transition-colors mb-3" />
              <h4 className="font-bold">Your Profile</h4>
              <p className="text-sm text-foreground/60 mt-1">
                Update your public profile
              </p>
            </GlassCard>
          </Link>
        </section>
      </Container>
    </main>
  );
}
