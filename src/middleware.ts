import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "~/lib/auth";

const PUBLIC_PATHS = new Set([
  "/login",
  "/api/nonce",
  "/api/complete-siwe",
  "/api/trpc",
]);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/favicon") ||
    /\.[^/]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }
  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }
  const session = await verifySessionToken(token);
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/(.*)"],
};
