"use client";

import * as React from "react";

import { setReaction } from "@/app/actions/reactions";
import {
  REACTION_CONFIG,
  type ReactionValue,
  type ReactionCounts,
} from "@/lib/reactions";
import { cn } from "@/lib/utils";

// ============================================
// 👑 KING BLOGGERS V2 - Rich Reaction Bar
// ============================================
// TikTok-style emoji reactions - all visible at a glance
// ============================================

export type ReactionBarProps = {
  postId: string;
  initialCounts: ReactionCounts;
  initialMyValue: ReactionValue | null;
  compact?: boolean;
};

// Positive reactions to show (excluding down)
const POSITIVE_REACTIONS: ReactionValue[] = [
  "fire",
  "crown",
  "gem",
  "insightful",
  "lol",
  "up",
];

export function ReactionBar({
  postId,
  initialCounts,
  initialMyValue,
  compact = false,
}: ReactionBarProps) {
  const [counts, setCounts] = React.useState<ReactionCounts>(initialCounts);
  const [myValue, setMyValue] = React.useState<ReactionValue | null>(
    initialMyValue
  );
  const [busy, setBusy] = React.useState(false);
  const [popType, setPopType] = React.useState<ReactionValue | null>(null);

  async function handleReaction(nextValue: ReactionValue) {
    if (busy) return;

    // Trigger pop animation
    setPopType(nextValue);
    setTimeout(() => setPopType(null), 400);

    // Optimistic update
    const prev = myValue;
    const prevCounts = { ...counts };

    // Determine next state
    let nextMy: ReactionValue | null = nextValue;
    if (prev === nextValue) {
      // Toggle off
      nextMy = null;
    }

    // Update counts optimistically
    const newCounts = { ...counts };
    if (prev) {
      newCounts[prev] = Math.max(0, newCounts[prev] - 1);
    }
    if (nextMy) {
      newCounts[nextMy] = newCounts[nextMy] + 1;
    }

    setCounts(newCounts);
    setMyValue(nextMy);

    setBusy(true);
    const res = await setReaction({ postId, value: nextMy ?? "none" });
    setBusy(false);

    if (!res.ok) {
      // Revert on failure
      setCounts(prevCounts);
      setMyValue(prev);
    }
  }

  // Calculate total reactions
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  if (compact) {
    // Compact inline view for post cards - show all reactions
    return (
      <div className="flex items-center gap-1 flex-wrap">
        {POSITIVE_REACTIONS.map((type) => {
          const count = counts[type];
          const isActive = myValue === type;

          return (
            <button
              key={type}
              onClick={() => void handleReaction(type)}
              disabled={busy}
              className={cn(
                "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-sm transition-all duration-200",
                "hover:bg-foreground/10 active:scale-95",
                isActive && "bg-king-orange/20 ring-1 ring-king-orange/40",
                count > 0 ? "opacity-100" : "opacity-50 hover:opacity-80",
                popType === type && "animate-bounce",
                "disabled:pointer-events-none"
              )}
              title={REACTION_CONFIG[type].label}
            >
              <span
                className={cn(
                  "text-base",
                  popType === type && "scale-125 transition-transform"
                )}
              >
                {REACTION_CONFIG[type].emoji}
              </span>
              {count > 0 && (
                <span className="text-[10px] font-semibold tabular-nums text-foreground/70">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Full view for post pages - single row on mobile, minimal background
  return (
    <div
      className={cn(
        "flex items-center gap-1",
        "max-w-full",
        "flex-nowrap sm:flex-wrap",
        "overflow-x-auto sm:overflow-visible",
        "scrollbar-hide"
      )}
    >
      {POSITIVE_REACTIONS.map((type) => {
        const count = counts[type];
        const isActive = myValue === type;

        return (
          <button
            key={type}
            onClick={() => void handleReaction(type)}
            disabled={busy}
            className={cn(
              "flex items-center gap-1 rounded-full transition-all duration-200",
              "px-1.5 py-1 sm:px-2 sm:py-1.5",
              "hover:bg-foreground/5 active:scale-95",
              isActive && "bg-king-orange/10",
              popType === type && "animate-bounce",
              "disabled:pointer-events-none"
            )}
            title={REACTION_CONFIG[type].label}
            aria-label={`${REACTION_CONFIG[type].label} (${count})`}
          >
            <span
              className={cn(
                "text-[22px] sm:text-2xl transition-transform duration-200",
                popType === type && "scale-125",
                isActive && "drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]",
                "filter saturate-125"
              )}
            >
              {REACTION_CONFIG[type].emoji}
            </span>
            <span
              className={cn(
                "text-xs font-bold tabular-nums",
                isActive ? "text-king-orange" : "text-foreground/60"
              )}
            >
              {count}
            </span>
          </button>
        );
      })}

      {/* Total indicator */}
      {total > 0 && (
        <div className="hidden sm:block sm:ml-2 px-3 py-2 text-xs text-foreground/50 font-medium">
          {total} reaction{total !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}

// Legacy-compatible wrapper for existing code
export function LegacyReactionBar({
  postId,
  initialUp,
  initialDown,
  initialMyValue,
}: {
  postId: string;
  initialUp: number;
  initialDown: number;
  initialMyValue: "up" | "down" | null;
}) {
  const initialCounts: ReactionCounts = {
    up: initialUp,
    down: initialDown,
    fire: 0,
    gem: 0,
    crown: 0,
    insightful: 0,
    lol: 0,
  };

  return (
    <ReactionBar
      postId={postId}
      initialCounts={initialCounts}
      initialMyValue={initialMyValue}
    />
  );
}
