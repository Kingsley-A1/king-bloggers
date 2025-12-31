import * as React from "react";

import { CategoryPill } from "@/components/features/CategoryPill";
import type { PostCategory } from "@/lib/queries/posts";

const CATEGORIES: Array<{ label: string; href: string; value?: PostCategory }> =
  [
    { label: "All", href: "/" },
    { label: "Tech", href: "/tech", value: "tech" },
    { label: "Art & Culture", href: "/art-culture", value: "art_culture" },
    { label: "Entertainment", href: "/entertainment", value: "entertainment" },
    { label: "Politics", href: "/politics", value: "politics" },
    { label: "Economics", href: "/economics", value: "economics" },
    { label: "Religion", href: "/religion", value: "religion" },
  ];

export function CategoryNav({ activeHref }: { activeHref: string }) {
  return (
    <div className="sticky top-[72px] z-30 bg-background/60 backdrop-blur-xl border-b border-foreground/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {CATEGORIES.map((c) => (
            <CategoryPill
              key={c.href}
              label={c.label}
              href={c.href}
              active={activeHref === c.href}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
