"use client";

import * as React from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";

import { setReaction } from "@/app/actions/reactions";
import { GlassButton } from "@/components/ui/GlassButton";

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

  async function apply(next: "up" | "down") {
    if (busy) return;

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
    <div className="flex items-center gap-2">
      <GlassButton
        variant={myValue === "up" ? "primary" : "glass"}
        size="sm"
        onClick={() => void apply("up")}
        disabled={busy}
        className="gap-2"
      >
        <ThumbsUp className="h-4 w-4" />
        <span className="tabular-nums">{up}</span>
      </GlassButton>

      <GlassButton
        variant={myValue === "down" ? "primary" : "glass"}
        size="sm"
        onClick={() => void apply("down")}
        disabled={busy}
        className="gap-2"
      >
        <ThumbsDown className="h-4 w-4" />
        <span className="tabular-nums">{down}</span>
      </GlassButton>
    </div>
  );
}
