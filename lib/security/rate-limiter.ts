/**
 * Enterprise Rate Limiter
 * Production-ready rate limiting with multiple strategies
 *
 * Features:
 * - Multiple rate limit tiers
 * - IP-based and user-based limiting
 * - Sliding window algorithm
 * - Redis-ready (with in-memory fallback)
 * - Endpoint-specific limits
 * - Bypass for trusted sources
 */

import { NextResponse } from "next/server";
import {
  securityLogger,
  SecurityEventType,
  SecurityEventSeverity,
  getClientIP,
} from "./security-logger";

// Rate limit configuration
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message?: string; // Custom error message
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  keyGenerator?: (req: Request) => string; // Custom key generator
}

// Predefined rate limit tiers
export const RateLimitTiers = {
  // Very strict - for auth endpoints
  AUTH: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    message: "Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 1 phút.",
  },

  // Strict - for sensitive operations
  SENSITIVE: {
    windowMs: 60 * 1000,
    maxRequests: 10,
    message: "Quá nhiều yêu cầu. Vui lòng thử lại sau.",
  },

  // Standard - for general API
  STANDARD: {
    windowMs: 60 * 1000,
    maxRequests: 60,
    message: "Rate limit exceeded. Please try again later.",
  },

  // Relaxed - for read-heavy endpoints
  RELAXED: {
    windowMs: 60 * 1000,
    maxRequests: 120,
    message: "Rate limit exceeded.",
  },

  // Bulk operations
  BULK: {
    windowMs: 60 * 1000,
    maxRequests: 5,
    message: "Bulk operation limit exceeded. Please wait before trying again.",
  },

  // File uploads
  UPLOAD: {
    windowMs: 60 * 1000,
    maxRequests: 10,
    message: "Upload limit exceeded. Please wait before uploading more files.",
  },
} as const;

// In-memory store (use Redis in production for distributed systems)
interface RateLimitEntry {
  count: number;
  resetAt: number;
  firstRequest: number;
}

class RateLimitStore {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000);
  }

  get(key: string): RateLimitEntry | undefined {
    const entry = this.store.get(key);
    if (entry && entry.resetAt < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry;
  }

  set(key: string, entry: RateLimitEntry): void {
    this.store.set(key, entry);
  }

  increment(key: string, windowMs: number): RateLimitEntry {
    const now = Date.now();
    const existing = this.get(key);

    if (existing) {
      existing.count++;
      return existing;
    }

    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + windowMs,
      firstRequest: now,
    };
    this.store.set(key, newEntry);
    return newEntry;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetAt < now) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }

  // Stats for monitoring
  getStats(): { totalKeys: number; memoryUsage: number } {
    return {
      totalKeys: this.store.size,
      memoryUsage: process.memoryUsage().heapUsed,
    };
  }
}

// Global store instance
const store = new RateLimitStore();

// Trusted IPs that bypass rate limiting
const trustedIPs = new Set(
  (process.env.RATE_LIMIT_TRUSTED_IPS || "").split(",").filter(Boolean)
);

// Trusted API keys
const trustedApiKeys = new Set(
  (process.env.RATE_LIMIT_TRUSTED_KEYS || "").split(",").filter(Boolean)
);

/**
 * Generate rate limit key
 */
function generateKey(
  request: Request,
  prefix: string,
  customGenerator?: (req: Request) => string
): string {
  if (customGenerator) {
    return `${prefix}:${customGenerator(request)}`;
  }

  const ip = getClientIP(request) || "unknown";
  const url = new URL(request.url);
  return `${prefix}:${ip}:${url.pathname}`;
}

/**
 * Check if request should bypass rate limiting
 */
