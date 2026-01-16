/**
 * Request Signing for Sensitive Operations
 * HMAC-based request integrity verification
 *
 * Use for: Admin actions, bulk operations, financial transactions
 * Prevents: Request tampering, replay attacks
 */

import crypto from "crypto";
import { securityLogger, SecurityEventType, SecurityEventSeverity } from "./security-logger";

const SIGNATURE_ALGORITHM = "sha256";
const TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000; // 5 minutes
const NONCE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

// Nonce storage for replay attack prevention
const usedNonces = new Map<string, number>();

// Cleanup expired nonces periodically
setInterval(() => {
  const now = Date.now();
  for (const [nonce, timestamp] of usedNonces.entries()) {
    if (now - timestamp > NONCE_EXPIRY_MS) {
      usedNonces.delete(nonce);
    }
  }
}, 60 * 1000);

interface SignatureComponents {
  timestamp: number;
  nonce: string;
  method: string;
  path: string;
  body?: string;
  userId?: string;
}

interface SignedRequest {
  signature: string;
  timestamp: number;
  nonce: string;
}

/**
 * Generate signing key from user session
 */
function getSigningKey(sessionToken: string): Buffer {
  const appSecret = process.env.NEXTAUTH_SECRET || "development-secret";
  return crypto
    .createHmac("sha256", appSecret)
    .update(sessionToken)
    .digest();
}

/**
 * Create canonical string for signing
 */
function createCanonicalString(components: SignatureComponents): string {
  const parts = [
    components.timestamp.toString(),
    components.nonce,
    components.method.toUpperCase(),
    components.path,
    components.userId || "",
    components.body ? crypto.createHash("sha256").update(components.body).digest("hex") : "",
  ];

  return parts.join("\n");
}

/**
 * Sign a request (client-side)
 */
export function signRequest(
  sessionToken: string,
  method: string,
  path: string,
  body?: object,
  userId?: string
): SignedRequest {
  const timestamp = Date.now();
  const nonce = crypto.randomBytes(16).toString("hex");

  const components: SignatureComponents = {
    timestamp,
    nonce,
    method,
    path,
    body: body ? JSON.stringify(body) : undefined,
    userId,
  };

  const canonicalString = createCanonicalString(components);
  const signingKey = getSigningKey(sessionToken);

  const signature = crypto
    .createHmac(SIGNATURE_ALGORITHM, signingKey)
    .update(canonicalString)
    .digest("hex");

  return {
    signature,
    timestamp,
    nonce,
  };
}

/**
 * Verify a signed request (server-side)
 */
export async function verifySignedRequest(
  request: Request,
  sessionToken: string,
  userId?: string
): Promise<{
  valid: boolean;
  error?: string;
}> {
  try {
    // Extract signature headers
    const signature = request.headers.get("x-signature");
    const timestampStr = request.headers.get("x-timestamp");
    const nonce = request.headers.get("x-nonce");

    if (!signature || !timestampStr || !nonce) {
      return { valid: false, error: "Missing signature headers" };
    }

    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) {
      return { valid: false, error: "Invalid timestamp" };
    }

    // Check timestamp tolerance (prevent replay attacks)
    const now = Date.now();
    if (Math.abs(now - timestamp) > TIMESTAMP_TOLERANCE_MS) {
      await securityLogger.log({
        type: SecurityEventType.API_SUSPICIOUS_REQUEST,
        severity: SecurityEventSeverity.MEDIUM,
        userId,
        outcome: "BLOCKED",
        details: {
          reason: "Timestamp out of tolerance",
          timestampDiff: now - timestamp,
          tolerance: TIMESTAMP_TOLERANCE_MS,
        },
      });
      return { valid: false, error: "Request expired" };
    }

    // Check nonce (prevent replay attacks)
    if (usedNonces.has(nonce)) {
      await securityLogger.log({
        type: SecurityEventType.API_SUSPICIOUS_REQUEST,
        severity: SecurityEventSeverity.HIGH,
        userId,
        outcome: "BLOCKED",
        details: {
          reason: "Nonce reuse detected (potential replay attack)",
          nonce,
        },
      });
      return { valid: false, error: "Nonce already used" };
    }

    // Get request body
    let body: string | undefined;
    const contentType = request.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      body = await request.text();
    }

    // Recreate canonical string
    const url = new URL(request.url);
    const components: SignatureComponents = {
      timestamp,
      nonce,
      method: request.method,
      path: url.pathname,
      body,
      userId,
    };

    const canonicalString = createCanonicalString(components);
    const signingKey = getSigningKey(sessionToken);

    const expectedSignature = crypto
      .createHmac(SIGNATURE_ALGORITHM, signingKey)
      .update(canonicalString)
      .digest("hex");

    // Timing-safe comparison
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    if (!isValid) {
      await securityLogger.log({
        type: SecurityEventType.API_SUSPICIOUS_REQUEST,
        severity: SecurityEventSeverity.HIGH,
        userId,
        outcome: "BLOCKED",
        details: {
          reason: "Invalid signature",
          path: url.pathname,
          method: request.method,
        },
      });
      return { valid: false, error: "Invalid signature" };
    }

    // Mark nonce as used
    usedNonces.set(nonce, now);

    return { valid: true };
  } catch (error) {
    console.error("[RequestSigning] Verification failed:", error);
    return { valid: false, error: "Verification failed" };
  }
}

