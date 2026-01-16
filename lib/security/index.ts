/**
 * Security Module Index
 * Enterprise-grade security for TMS
 *
 * Compliance: OWASP ASVS L2, ISO 27001, SOC 2
 *
 * @module security
 */

// =============================================================================
// Security Event Logging
// =============================================================================
export {
  securityLogger,
  SecurityEventType,
  SecurityEventSeverity,
  getClientIP,
  getUserAgent,
  type SecurityEventData,
} from "./security-logger";

// =============================================================================
// Encryption & Key Management
// =============================================================================
export {
  encrypt,
  decrypt,
  encryptPII,
  decryptPII,
  reEncrypt,
  isEncrypted,
  needsReEncryption,
  getEncryptionStatus,
  keyManager,
} from "./key-rotation";

// =============================================================================
// Password Policy
// =============================================================================
export {
  passwordSchema,
  calculatePasswordStrength,
  checkPasswordBreach,
  checkPasswordHistory,
  addToPasswordHistory,
  isPasswordExpired,
  validatePassword,
  hashPassword,
  verifyPassword,
  getPasswordPolicy,
} from "./password-policy";

// =============================================================================
// Rate Limiting
// =============================================================================
export {
  RateLimitTiers,
  checkRateLimit,
  createRateLimitHeaders,
  rateLimitMiddleware,
  withRateLimit,
  getRateLimitStatus,
  clearRateLimit,
  getRateLimitStats,
  type RateLimitResult,
} from "./rate-limiter";

// =============================================================================
// Security Headers
// =============================================================================
export {
  getSecurityHeaders,
  applySecurityHeaders,
  securityHeadersMiddleware,
  getCORSHeaders,
  generateSecurityTxt,
  generateRobotsTxt,
} from "./headers";

// =============================================================================
// Request Signing
// =============================================================================
export {
  signRequest,
  verifySignedRequest,
  requireSignedRequest,
  requiresSignedRequest,
  SIGNED_OPERATIONS,
  getClientSigningCode,
} from "./request-signing";

// =============================================================================
// CRON Authentication
// =============================================================================
export { verifyCronAuth } from "./cron-auth";

// =============================================================================
// Input Sanitization
// =============================================================================
export {
  sanitizeString,
  sanitizeNumber,
  sanitizeBoolean,
  sanitizeArray,
  sanitizeObject,
  sanitizeRequestBody,
  sanitizeFormData,
  withSanitization,
  detectThreats,
  fieldSanitizers,
  type SanitizeOptions,
  type ThreatDetectionResult,
} from "./input-sanitizer";

// =============================================================================
// Anomaly Detection
// =============================================================================
export {
  analyzeUserBehavior,
  analyzeLogin,
  recordAction,
  recordLoginAttempt,
  getUserRiskProfile,
  getIPReputation,
  clearUserActivity,
  blockIP,
  isIPBlocked,
  unblockIP,
  type AnomalyResult,
  type AnomalyDetail,
} from "./anomaly-detection";

// =============================================================================
// Edge Middleware Utilities
// =============================================================================
export {
  applySecurityHeaders as applyEdgeSecurityHeaders,
  detectSuspiciousRequest,
  detectBot,
  checkGeoBlock,
  getRequestId,
  getClientInfo,
  runSecurityCheck,
  createSecurityMiddleware,
  withSecurityHeaders,
  type ClientInfo,
  type SecurityCheckResult,
  type SecurityMiddlewareOptions,
} from "./middleware";

// =============================================================================
// Quick Security Checks
// =============================================================================

/**
 * Check if environment is properly configured for production security
 */
export function validateSecurityConfig(): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Critical checks
  if (!process.env.NEXTAUTH_SECRET) {
    errors.push("NEXTAUTH_SECRET is not set");
  }

  if (!process.env.PII_ENCRYPTION_KEY) {
    if (process.env.NODE_ENV === "production") {
      errors.push("PII_ENCRYPTION_KEY is not set (required for production)");
    } else {
      warnings.push("PII_ENCRYPTION_KEY is not set (PII will be unencrypted)");
    }
  }

  if (!process.env.CRON_SECRET) {
    warnings.push("CRON_SECRET is not set (cron jobs will fail)");
  }

  // Telegram security
  if (process.env.TELEGRAM_BOT_TOKEN && !process.env.TELEGRAM_WEBHOOK_SECRET) {
    if (process.env.NODE_ENV === "production") {
      errors.push("TELEGRAM_WEBHOOK_SECRET required when using Telegram bot");
    } else {
      warnings.push("TELEGRAM_WEBHOOK_SECRET not set (webhook unprotected)");
    }
  }

  // Database
  if (!process.env.DATABASE_URL) {
    errors.push("DATABASE_URL is not set");
  } else if (
    process.env.NODE_ENV === "production" &&
    !process.env.DATABASE_URL.includes("sslmode=require")
  ) {
    warnings.push("DATABASE_URL should use SSL in production");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Security configuration summary for logging
 */
export function getSecuritySummary(): Record<string, boolean | string> {
  return {
    hasAuthSecret: !!process.env.NEXTAUTH_SECRET,
    hasEncryptionKey: !!process.env.PII_ENCRYPTION_KEY,
    hasCronSecret: !!process.env.CRON_SECRET,
    hasTelegramWebhookSecret: !!process.env.TELEGRAM_WEBHOOK_SECRET,
    hasSIEMEndpoint: !!process.env.SIEM_ENDPOINT,
    nodeEnv: process.env.NODE_ENV || "development",
    isProduction: process.env.NODE_ENV === "production",
  };
}
