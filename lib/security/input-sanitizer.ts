/**
 * Input Sanitization Layer
 * Deep sanitization for all user inputs
 *
 * Features:
 * - XSS prevention
 * - SQL injection prevention
 * - NoSQL injection prevention
 * - Path traversal prevention
 * - Command injection prevention
 * - Unicode normalization
 * - Deep object sanitization
 */

import { securityLogger, SecurityEventType, SecurityEventSeverity } from "./security-logger";

// =============================================================================
// Configuration
// =============================================================================

const SANITIZE_CONFIG = {
  maxStringLength: 10000,
  maxArrayLength: 1000,
  maxObjectDepth: 10,
  maxObjectKeys: 100,
  allowedTags: [] as string[], // No HTML tags allowed by default
  allowedProtocols: ["http:", "https:", "mailto:"],
};

// =============================================================================
// Dangerous Patterns
// =============================================================================

// XSS patterns
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^>]*>/gi,
  /<link\b[^>]*>/gi,
  /javascript\s*:/gi,
  /vbscript\s*:/gi,
  /data\s*:\s*text\/html/gi,
  /on\w+\s*=\s*["'][^"']*["']/gi,
  /on\w+\s*=\s*[^\s>]+/gi,
  /expression\s*\([^)]*\)/gi,
  /url\s*\(\s*["']?\s*javascript/gi,
];

// SQL injection patterns
const SQL_PATTERNS = [
  /(\s|^)(SELECT|INSERT|UPDATE|DELETE|DROP|TRUNCATE|ALTER|CREATE|EXEC|EXECUTE)\s/gi,
  /(\s|^)(UNION\s+(ALL\s+)?SELECT)/gi,
  /(\s|^)(OR|AND)\s+[\d\w]+\s*=\s*[\d\w]+/gi,
  /['"](\s*)(OR|AND)(\s*)['"]?\s*=\s*['"]?/gi,
  /;\s*(DROP|DELETE|TRUNCATE|UPDATE|INSERT)/gi,
  /--\s*$/gm,
  /\/\*[\s\S]*?\*\//g,
  /WAITFOR\s+DELAY/gi,
  /BENCHMARK\s*\(/gi,
  /SLEEP\s*\(/gi,
];

// NoSQL injection patterns
const NOSQL_PATTERNS = [
  /\$where\s*:/gi,
  /\$regex\s*:/gi,
  /\$ne\s*:/gi,
  /\$gt\s*:/gi,
  /\$lt\s*:/gi,
  /\$nin\s*:/gi,
  /\$or\s*:\s*\[/gi,
  /\$and\s*:\s*\[/gi,
];

// Command injection patterns
const COMMAND_PATTERNS = [
  /[;&|`$(){}[\]<>]/g,
  /\b(cat|ls|dir|rm|del|mv|cp|chmod|chown|wget|curl|nc|netcat|bash|sh|cmd|powershell)\b/gi,
];

// Path traversal patterns
const PATH_PATTERNS = [
  /\.\.\//g,
  /\.\.\\/g,
  /%2e%2e%2f/gi,
  /%2e%2e%5c/gi,
  /\.\.%2f/gi,
  /\.\.%5c/gi,
  /%252e%252e%252f/gi,
];

// =============================================================================
// Sanitization Functions
// =============================================================================

/**
 * Encode HTML entities
 */
function encodeHTMLEntities(str: string): string {
  const entities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
    "`": "&#x60;",
    "=": "&#x3D;",
  };
  return str.replace(/[&<>"'`=/]/g, (char) => entities[char] || char);
}

/**
 * Remove dangerous patterns from string
 */
function removeDangerousPatterns(str: string): string {
  let result = str;

  // Remove XSS patterns
  for (const pattern of XSS_PATTERNS) {
    result = result.replace(pattern, "");
  }

  return result;
}

/**
 * Normalize unicode to prevent homograph attacks
 */
function normalizeUnicode(str: string): string {
  // Normalize to NFC form
  let normalized = str.normalize("NFC");

  // Replace confusable characters
  const confusables: Record<string, string> = {
    "\u0430": "a", // Cyrillic а
    "\u0435": "e", // Cyrillic е
    "\u043E": "o", // Cyrillic о
    "\u0440": "p", // Cyrillic р
    "\u0441": "c", // Cyrillic с
    "\u0445": "x", // Cyrillic х
    "\u0443": "y", // Cyrillic у
    "\u0456": "i", // Ukrainian і
    "\u0251": "a", // Latin alpha
    "\u03B1": "a", // Greek alpha
  };

  for (const [confusable, replacement] of Object.entries(confusables)) {
    normalized = normalized.replace(new RegExp(confusable, "g"), replacement);
  }

  return normalized;
}

/**
 * Sanitize URL
 */
function sanitizeURL(url: string): string | null {
  try {
    const parsed = new URL(url);

    // Check protocol
    if (!SANITIZE_CONFIG.allowedProtocols.includes(parsed.protocol)) {
      return null;
    }

    // Remove dangerous characters from path
    parsed.pathname = parsed.pathname.replace(/[<>"'`]/g, "");

    return parsed.toString();
  } catch {
    // Not a valid URL, return sanitized string
    return encodeHTMLEntities(url);
  }
}

/**
 * Sanitize email
 */
function sanitizeEmail(email: string): string {
  // Basic email sanitization
  return email
    .toLowerCase()
    .trim()
    .replace(/[<>"'`;&|]/g, "")
    .slice(0, 254); // Max email length per RFC
}

/**
 * Sanitize filename
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "") // Remove invalid chars
    .replace(/\.\./g, "") // Remove path traversal
    .replace(/^\.+/, "") // Remove leading dots
    .slice(0, 255); // Max filename length
}

// =============================================================================
// Main Sanitization Functions
// =============================================================================

export interface SanitizeOptions {
  encodeHTML?: boolean;
  removeSQL?: boolean;
  removeNoSQL?: boolean;
  removeCommands?: boolean;
  removePaths?: boolean;
  normalizeUnicode?: boolean;
  maxLength?: number;
  trimWhitespace?: boolean;
  toLowerCase?: boolean;
}

const DEFAULT_OPTIONS: SanitizeOptions = {
  encodeHTML: true,
  removeSQL: true,
  removeNoSQL: true,
  removeCommands: false, // Only enable for specific fields
  removePaths: true,
  normalizeUnicode: true,
  trimWhitespace: true,
  toLowerCase: false,
};

/**
 * Sanitize a string value
 */
export function sanitizeString(
  value: string,
  options: SanitizeOptions = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let result = value;

  // Limit length first
  const maxLen = opts.maxLength || SANITIZE_CONFIG.maxStringLength;
  if (result.length > maxLen) {
    result = result.slice(0, maxLen);
  }

  // Trim whitespace
  if (opts.trimWhitespace) {
    result = result.trim();
  }

  // Normalize unicode
  if (opts.normalizeUnicode) {
    result = normalizeUnicode(result);
  }

  // Remove dangerous patterns
  result = removeDangerousPatterns(result);

  // Remove SQL injection patterns
  if (opts.removeSQL) {
    for (const pattern of SQL_PATTERNS) {
      result = result.replace(pattern, " ");
    }
  }

  // Remove NoSQL injection patterns
  if (opts.removeNoSQL) {
    for (const pattern of NOSQL_PATTERNS) {
      result = result.replace(pattern, "");
    }
  }

  // Remove command injection patterns
  if (opts.removeCommands) {
    for (const pattern of COMMAND_PATTERNS) {
      result = result.replace(pattern, "");
    }
  }

  // Remove path traversal patterns
  if (opts.removePaths) {
    for (const pattern of PATH_PATTERNS) {
      result = result.replace(pattern, "");
    }
  }

  // Encode HTML entities
  if (opts.encodeHTML) {
    result = encodeHTMLEntities(result);
  }

  // Convert to lowercase
  if (opts.toLowerCase) {
    result = result.toLowerCase();
  }

  return result;
}

/**
 * Sanitize a number value
 */
export function sanitizeNumber(value: unknown): number | null {
  if (typeof value === "number" && !isNaN(value) && isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

/**
 * Sanitize a boolean value
 */
export function sanitizeBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (lower === "true" || lower === "1" || lower === "yes") return true;
    if (lower === "false" || lower === "0" || lower === "no") return false;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  return null;
}

/**
 * Sanitize an array
 */
export function sanitizeArray<T>(
  value: unknown[],
  itemSanitizer: (item: unknown) => T,
  maxLength: number = SANITIZE_CONFIG.maxArrayLength
): T[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.slice(0, maxLength).map(itemSanitizer).filter((item) => item !== null);
}

/**
 * Deep sanitize an object
 */
export function sanitizeObject(
  obj: unknown,
  options: SanitizeOptions = {},
  depth: number = 0
): unknown {
  // Prevent infinite recursion
  if (depth > SANITIZE_CONFIG.maxObjectDepth) {
    return null;
  }

  // Handle null/undefined
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle primitives
  if (typeof obj === "string") {
    return sanitizeString(obj, options);
  }

  if (typeof obj === "number") {
    return sanitizeNumber(obj);
  }

  if (typeof obj === "boolean") {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj
      .slice(0, SANITIZE_CONFIG.maxArrayLength)
      .map((item) => sanitizeObject(item, options, depth + 1));
  }

  // Handle objects
  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    const keys = Object.keys(obj as object).slice(0, SANITIZE_CONFIG.maxObjectKeys);

    for (const key of keys) {
      // Sanitize key
      const sanitizedKey = sanitizeString(key, { encodeHTML: false, maxLength: 100 });

      // Skip dangerous keys
      if (sanitizedKey.startsWith("$") || sanitizedKey.startsWith("__")) {
        continue;
      }

      // Sanitize value
      result[sanitizedKey] = sanitizeObject(
        (obj as Record<string, unknown>)[key],
        options,
        depth + 1
      );
    }

    return result;
  }

  return null;
}

// =============================================================================
// Field-Specific Sanitizers
// =============================================================================

export const fieldSanitizers = {
  email: sanitizeEmail,
  url: sanitizeURL,
  filename: sanitizeFilename,

  username: (value: string) =>
    sanitizeString(value, {
      maxLength: 50,
      toLowerCase: true,
      removeCommands: true,
    }).replace(/[^a-z0-9_-]/g, ""),

  password: (value: string) =>
    // Don't sanitize passwords, just limit length
    value.slice(0, 128),

  phone: (value: string) =>
    value.replace(/[^0-9+\-() ]/g, "").slice(0, 20),

  name: (value: string) =>
    sanitizeString(value, { maxLength: 100 })
      .replace(/[^a-zA-Z\s\u00C0-\u024F\u1E00-\u1EFF-]/g, ""),

  text: (value: string) =>
    sanitizeString(value, { maxLength: 5000 }),

  shortText: (value: string) =>
    sanitizeString(value, { maxLength: 255 }),

  id: (value: string) =>
    value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 36),

  uuid: (value: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value) ? value.toLowerCase() : null;
  },

  json: (value: string) => {
    try {
      const parsed = JSON.parse(value);
      return JSON.stringify(sanitizeObject(parsed));
    } catch {
      return null;
    }
  },
};

// =============================================================================
// Detection Functions
// =============================================================================

export interface ThreatDetectionResult {
  hasThreat: boolean;
  threats: string[];
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

/**
 * Detect threats in input without modifying it
 */
export function detectThreats(value: string): ThreatDetectionResult {
  const threats: string[] = [];

  // Check XSS
  for (const pattern of XSS_PATTERNS) {
    if (pattern.test(value)) {
      threats.push("XSS_ATTEMPT");
      break;
    }
  }

  // Check SQL injection
  for (const pattern of SQL_PATTERNS) {
    if (pattern.test(value)) {
      threats.push("SQL_INJECTION");
      break;
    }
  }

  // Check NoSQL injection
  for (const pattern of NOSQL_PATTERNS) {
    if (pattern.test(value)) {
      threats.push("NOSQL_INJECTION");
      break;
    }
  }

  // Check path traversal
  for (const pattern of PATH_PATTERNS) {
    if (pattern.test(value)) {
      threats.push("PATH_TRAVERSAL");
      break;
    }
  }

  // Check command injection
  const commandPatternsCombined = /[;&|`]|\b(rm|del|wget|curl|nc)\b/gi;
  if (commandPatternsCombined.test(value)) {
    threats.push("COMMAND_INJECTION");
  }

  // Determine severity
  let severity: ThreatDetectionResult["severity"] = "LOW";
  if (threats.length > 0) {
    if (threats.includes("SQL_INJECTION") || threats.includes("COMMAND_INJECTION")) {
      severity = "CRITICAL";
    } else if (threats.includes("XSS_ATTEMPT") || threats.includes("NOSQL_INJECTION")) {
      severity = "HIGH";
    } else {
      severity = "MEDIUM";
    }
  }

  return {
    hasThreat: threats.length > 0,
    threats,
    severity,
  };
}

// =============================================================================
// Middleware & Utilities
// =============================================================================

/**
 * Sanitize request body
 */
export async function sanitizeRequestBody(
  request: Request,
  options: SanitizeOptions = {}
): Promise<{ sanitized: unknown; threats: ThreatDetectionResult }> {
  const contentType = request.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    return { sanitized: null, threats: { hasThreat: false, threats: [], severity: "LOW" } };
  }

  try {
    const body = await request.json();
    const rawString = JSON.stringify(body);

    // Detect threats first
    const threats = detectThreats(rawString);

    // Log if threats detected
    if (threats.hasThreat) {
      await securityLogger.log({
        type: SecurityEventType.THREAT_INJECTION_ATTEMPT,
        severity:
          threats.severity === "CRITICAL"
            ? SecurityEventSeverity.CRITICAL
            : threats.severity === "HIGH"
            ? SecurityEventSeverity.HIGH
            : SecurityEventSeverity.MEDIUM,
        outcome: "WARNING",
        details: {
          threats: threats.threats,
          inputLength: rawString.length,
        },
      });
    }

    // Sanitize
    const sanitized = sanitizeObject(body, options);

    return { sanitized, threats };
  } catch {
    return { sanitized: null, threats: { hasThreat: false, threats: [], severity: "LOW" } };
  }
}

/**
 * Create a sanitized version of form data
 */
export function sanitizeFormData(
  formData: FormData,
  fieldRules: Record<string, keyof typeof fieldSanitizers>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, sanitizerName] of Object.entries(fieldRules)) {
    const value = formData.get(key);

    if (typeof value === "string") {
      const sanitizer = fieldSanitizers[sanitizerName];
      result[key] = sanitizer ? sanitizer(value) : sanitizeString(value);
    }
  }

  return result;
}

/**
 * Validate and sanitize with Zod schema
 */
export function withSanitization<T>(
  schema: { parse: (data: unknown) => T },
  data: unknown,
  options: SanitizeOptions = {}
): T {
  const sanitized = sanitizeObject(data, options);
  return schema.parse(sanitized);
}
