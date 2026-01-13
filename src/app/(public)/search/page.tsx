"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, Loader2, ArrowLeft, Eye, Calendar } from "lucide-react";

import { Container } from "@/components/layout/Container";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

// ============================================
// 👑 KING BLOGGERS - Search Page
// ============================================

type SearchResult = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  category: string;
  coverImageUrl: string | null;
  authorName: string | null;
  viewCount: number;
  createdAt: string;
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    tech: "Tech",
    art_culture: "Art & Culture",
    entertainment: "Entertainment",
    sport: "Sport",
    health: "Health",
    self_growth: "Self Growth",
    finances: "Finances",
    politics: "Politics",
    economics: "Economics",
    religion: "Religion",
  };
  return labels[category] ?? category;
}

function getBadgeVariant(category: string): "tech" | "art" | "politics" {
  switch (category) {
    case "tech":
      return "tech";
    case "art_culture":
      return "art";
    default:
      return "politics";
  }
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const [searchInput, setSearchInput] = React.useState(query);
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [searched, setSearched] = React.useState(false);

  // Fetch search results
  const performSearch = React.useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(q.trim())}`
      );
      if (res.ok) {
        const data = await res.json();
        setResults(data.posts ?? []);
      } else {
        setResults([]);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Search on mount if query param exists
  React.useEffect(() => {
    if (query) {
      performSearch(query);
    }
  }, [query, performSearch]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set("q", searchInput.trim());
    window.history.pushState({}, "", url.toString());
    performSearch(searchInput);
  }

  return (
    <main className="min-h-screen py-8 md:py-14">
      <Container>
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-foreground/60 hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
            🔍 Search Posts
          </h1>
          
          {/* Search Form */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/40" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search for blogs, topics, authors..."
                className={cn(
                  "w-full pl-12 pr-4 py-3 rounded-xl",
                  "bg-foreground/5 border border-foreground/10",
                  "focus:outline-none focus:ring-2 focus:ring-king-orange/50 focus:border-king-orange",
                  "placeholder:text-foreground/40"
                )}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={cn(
                "px-6 py-3 rounded-xl font-semibold",
                "bg-king-orange text-black",
                "hover:bg-king-orange/90 transition-colors",
                "disabled:opacity-50"
              )}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Search"
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex flex-col items-center gap-4 py-16">
            <Loader2 className="h-8 w-8 animate-spin text-king-orange" />
            <span className="text-foreground/50">Searching...</span>
          </div>
        ) : searched && results.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h2 className="text-xl font-bold mb-2">No results found</h2>
            <p className="text-foreground/60">
              Try different keywords or browse our categories
            </p>
          </GlassCard>
        ) : results.length > 0 ? (
          <div className="space-y-4">
            <p className="text-foreground/60 text-sm mb-4">
              Found {results.length} result{results.length !== 1 ? "s" : ""} for "{query}"
            </p>
            {results.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`}>
                <GlassCard className="p-4 hover:border-king-orange/30 transition-colors">
                  <div className="flex gap-4">
                    {post.coverImageUrl && (
                      <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                        <Image
                          src={post.coverImageUrl}
                          alt={post.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getBadgeVariant(post.category)} className="text-xs">
                          {getCategoryLabel(post.category)}
                        </Badge>
                      </div>
                      <h3 className="font-bold text-lg line-clamp-1 mb-1">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-sm text-foreground/60 line-clamp-2 mb-2">
                          {post.excerpt}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-foreground/50">
                        <span>{post.authorName ?? "Anonymous"}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {post.viewCount}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(post.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </Link>
            ))}
          </div>
        ) : (
          <GlassCard className="p-8 text-center">
            <div className="text-4xl mb-4">👑</div>
            <h2 className="text-xl font-bold mb-2">Discover Content</h2>
            <p className="text-foreground/60">
              Search for blogs, topics, or browse our categories
            </p>
          </GlassCard>
        )}
      </Container>
    </main>
  );
}

export default function SearchPage() {
  return (
    <React.Suspense
      fallback={
        <main className="min-h-screen py-8 md:py-14">
          <Container>
            <div className="flex flex-col items-center gap-4 py-16">
              <Loader2 className="h-8 w-8 animate-spin text-king-orange" />
              <span className="text-foreground/50">Loading search...</span>
            </div>
          </Container>
        </main>
      }
    >
      <SearchPageContent />
    </React.Suspense>
  );
}
