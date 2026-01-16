import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

/**
 * Verify CRON request authentication
 * Uses timing-safe comparison to prevent timing attacks
 *
 * @param request - The incoming request
 * @returns null if authorized, NextResponse with error if not
 */
export function verifyCronAuth(request: Request): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET;

  // Check if CRON_SECRET is configured
  if (!cronSecret) {
    console.error("[CRON] CRON_SECRET not configured");
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }

  // Get authorization header
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Extract Bearer token
  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return NextResponse.json(
      { error: "Invalid authorization format" },
      { status: 401 }
    );
  }

  // Timing-safe comparison to prevent timing attacks
  try {
    const expected = Buffer.from(cronSecret, "utf8");
    const received = Buffer.from(token, "utf8");

    // Length check (timing-safe)
    if (expected.length !== received.length) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Constant-time comparison
    if (!timingSafeEqual(expected, received)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Authorized
    return null;
  } catch (error) {
    console.error("[CRON] Auth verification error:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
