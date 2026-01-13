// middleware.ts - lightweight auth guard for Vercel Edge
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Những path KHÔNG cần auth
const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/api/auth",         // next-auth handlers
  "/_next",            // assets
  "/favicon.ico",
];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  // NextAuth v5 cookie names - check both http and https variants
  const hasSession =
    req.cookies.has("authjs.session-token") ||            // http (development)
    req.cookies.has("__Secure-authjs.session-token") ||   // https (production)
    req.cookies.has("next-auth.session-token");           // fallback for old cookie name

  if (!hasSession) {
    // Don't redirect if already on login page to prevent loop
    if (pathname === "/login") {
      return NextResponse.next();
    }
    
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Chỉ match các route app, bỏ static/image
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
