import type { Metadata } from "next";
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

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://king-bloggers.vercel.app";

const VIDEO_EXT_RE = /\.(mp4|webm|mov|ogg)(\?.*)?$/i;

function decodeHtmlEntitiesLoose(input: string) {
  let out = input;
  for (let i = 0; i < 3; i++) {
    const next = out.replace(/&amp;/g, "&");
    if (next === out) break;
    out = next;
  }

  out = out
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    )
    .replace(/&#([0-9]+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
    .replace(/&nbsp;/g, " ");

  return out;
}

function sanitizeMediaSrc(raw: string): string | null {
  const decoded = decodeHtmlEntitiesLoose(raw);
  const compact = decoded.replace(/\s+/g, "").trim();
  if (!compact) return null;
  if (compact.startsWith("//")) return `https:${compact}`;
  if (compact.startsWith("http://") || compact.startsWith("https://"))
    return compact;
  if (compact.startsWith("/")) return compact;
  return null;
}

function extractFirstImageSrcFromHtml(html: string): string | null {
  // minimal, server-safe extraction
  const match = html.match(/<img[^>]+src\s*=\s*['"]([^'"]+)['"][^>]*>/i);
  if (!match?.[1]) return null;
  return sanitizeMediaSrc(match[1]);
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) {
    return {
      title: "Post not found — King Bloggers",
      robots: { index: false, follow: false },
    };
  }

  const title = `${post.title} — King Bloggers`;
  const description =
    post.excerpt ?? "A sovereign feed for Tech, Art, Culture, and Power.";

  const cover = post.coverImageUrl
    ? sanitizeMediaSrc(post.coverImageUrl)
    : null;
  const coverIsVideo = cover ? VIDEO_EXT_RE.test(cover) : false;
  const firstContentImage = extractFirstImageSrcFromHtml(post.content);

  // Determine the best OG image source
  const rawOgImage =
    (cover && !coverIsVideo ? cover : null) ?? firstContentImage ?? null;

  // Ensure the OG image is an absolute URL
  function toAbsoluteUrl(src: string | null): string {
    if (!src) return `${APP_URL}/icons/og.png`;
    if (src.startsWith("http://") || src.startsWith("https://")) return src;
    if (src.startsWith("/")) return `${APP_URL}${src}`;
    return `${APP_URL}/${src}`;
  }

  const ogImage = toAbsoluteUrl(rawOgImage);

  return {
    title,
    description,
    openGraph: {
      type: "article",
      url: `${APP_URL}/blog/${post.slug}`,
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

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
