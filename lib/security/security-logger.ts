/**
 * Security Event Logger
 * Enterprise-grade security event logging for compliance and monitoring
 *
 * Supports: SIEM integration, alerting, audit trails
 * Compliant with: ISO 27001, SOC 2, GDPR logging requirements
 */

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Security event types following OWASP logging guidelines
export enum SecurityEventType {
  // Authentication events
  AUTH_LOGIN_SUCCESS = "AUTH_LOGIN_SUCCESS",
  AUTH_LOGIN_FAILURE = "AUTH_LOGIN_FAILURE",
  AUTH_LOGOUT = "AUTH_LOGOUT",
  AUTH_PASSWORD_CHANGE = "AUTH_PASSWORD_CHANGE",
  AUTH_PASSWORD_RESET_REQUEST = "AUTH_PASSWORD_RESET_REQUEST",
  AUTH_PASSWORD_RESET_COMPLETE = "AUTH_PASSWORD_RESET_COMPLETE",
  AUTH_2FA_ENABLED = "AUTH_2FA_ENABLED",
  AUTH_2FA_DISABLED = "AUTH_2FA_DISABLED",
  AUTH_2FA_SUCCESS = "AUTH_2FA_SUCCESS",
  AUTH_2FA_FAILURE = "AUTH_2FA_FAILURE",
  AUTH_SESSION_EXPIRED = "AUTH_SESSION_EXPIRED",
  AUTH_SESSION_REVOKED = "AUTH_SESSION_REVOKED",

  // Account security events
  ACCOUNT_LOCKOUT = "ACCOUNT_LOCKOUT",
  ACCOUNT_UNLOCK = "ACCOUNT_UNLOCK",
  ACCOUNT_CREATED = "ACCOUNT_CREATED",
  ACCOUNT_DELETED = "ACCOUNT_DELETED",
  ACCOUNT_ROLE_CHANGED = "ACCOUNT_ROLE_CHANGED",
  ACCOUNT_PERMISSIONS_CHANGED = "ACCOUNT_PERMISSIONS_CHANGED",

  // Access control events
  ACCESS_DENIED = "ACCESS_DENIED",
  ACCESS_PRIVILEGE_ESCALATION_ATTEMPT = "ACCESS_PRIVILEGE_ESCALATION_ATTEMPT",
  ACCESS_RESOURCE_NOT_FOUND = "ACCESS_RESOURCE_NOT_FOUND",
  ACCESS_UNAUTHORIZED_RESOURCE = "ACCESS_UNAUTHORIZED_RESOURCE",

  // Data events
  DATA_EXPORT = "DATA_EXPORT",
  DATA_BULK_DELETE = "DATA_BULK_DELETE",
  DATA_SENSITIVE_ACCESS = "DATA_SENSITIVE_ACCESS",
  DATA_PII_ACCESS = "DATA_PII_ACCESS",

  // API security events
  API_RATE_LIMIT_EXCEEDED = "API_RATE_LIMIT_EXCEEDED",
  API_INVALID_TOKEN = "API_INVALID_TOKEN",
  API_SUSPICIOUS_REQUEST = "API_SUSPICIOUS_REQUEST",
  API_CRON_AUTH_FAILURE = "API_CRON_AUTH_FAILURE",
  API_WEBHOOK_AUTH_FAILURE = "API_WEBHOOK_AUTH_FAILURE",

  // System events
  SYSTEM_CONFIG_CHANGE = "SYSTEM_CONFIG_CHANGE",
  SYSTEM_ENCRYPTION_KEY_ROTATED = "SYSTEM_ENCRYPTION_KEY_ROTATED",
  SYSTEM_SECURITY_SCAN = "SYSTEM_SECURITY_SCAN",

  // Threat detection
  THREAT_BRUTE_FORCE_DETECTED = "THREAT_BRUTE_FORCE_DETECTED",
  THREAT_INJECTION_ATTEMPT = "THREAT_INJECTION_ATTEMPT",
  THREAT_XSS_ATTEMPT = "THREAT_XSS_ATTEMPT",
  THREAT_SUSPICIOUS_PATTERN = "THREAT_SUSPICIOUS_PATTERN",
}

