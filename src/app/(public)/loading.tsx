import { Container } from "@/components/layout/Container";
import { CategoryNav } from "@/components/layout/CategoryNav";
import { PostCardSkeleton } from "@/components/features/PostCardSkeleton";

export default function Loading() {
  return (
    <main className="min-h-screen py-14">
      <CategoryNav activeHref="/" />

      <Container className="pt-8">
        <div className="glass-card p-8 md:p-12">
          <div className="text-xs font-mono text-foreground/50">Loading</div>
          <div className="mt-2 h-10 w-64 rounded skeleton" />
          <div className="mt-4 h-4 w-96 max-w-full rounded skeleton" />
        </div>

        <section className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </section>
      </Container>
    </main>
  );
}
