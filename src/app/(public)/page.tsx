import { SectionHeader } from "@/components/features/SectionHeader";
import { Container } from "@/components/layout/Container";
import { CategoryNav } from "@/components/layout/CategoryNav";
import { ForYouFeed } from "@/components/features/ForYouFeed";
import { loadFeed } from "@/lib/personalization/feed-actions";
import { GlassButton } from "@/components/ui/GlassButton";
import { SearchBar } from "@/components/features/SearchBar";
import { auth } from "@/lib/auth";

// ============================================
// 👑 KING BLOGGERS V2 - Home Page
// ============================================
// Personalized "For You" feed with feed switching
// ============================================
export const revalidate = 30;

export default async function HomePage() {
  const session = await auth();
  const name = session?.user?.name ?? "you";

  // Load initial posts using the personalization engine
  const { items, nextCursor, hasMore } = await loadFeed("for-you");

  return (
    <main className="min-h-screen py-14">
      <CategoryNav activeHref="/" />

      <Container className="pt-8">
        <div className="glass-card p-8 md:p-12">
          <SectionHeader
            title="King Bloggers"
            subtitle={`Built for ${name} -- A sovereign feed for Tech, Art, Culture, and Power and more...`}
          />
          {/* Hero Search Bar */}
          <div className="mt-6 max-w-2xl">
            <SearchBar
              variant="hero"
              placeholder="Search articles, topics, creators..."
            />
          </div>
        </div>

        {items.length === 0 ? (
          <div className="mt-10 glass-card p-8 md:p-10">
            <div className="flex flex-col gap-4">
              <div className="text-sm text-foreground/70">
                No posts published yet.
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
            <ForYouFeed
              initialPosts={items}
              initialCursor={nextCursor}
              initialHasMore={hasMore}
              initialFeedType="for-you"
              loadMoreAction={loadFeed}
            />
          </section>
        )}
      </Container>
    </main>
  );
}