export enum SecurityEventSeverity {
  INFO = "INFO",
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export interface SecurityEventData {
  type: SecurityEventType;
  severity: SecurityEventSeverity;
  userId?: string | null;
  userEmail?: string | null;
  userRole?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  resource?: string | null;
  resourceId?: string | null;
  action?: string | null;
  outcome: "SUCCESS" | "FAILURE" | "BLOCKED" | "WARNING";
  details?: Record<string, any>;
  requestId?: string | null;
}

// Severity mapping for automatic classification
const eventSeverityMap: Partial<Record<SecurityEventType, SecurityEventSeverity>> = {
  [SecurityEventType.AUTH_LOGIN_FAILURE]: SecurityEventSeverity.LOW,
  [SecurityEventType.ACCOUNT_LOCKOUT]: SecurityEventSeverity.MEDIUM,
  [SecurityEventType.ACCESS_DENIED]: SecurityEventSeverity.LOW,
  [SecurityEventType.ACCESS_PRIVILEGE_ESCALATION_ATTEMPT]: SecurityEventSeverity.CRITICAL,
  [SecurityEventType.API_RATE_LIMIT_EXCEEDED]: SecurityEventSeverity.MEDIUM,
  [SecurityEventType.THREAT_BRUTE_FORCE_DETECTED]: SecurityEventSeverity.HIGH,
  [SecurityEventType.THREAT_INJECTION_ATTEMPT]: SecurityEventSeverity.CRITICAL,
  [SecurityEventType.THREAT_XSS_ATTEMPT]: SecurityEventSeverity.CRITICAL,
  [SecurityEventType.SYSTEM_ENCRYPTION_KEY_ROTATED]: SecurityEventSeverity.HIGH,
  [SecurityEventType.ACCOUNT_ROLE_CHANGED]: SecurityEventSeverity.MEDIUM,
  [SecurityEventType.DATA_BULK_DELETE]: SecurityEventSeverity.HIGH,
  [SecurityEventType.DATA_EXPORT]: SecurityEventSeverity.MEDIUM,
};

class SecurityLogger {
  private static instance: SecurityLogger;
  private alertThresholds: Map<SecurityEventType, number> = new Map();
  private eventCounts: Map<string, { count: number; firstSeen: Date }> = new Map();

  private constructor() {
    // Set alert thresholds for specific events
    this.alertThresholds.set(SecurityEventType.AUTH_LOGIN_FAILURE, 5);
    this.alertThresholds.set(SecurityEventType.API_RATE_LIMIT_EXCEEDED, 10);
    this.alertThresholds.set(SecurityEventType.ACCESS_DENIED, 10);
  }

  public static getInstance(): SecurityLogger {
    if (!SecurityLogger.instance) {
      SecurityLogger.instance = new SecurityLogger();
    }
    return SecurityLogger.instance;
  }

  /**
   * Log a security event
   */
  async log(event: SecurityEventData): Promise<void> {
    const timestamp = new Date();
    const severity = event.severity || eventSeverityMap[event.type] || SecurityEventSeverity.INFO;

    // Sanitize sensitive data from details
    const sanitizedDetails = this.sanitizeDetails(event.details);

    // Create log entry
    const logEntry = {
      timestamp: timestamp.toISOString(),
      type: event.type,
      severity,
      userId: event.userId,
      userEmail: this.maskEmail(event.userEmail),
      userRole: event.userRole,
      ipAddress: event.ipAddress,
      userAgent: this.truncateUserAgent(event.userAgent),
      resource: event.resource,
      resourceId: event.resourceId,
      action: event.action,
      outcome: event.outcome,
      details: sanitizedDetails,
      requestId: event.requestId,
    };

    // Console log for development and immediate visibility
    this.consoleLog(logEntry);

    // Store in database for audit trail
    await this.persistLog(logEntry);

    // Check for alert conditions
    await this.checkAlertConditions(event, severity);

    // Send to SIEM if configured
    await this.sendToSIEM(logEntry);
  }

