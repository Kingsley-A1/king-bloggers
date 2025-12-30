import { Breadcrumb } from "@/components/features/Breadcrumb";
import { CommentSection } from "@/components/features/CommentSection";
import { SectionHeader } from "@/components/features/SectionHeader";
import { Container } from "@/components/layout/Container";
import { GlassCard } from "@/components/ui/GlassCard";
import { auth } from "@/lib/auth";
import { listCommentsForPost } from "@/lib/queries/comments";
import { getPublishedPostBySlug, badgeVariantForCategory, labelForCategory, readTimeFromContent } from "@/lib/queries/posts";
import { Badge } from "@/components/ui/Badge";
import { notFound } from "next/navigation";
import { getReactionSummary } from "@/lib/queries/reactions";
import { ReactionBar } from "@/components/features/ReactionBar";
import { ShareBar } from "@/components/features/ShareBar";
import { BlogVideoPlayer } from "@/components/features/BlogVideoPlayer";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) notFound();

  const session = await auth();
  const canComment = Boolean(session?.user?.id);
  const comments = await listCommentsForPost(post.id);
  const reaction = await getReactionSummary(post.id, session?.user?.id);

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  const url = host ? `${proto}://${host}/blog/${post.slug}` : `/blog/${post.slug}`;

  return (
    <main className="min-h-screen py-14">
      <Container>
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Blog", href: "/" },
            { label: post.title },
          ]}
        />

        <GlassCard className="mt-6 p-8 md:p-12">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Badge variant={badgeVariantForCategory(post.category)}>{labelForCategory(post.category)}</Badge>
              <div className="text-xs font-mono text-foreground/50">{readTimeFromContent(post.content)}</div>
            </div>

            <SectionHeader title={post.title} subtitle={post.excerpt ?? undefined} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <ReactionBar
                postId={post.id}
                initialUp={reaction.up}
                initialDown={reaction.down}
                initialMyValue={reaction.myValue}
              />
              <ShareBar title={post.title} url={url} />
            </div>
          </div>

          {post.videoUrl ? (
            <div className="mt-10">
              <BlogVideoPlayer src={post.videoUrl} title={post.title} poster={post.coverImageUrl} />
            </div>
          ) : null}

          <div className="mt-10 post-content" dangerouslySetInnerHTML={{ __html: post.content }} />
        </GlassCard>

        <div className="mt-8">
          <CommentSection postId={post.id} canComment={canComment} comments={comments} redirectTo={`/blog/${post.slug}`} />
        </div>

        <div className="mt-8">
          <GlassCard className="p-6 md:p-8">
            <div className="flex flex-col gap-3">
              <div className="text-lg font-black tracking-tight">Reshare this post</div>
              <div className="text-sm text-foreground/60">Share it to your friends, groups, or socials.</div>
              <ShareBar title={post.title} url={url} />
            </div>
          </GlassCard>
        </div>
      </Container>
    </main>
  );
}
