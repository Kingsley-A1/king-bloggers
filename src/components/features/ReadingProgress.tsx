"use client";

import * as React from "react";

/**
 * ReadingProgress - A premium reading progress indicator
 * 
 * Displays an animated gradient progress bar at the top of the viewport
 * that fills as the user scrolls through content.
 * 
 * Features:
 * - Smooth transition animation
 * - Orange-to-amber gradient (King's accent color)
 * - Glow effect for premium feel
 * - SSR-safe (client-only rendering)
 * 
 * @example
 * // In your blog post layout or page
 * <ReadingProgress />
 */
export function ReadingProgress() {
    const [progress, setProgress] = React.useState(0);
    const [isVisible, setIsVisible] = React.useState(false);

    React.useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;

            // Avoid division by zero
            if (docHeight <= 0) {
                setProgress(0);
                return;
            }

            const scrollPercent = Math.min(100, Math.max(0, (scrollTop / docHeight) * 100));
            setProgress(scrollPercent);

            // Only show after scrolling a bit (prevents flash at top)
            setIsVisible(scrollTop > 100);
        };

        // Initial check
        handleScroll();

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Don't render on server or when at top of page
    if (!isVisible) return null;

    return (
        <div
            className="fixed top-0 left-0 z-[200] h-1 transition-all duration-150 ease-out"
            style={{
                width: `${progress}%`,
                background: "linear-gradient(to right, rgb(249, 115, 22), rgb(245, 158, 11))",
                boxShadow: progress > 0 ? "0 0 10px rgba(249, 115, 22, 0.5)" : "none",
            }}
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Reading progress"
        />
    );
}

/**
 * ReadingTimeRemaining - Shows estimated reading time left
 * 
 * @example
 * <ReadingTimeRemaining totalMinutes={8} />
 */
export function ReadingTimeRemaining({ totalMinutes }: { totalMinutes: number }) {
    const [remainingText, setRemainingText] = React.useState("");

    React.useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;

            if (docHeight <= 0) {
                setRemainingText(`${totalMinutes} min left`);
                return;
            }

            const scrollPercent = Math.min(1, Math.max(0, scrollTop / docHeight));
            const remaining = Math.ceil(totalMinutes * (1 - scrollPercent));

            if (remaining <= 0) {
                setRemainingText("Finished");
            } else if (remaining === 1) {
                setRemainingText("1 min left");
            } else {
                setRemainingText(`${remaining} min left`);
            }
        };

        handleScroll();
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [totalMinutes]);

    return (
        <span className="text-xs font-mono text-foreground/50">
            {remainingText}
        </span>
    );
}
