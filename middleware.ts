/**
 * Enhanced Security Middleware
 * Enterprise-grade protection for TMS
 *
 * Features:
 * - Multi-tier rate limiting
 * - Bot detection & blocking
 * - Suspicious pattern detection (SQLi, XSS, path traversal)
 * - Geo-blocking support
 * - Security headers
 * - Request tracing
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  getClientInfo,
  detectSuspiciousRequest,
  detectBot,
  checkGeoBlock,
  applySecurityHeaders,
  type ClientInfo,
} from "@/lib/security/middleware";

// =============================================================================
// Configuration
// =============================================================================

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/api/auth",
  "/api/health",
  "/api/ready",
  "/_next",
  "/favicon.ico",
  "/.well-known",
];

const RATE_LIMIT_CONFIG = {
  // Auth endpoints - strict
  auth: { limit: 5, windowMs: 60 * 1000 },
  // Sensitive operations
  sensitive: { limit: 10, windowMs: 60 * 1000 },
  // Standard API
  api: { limit: 60, windowMs: 60 * 1000 },
  // Relaxed (read-heavy)
  relaxed: { limit: 120, windowMs: 60 * 1000 },
} as const;

// Paths that need stricter rate limiting
const SENSITIVE_PATHS = [
  "/api/admin",
  "/api/2fa",
  "/api/export",
  "/api/bulk",
];

// =============================================================================
// Rate Limiting (Edge-compatible)
// =============================================================================

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const rateLimitGlobal = globalThis as unknown as {
  __rateLimitStore?: Map<string, RateLimitEntry>;
};
const RATE_LIMIT_STORE =
  rateLimitGlobal.__rateLimitStore ?? new Map<string, RateLimitEntry>();
rateLimitGlobal.__rateLimitStore = RATE_LIMIT_STORE;

function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  const existing = RATE_LIMIT_STORE.get(key);

  if (!existing || existing.resetAt <= now) {
    RATE_LIMIT_STORE.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: Math.ceil(windowMs / 1000) };
  }

  if (existing.count >= limit) {
    const retryAfterSeconds = Math.ceil((existing.resetAt - now) / 1000);
    return { ok: false, remaining: 0, retryAfterSeconds };
  }

  existing.count += 1;
  RATE_LIMIT_STORE.set(key, existing);
  return {
    ok: true,
    remaining: limit - existing.count,
    retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000),
  };
}

function getRateLimitTier(pathname: string): keyof typeof RATE_LIMIT_CONFIG {
  if (pathname.startsWith("/api/auth") || pathname === "/api/register") {
    return "auth";
  }
  if (SENSITIVE_PATHS.some((p) => pathname.startsWith(p))) {
    return "sensitive";
  }
  return "api";
}

// =============================================================================
// Helpers
// =============================================================================

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function createBlockedResponse(
  message: string,
  status: number,
  clientInfo: ClientInfo
): NextResponse {
  return new NextResponse(
    JSON.stringify({ ok: false, error: message }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        "X-Request-Id": clientInfo.requestId,
      },
    }
  );
}

// =============================================================================
// Main Middleware
// =============================================================================

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const clientInfo = getClientInfo(req);

  // 1. Security checks for all requests (except static assets)
  if (!pathname.startsWith("/_next")) {
    // Bot detection - block known malicious bots
    const botCheck = detectBot(clientInfo.userAgent);
    if (botCheck.isBadBot) {
      console.warn(`[Security] Bad bot blocked: ${clientInfo.userAgent}`, {
        ip: clientInfo.ip,
        path: pathname,
      });
      return createBlockedResponse("Access denied", 403, clientInfo);
    }

    // Suspicious pattern detection (SQLi, XSS, path traversal)
    const suspiciousCheck = detectSuspiciousRequest(req);
    if (suspiciousCheck.suspicious) {
      console.warn(`[Security] Suspicious request blocked: ${suspiciousCheck.reason}`, {
        ip: clientInfo.ip,
        path: pathname,
      });
      return createBlockedResponse("Request blocked", 403, clientInfo);
    }

    // Geo-blocking (if configured via BLOCKED_COUNTRIES env)
    const geoCheck = checkGeoBlock(req);
    if (geoCheck.blocked) {
      console.warn(`[Security] Geo-blocked request from ${geoCheck.country}`, {
        ip: clientInfo.ip,
      });
      return createBlockedResponse("Service not available in your region", 451, clientInfo);
    }
  }

  // 2. Rate limiting for API routes
  if (pathname.startsWith("/api/")) {
    const tier = getRateLimitTier(pathname);
    const config = RATE_LIMIT_CONFIG[tier];
    const key = `${tier}:${clientInfo.ip}:${pathname.split("/").slice(0, 3).join("/")}`;

    const result = checkRateLimit(key, config.limit, config.windowMs);

    if (!result.ok) {
      console.warn(`[RateLimit] Exceeded for ${clientInfo.ip} on ${pathname}`, {
        tier,
        limit: config.limit,
      });

      const response = NextResponse.json(
        {
          ok: false,
          error: "Too many requests",
          message: tier === "auth"
            ? "Quá nhiều lần thử. Vui lòng đợi 1 phút."
            : "Rate limit exceeded. Please try again later.",
          retryAfter: result.retryAfterSeconds,
        },
        { status: 429 }
      );

      response.headers.set("Retry-After", result.retryAfterSeconds.toString());
      response.headers.set("X-RateLimit-Limit", config.limit.toString());
      response.headers.set("X-RateLimit-Remaining", "0");
      response.headers.set("X-Request-Id", clientInfo.requestId);

      return applySecurityHeaders(response);
    }
  }

  // 3. Public paths - allow without auth
  if (isPublic(pathname)) {
    const response = NextResponse.next();
    response.headers.set("X-Request-Id", clientInfo.requestId);
    return applySecurityHeaders(response);
  }

  // 4. Auth check for protected routes
  const hasSession =
    req.cookies.has("authjs.session-token") ||
    req.cookies.has("__Secure-authjs.session-token") ||
    req.cookies.has("next-auth.session-token");

  if (!hasSession) {
    if (pathname === "/login") {
      const response = NextResponse.next();
      response.headers.set("X-Request-Id", clientInfo.requestId);
      return applySecurityHeaders(response);
    }

    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", req.nextUrl.pathname);

    const response = NextResponse.redirect(url);
    response.headers.set("X-Request-Id", clientInfo.requestId);
    return response;
  }

  // 5. Authenticated request - add security headers
  const response = NextResponse.next();
  response.headers.set("X-Request-Id", clientInfo.requestId);
  return applySecurityHeaders(response);
}

// =============================================================================
// Matcher Configuration
// =============================================================================

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
