/**
 * Security Middleware Module
 * Edge-compatible security enhancements for Next.js middleware
 *
 * Note: This module is designed for Edge Runtime
 * Node.js-specific features are in separate modules
 */

import { NextRequest, NextResponse } from "next/server";

// =============================================================================
// Security Headers
// =============================================================================

/**
 * Security headers for Edge middleware
 * Subset that doesn't require dynamic computation
 */
const STATIC_SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-DNS-Prefetch-Control": "off",
  "X-Download-Options": "noopen",
  "X-Permitted-Cross-Domain-Policies": "none",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
};

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(STATIC_SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  // Add HSTS in production
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  return response;
}

// =============================================================================
// Suspicious Request Detection
// =============================================================================

// SQL injection patterns
const SQL_INJECTION_PATTERNS = [
  /(\s|^)(SELECT|INSERT|UPDATE|DELETE|DROP|TRUNCATE|ALTER|UNION|;--)/i,
  /('|")\s*(OR|AND)\s*('|"|\d)/i,
  /\b(SLEEP|BENCHMARK|WAITFOR)\s*\(/i,
];

// XSS patterns
const XSS_PATTERNS = [
  /<script[^>]*>/i,
  /javascript:/i,
  /on\w+\s*=/i,
  /data:text\/html/i,
];

// Path traversal patterns
const PATH_TRAVERSAL_PATTERNS = [
  /\.\.\//,
  /\.\.\\/,
  /%2e%2e%2f/i,
  /%2e%2e%5c/i,
];

/**
 * Check for suspicious patterns in request
 */
export function detectSuspiciousRequest(req: NextRequest): {
  suspicious: boolean;
  reason?: string;
} {
  const url = req.nextUrl;
  const pathname = url.pathname;
  const search = url.search;
  const fullUrl = pathname + search;

  // Check path traversal
  for (const pattern of PATH_TRAVERSAL_PATTERNS) {
    if (pattern.test(fullUrl)) {
      return { suspicious: true, reason: "Path traversal attempt" };
    }
  }

  // Check SQL injection in query params
  for (const [_, value] of url.searchParams) {
    for (const pattern of SQL_INJECTION_PATTERNS) {
      if (pattern.test(value)) {
        return { suspicious: true, reason: "SQL injection pattern" };
      }
    }
    for (const pattern of XSS_PATTERNS) {
      if (pattern.test(value)) {
        return { suspicious: true, reason: "XSS pattern" };
      }
    }
  }

  return { suspicious: false };
}

// =============================================================================
// Bot Detection
// =============================================================================

const KNOWN_BAD_BOTS = [
  /masscan/i,
  /nikto/i,
  /sqlmap/i,
  /nessus/i,
  /openvas/i,
  /nmap/i,
  /dirbuster/i,
  /gobuster/i,
  /wpscan/i,
  /acunetix/i,
];

const KNOWN_GOOD_BOTS = [
  /googlebot/i,
  /bingbot/i,
  /slurp/i, // Yahoo
  /duckduckbot/i,
  /baiduspider/i,
  /yandexbot/i,
  /facebot/i,
  /twitterbot/i,
];

/**
 * Detect bot type from user agent
 */
export function detectBot(userAgent: string | null): {
  isBot: boolean;
  isBadBot: boolean;
  isGoodBot: boolean;
} {
  if (!userAgent) {
    return { isBot: false, isBadBot: false, isGoodBot: false };
  }

  for (const pattern of KNOWN_BAD_BOTS) {
    if (pattern.test(userAgent)) {
      return { isBot: true, isBadBot: true, isGoodBot: false };
    }
  }

  for (const pattern of KNOWN_GOOD_BOTS) {
    if (pattern.test(userAgent)) {
      return { isBot: true, isBadBot: false, isGoodBot: true };
    }
  }

  // Generic bot detection
  const isBot = /bot|crawler|spider|scraper/i.test(userAgent);

  return { isBot, isBadBot: false, isGoodBot: false };
}

// =============================================================================
// Geo-blocking (Optional)
// =============================================================================

/**
 * Countries to block (ISO codes)
 * Configure via environment variable
 */
function getBlockedCountries(): string[] {
  const blocked = process.env.BLOCKED_COUNTRIES;
  if (!blocked) return [];
  return blocked.split(",").map((c) => c.trim().toUpperCase());
}

/**
 * Check if request should be geo-blocked
 * Uses Vercel's geo headers or Cloudflare headers
 */
export function checkGeoBlock(req: NextRequest): {
  blocked: boolean;
  country?: string;
} {
  const blockedCountries = getBlockedCountries();
  if (blockedCountries.length === 0) {
    return { blocked: false };
  }

  // Vercel geo header
  const country =
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("cf-ipcountry") ||
    null;

  if (country && blockedCountries.includes(country.toUpperCase())) {
    return { blocked: true, country };
  }

  return { blocked: false, country: country || undefined };
}

// =============================================================================
// Request ID
// =============================================================================

/**
 * Generate or extract request ID for tracing
 */
export function getRequestId(req: NextRequest): string {
  // Check for existing request ID
  const existing =
    req.headers.get("x-request-id") ||
    req.headers.get("x-correlation-id") ||
    req.headers.get("x-trace-id");

  if (existing) return existing;

  // Generate new ID (UUID v4 compatible for Edge)
  return crypto.randomUUID();
}

// =============================================================================
// Client Information
// =============================================================================

export interface ClientInfo {
  ip: string;
  userAgent: string | null;
  country?: string;
  city?: string;
  requestId: string;
}

/**
 * Extract client information from request
 */
export function getClientInfo(req: NextRequest): ClientInfo {
  // IP address - check various headers
  const ip =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  // User agent
  const userAgent = req.headers.get("user-agent");

  // Geo data (if available)
  const country =
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("cf-ipcountry") ||
    undefined;

  const city =
    req.headers.get("x-vercel-ip-city") ||
    req.headers.get("cf-ipcity") ||
    undefined;

  // Request ID
  const requestId = getRequestId(req);

  return {
    ip,
    userAgent,
    country,
    city,
    requestId,
  };
}

// =============================================================================
// Full Security Check
// =============================================================================

export interface SecurityCheckResult {
  allowed: boolean;
  response?: NextResponse;
  clientInfo: ClientInfo;
  threats: string[];
}

/**
 * Run full security check on request
 */
export function runSecurityCheck(req: NextRequest): SecurityCheckResult {
  const clientInfo = getClientInfo(req);
  const threats: string[] = [];

  // 1. Check for suspicious patterns
  const suspiciousCheck = detectSuspiciousRequest(req);
  if (suspiciousCheck.suspicious) {
    threats.push(suspiciousCheck.reason || "Suspicious request");
    return {
      allowed: false,
      response: new NextResponse(
        JSON.stringify({ error: "Request blocked" }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
            "X-Request-Id": clientInfo.requestId,
          },
        }
      ),
      clientInfo,
      threats,
    };
  }

  // 2. Check for bad bots
  const botCheck = detectBot(clientInfo.userAgent);
  if (botCheck.isBadBot) {
    threats.push("Known malicious bot detected");
    return {
      allowed: false,
      response: new NextResponse(
        JSON.stringify({ error: "Access denied" }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
            "X-Request-Id": clientInfo.requestId,
          },
        }
      ),
      clientInfo,
      threats,
    };
  }

  // 3. Check geo-blocking
  const geoCheck = checkGeoBlock(req);
  if (geoCheck.blocked) {
    threats.push(`Blocked country: ${geoCheck.country}`);
    return {
      allowed: false,
      response: new NextResponse(
        JSON.stringify({ error: "Service not available in your region" }),
        {
          status: 451, // Unavailable for legal reasons
          headers: {
            "Content-Type": "application/json",
            "X-Request-Id": clientInfo.requestId,
          },
        }
      ),
      clientInfo,
      threats,
    };
  }

  return {
    allowed: true,
    clientInfo,
    threats,
  };
}