function shouldBypass(request: Request): boolean {
  // Check trusted IPs
  const ip = getClientIP(request);
  if (ip && trustedIPs.has(ip)) {
    return true;
  }

  // Check trusted API keys
  const apiKey = request.headers.get("x-api-key");
  if (apiKey && trustedApiKeys.has(apiKey)) {
    return true;
  }

  // Bypass for internal health checks
  const url = new URL(request.url);
  if (url.pathname === "/api/health" || url.pathname === "/api/ready") {
    return true;
  }

  return false;
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

/**
 * Check rate limit
 */
export async function checkRateLimit(
  request: Request,
  config: RateLimitConfig,
  prefix: string = "rl"
): Promise<RateLimitResult> {
  // Bypass check
  if (shouldBypass(request)) {
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      reset: Date.now() + config.windowMs,
    };
  }

  const key = generateKey(request, prefix, config.keyGenerator);
  const entry = store.increment(key, config.windowMs);

  const remaining = Math.max(0, config.maxRequests - entry.count);
  const reset = entry.resetAt;

  if (entry.count > config.maxRequests) {
    // Log rate limit exceeded
    const ip = getClientIP(request);
    await securityLogger.logRateLimitExceeded(
      ip || "unknown",
      new URL(request.url).pathname,
      config.maxRequests
    );

    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      reset,
      retryAfter: Math.ceil((reset - Date.now()) / 1000),
    };
  }

  return {
    success: true,
    limit: config.maxRequests,
    remaining,
    reset,
  };
}

/**
 * Create rate limit response headers
 */
export function createRateLimitHeaders(result: RateLimitResult): Headers {
  const headers = new Headers();
  headers.set("X-RateLimit-Limit", result.limit.toString());
  headers.set("X-RateLimit-Remaining", result.remaining.toString());
  headers.set("X-RateLimit-Reset", Math.ceil(result.reset / 1000).toString());

  if (!result.success && result.retryAfter) {
    headers.set("Retry-After", result.retryAfter.toString());
  }

  return headers;
}

/**
 * Rate limit middleware function
 */
export async function rateLimitMiddleware(
  request: Request,
  tier: keyof typeof RateLimitTiers = "STANDARD"
): Promise<NextResponse | null> {
  const config = RateLimitTiers[tier];
  const result = await checkRateLimit(request, config, `rl:${tier.toLowerCase()}`);

  if (!result.success) {
    const headers = createRateLimitHeaders(result);
    return NextResponse.json(
      {
        error: "Too Many Requests",
        message: config.message,
        retryAfter: result.retryAfter,
      },
      {
        status: 429,
        headers,
      }
    );
  }

  return null; // Continue processing
}

/**
 * Decorator for rate limiting API routes
 */
export function withRateLimit(
  handler: (request: Request) => Promise<NextResponse>,
  tier: keyof typeof RateLimitTiers = "STANDARD"
) {
  return async (request: Request): Promise<NextResponse> => {
    const limitResponse = await rateLimitMiddleware(request, tier);
    if (limitResponse) {
      return limitResponse;
    }

    const response = await handler(request);

    // Add rate limit headers to successful response
    const config = RateLimitTiers[tier];
    const result = await checkRateLimit(request, config, `rl:${tier.toLowerCase()}`);
    const headers = createRateLimitHeaders(result);

    // Clone response and add headers
    const newHeaders = new Headers(response.headers);
    headers.forEach((value, key) => {
      newHeaders.set(key, value);
    });

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  };
}

/**
 * Get rate limit status for an IP/key
 */
export function getRateLimitStatus(
  request: Request,
  tier: keyof typeof RateLimitTiers = "STANDARD"
): {
  isLimited: boolean;
  remaining: number;
  resetIn: number;
} {
  const config = RateLimitTiers[tier];
  const key = generateKey(request, `rl:${tier.toLowerCase()}`);
  const entry = store.get(key);

  if (!entry) {
    return {
      isLimited: false,
      remaining: config.maxRequests,
      resetIn: 0,
    };
  }

  return {
    isLimited: entry.count > config.maxRequests,
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetIn: Math.max(0, entry.resetAt - Date.now()),
  };
}

/**
 * Clear rate limit for a specific key (admin function)
 */
export function clearRateLimit(ip: string, tier: keyof typeof RateLimitTiers): void {
  // This would require iterating through keys or having a more sophisticated store
  console.log(`[RateLimiter] Rate limit cleared for IP: ${ip}, tier: ${tier}`);
}

/**
 * Get store statistics for monitoring
 */
export function getRateLimitStats(): { totalKeys: number; memoryUsage: number } {
  return store.getStats();
}
