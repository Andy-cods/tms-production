/**
 * CSP Violation Report Endpoint
 * Receives and logs Content Security Policy violation reports
 *
 * Compliance: OWASP, Mozilla Observatory
 */

import { NextRequest, NextResponse } from "next/server";
import { securityLogger, SecurityEventType, SecurityEventSeverity, getClientIP } from "@/lib/security/security-logger";

interface CSPViolationReport {
  "csp-report"?: {
    "document-uri"?: string;
    "violated-directive"?: string;
    "effective-directive"?: string;
    "original-policy"?: string;
    "blocked-uri"?: string;
    "source-file"?: string;
    "line-number"?: number;
    "column-number"?: number;
    "status-code"?: number;
    disposition?: string;
    referrer?: string;
    "script-sample"?: string;
  };
}

// Rate limiting for CSP reports (prevent flooding)
const reportCounts = new Map<string, { count: number; firstSeen: number }>();
const MAX_REPORTS_PER_MINUTE = 10;
const CLEANUP_INTERVAL = 60 * 1000;

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of reportCounts.entries()) {
    if (now - value.firstSeen > CLEANUP_INTERVAL) {
      reportCounts.delete(key);
    }
  }
}, CLEANUP_INTERVAL);

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = reportCounts.get(ip);

  if (!record) {
    reportCounts.set(ip, { count: 1, firstSeen: now });
    return false;
  }

  // Reset if window expired
  if (now - record.firstSeen > CLEANUP_INTERVAL) {
    reportCounts.set(ip, { count: 1, firstSeen: now });
    return false;
  }

  record.count++;
  return record.count > MAX_REPORTS_PER_MINUTE;
}

export async function POST(request: NextRequest) {
  const ip = getClientIP(request) || "unknown";

  // Rate limit check
  if (isRateLimited(ip)) {
    return new NextResponse(null, { status: 429 });
  }

  try {
    const contentType = request.headers.get("content-type") || "";

    // CSP reports can come as application/csp-report or application/json
    if (
      !contentType.includes("application/csp-report") &&
      !contentType.includes("application/json")
    ) {
      return new NextResponse(null, { status: 400 });
    }

    const body: CSPViolationReport = await request.json();
    const report = body["csp-report"];

    if (!report) {
      return new NextResponse(null, { status: 400 });
    }

    // Filter out noise (common false positives)
    const blockedUri = report["blocked-uri"] || "";
    const noisePatterns = [
      "chrome-extension://",
      "moz-extension://",
      "safari-extension://",
      "about:",
      "data:",
      "blob:",
    ];

    if (noisePatterns.some((pattern) => blockedUri.startsWith(pattern))) {
      // Don't log browser extension violations
      return new NextResponse(null, { status: 204 });
    }

    // Log the violation
    await securityLogger.log({
      type: SecurityEventType.THREAT_SUSPICIOUS_PATTERN,
      severity: SecurityEventSeverity.LOW,
      ipAddress: ip,
      resource: report["document-uri"],
      outcome: "WARNING",
      details: {
        violatedDirective: report["violated-directive"],
        effectiveDirective: report["effective-directive"],
        blockedUri: report["blocked-uri"],
        sourceFile: report["source-file"],
        lineNumber: report["line-number"],
        columnNumber: report["column-number"],
        disposition: report.disposition,
        scriptSample: report["script-sample"]?.substring(0, 100), // Limit sample length
      },
    });

    // Check for potential attacks
    const attackPatterns = [
      /javascript:/i,
      /data:text\/html/i,
      /<script/i,
      /onerror=/i,
      /onload=/i,
    ];

    const isAttack = attackPatterns.some(
      (pattern) =>
        pattern.test(blockedUri) || pattern.test(report["script-sample"] || "")
    );

    if (isAttack) {
      await securityLogger.logSuspiciousActivity(
        SecurityEventType.THREAT_XSS_ATTEMPT,
        {
          violatedDirective: report["violated-directive"],
          blockedUri: report["blocked-uri"],
          documentUri: report["document-uri"],
        },
        ip
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[CSP Report] Failed to process report:", error);
    return new NextResponse(null, { status: 500 });
  }
}

// Only accept POST requests
export async function GET() {
  return new NextResponse(null, { status: 405 });
}
