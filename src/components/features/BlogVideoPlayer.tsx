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
  /** Enable auto-play when video scrolls into view (muted by default) */
  autoPlayOnScroll?: boolean;
};

export function BlogVideoPlayer({
  src,
  title = "Video",
  poster,
  className,
  autoPlayOnScroll = true,
}: BlogVideoPlayerProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = React.useState(false);
  const [userPaused, setUserPaused] = React.useState(false);

  const youTube = isYouTube(src);
  const embed = youTube ? toYouTubeEmbed(src) : null;

  // Intersection Observer for auto-play on scroll
  React.useEffect(() => {
    if (youTube || !autoPlayOnScroll) return;

    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const visible = entry.isIntersecting && entry.intersectionRatio >= 0.5;
          setIsInView(visible);

          if (visible && !userPaused) {
            // Auto-play when 50% visible (muted to comply with browser policies)
            video.muted = true;
            video.play().catch(() => {
              // Ignore autoplay errors (browser may block)
            });
          } else if (!visible && !video.paused) {
            // Pause when scrolled out of view
            video.pause();
          }
        });
      },
      {
        threshold: [0, 0.25, 0.5, 0.75, 1],
        rootMargin: "0px",
      }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [youTube, autoPlayOnScroll, userPaused]);

  // Track if user manually paused
  const handlePause = () => {
    if (isInView) {
      setUserPaused(true);
    }
  };

  const handlePlay = () => {
    setUserPaused(false);
  };

  return (
    <GlassCard className={"overflow-hidden " + (className ?? "")} ref={containerRef}>
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
          <video
            ref={videoRef}
            className="h-full w-full object-contain bg-black"
            controls
            playsInline
            preload="metadata"
            poster={poster ?? undefined}
            src={src}
            onPause={handlePause}
            onPlay={handlePlay}
          />
        )}
      </div>
      <div className="p-4">
        <div className="text-sm font-bold">{title}</div>
        <div className="text-xs text-foreground/60">
          {autoPlayOnScroll && !youTube ? (
            <>Auto-plays when in view • Tap to unmute</>
          ) : (
            <>Watch in portrait or rotate to landscape for full screen.</>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
