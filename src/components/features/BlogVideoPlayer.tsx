"use client";

import * as React from "react";

import { GlassCard } from "@/components/ui/GlassCard";

function isYouTube(url: string) {
  return /youtube\.com|youtu\.be/.test(url);
}

function toYouTubeEmbed(url: string) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace("/", "");
      return `https://www.youtube.com/embed/${id}`;
    }

    const id = u.searchParams.get("v");
    if (id) return `https://www.youtube.com/embed/${id}`;

    return url;
  } catch (error) {
    void error;
    return url;
  }
}

export type BlogVideoPlayerProps = {
  src: string;
  title?: string;
  poster?: string | null;
  className?: string;
};

export function BlogVideoPlayer({
  src,
  title = "Video",
  poster,
  className,
}: BlogVideoPlayerProps) {
  const youTube = isYouTube(src);
  const embed = youTube ? toYouTubeEmbed(src) : null;

  return (
    <GlassCard className={"overflow-hidden " + (className ?? "")}>
      <div className="w-full aspect-video bg-foreground/5">
        {youTube ? (
          <iframe
            className="h-full w-full"
            src={embed ?? src}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video
            className="h-full w-full object-contain bg-black"
            controls
            playsInline
            preload="metadata"
            poster={poster ?? undefined}
            src={src}
          />
        )}
      </div>
      <div className="p-4">
        <div className="text-sm font-bold">{title}</div>
        <div className="text-xs text-foreground/60">
          Watch in portrait or rotate to landscape for full screen.
        </div>
      </div>
    </GlassCard>
  );
}