// =============================================================================
// Enhanced Middleware Factory
// =============================================================================

export interface SecurityMiddlewareOptions {
  enableBotDetection?: boolean;
  enableSuspiciousPatternDetection?: boolean;
  enableGeoBlocking?: boolean;
  enableSecurityHeaders?: boolean;
}

/**
 * Create enhanced security middleware
 */
export function createSecurityMiddleware(
  options: SecurityMiddlewareOptions = {}
) {
  const {
    enableBotDetection = true,
    enableSuspiciousPatternDetection = true,
    enableGeoBlocking = true,
    enableSecurityHeaders = true,
  } = options;

  return (req: NextRequest): NextResponse | null => {
    const clientInfo = getClientInfo(req);

    // Suspicious pattern detection
    if (enableSuspiciousPatternDetection) {
      const check = detectSuspiciousRequest(req);
      if (check.suspicious) {
        console.warn(
          `[Security] Suspicious request blocked: ${check.reason}`,
          { ip: clientInfo.ip, path: req.nextUrl.pathname }
        );
        return new NextResponse(JSON.stringify({ error: "Blocked" }), {
          status: 403,
          headers: { "X-Request-Id": clientInfo.requestId },
        });
      }
    }

    // Bot detection
    if (enableBotDetection) {
      const botCheck = detectBot(clientInfo.userAgent);
      if (botCheck.isBadBot) {
        console.warn("[Security] Bad bot blocked", {
          ip: clientInfo.ip,
          userAgent: clientInfo.userAgent,
        });
        return new NextResponse(JSON.stringify({ error: "Blocked" }), {
          status: 403,
          headers: { "X-Request-Id": clientInfo.requestId },
        });
      }
    }

    // Geo-blocking
    if (enableGeoBlocking) {
      const geoCheck = checkGeoBlock(req);
      if (geoCheck.blocked) {
        return new NextResponse(
          JSON.stringify({ error: "Not available" }),
          { status: 451, headers: { "X-Request-Id": clientInfo.requestId } }
        );
      }
    }

    return null; // Continue to next middleware
  };
}

/**
 * Wrap response with security headers
 */
export function withSecurityHeaders(response: NextResponse): NextResponse {
  return applySecurityHeaders(response);
}
