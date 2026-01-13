import { Breadcrumb } from "@/components/features/Breadcrumb";
import {
  InfinitePostScroll,
  type InfinitePost,
} from "@/components/features/InfinitePostScroll";
import { Container } from "@/components/layout/Container";
import { auth } from "@/lib/auth";
import {
  getPublishedPostBySlug,
  labelForCategory,
  trackPostView,
} from "@/lib/queries/posts";
import { notFound } from "next/navigation";
import { getReactionSummary } from "@/lib/queries/reactions";
import { isBookmarked } from "@/lib/actions/bookmarks";
import { isFollowing } from "@/lib/actions/follows";
import { headers } from "next/headers";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) notFound();

  // Track view (async, non-blocking)
  void trackPostView(post.id);

  const session = await auth();
  const canComment = Boolean(session?.user?.id);
  const reaction = await getReactionSummary(post.id, session?.user?.id);
  const bookmarked = session?.user?.id ? await isBookmarked(post.id) : false;

  // Check if current user follows the author (don't show follow button for own posts)
  const isOwnPost = session?.user?.id === post.authorId;
  const following =
    !isOwnPost && session?.user?.id ? await isFollowing(post.authorId) : false;

  // Get comment count
  const commentCountResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(sql`comments`)
    .where(sql`post_id = ${post.id}`);
  const commentCount = Number(commentCountResult[0]?.count ?? 0);

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  const url = host
    ? `${proto}://${host}/blog/${post.slug}`
    : `/blog/${post.slug}`;

  // Prepare initial post for infinite scroll
  const initialPost: InfinitePost = {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    category: post.category,
    coverImageUrl: post.coverImageUrl,
    videoUrl: post.videoUrl ?? null,
    authorId: post.authorId,
    authorName: post.authorName,
    authorEmail: post.authorEmail,
    authorImage: post.authorImage,
    authorRole: post.authorRole,
    viewCount: post.viewCount,
    createdAt: post.createdAt.toISOString(),
    reactionCounts: reaction.counts,
    myReaction: reaction.myValue,
    bookmarked,
    following,
    isOwnPost,
    commentCount,
  };

  return (
    <main className="min-h-screen py-6 md:py-14">
      <Container>
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            {
              label: labelForCategory(post.category),
              href: `/${post.category.replace("_", "-")}`,
            },
            { label: post.title },
          ]}
        />
      </Container>

      {/* 👑 INFINITE SCROLL - Instagram Style */}
      <div className="mt-4 md:mt-6">
        <InfinitePostScroll
          initialPost={initialPost}
          currentUrl={url}
          userId={session?.user?.id}
          canComment={canComment}
        />
      </div>
    </main>
  );
}
