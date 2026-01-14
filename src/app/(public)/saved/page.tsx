import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { CategoryNav } from "@/components/layout/CategoryNav";
import { SectionHeader } from "@/components/features/SectionHeader";
import { GlassButton } from "@/components/ui/GlassButton";
import { BookmarkButton } from "@/components/features/BookmarkButton";

import { auth } from "@/lib/auth";
import { getMyBookmarks } from "@/lib/actions/bookmarks";

export const revalidate = 30;

function categoryLabel(category: string): string {
  switch (category) {
    case "tech":
      return "Tech";
    case "art_culture":
      return "Art & Culture";
    case "politics":
      return "Politics";
    case "economics":
      return "Economics";
    case "religion":
      return "Religion";
    case "entertainment":
      return "Entertainment";
    case "sport":
      return "Sport";
    case "health":
      return "Health";
    case "self_growth":
      return "Self Growth";
    case "finances":
      return "Finances";
    default:
      return category;
  }
}

export default async function SavedPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <main className="min-h-screen py-14">
        <CategoryNav activeHref="/saved" />
        <Container className="pt-8">
          <div className="glass-card p-8 md:p-12">
            <SectionHeader
              title="Saved"
              subtitle="Sign in to save posts and read them later."
            />
            <div className="mt-6">
              <GlassButton as="a" href="/login" variant="primary">
                Sign In
              </GlassButton>
            </div>
          </div>
        </Container>
      </main>
    );
  }

  const items = await getMyBookmarks();

  return (
    <main className="min-h-screen py-14">
      <CategoryNav activeHref="/saved" />

      <Container className="pt-8">
        <div className="glass-card p-8 md:p-12">
          <SectionHeader
            title="Saved"
            subtitle="Your bookmarked posts — ready anytime."
          />
        </div>

        {items.length === 0 ? (
          <div className="mt-10 glass-card p-10 text-center">
            <div className="text-4xl mb-3">🔖</div>
            <div className="text-lg font-bold">No saved posts yet</div>
            <div className="mt-2 text-sm text-foreground/60">
              Tap “Save” on any post to keep it here.
            </div>
            <div className="mt-6">
              <GlassButton as="a" href="/" variant="primary">
                Explore Feed
              </GlassButton>
            </div>
          </div>
        ) : (
          <section className="mt-10 space-y-3">
            {items.map((p) => (
              <div
                key={p.id}
                className="glass-card p-5 flex items-start justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs text-foreground/60">
                    <span className="px-2 py-1 rounded-full bg-foreground/5 border border-foreground/10">
                      {categoryLabel(p.category)}
                    </span>
                    <span className="truncate">
                      {p.authorName ?? p.authorEmail}
                    </span>
                  </div>

                  <Link
                    href={`/blog/${p.slug}`}
                    className="mt-2 block text-base font-black leading-snug hover:underline"
                  >
                    {p.title}
                  </Link>

                  {p.excerpt && (
                    <p className="mt-2 text-sm text-foreground/70 line-clamp-2">
                      {p.excerpt}
                    </p>
                  )}

                  <div className="mt-3">
                    <GlassButton as="a" href={`/blog/${p.slug}`} variant="glass">
                      Open
                    </GlassButton>
                  </div>
                </div>

                <BookmarkButton postId={p.id} initialBookmarked={true} />
              </div>
            ))}
          </section>
        )}
      </Container>
    </main>
  );
}
