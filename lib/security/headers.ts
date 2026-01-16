/**
 * Security Headers Configuration
 * Enterprise-grade HTTP security headers
 *
 * Compliance: OWASP, Mozilla Observatory A+ rating
 */

import { NextResponse } from "next/server";

// Environment detection
const isDev = process.env.NODE_ENV !== "production";
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

/**
 * Content Security Policy configuration
 */
function generateCSP(): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      "'unsafe-inline'", // Required for Next.js
      "'unsafe-eval'", // Required for development
      "https://vercel.live",
      "https://*.vercel-insights.com",
    ],
    "style-src": ["'self'", "'unsafe-inline'"], // Required for Tailwind
    "img-src": [
      "'self'",
      "data:",
      "blob:",
      "https:",
      "https://*.googleusercontent.com",
      "https://uploadthing.com",
      "https://utfs.io",
    ],
    "font-src": ["'self'", "data:", "https://fonts.gstatic.com"],
    "connect-src": [
      "'self'",
      "https://api.telegram.org",
      "https://uploadthing.com",
      "https://utfs.io",
      "https://*.vercel-insights.com",
      "https://*.sentry.io",
      "wss://*.pusher.com",
    ],
    "media-src": ["'self'", "blob:"],
    "object-src": ["'none'"],
    "frame-src": ["'self'"],
    "frame-ancestors": ["'self'"],
    "form-action": ["'self'"],
    "base-uri": ["'self'"],
    "upgrade-insecure-requests": [],
  };

  // Add Sentry if configured
  if (sentryDsn) {
    const sentryHost = new URL(sentryDsn).host;
    directives["connect-src"].push(`https://${sentryHost}`);
  }

  // Add report-uri for CSP violation reporting
  if (!isDev) {
    directives["report-uri"] = ["/api/security/csp-report"];
    directives["report-to"] = ["csp-endpoint"];
  }

  // Remove unsafe-eval in production for stricter security
  if (!isDev) {
    directives["script-src"] = directives["script-src"].filter(
      (v) => v !== "'unsafe-eval'"
    );
  }

  return Object.entries(directives)
    .map(([key, values]) => {
      if (values.length === 0) return key;
      return `${key} ${values.join(" ")}`;
    })
    .join("; ");
}

/**
 * Permissions Policy (formerly Feature-Policy)
 */
function generatePermissionsPolicy(): string {
  const policies = [
    "accelerometer=()",
    "ambient-light-sensor=()",
    "autoplay=()",
    "battery=()",
    "camera=()",
    "cross-origin-isolated=()",
    "display-capture=()",
    "document-domain=()",
    "encrypted-media=()",
    "execution-while-not-rendered=()",
    "execution-while-out-of-viewport=()",
    "fullscreen=(self)",
    "geolocation=()",
    "gyroscope=()",
    "keyboard-map=()",
    "magnetometer=()",
    "microphone=()",
    "midi=()",
    "navigation-override=()",
    "payment=()",
    "picture-in-picture=()",
    "publickey-credentials-get=()",
    "screen-wake-lock=()",
    "sync-xhr=()",
    "usb=()",
    "web-share=()",
    "xr-spatial-tracking=()",
  ];

  return policies.join(", ");
}

/**
 * All security headers
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    // Content Security Policy
    "Content-Security-Policy": generateCSP(),

    // Prevent MIME type sniffing
    "X-Content-Type-Options": "nosniff",

    // Prevent clickjacking
    "X-Frame-Options": "SAMEORIGIN",

    // XSS Protection (legacy, but still useful)
    "X-XSS-Protection": "1; mode=block",

    // Referrer Policy
    "Referrer-Policy": "strict-origin-when-cross-origin",

    // Permissions Policy
    "Permissions-Policy": generatePermissionsPolicy(),

    // HSTS (Strict Transport Security)
    ...(isDev
      ? {}
      : {
          "Strict-Transport-Security":
            "max-age=31536000; includeSubDomains; preload",
        }),

    // Prevent DNS prefetching
    "X-DNS-Prefetch-Control": "off",

    // Prevent IE from executing downloads in site's context
    "X-Download-Options": "noopen",

    // Prevent browsers from rendering site in modes other than expected
    "X-Permitted-Cross-Domain-Policies": "none",

    // Report-To header for CSP violation reporting
    ...(isDev
      ? {}
      : {
          "Report-To": JSON.stringify({
            group: "csp-endpoint",
            max_age: 10886400,
            endpoints: [{ url: `${appUrl}/api/security/csp-report` }],
          }),
        }),

    // Cross-Origin headers
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Embedder-Policy": "credentialless",
    "Cross-Origin-Resource-Policy": "same-origin",

    // Cache control for security
    "Cache-Control": "no-store, max-age=0",
  };
}

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  const headers = getSecurityHeaders();

  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }

  return response;
}

/**
 * Security headers middleware
 */
export function securityHeadersMiddleware(response: NextResponse): NextResponse {
  return applySecurityHeaders(response);
}

/**
 * CORS headers for API routes
 */
export function getCORSHeaders(origin?: string): Record<string, string> {
  const allowedOrigins = [
    appUrl,
    "http://localhost:3000",
    "http://localhost:3001",
  ].filter(Boolean);

  const isAllowed = origin && allowedOrigins.includes(origin);

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : allowedOrigins[0],
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Requested-With, X-CSRF-Token",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400", // 24 hours
  };
}

/**
 * Generate security.txt content
 * Following RFC 9116 standard
 */
export function generateSecurityTxt(): string {
  const contactEmail = process.env.SECURITY_CONTACT_EMAIL || "security@example.com";
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);

  return `# Security Policy
# This file follows the security.txt standard (RFC 9116)
# https://securitytxt.org/

Contact: mailto:${contactEmail}
Expires: ${expires.toISOString()}
Preferred-Languages: en, vi

# Our security policy
Policy: ${appUrl}/security-policy

# If you discover a security vulnerability, please report it to us
# We appreciate your efforts to responsibly disclose your findings

# Acknowledgments page (if applicable)
# Acknowledgments: ${appUrl}/security/hall-of-fame

# Encryption key for secure communication (if applicable)
# Encryption: ${appUrl}/.well-known/pgp-key.txt

# Hiring security researchers
# Hiring: ${appUrl}/careers/security
`;
}

/**
 * Generate robots.txt with security considerations
 */
export function generateRobotsTxt(): string {
  return `User-agent: *
Disallow: /api/
Disallow: /admin/
Disallow: /_next/
Disallow: /static/

# Security-sensitive paths
Disallow: /.well-known/
Disallow: /security.txt

Sitemap: ${appUrl}/sitemap.xml
`;
}
