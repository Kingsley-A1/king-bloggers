"use client";

import * as React from "react";
import { ThumbsDown, ThumbsUp, Heart } from "lucide-react";

import { setReaction } from "@/app/actions/reactions";
import { cn } from "@/lib/utils";

export type ReactionBarProps = {
  postId: string;
  initialUp: number;
  initialDown: number;
  initialMyValue: "up" | "down" | null;
};

export function ReactionBar({ postId, initialUp, initialDown, initialMyValue }: ReactionBarProps) {
  const [up, setUp] = React.useState(initialUp);
  const [down, setDown] = React.useState(initialDown);
  const [myValue, setMyValue] = React.useState<"up" | "down" | null>(initialMyValue);
  const [busy, setBusy] = React.useState(false);
  const [popUp, setPopUp] = React.useState(false);
  const [popDown, setPopDown] = React.useState(false);

  async function apply(next: "up" | "down") {
    if (busy) return;

    // Trigger pop animation
    if (next === "up") {
      setPopUp(true);
      setTimeout(() => setPopUp(false), 400);
    } else {
      setPopDown(true);
      setTimeout(() => setPopDown(false), 400);
    }

    // Optimistic update
    const prev = myValue;
    let nextMy: "up" | "down" | null = next;
    if (prev === next) nextMy = null;

    const nextUp =
      (prev === "up" ? up - 1 : up) + (nextMy === "up" ? 1 : 0);
    const nextDown =
      (prev === "down" ? down - 1 : down) + (nextMy === "down" ? 1 : 0);

    setUp(nextUp);
    setDown(nextDown);
    setMyValue(nextMy);

    setBusy(true);
    const res = await setReaction({ postId, value: nextMy ?? "none" });
    setBusy(false);

    if (!res.ok) {
      // Revert on failure
      setUp(up);
      setDown(down);
      setMyValue(prev);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {/* Like Button */}
      <button
        onClick={() => void apply("up")}
        disabled={busy}
        className={cn(
          "group relative flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300",
          "border bg-foreground/5 hover:bg-foreground/10",
          myValue === "up"
            ? "border-king-orange/50 bg-king-orange/10 text-king-orange"
            : "border-foreground/10 text-foreground/70 hover:text-foreground",
          "disabled:opacity-50 disabled:pointer-events-none"
        )}
      >
        <Heart
          className={cn(
            "h-5 w-5 transition-all",
            popUp && "reaction-pop",
            myValue === "up" && "fill-current text-king-orange"
          )}
        />
        <span className="text-sm font-bold tabular-nums">{up}</span>
        {popUp && myValue !== "up" && (
          <span className="absolute inset-0 rounded-full border-2 border-king-orange/50 animate-[reactionBurst_0.5s_ease-out]" />
        )}
      </button>

      {/* Dislike Button */}
      <button
        onClick={() => void apply("down")}
        disabled={busy}
        className={cn(
          "group relative flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300",
          "border bg-foreground/5 hover:bg-foreground/10",
          myValue === "down"
            ? "border-red-500/50 bg-red-500/10 text-red-500"
            : "border-foreground/10 text-foreground/70 hover:text-foreground",
          "disabled:opacity-50 disabled:pointer-events-none"
        )}
      >
        <ThumbsDown
          className={cn(
            "h-5 w-5 transition-all",
            popDown && "reaction-pop"
          )}
        />
        <span className="text-sm font-bold tabular-nums">{down}</span>
      </button>
    </div>
  );
}
