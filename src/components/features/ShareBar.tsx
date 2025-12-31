"use client";

import * as React from "react";
import { Copy, Share2 } from "lucide-react";

import { GlassButton } from "@/components/ui/GlassButton";
import { copyTextToClipboard } from "@/lib/clipboard";
import { logDevError } from "@/lib/error-utils";

export type ShareBarProps = {
  title: string;
  url: string;
  className?: string;
};

export function ShareBar({ title, url, className }: ShareBarProps) {
  const [copyState, setCopyState] = React.useState<
    "idle" | "copied" | "failed"
  >("idle");

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

    await copy();
  }

  async function copy() {
    const ok = await copyTextToClipboard(url);
    setCopyState(ok ? "copied" : "failed");
    window.setTimeout(() => setCopyState("idle"), ok ? 1200 : 1800);
  }

  return (
    <div className={"flex flex-wrap items-center gap-2 " + (className ?? "")}>
      <GlassButton
        variant="glass"
        size="sm"
        onClick={() => void share()}
        className="gap-2"
      >
        <Share2 className="h-4 w-4" />
        Share
      </GlassButton>
      <GlassButton
        variant="ghost"
        size="sm"
        onClick={() => void copy()}
        className="gap-2"
      >
        <Copy className="h-4 w-4" />
        {copyState === "copied"
          ? "Copied"
          : copyState === "failed"
          ? "Copy failed"
          : "Copy link"}
      </GlassButton>
    </div>
  );
}
