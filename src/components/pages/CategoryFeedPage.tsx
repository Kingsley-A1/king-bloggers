import { SectionHeader } from "@/components/features/SectionHeader";
import { Container } from "@/components/layout/Container";
import { CategoryNav } from "@/components/layout/CategoryNav";
import { CategoryInfiniteFeed } from "@/components/features/CategoryInfiniteFeed";
import { GlassButton } from "@/components/ui/GlassButton";
import { SearchBar } from "@/components/features/SearchBar";
import {
  badgeVariantForCategory,
  labelForCategory,
  listPublishedPosts,
  readTimeFromContent,
  formatCount,
  type PostCategory,
} from "@/lib/queries/posts";

// ============================================
// 👑 KING BLOGGERS V2 - Category Feed Page
// ============================================
// Infinite scroll with cursor pagination
// ============================================

export async function CategoryFeedPage({
  category,
  activeHref,
}: {
  category: PostCategory;
  activeHref: string;
}) {
  const {
    items: rows,
    nextCursor,
    hasMore,
  } = await listPublishedPosts({ category, limit: 12 });
  const title = labelForCategory(category);

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
    authorName: p.authorName,
    authorImage: p.authorImage,
    authorRole: p.authorRole,
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
      <CategoryNav activeHref={activeHref} />

      <Container className="pt-8">
        <div className="glass-card p-8 md:p-12">
          <SectionHeader
            title={title}
            subtitle={`Latest ${title} stories from the sovereign feed.`}
          />
          {/* Category Search Bar */}
          <div className="mt-6 max-w-xl">
            <SearchBar
              variant="inline"
              placeholder={`Search in ${title}...`}
            />
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="mt-10 glass-card p-8 md:p-10">
            <div className="flex flex-col gap-4">
              <div className="text-sm text-foreground/70">
                No posts published in {title} yet.
              </div>
              <div>
                <GlassButton as="a" href="/bloggers/editor" variant="primary">
                  Upload Blog
                </GlassButton>
              </div>
            </div>
          </div>
        ) : (
          <section className="mt-10">
            <CategoryInfiniteFeed
              category={category}
              initialPosts={initialPosts}
              initialCursor={nextCursor}
              initialHasMore={hasMore}
            />
          </section>
        )}
      </Container>
    </main>
  );
}
