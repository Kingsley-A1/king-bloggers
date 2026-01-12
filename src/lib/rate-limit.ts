"use server";

import { headers } from "next/headers";

/**
 * Simple in-memory rate limiter for server actions.
 *
 * IMPORTANT: This is an in-memory implementation suitable for development
 * and single-instance deployments. For production with multiple instances,
 * consider using Redis or Upstash Rate Limit.
 *
 * @example
 * const { limited } = await rateLimit("login");
 * if (limited) return { ok: false, error: "Too many requests. Please wait." };
 */

const RATE_LIMITS = {
  // Auth actions: 10 requests per minute
  register: { windowMs: 60 * 1000, maxRequests: 10 },
  login: { windowMs: 60 * 1000, maxRequests: 15 },
  // Content actions: 20 requests per minute
  createPost: { windowMs: 60 * 1000, maxRequests: 20 },
  createComment: { windowMs: 60 * 1000, maxRequests: 30 },
  // Default fallback
  default: { windowMs: 60 * 1000, maxRequests: 60 },
} as const;

type RateLimitAction = keyof typeof RATE_LIMITS;

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory cache (cleared on server restart)
const cache = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now > entry.resetTime) {
      cache.delete(key);
    }
  }
}, 5 * 60 * 1000);

export async function rateLimit(
  action: RateLimitAction = "default",
  customIdentifier?: string
): Promise<{ limited: boolean; retryAfterMs?: number; remaining?: number }> {
  try {
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() ?? "unknown";
    const identifier = customIdentifier ?? ip;
    const key = `${action}:${identifier}`;

    const config = RATE_LIMITS[action] ?? RATE_LIMITS.default;
    const now = Date.now();
    const entry = cache.get(key);

    // No existing entry or expired window
    if (!entry || now > entry.resetTime) {
      cache.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return { limited: false, remaining: config.maxRequests - 1 };
    }

    // Check if limit exceeded
    if (entry.count >= config.maxRequests) {
      return {
        limited: true,
        retryAfterMs: entry.resetTime - now,
        remaining: 0,
      };
    }

    // Increment count
    entry.count++;
    return { limited: false, remaining: config.maxRequests - entry.count };
  } catch (error) {
    // On error, allow the request (fail open for availability)
    console.error("Rate limit check failed:", error);
    return { limited: false };
  }
}

/**
 * Helper to format rate limit error message
 * Must be async since this file has "use server" directive
 */
export async function rateLimitError(retryAfterMs?: number): Promise<string> {
  if (!retryAfterMs) return "Too many requests. Please try again later.";
  const seconds = Math.ceil(retryAfterMs / 1000);
  return `Too many requests. Please try again in ${seconds} second${
    seconds === 1 ? "" : "s"
  }.`;
}
