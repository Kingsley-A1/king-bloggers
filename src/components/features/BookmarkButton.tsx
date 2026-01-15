"use client";

import * as React from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";

import { toggleBookmark } from "@/lib/actions/bookmarks";
import { cn } from "@/lib/utils";

// ============================================
// 👑 KING BLOGGERS V2 - Bookmark Button
// ============================================

type BookmarkButtonProps = {
  postId: string;
  initialBookmarked: boolean;
  className?: string;
  showLabel?: boolean;
  variant?: "pill" | "icon";
};

export function BookmarkButton({
  postId,
  initialBookmarked,
  className,
  showLabel = false,
  variant = "pill",
}: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = React.useState(initialBookmarked);
  const [busy, setBusy] = React.useState(false);
  const [pop, setPop] = React.useState(false);

  async function handleClick() {
    if (busy) return;

    // Trigger animation
    if (!bookmarked) {
      setPop(true);
      setTimeout(() => setPop(false), 400);
    }

    // Optimistic update
    const prev = bookmarked;
    setBookmarked(!prev);
    setBusy(true);

    const result = await toggleBookmark(postId);
    setBusy(false);

    if (!result.ok) {
      // Revert on failure
      setBookmarked(prev);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      className={cn(
        "flex items-center gap-2 rounded-full transition-all duration-300",
        variant === "pill"
          ? "px-3 py-2 border bg-foreground/5 hover:bg-foreground/10"
          : "p-2 border border-foreground/10 hover:border-foreground/20",
        bookmarked
          ? variant === "pill"
            ? "border-king-gold/50 bg-king-gold/10 text-king-gold"
            : "border-king-gold/40 text-king-gold"
          : "text-foreground/70 hover:text-foreground",
        "disabled:opacity-50 disabled:pointer-events-none",
        className
      )}
      aria-label={bookmarked ? "Remove bookmark" : "Save for later"}
    >
      {bookmarked ? (
        <BookmarkCheck
          className={cn("h-5 w-5 fill-current", pop && "reaction-pop")}
        />
      ) : (
        <Bookmark className="h-5 w-5" />
      )}
      {showLabel && (
        <span className="text-sm font-medium">
          {bookmarked ? "Saved" : "Save"}
        </span>
      )}
    </button>
  );
}
