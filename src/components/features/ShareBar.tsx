"use client";

import * as React from "react";
import { Copy, Share2, Check, X, Link as LinkIcon } from "lucide-react";

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
  const [copyState, setCopyState] = React.useState<
    "idle" | "copied" | "failed"
  >("idle");
  const [showLinkPreview, setShowLinkPreview] = React.useState(false);

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
    if (ok) {
      setShowLinkPreview(true);
      window.setTimeout(() => {
        setCopyState("idle");
        setShowLinkPreview(false);
      }, 3000);
    } else {
      window.setTimeout(() => setCopyState("idle"), 1800);
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center gap-2">
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
          variant={copyState === "copied" ? "primary" : "ghost"}
          size="sm"
          onClick={() => void copy()}
          className={cn(
            "gap-2 transition-all duration-300",
            copyState === "copied" &&
              "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
          )}
        >
          {copyState === "copied" ? (
            <Check className="h-4 w-4" />
          ) : copyState === "failed" ? (
            <X className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          {copyState === "copied"
            ? "Copied!"
            : copyState === "failed"
            ? "Failed"
            : "Copy link"}
        </GlassButton>
      </div>

      {/* Link Preview Toast */}
      {showLinkPreview && (
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg",
            "bg-foreground/5 border border-foreground/10",
            "animate-in slide-in-from-top-2 fade-in duration-200"
          )}
        >
          <LinkIcon className="h-3.5 w-3.5 text-king-orange shrink-0" />
          <span className="text-xs text-foreground/70 truncate font-mono">
            {url}
          </span>
        </div>
      )}
    </div>
  );
}
