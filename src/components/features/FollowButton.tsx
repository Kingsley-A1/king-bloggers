"use client";

import * as React from "react";
import { UserPlus, UserCheck } from "lucide-react";

import { toggleFollow } from "@/lib/actions/follows";
import { cn } from "@/lib/utils";
import { GlassButton } from "@/components/ui/GlassButton";

// ============================================
// 👑 KING BLOGGERS V2 - Follow Button
// ============================================

type FollowButtonProps = {
  targetUserId: string;
  initialFollowing: boolean;
  className?: string;
  compact?: boolean;
};

export function FollowButton({
  targetUserId,
  initialFollowing,
  className,
  compact = false,
}: FollowButtonProps) {
  const [following, setFollowing] = React.useState(initialFollowing);
  const [busy, setBusy] = React.useState(false);

  async function handleClick() {
    if (busy) return;

    // Optimistic update
    const prev = following;
    setFollowing(!prev);
    setBusy(true);

    const result = await toggleFollow(targetUserId);
    setBusy(false);

    if (!result.ok) {
      // Revert on failure
      setFollowing(prev);
    }
  }

  if (compact) {
    return (
      <button
        onClick={handleClick}
        disabled={busy}
        className={cn(
          "p-2.5 rounded-full transition-all border-2",
          following
            ? "bg-king-orange/20 text-king-orange border-king-orange/30"
            : "bg-king-orange text-black border-king-orange hover:bg-king-orange/90",
          "disabled:opacity-50 shadow-lg shadow-king-orange/20",
          className
        )}
        aria-label={following ? "Unfollow" : "Follow"}
      >
        {following ? (
          <UserCheck className="h-5 w-5" />
        ) : (
          <UserPlus className="h-5 w-5" />
        )}
      </button>
    );
  }

  return (
    <GlassButton
      onClick={handleClick}
      disabled={busy}
      loading={busy}
      variant={following ? "glass" : "primary"}
      size="sm"
      className={cn(
        "font-bold shadow-lg",
        following 
          ? "border-king-orange/30" 
          : "shadow-king-orange/30",
        className
      )}
    >
      {following ? (
        <>
          <UserCheck className="h-4 w-4 mr-1.5" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4 mr-1.5" />
          Follow
        </>
      )}
    </GlassButton>
  );
}