/**
 * Middleware wrapper for signed requests
 */
export function requireSignedRequest(
  handler: (request: Request, context: { sessionToken: string; userId: string }) => Promise<Response>
) {
  return async (request: Request): Promise<Response> => {
    // In development, optionally skip signature verification
    if (process.env.NODE_ENV !== "production" && process.env.SKIP_REQUEST_SIGNING === "true") {
      console.warn("[RequestSigning] Signature verification skipped (development mode)");
      // Would need to get session from elsewhere in real implementation
      return handler(request, { sessionToken: "", userId: "" });
    }

    // Get session token from cookie or header
    const sessionToken = request.headers.get("x-session-token");
    const userId = request.headers.get("x-user-id");

    if (!sessionToken) {
      return new Response(JSON.stringify({ error: "Session token required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const verification = await verifySignedRequest(request, sessionToken, userId || undefined);

    if (!verification.valid) {
      return new Response(
        JSON.stringify({ error: "Request verification failed", details: verification.error }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return handler(request, { sessionToken, userId: userId || "" });
  };
}

/**
 * Generate client-side signing code snippet
 */
export function getClientSigningCode(): string {
  return `
// Client-side request signing
async function signedFetch(url, options = {}) {
  const sessionToken = getSessionToken(); // Implement based on your auth system
  const userId = getCurrentUserId();

  const timestamp = Date.now();
  const nonce = crypto.randomUUID();

  const bodyHash = options.body
    ? await crypto.subtle.digest('SHA-256', new TextEncoder().encode(options.body))
    : '';

  const canonicalString = [
    timestamp,
    nonce,
    options.method || 'GET',
    new URL(url, window.location.origin).pathname,
    userId || '',
    bodyHash ? Array.from(new Uint8Array(bodyHash)).map(b => b.toString(16).padStart(2, '0')).join('') : ''
  ].join('\\n');

  // Sign with session-derived key (implement key derivation)
  const signature = await signWithKey(canonicalString, sessionToken);

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'X-Signature': signature,
      'X-Timestamp': timestamp.toString(),
      'X-Nonce': nonce,
      'X-Session-Token': sessionToken,
      'X-User-Id': userId,
    },
  });
}
`;
}

/**
 * Sensitive operations that should require signed requests
 */
export const SIGNED_OPERATIONS = [
  "/api/admin/users/delete",
  "/api/admin/users/role",
  "/api/admin/bulk-delete",
  "/api/settings/security",
  "/api/export/data",
  "/api/2fa/disable",
] as const;

/**
 * Check if a path requires signed request
 */
export function requiresSignedRequest(path: string): boolean {
  return SIGNED_OPERATIONS.some((op) => path.startsWith(op));
}
