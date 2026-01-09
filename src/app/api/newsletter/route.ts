import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";

import { db } from "../../../db";
import { newsletterSubscribers } from "../../../db/schema";

// ============================================
// 👑 KING BLOGGERS - Newsletter Subscription
// ============================================
// BE-002: ✅ Rate limiting to prevent spam/abuse
// ============================================

const payloadSchema = z.object({
  email: z.string().email(),
});

// Simple in-memory rate limiting for newsletter
// More lenient than auth: 5 requests per minute per IP
const NEWSLETTER_WINDOW_MS = 60 * 1000;
const NEWSLETTER_MAX_REQUESTS = 5;
const newsletterRateCache = new Map<string, { count: number; resetTime: number }>();

// Cleanup stale entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of newsletterRateCache.entries()) {
      if (now > entry.resetTime) {
        newsletterRateCache.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

async function checkNewsletterRateLimit(): Promise<{ limited: boolean; retryAfterMs?: number }> {
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() ?? "unknown";
  const key = `newsletter:${ip}`;
  const now = Date.now();
  const entry = newsletterRateCache.get(key);

  if (!entry || now > entry.resetTime) {
    newsletterRateCache.set(key, { count: 1, resetTime: now + NEWSLETTER_WINDOW_MS });
    return { limited: false };
  }

  if (entry.count >= NEWSLETTER_MAX_REQUESTS) {
    return { limited: true, retryAfterMs: entry.resetTime - now };
  }

  entry.count++;
  return { limited: false };
}

export async function POST(req: Request) {
  // Rate limit check
  const { limited, retryAfterMs } = await checkNewsletterRateLimit();
  if (limited) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Please wait a moment." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((retryAfterMs ?? 60000) / 1000)),
        },
      }
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch (error) {
    void error;
    return NextResponse.json(
      { ok: false, error: "Invalid JSON." },
      { status: 400 }
    );
  }

  const parsed = payloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid email." },
      { status: 400 }
    );
  }

  await db
    .insert(newsletterSubscribers)
    .values({ email: parsed.data.email.toLowerCase() })
    .onConflictDoNothing({ target: newsletterSubscribers.email });

  return NextResponse.json({ ok: true });
}
