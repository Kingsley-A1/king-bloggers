import { SectionHeader } from "@/components/features/SectionHeader";
import { PostCard } from "@/components/features/PostCard";
import { Container } from "@/components/layout/Container";
import { CategoryNav } from "@/components/layout/CategoryNav";
import { unstable_noStore as noStore } from "next/cache";
import { GlassButton } from "@/components/ui/GlassButton";
import {
  badgeVariantForCategory,
  labelForCategory,
  listPublishedPosts,
  readTimeFromContent,
  type PostCategory,
} from "@/lib/queries/posts";

export async function CategoryFeedPage({
  category,
  activeHref,
}: {
  category: PostCategory;
  activeHref: string;
}) {
  noStore();
  const rows = await listPublishedPosts({ category, limit: 30 });
  const title = labelForCategory(category);

  return (
    <main className="min-h-screen py-14">
      <CategoryNav activeHref={activeHref} />

      <Container className="pt-8">
        <div className="glass-card p-8 md:p-12">
          <SectionHeader
            title={title}
            subtitle={`Latest ${title} stories from the sovereign feed.`}
          />
        </div>

        {rows.length === 0 ? (
          <div className="mt-10 glass-card p-8 md:p-10">
            <div className="flex flex-col gap-4">
              <div className="text-sm text-foreground/70">
                No posts published in {title} yet.
              </div>
              <div>
                <GlassButton as="a" href="/blogger/editor" variant="primary">
                  Upload Blog
                </GlassButton>
              </div>
            </div>
          </div>
        ) : (
          <section className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rows.map((p) => (
              <PostCard
                key={p.slug}
                href={`/blog/${p.slug}`}
                title={p.title}
                excerpt={p.excerpt ?? undefined}
                badge={{
                  label: labelForCategory(p.category),
                  variant: badgeVariantForCategory(p.category),
                }}
                readTime={readTimeFromContent(p.content)}
                authorName={p.authorEmail}
                imageUrl={p.coverImageUrl}
              />
            ))}
          </section>
        )}
      </Container>
    </main>
  );
}
