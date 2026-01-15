"use client";

import * as React from "react";
import { Share2 } from "lucide-react";

import { GlassButton } from "@/components/ui/GlassButton";
import { copyTextToClipboard } from "@/lib/clipboard";
import { logDevError } from "@/lib/error-utils";
import { cn } from "@/lib/utils";

export type ShareBarProps = {
  title: string;
  url: string;
  className?: string;
};

export function ShareBar({ title, url, className }: ShareBarProps) {
  async function share() {
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function"
    ) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        logDevError("ShareBar.share", error);
      }
    }

    await copyTextToClipboard(url);
  }

  return (
    <div className={cn("space-y-2", className)}>
      <GlassButton
        variant="glass"
        size="sm"
        onClick={() => void share()}
        className="gap-2"
      >
        <Share2 className="h-4 w-4" />
        Share
      </GlassButton>
    </div>
  );
}
