"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { setReaction } from "@/app/actions/reactions";
import { REACTION_CONFIG, type ReactionValue, type ReactionCounts } from "@/lib/reactions";
import { cn } from "@/lib/utils";

// ============================================
// 👑 KING BLOGGERS V2 - Rich Reaction Bar
// ============================================
// TikTok-style emoji reactions with haptic feedback
// ============================================

export type ReactionBarProps = {
  postId: string;
  initialCounts: ReactionCounts;
  initialMyValue: ReactionValue | null;
  compact?: boolean;
};

// Positive reactions to show (excluding down)
const POSITIVE_REACTIONS: ReactionValue[] = ["fire", "crown", "gem", "insightful", "lol", "up"];

export function ReactionBar({
  postId,
  initialCounts,
  initialMyValue,
  compact = false,
}: ReactionBarProps) {
  const [counts, setCounts] = React.useState<ReactionCounts>(initialCounts);
  const [myValue, setMyValue] = React.useState<ReactionValue | null>(initialMyValue);
  const [busy, setBusy] = React.useState(false);
  const [showPicker, setShowPicker] = React.useState(false);
  const [popType, setPopType] = React.useState<ReactionValue | null>(null);
  const pickerRef = React.useRef<HTMLDivElement>(null);

  // Close picker when clicking outside
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Calculate total reactions
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  // Get top 3 non-zero reactions for display
  const topReactions = Object.entries(counts)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type]) => type as ReactionValue);

  async function handleReaction(nextValue: ReactionValue) {
    if (busy) return;
    setShowPicker(false);

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

  if (compact) {
    // Compact view for post cards
    return (
      <div className="flex items-center gap-2">
        {topReactions.length > 0 ? (
          <div className="flex items-center">
            {topReactions.map((type) => (
              <span key={type} className="text-sm -mr-1">
                {REACTION_CONFIG[type].emoji}
              </span>
            ))}
          </div>
        ) : null}
        <span className="text-xs text-foreground/60 tabular-nums">
          {total > 0 ? total : ""}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3" ref={pickerRef}>
      {/* Main reaction display */}
      <div className="relative">
        <button
          onClick={() => setShowPicker((p) => !p)}
          disabled={busy}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300",
            "border bg-foreground/5 hover:bg-foreground/10",
            myValue
              ? "border-king-orange/50 bg-king-orange/10"
              : "border-foreground/10",
            "disabled:opacity-50 disabled:pointer-events-none"
          )}
          aria-label="React to this post"
        >
          {myValue ? (
            <span className={cn("text-lg", popType === myValue && "reaction-pop")}>
              {REACTION_CONFIG[myValue].emoji}
            </span>
          ) : (
            <Plus className="h-5 w-5 text-foreground/70" />
          )}
          <span className="text-sm font-bold tabular-nums text-foreground/80">
            {total}
          </span>
        </button>

        {/* Reaction Picker Popup */}
        {showPicker && (
          <div
            className={cn(
              "absolute bottom-full left-0 mb-2 z-50",
              "animate-in slide-in-from-bottom-2 fade-in duration-200"
            )}
          >
            <div className="reaction-picker">
              {POSITIVE_REACTIONS.map((type) => (
                <button
                  key={type}
                  onClick={() => void handleReaction(type)}
                  className={cn(
                    "reaction-emoji",
                    myValue === type && "bg-king-orange/20 scale-110"
                  )}
                  title={REACTION_CONFIG[type].label}
                  aria-label={REACTION_CONFIG[type].label}
                >
                  {REACTION_CONFIG[type].emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reaction breakdown (shown when expanded) */}
      {topReactions.length > 0 && (
        <div className="flex items-center gap-1">
          {topReactions.map((type) => (
            <button
              key={type}
              onClick={() => void handleReaction(type)}
              disabled={busy}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-all",
                "border border-transparent hover:border-foreground/10 hover:bg-foreground/5",
                myValue === type && "border-king-orange/30 bg-king-orange/10",
                popType === type && "reaction-pop"
              )}
            >
              <span>{REACTION_CONFIG[type].emoji}</span>
              <span className="text-xs tabular-nums text-foreground/60">
                {counts[type]}
              </span>
            </button>
          ))}
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