  /**
   * Quick logging methods for common events
   */
  async logLoginSuccess(userId: string, email: string, ip?: string, userAgent?: string): Promise<void> {
    await this.log({
      type: SecurityEventType.AUTH_LOGIN_SUCCESS,
      severity: SecurityEventSeverity.INFO,
      userId,
      userEmail: email,
      ipAddress: ip,
      userAgent,
      outcome: "SUCCESS",
    });
  }

  async logLoginFailure(email: string, reason: string, ip?: string, userAgent?: string): Promise<void> {
    await this.log({
      type: SecurityEventType.AUTH_LOGIN_FAILURE,
      severity: SecurityEventSeverity.LOW,
      userEmail: email,
      ipAddress: ip,
      userAgent,
      outcome: "FAILURE",
      details: { reason },
    });
  }

  async logAccessDenied(
    userId: string | null,
    resource: string,
    action: string,
    ip?: string
  ): Promise<void> {
    await this.log({
      type: SecurityEventType.ACCESS_DENIED,
      severity: SecurityEventSeverity.LOW,
      userId,
      resource,
      action,
      ipAddress: ip,
      outcome: "BLOCKED",
    });
  }

  async logRateLimitExceeded(ip: string, endpoint: string, limit: number): Promise<void> {
    await this.log({
      type: SecurityEventType.API_RATE_LIMIT_EXCEEDED,
      severity: SecurityEventSeverity.MEDIUM,
      ipAddress: ip,
      resource: endpoint,
      outcome: "BLOCKED",
      details: { limit, endpoint },
    });
  }

  async logSuspiciousActivity(
    type: SecurityEventType,
    details: Record<string, any>,
    ip?: string,
    userId?: string
  ): Promise<void> {
    await this.log({
      type,
      severity: SecurityEventSeverity.HIGH,
      userId,
      ipAddress: ip,
      outcome: "WARNING",
      details,
    });
  }

  async logAccountLockout(userId: string, email: string, reason: string, ip?: string): Promise<void> {
    await this.log({
      type: SecurityEventType.ACCOUNT_LOCKOUT,
      severity: SecurityEventSeverity.MEDIUM,
      userId,
      userEmail: email,
      ipAddress: ip,
      outcome: "BLOCKED",
      details: { reason },
    });
  }

  async logPrivilegeChange(
    adminId: string,
    targetUserId: string,
    oldRole: string,
    newRole: string
  ): Promise<void> {
    await this.log({
      type: SecurityEventType.ACCOUNT_ROLE_CHANGED,
      severity: SecurityEventSeverity.MEDIUM,
      userId: adminId,
      resourceId: targetUserId,
      outcome: "SUCCESS",
      details: { oldRole, newRole, changedBy: adminId },
    });
  }

  async logDataExport(userId: string, dataType: string, recordCount: number): Promise<void> {
    await this.log({
      type: SecurityEventType.DATA_EXPORT,
      severity: SecurityEventSeverity.MEDIUM,
      userId,
      resource: dataType,
      outcome: "SUCCESS",
      details: { recordCount, dataType },
    });
  }

