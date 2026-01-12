import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// ============================================
// 👑 KING BLOGGERS - Auth Middleware
// ============================================
// Protects /blogger/* and /reader/* routes
// Any authenticated user can access the editor
// Dashboard restricted to bloggers only
// ============================================

function loginRedirect(req: NextRequest, callbackUrl: string) {
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("callbackUrl", callbackUrl);
  return NextResponse.redirect(url);
}

export default async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Check if route requires authentication
  const isBloggerRoute =
    pathname.startsWith("/blogger") || pathname.startsWith("/bloggers");
  const isReaderRoute = pathname.startsWith("/reader");

  // Only protect blogger and reader routes
  if (!isBloggerRoute && !isReaderRoute) {
    return NextResponse.next();
  }

  // Attempt to get JWT token
  // NextAuth v5 uses "authjs.session-token" cookie name
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) {
    console.error("middleware: AUTH_SECRET not configured");
    return loginRedirect(req, pathname + search);
  }

  let token: Awaited<ReturnType<typeof getToken>> = null;
  try {
    // Try both cookie names for compatibility
    token = await getToken({
      req,
      secret,
      cookieName: "authjs.session-token",
    });

    // Fallback to legacy cookie name
    if (!token) {
      token = await getToken({
        req,
        secret,
        cookieName: "next-auth.session-token",
      });
    }

    // Also try secure variants (for production HTTPS)
    if (!token) {
      token = await getToken({
        req,
        secret,
        cookieName: "__Secure-authjs.session-token",
      });
    }
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("middleware.getToken failed:", error);
    }
  }

  // No token = not authenticated → redirect to login
  if (!token) {
    return loginRedirect(req, pathname + search);
  }

  // Check role for dashboard (bloggers only)
  const role = typeof token.role === "string" ? token.role : "reader";
  const isDashboard = pathname.includes("/dashboard");

  if (isDashboard && role !== "blogger") {
    // Readers cannot access dashboard, redirect to editor
    const url = req.nextUrl.clone();
    url.pathname = "/blogger/editor";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // User is authenticated → allow access
  return NextResponse.next();
}

export const config = {
  matcher: ["/blogger/:path*", "/bloggers/:path*", "/reader/:path*"],
};
