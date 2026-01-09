import { SectionHeader } from "@/components/features/SectionHeader";
import { Container } from "@/components/layout/Container";
import { CategoryNav } from "@/components/layout/CategoryNav";
import { InfiniteFeed } from "@/components/features/InfiniteFeed";
import { loadMorePosts } from "@/app/actions/feed";
import {
  listPublishedPosts,
  badgeVariantForCategory,
  labelForCategory,
  readTimeFromContent,
  formatCount,
} from "@/lib/queries/posts";
import { GlassButton } from "@/components/ui/GlassButton";

// ============================================
// 👑 KING BLOGGERS V2 - Home Page
// ============================================
// Infinite scroll feed with cursor pagination
// ============================================
export const revalidate = 30;

export default async function HomePage() {
  const { items: rows, nextCursor, hasMore } = await listPublishedPosts({ limit: 12 });

  // Transform posts for the infinite feed component
  const initialPosts = rows.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt ?? undefined,
    content: p.content,
    coverImageUrl: p.coverImageUrl,
    category: p.category,
    authorEmail: p.authorEmail,
    viewCount: formatCount(p.viewCount),
    reactionCount: p.reactionCount,
    badge: {
      label: labelForCategory(p.category),
      variant: badgeVariantForCategory(p.category),
    },
    readTime: readTimeFromContent(p.content),
  }));

  return (
    <main className="min-h-screen py-14">
      <CategoryNav activeHref="/" />

      <Container className="pt-8">
        <div className="glass-card p-8 md:p-12">
          <SectionHeader
            title="King Bloggers"
            subtitle="A sovereign feed for Tech, Art, Culture, and Power. Built in Liquid Glass."
          />
        </div>

        {rows.length === 0 ? (
          <div className="mt-10 glass-card p-8 md:p-10">
            <div className="flex flex-col gap-4">
              <div className="text-sm text-foreground/70">
                No posts published yet.
              </div>
              <div>
                <GlassButton as="a" href="/blogger/editor" variant="primary">
                  Upload Blog
                </GlassButton>
              </div>
            </div>
          </div>
        ) : (
          <section className="mt-10">
            <InfiniteFeed
              initialPosts={initialPosts}
              initialCursor={nextCursor}
              initialHasMore={hasMore}
              loadMoreAction={loadMorePosts}
            />
          </section>
        )}
      </Container>
    </main>
  );
}
