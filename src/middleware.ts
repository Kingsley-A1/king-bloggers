import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

function loginRedirect(req: NextRequest, callbackUrl: string) {
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("callbackUrl", callbackUrl);
  return NextResponse.redirect(url);
}

export default async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  const isBlogger = pathname.startsWith("/blogger");
  const isReader = pathname.startsWith("/reader");

  if (!isBlogger && !isReader) return NextResponse.next();

  const callback = pathname + search;
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return loginRedirect(req, callback);
  }

  let token: Awaited<ReturnType<typeof getToken>> = null;
  try {
    token = await getToken({ req, secret });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("middleware.getToken failed", error);
    }
    token = null;
  }

  if (!token) {
    return loginRedirect(req, callback);
  }

  const role =
    typeof (token as { role?: unknown }).role === "string"
      ? (token as { role: string }).role
      : undefined;
  if (isBlogger && role !== "blogger") {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/blogger/:path*", "/reader/:path*"],
};
