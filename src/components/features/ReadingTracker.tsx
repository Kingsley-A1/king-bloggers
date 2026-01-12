"use client";

import { useCallback, useEffect, useRef } from "react";

import { trackReadingProgress, trackEngagement } from "@/lib/personalization/track-engagement";

// ============================================
// 👑 KING BLOGGERS - Reading Tracker
// ============================================
// Tracks scroll depth and time spent for personalization
// ============================================

export interface ReadingTrackerProps {
  postId: string;
}

/**
 * Invisible component that tracks reading engagement.
 * Place inside your blog post page.
 * Uses document body scroll position for tracking.
 */
export function ReadingTracker({ postId }: ReadingTrackerProps) {
  const startTime = useRef(Date.now());
  const maxScrollDepth = useRef(0);
  const lastReportedDepth = useRef(0);
  const reportIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // Calculate current scroll depth based on page scroll
  const getScrollDepth = useCallback((): number => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    
    if (docHeight <= 0) return 100;
    return Math.min(100, Math.round((scrollTop / docHeight) * 100));
  }, []);

  // Report progress to server
  const reportProgress = useCallback(async () => {
    const currentDepth = getScrollDepth();
    maxScrollDepth.current = Math.max(maxScrollDepth.current, currentDepth);

    // Only report if depth increased significantly
    if (maxScrollDepth.current - lastReportedDepth.current < 10) return;

    const timeSpent = Math.round((Date.now() - startTime.current) / 1000);

    await trackReadingProgress({
      postId,
      scrollDepth: maxScrollDepth.current,
      timeSpent,
    });

    lastReportedDepth.current = maxScrollDepth.current;
  }, [postId, getScrollDepth]);

  // Track scroll
  useEffect(() => {
    const handleScroll = () => {
      const depth = getScrollDepth();
      maxScrollDepth.current = Math.max(maxScrollDepth.current, depth);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [getScrollDepth]);

  // Report periodically (every 15 seconds)
  useEffect(() => {
    reportIntervalRef.current = setInterval(reportProgress, 15000);
    return () => clearInterval(reportIntervalRef.current);
  }, [reportProgress]);

  // Report on page leave
  useEffect(() => {
    const handleBeforeUnload = () => {
      const timeSpent = Math.round((Date.now() - startTime.current) / 1000);
      
      // Use sendBeacon for reliable delivery on page close
      navigator.sendBeacon?.(
        "/api/track-reading",
        JSON.stringify({
          postId,
          scrollDepth: maxScrollDepth.current,
          timeSpent,
        })
      );
    };

    // Also report on visibility change (user switches tabs)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        void reportProgress();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [postId, reportProgress]);

  // Track initial view
  useEffect(() => {
    void trackEngagement(postId, "view");
  }, [postId]);

  // This component renders nothing
  return null;
}

/**
 * Hook version for more flexibility
 */
export function useReadingTracker(postId: string) {
  const startTime = useRef(Date.now());
  const maxScrollDepth = useRef(0);

  const getScrollDepth = useCallback((): number => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    
    if (docHeight <= 0) return 100;
    return Math.min(100, Math.round((scrollTop / docHeight) * 100));
  }, []);

  const reportProgress = useCallback(async () => {
    const currentDepth = getScrollDepth();
    maxScrollDepth.current = Math.max(maxScrollDepth.current, currentDepth);
    const timeSpent = Math.round((Date.now() - startTime.current) / 1000);

    await trackReadingProgress({
      postId,
      scrollDepth: maxScrollDepth.current,
      timeSpent,
    });
  }, [postId, getScrollDepth]);

  useEffect(() => {
    const handleScroll = () => {
      const depth = getScrollDepth();
      maxScrollDepth.current = Math.max(maxScrollDepth.current, depth);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [getScrollDepth]);

  useEffect(() => {
    void trackEngagement(postId, "view");
  }, [postId]);

  return { reportProgress, getScrollDepth };
}
