"use client";

import * as React from "react";
import { cn } from "../../lib/utils";

/**
 * TiltCard - A 3D perspective card that responds to mouse movement
 * 
 * Creates a premium, interactive card experience with:
 * - Smooth 3D tilt based on cursor position
 * - Subtle glow effect following the cursor
 * - Spring-like animation on mouse leave
 * - Touch-friendly (no tilt on mobile)
 * 
 * This follows the "Haptic Motion" principle from King Bloggers Dev Manifesto:
 * "Buttons are not static. They scale on press."
 * 
 * @example
 * <TiltCard className="p-6">
 *   <h3>Card Content</h3>
 * </TiltCard>
 */

interface TiltCardProps {
    children: React.ReactNode;
    className?: string;
    /** Maximum tilt angle in degrees (default: 10) */
    maxTilt?: number;
    /** Perspective distance in pixels (default: 1000) */
    perspective?: number;
    /** Enable/disable the glow effect (default: true) */
    glowEnabled?: boolean;
    /** Scale on hover (default: 1.02) */
    hoverScale?: number;
}

export function TiltCard({
    children,
    className,
    maxTilt = 10,
    perspective = 1000,
    glowEnabled = true,
    hoverScale = 1.02,
}: TiltCardProps) {
    const cardRef = React.useRef<HTMLDivElement>(null);
    const [isHovering, setIsHovering] = React.useState(false);
    const [tiltStyle, setTiltStyle] = React.useState<React.CSSProperties>({});
    const [glowStyle, setGlowStyle] = React.useState<React.CSSProperties>({});

    const handleMouseMove = React.useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (!cardRef.current) return;

            const rect = cardRef.current.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            // Calculate tilt based on cursor position relative to center
            const rotateY = ((e.clientX - centerX) / (rect.width / 2)) * maxTilt;
            const rotateX = -((e.clientY - centerY) / (rect.height / 2)) * maxTilt;

            setTiltStyle({
                transform: `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${hoverScale})`,
                transition: "transform 0.1s ease-out",
            });

            // Update glow position
            if (glowEnabled) {
                const glowX = ((e.clientX - rect.left) / rect.width) * 100;
                const glowY = ((e.clientY - rect.top) / rect.height) * 100;
                setGlowStyle({
                    background: `radial-gradient(circle at ${glowX}% ${glowY}%, rgba(255, 140, 0, 0.15) 0%, transparent 50%)`,
                });
            }
        },
        [maxTilt, perspective, hoverScale, glowEnabled]
    );

    const handleMouseEnter = React.useCallback(() => {
        setIsHovering(true);
    }, []);

    const handleMouseLeave = React.useCallback(() => {
        setIsHovering(false);
        // Spring back animation
        setTiltStyle({
            transform: `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale(1)`,
            transition: "transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        });
        setGlowStyle({});
    }, [perspective]);

    return (
        <div
            ref={cardRef}
            className={cn(
                "relative overflow-hidden rounded-xl",
                "glass-card", // Uses existing glass styling
                className
            )}
            style={tiltStyle}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Glow overlay */}
            {glowEnabled && isHovering && (
                <div
                    className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300"
                    style={glowStyle}
                />
            )}

            {/* Content */}
            <div className="relative z-0">{children}</div>
        </div>
    );
}

/**
 * TiltPostCard - A PostCard with built-in tilt effect
 * Drop-in replacement for the regular PostCard with 3D tilt
 */
export function TiltPostCard({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <TiltCard
            className={cn("block", className)}
            maxTilt={8}
            hoverScale={1.01}
        >
            {children}
        </TiltCard>
    );
}
