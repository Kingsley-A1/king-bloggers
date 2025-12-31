import { SectionHeader } from "@/components/features/SectionHeader";
import { Container } from "@/components/layout/Container";
import { CategoryNav } from "@/components/layout/CategoryNav";
import { PostCard } from "@/components/features/PostCard";
import {
  listPublishedPosts,
  badgeVariantForCategory,
  labelForCategory,
  readTimeFromContent,
} from "@/lib/queries/posts";
import { unstable_noStore as noStore } from "next/cache";
import { GlassButton } from "@/components/ui/GlassButton";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  noStore();
  const rows = await listPublishedPosts({ limit: 30 });

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
