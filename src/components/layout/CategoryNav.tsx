"use client";

import * as React from "react";

import { CategoryPill } from "@/components/features/CategoryPill";
import type { PostCategory } from "@/lib/queries/posts";

// ============================================
// 👑 KING BLOGGERS - Smart Scroll Category Nav
// ============================================
// Hides on scroll down, shows on scroll up
// Mobile-optimized screen real estate
// ============================================

const CATEGORIES: Array<{ label: string; href: string; value?: PostCategory }> =
  [
    { label: "All", href: "/" },
    { label: "Tech", href: "/tech", value: "tech" },
    { label: "Art & Culture", href: "/art-culture", value: "art_culture" },
    { label: "Entertainment", href: "/entertainment", value: "entertainment" },
    { label: "Sport", href: "/sport", value: "sport" },
    { label: "Health", href: "/health", value: "health" },
    { label: "Self Growth", href: "/self-growth", value: "self_growth" },
    { label: "Finances", href: "/finances", value: "finances" },
    { label: "Politics", href: "/politics", value: "politics" },
    { label: "Economics", href: "/economics", value: "economics" },
    { label: "Religion", href: "/religion", value: "religion" },
  ];

export function CategoryNav({ activeHref }: { activeHref: string }) {
  const [visible, setVisible] = React.useState(true);
  const [lastScrollY, setLastScrollY] = React.useState(0);

  React.useEffect(() => {
    function handleScroll() {
      const currentScrollY = window.scrollY;
      const threshold = 100; // Start hiding after 100px scroll

      if (currentScrollY < threshold) {
        // Always show at top of page
        setVisible(true);
      } else if (currentScrollY > lastScrollY + 10) {
        // Scrolling DOWN - hide nav
        setVisible(false);
      } else if (currentScrollY < lastScrollY - 10) {
        // Scrolling UP - show nav
        setVisible(true);
      }

      setLastScrollY(currentScrollY);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <div
      className={`sticky top-[56px] md:top-[64px] z-30 bg-background/80 backdrop-blur-xl border-b border-foreground/10 transition-all duration-300 ${
        visible
          ? "translate-y-0 opacity-100"
          : "-translate-y-full opacity-0 pointer-events-none"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-2 md:py-3">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 -mb-1">
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