  /**
   * Private helper methods
   */
  private sanitizeDetails(details?: Record<string, any>): Record<string, any> | undefined {
    if (!details) return undefined;

    const sensitiveKeys = ["password", "secret", "token", "key", "credential", "apiKey"];
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(details)) {
      if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
        sanitized[key] = "[REDACTED]";
      } else if (typeof value === "string" && value.length > 500) {
        sanitized[key] = value.substring(0, 500) + "...[TRUNCATED]";
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private maskEmail(email?: string | null): string | null {
    if (!email) return null;
    const [local, domain] = email.split("@");
    if (!domain) return email;
    const maskedLocal = local.length > 2
      ? local[0] + "*".repeat(local.length - 2) + local[local.length - 1]
      : local;
    return `${maskedLocal}@${domain}`;
  }

  private truncateUserAgent(userAgent?: string | null): string | null {
    if (!userAgent) return null;
    return userAgent.length > 200 ? userAgent.substring(0, 200) + "..." : userAgent;
  }

  private consoleLog(entry: any): void {
    const icon = this.getSeverityIcon(entry.severity);
    const color = this.getSeverityColor(entry.severity);

    console.log(
      `${icon} [SECURITY] [${entry.severity}] ${entry.type} - ${entry.outcome}`,
      {
        timestamp: entry.timestamp,
        user: entry.userEmail || entry.userId || "anonymous",
        ip: entry.ipAddress || "unknown",
        resource: entry.resource,
        details: entry.details,
      }
    );
  }

  private getSeverityIcon(severity: SecurityEventSeverity): string {
    switch (severity) {
      case SecurityEventSeverity.CRITICAL: return "🚨";
      case SecurityEventSeverity.HIGH: return "🔴";
      case SecurityEventSeverity.MEDIUM: return "🟠";
      case SecurityEventSeverity.LOW: return "🟡";
      default: return "🔵";
    }
  }

  private getSeverityColor(severity: SecurityEventSeverity): string {
    switch (severity) {
      case SecurityEventSeverity.CRITICAL: return "\x1b[31m";
      case SecurityEventSeverity.HIGH: return "\x1b[31m";
      case SecurityEventSeverity.MEDIUM: return "\x1b[33m";
      case SecurityEventSeverity.LOW: return "\x1b[33m";
      default: return "\x1b[36m";
    }
  }

  private async persistLog(entry: any): Promise<void> {
    try {
      // Store in AuditLog table with security event type
      await prisma.auditLog.create({
        data: {
          userId: entry.userId,
          action: `SECURITY:${entry.type}`,
          entity: "SecurityEvent",
          entityId: entry.resourceId || entry.requestId || "system",
          oldValue: Prisma.JsonNull,
          newValue: {
            severity: entry.severity,
            outcome: entry.outcome,
            ipAddress: entry.ipAddress,
            userAgent: entry.userAgent,
            resource: entry.resource,
            details: entry.details,
          },
        },
      });
    } catch (error) {
      // Don't throw - logging should never break the application
      console.error("[SecurityLogger] Failed to persist log:", error);
    }
  }

  private async checkAlertConditions(
    event: SecurityEventData,
    severity: SecurityEventSeverity
  ): Promise<void> {
    // Immediate alert for critical events
    if (severity === SecurityEventSeverity.CRITICAL) {
      await this.sendAlert(event, "CRITICAL security event detected");
      return;
    }

    // Threshold-based alerting
    const threshold = this.alertThresholds.get(event.type);
    if (threshold) {
      const key = `${event.type}:${event.ipAddress || "global"}`;
      const record = this.eventCounts.get(key) || { count: 0, firstSeen: new Date() };

      record.count++;
      this.eventCounts.set(key, record);

      // Reset after 1 hour
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (record.firstSeen < hourAgo) {
        record.count = 1;
        record.firstSeen = new Date();
      }

      if (record.count >= threshold) {
        await this.sendAlert(
          event,
          `Threshold exceeded: ${record.count} occurrences of ${event.type} in last hour`
        );
        // Reset after alert
        this.eventCounts.delete(key);
      }
    }
  }

  private async sendAlert(event: SecurityEventData, message: string): Promise<void> {
    console.error(`🚨 SECURITY ALERT: ${message}`, {
      event: event.type,
      severity: event.severity,
      user: event.userEmail || event.userId,
      ip: event.ipAddress,
    });

    // TODO: Integrate with alerting system (Slack, PagerDuty, email, etc.)
    // Example:
    // await slackWebhook.send({ text: message, ... });
    // await pagerduty.trigger({ ... });
  }

  private async sendToSIEM(entry: any): Promise<void> {
    const siemEndpoint = process.env.SIEM_ENDPOINT;
    if (!siemEndpoint) return;

    try {
      // Send to SIEM in CEF (Common Event Format) or JSON
      await fetch(siemEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...entry,
          source: "TMS",
          version: "1.0",
        }),
      });
    } catch (error) {
      console.error("[SecurityLogger] Failed to send to SIEM:", error);
    }
  }
}

// Export singleton instance
export const securityLogger = SecurityLogger.getInstance();

// Export helper for getting client IP
export function getClientIP(request: Request): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }
  return null;
}

// Export helper for getting user agent
export function getUserAgent(request: Request): string | null {
  return request.headers.get("user-agent");
}
