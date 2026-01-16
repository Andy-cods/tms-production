/**
 * Anomaly Detection System
 * Real-time behavioral analysis and threat detection
 *
 * Features:
 * - Login pattern analysis
 * - API usage monitoring
 * - Velocity checks (rapid actions)
 * - Geographic anomaly detection
 * - Time-based anomaly detection
 * - Risk scoring
 */

import { prisma } from "@/lib/prisma";
import {
  securityLogger,
  SecurityEventType,
  SecurityEventSeverity,
} from "./security-logger";

// =============================================================================
// Configuration
// =============================================================================

const ANOMALY_CONFIG = {
  // Velocity thresholds (actions per minute)
  velocity: {
    login: 3, // Max login attempts per minute
    apiCalls: 100, // Max API calls per minute per user
    dataExport: 2, // Max exports per minute
    passwordReset: 2, // Max password reset requests per minute
    bulkOperations: 5, // Max bulk operations per minute
  },

  // Time-based thresholds
  time: {
    suspiciousHoursStart: 0, // 12 AM
    suspiciousHoursEnd: 5, // 5 AM
    weekendSuspiciousMultiplier: 1.5, // Increase risk on weekends
  },

  // Risk score thresholds
  risk: {
    low: 30,
    medium: 60,
    high: 80,
    critical: 95,
  },

  // Pattern detection
  patterns: {
    maxFailedLoginsPerHour: 10,
    maxUniqueIPsPerDay: 10,
    maxSessionsPerUser: 5,
    dataExfiltrationThresholdMB: 100,
  },
};

// =============================================================================
// In-Memory Tracking (Use Redis in production for distributed systems)
// =============================================================================

interface UserActivity {
  actions: { timestamp: number; type: string; metadata?: Record<string, unknown> }[];
  loginAttempts: { timestamp: number; success: boolean; ip: string }[];
  ips: Set<string>;
  lastSeen: number;
  riskScore: number;
}

interface IPActivity {
  users: Set<string>;
  actions: { timestamp: number; type: string }[];
  failedLogins: number;
  lastSeen: number;
}

const userActivities = new Map<string, UserActivity>();
const ipActivities = new Map<string, IPActivity>();

// Cleanup old data every 5 minutes
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;

  for (const [userId, activity] of userActivities.entries()) {
    if (activity.lastSeen < oneHourAgo) {
      userActivities.delete(userId);
    } else {
      // Clean old actions
      activity.actions = activity.actions.filter((a) => a.timestamp > oneHourAgo);
      activity.loginAttempts = activity.loginAttempts.filter(
        (a) => a.timestamp > oneHourAgo
      );
    }
  }

  for (const [ip, activity] of ipActivities.entries()) {
    if (activity.lastSeen < oneHourAgo) {
      ipActivities.delete(ip);
    } else {
      activity.actions = activity.actions.filter((a) => a.timestamp > oneHourAgo);
    }
  }
}, 5 * 60 * 1000);

// =============================================================================
// Activity Tracking
// =============================================================================

function getUserActivity(userId: string): UserActivity {
  let activity = userActivities.get(userId);
  if (!activity) {
    activity = {
      actions: [],
      loginAttempts: [],
      ips: new Set(),
      lastSeen: Date.now(),
      riskScore: 0,
    };
    userActivities.set(userId, activity);
  }
  return activity;
}

function getIPActivity(ip: string): IPActivity {
  let activity = ipActivities.get(ip);
  if (!activity) {
    activity = {
      users: new Set(),
      actions: [],
      failedLogins: 0,
      lastSeen: Date.now(),
    };
    ipActivities.set(ip, activity);
  }
  return activity;
}

/**
 * Record user action
 */
export function recordAction(
  userId: string,
  actionType: string,
  ip: string,
  metadata?: Record<string, unknown>
): void {
  const now = Date.now();

  // Update user activity
  const userActivity = getUserActivity(userId);
  userActivity.actions.push({ timestamp: now, type: actionType, metadata });
  userActivity.ips.add(ip);
  userActivity.lastSeen = now;

  // Update IP activity
  const ipActivity = getIPActivity(ip);
  ipActivity.users.add(userId);
  ipActivity.actions.push({ timestamp: now, type: actionType });
  ipActivity.lastSeen = now;
}

/**
 * Record login attempt
 */
export function recordLoginAttempt(
  userId: string | null,
  ip: string,
  success: boolean
): void {
  const now = Date.now();

  if (userId) {
    const userActivity = getUserActivity(userId);
    userActivity.loginAttempts.push({ timestamp: now, success, ip });
    userActivity.ips.add(ip);
    userActivity.lastSeen = now;
  }

  const ipActivity = getIPActivity(ip);
  if (!success) {
    ipActivity.failedLogins++;
  }
  ipActivity.lastSeen = now;
}

// =============================================================================
// Anomaly Detection Functions
// =============================================================================

export interface AnomalyResult {
  isAnomaly: boolean;
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  anomalies: AnomalyDetail[];
  recommendations: string[];
}

export interface AnomalyDetail {
  type: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  evidence: Record<string, unknown>;
}

/**
 * Check velocity anomalies (too many actions in short time)
 */
function checkVelocityAnomalies(
  userId: string,
  actionType: string
): AnomalyDetail | null {
  const activity = getUserActivity(userId);
  const oneMinuteAgo = Date.now() - 60 * 1000;

  const recentActions = activity.actions.filter(
    (a) => a.timestamp > oneMinuteAgo && a.type === actionType
  );

  const threshold =
    ANOMALY_CONFIG.velocity[actionType as keyof typeof ANOMALY_CONFIG.velocity] ||
    ANOMALY_CONFIG.velocity.apiCalls;

  if (recentActions.length > threshold) {
    return {
      type: "VELOCITY_ANOMALY",
      severity: recentActions.length > threshold * 2 ? "HIGH" : "MEDIUM",
      description: `Unusual velocity: ${recentActions.length} ${actionType} actions in last minute`,
      evidence: {
        actionType,
        count: recentActions.length,
        threshold,
        windowMs: 60000,
      },
    };
  }

  return null;
}

/**
 * Check login pattern anomalies
 */
function checkLoginAnomalies(userId: string, ip: string): AnomalyDetail[] {
  const anomalies: AnomalyDetail[] = [];
  const activity = getUserActivity(userId);

  // Check failed login count
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const recentFailedLogins = activity.loginAttempts.filter(
    (a) => a.timestamp > oneHourAgo && !a.success
  );

  if (recentFailedLogins.length > ANOMALY_CONFIG.patterns.maxFailedLoginsPerHour) {
    anomalies.push({
      type: "BRUTE_FORCE_ATTEMPT",
      severity: "HIGH",
      description: `${recentFailedLogins.length} failed login attempts in last hour`,
      evidence: {
        failedAttempts: recentFailedLogins.length,
        threshold: ANOMALY_CONFIG.patterns.maxFailedLoginsPerHour,
      },
    });
  }

  // Check for login from new IP
  const knownIPs = new Set(activity.loginAttempts.map((a) => a.ip));
  if (knownIPs.size > 0 && !knownIPs.has(ip)) {
    anomalies.push({
      type: "NEW_IP_LOGIN",
      severity: "LOW",
      description: "Login from previously unseen IP address",
      evidence: {
        newIP: ip,
        knownIPCount: knownIPs.size,
      },
    });
  }

  // Check for too many unique IPs
  if (activity.ips.size > ANOMALY_CONFIG.patterns.maxUniqueIPsPerDay) {
    anomalies.push({
      type: "MULTIPLE_IP_ANOMALY",
      severity: "MEDIUM",
      description: `User accessing from ${activity.ips.size} different IPs`,
      evidence: {
        uniqueIPs: activity.ips.size,
        threshold: ANOMALY_CONFIG.patterns.maxUniqueIPsPerDay,
      },
    });
  }

  return anomalies;
}

/**
 * Check time-based anomalies
 */
function checkTimeAnomalies(): AnomalyDetail | null {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  if (
    hour >= ANOMALY_CONFIG.time.suspiciousHoursStart &&
    hour < ANOMALY_CONFIG.time.suspiciousHoursEnd
  ) {
    return {
      type: "UNUSUAL_TIME_ACCESS",
      severity: isWeekend ? "MEDIUM" : "LOW",
      description: `Access during unusual hours (${hour}:00)`,
      evidence: {
        hour,
        isWeekend,
        suspiciousWindow: `${ANOMALY_CONFIG.time.suspiciousHoursStart}:00 - ${ANOMALY_CONFIG.time.suspiciousHoursEnd}:00`,
      },
    };
  }

  return null;
}

/**
 * Check geographic anomalies
 */
function checkGeoAnomalies(
  userId: string,
  currentCountry?: string,
  previousCountry?: string
): AnomalyDetail | null {
  if (!currentCountry || !previousCountry) return null;

  // Check for impossible travel (different country in short time)
  const activity = getUserActivity(userId);
  const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;

  const recentActions = activity.actions.filter((a) => a.timestamp > thirtyMinutesAgo);

  if (recentActions.length > 0 && currentCountry !== previousCountry) {
    return {
      type: "IMPOSSIBLE_TRAVEL",
      severity: "HIGH",
      description: `Login from ${currentCountry} shortly after activity from ${previousCountry}`,
      evidence: {
        currentCountry,
        previousCountry,
        timeDifferenceMs: Date.now() - recentActions[0].timestamp,
      },
    };
  }

  return null;
}

/**
 * Check IP reputation anomalies
 */
function checkIPAnomalies(ip: string): AnomalyDetail[] {
  const anomalies: AnomalyDetail[] = [];
  const activity = getIPActivity(ip);

  // Check for multiple users from same IP
  if (activity.users.size > 5) {
    anomalies.push({
      type: "SHARED_IP_ANOMALY",
      severity: "LOW",
      description: `Multiple users (${activity.users.size}) accessing from same IP`,
      evidence: {
        userCount: activity.users.size,
        ip,
      },
    });
  }

  // Check for high failed login rate from IP
  if (activity.failedLogins > 20) {
    anomalies.push({
      type: "IP_BRUTE_FORCE",
      severity: "CRITICAL",
      description: `High number of failed logins (${activity.failedLogins}) from IP`,
      evidence: {
        failedLogins: activity.failedLogins,
        ip,
      },
    });
  }

  return anomalies;
}

/**
 * Check data exfiltration patterns
 */
function checkDataExfiltration(userId: string): AnomalyDetail | null {
  const activity = getUserActivity(userId);
  const oneHourAgo = Date.now() - 60 * 60 * 1000;

  const exports = activity.actions.filter(
    (a) => a.timestamp > oneHourAgo && a.type === "DATA_EXPORT"
  );

  const totalSize = exports.reduce(
    (sum, e) => sum + ((e.metadata?.sizeBytes as number) || 0),
    0
  );

  const thresholdBytes = ANOMALY_CONFIG.patterns.dataExfiltrationThresholdMB * 1024 * 1024;

  if (totalSize > thresholdBytes) {
    return {
      type: "DATA_EXFILTRATION",
      severity: "CRITICAL",
      description: `Large data export detected: ${(totalSize / 1024 / 1024).toFixed(2)} MB`,
      evidence: {
        exportCount: exports.length,
        totalSizeMB: totalSize / 1024 / 1024,
        thresholdMB: ANOMALY_CONFIG.patterns.dataExfiltrationThresholdMB,
      },
    };
  }

  return null;
}

// =============================================================================
// Risk Scoring
// =============================================================================

/**
 * Calculate risk score from anomalies
 */
function calculateRiskScore(anomalies: AnomalyDetail[]): number {
  const severityScores: Record<string, number> = {
    LOW: 10,
    MEDIUM: 25,
    HIGH: 45,
    CRITICAL: 70,
  };

  let score = 0;
  for (const anomaly of anomalies) {
    score += severityScores[anomaly.severity] || 10;
  }

  // Cap at 100
  return Math.min(100, score);
}

/**
 * Get risk level from score
 */
function getRiskLevel(score: number): AnomalyResult["riskLevel"] {
  if (score >= ANOMALY_CONFIG.risk.critical) return "CRITICAL";
  if (score >= ANOMALY_CONFIG.risk.high) return "HIGH";
  if (score >= ANOMALY_CONFIG.risk.medium) return "MEDIUM";
  return "LOW";
}

/**
 * Generate recommendations based on anomalies
 */
function generateRecommendations(anomalies: AnomalyDetail[]): string[] {
  const recommendations: string[] = [];
  const types = new Set(anomalies.map((a) => a.type));

  if (types.has("BRUTE_FORCE_ATTEMPT") || types.has("IP_BRUTE_FORCE")) {
    recommendations.push("Consider implementing account lockout");
    recommendations.push("Enable 2FA for affected accounts");
  }

  if (types.has("IMPOSSIBLE_TRAVEL")) {
    recommendations.push("Verify user identity through secondary channel");
    recommendations.push("Consider blocking the session");
  }

  if (types.has("DATA_EXFILTRATION")) {
    recommendations.push("Review exported data for sensitive content");
    recommendations.push("Consider revoking user access temporarily");
  }

  if (types.has("UNUSUAL_TIME_ACCESS")) {
    recommendations.push("Verify if access is expected");
  }

  if (types.has("VELOCITY_ANOMALY")) {
    recommendations.push("Consider implementing stricter rate limits");
  }

  return recommendations;
}

// =============================================================================
// Main Analysis Functions
// =============================================================================

/**
 * Analyze user behavior for anomalies
 */
export async function analyzeUserBehavior(
  userId: string,
  ip: string,
  actionType: string,
  metadata?: {
    country?: string;
    previousCountry?: string;
    userAgent?: string;
  }
): Promise<AnomalyResult> {
  const anomalies: AnomalyDetail[] = [];

  // Record the action
  recordAction(userId, actionType, ip, metadata);

  // Check various anomaly types
  const velocityAnomaly = checkVelocityAnomalies(userId, actionType);
  if (velocityAnomaly) anomalies.push(velocityAnomaly);

  const loginAnomalies = checkLoginAnomalies(userId, ip);
  anomalies.push(...loginAnomalies);

  const timeAnomaly = checkTimeAnomalies();
  if (timeAnomaly) anomalies.push(timeAnomaly);

  const geoAnomaly = checkGeoAnomalies(
    userId,
    metadata?.country,
    metadata?.previousCountry
  );
  if (geoAnomaly) anomalies.push(geoAnomaly);

  const ipAnomalies = checkIPAnomalies(ip);
  anomalies.push(...ipAnomalies);

  const exfilAnomaly = checkDataExfiltration(userId);
  if (exfilAnomaly) anomalies.push(exfilAnomaly);

  // Calculate risk
  const riskScore = calculateRiskScore(anomalies);
  const riskLevel = getRiskLevel(riskScore);
  const recommendations = generateRecommendations(anomalies);

  // Update user's risk score
  const userActivity = getUserActivity(userId);
  userActivity.riskScore = riskScore;

  // Log if significant anomalies detected
  if (riskLevel === "HIGH" || riskLevel === "CRITICAL") {
    await securityLogger.log({
      type: SecurityEventType.THREAT_SUSPICIOUS_PATTERN,
      severity:
        riskLevel === "CRITICAL"
          ? SecurityEventSeverity.CRITICAL
          : SecurityEventSeverity.HIGH,
      userId,
      ipAddress: ip,
      outcome: "WARNING",
      details: {
        riskScore,
        riskLevel,
        anomalyCount: anomalies.length,
        anomalyTypes: anomalies.map((a) => a.type),
        recommendations,
      },
    });
  }

  return {
    isAnomaly: anomalies.length > 0,
    riskScore,
    riskLevel,
    anomalies,
    recommendations,
  };
}

/**
 * Analyze login attempt
 */
export async function analyzeLogin(
  userId: string | null,
  ip: string,
  success: boolean,
  metadata?: {
    email?: string;
    country?: string;
    userAgent?: string;
  }
): Promise<AnomalyResult> {
  // Record login attempt
  recordLoginAttempt(userId, ip, success);

  const anomalies: AnomalyDetail[] = [];

  // Check IP-based anomalies
  const ipAnomalies = checkIPAnomalies(ip);
  anomalies.push(...ipAnomalies);

  // Check time-based anomalies
  const timeAnomaly = checkTimeAnomalies();
  if (timeAnomaly) anomalies.push(timeAnomaly);

  // If we have a userId, check user-specific anomalies
  if (userId) {
    const loginAnomalies = checkLoginAnomalies(userId, ip);
    anomalies.push(...loginAnomalies);
  }

  // Failed login specific checks
  if (!success) {
    const ipActivity = getIPActivity(ip);

    // Check for credential stuffing (many different usernames from same IP)
    if (ipActivity.failedLogins > 10) {
      anomalies.push({
        type: "CREDENTIAL_STUFFING",
        severity: "HIGH",
        description: "Possible credential stuffing attack detected",
        evidence: {
          failedAttempts: ipActivity.failedLogins,
          ip,
        },
      });
    }
  }

  const riskScore = calculateRiskScore(anomalies);
  const riskLevel = getRiskLevel(riskScore);
  const recommendations = generateRecommendations(anomalies);

  // Log significant anomalies
  if (riskLevel === "HIGH" || riskLevel === "CRITICAL") {
    await securityLogger.log({
      type: success
        ? SecurityEventType.AUTH_LOGIN_SUCCESS
        : SecurityEventType.AUTH_LOGIN_FAILURE,
      severity:
        riskLevel === "CRITICAL"
          ? SecurityEventSeverity.CRITICAL
          : SecurityEventSeverity.HIGH,
      userId,
      userEmail: metadata?.email,
      ipAddress: ip,
      outcome: success ? "WARNING" : "BLOCKED",
      details: {
        riskScore,
        riskLevel,
        anomalyTypes: anomalies.map((a) => a.type),
        isAnomalousLogin: true,
      },
    });
  }

  return {
    isAnomaly: anomalies.length > 0,
    riskScore,
    riskLevel,
    anomalies,
    recommendations,
  };
}

/**
 * Get user's current risk profile
 */
export function getUserRiskProfile(userId: string): {
  riskScore: number;
  riskLevel: AnomalyResult["riskLevel"];
  recentActivityCount: number;
  uniqueIPs: number;
} {
  const activity = userActivities.get(userId);

  if (!activity) {
    return {
      riskScore: 0,
      riskLevel: "LOW",
      recentActivityCount: 0,
      uniqueIPs: 0,
    };
  }

  return {
    riskScore: activity.riskScore,
    riskLevel: getRiskLevel(activity.riskScore),
    recentActivityCount: activity.actions.length,
    uniqueIPs: activity.ips.size,
  };
}

/**
 * Get IP reputation
 */
export function getIPReputation(ip: string): {
  failedLogins: number;
  uniqueUsers: number;
  riskLevel: AnomalyResult["riskLevel"];
} {
  const activity = ipActivities.get(ip);

  if (!activity) {
    return {
      failedLogins: 0,
      uniqueUsers: 0,
      riskLevel: "LOW",
    };
  }

  let riskScore = 0;
  if (activity.failedLogins > 20) riskScore += 50;
  else if (activity.failedLogins > 10) riskScore += 30;
  else if (activity.failedLogins > 5) riskScore += 15;

  if (activity.users.size > 10) riskScore += 20;

  return {
    failedLogins: activity.failedLogins,
    uniqueUsers: activity.users.size,
    riskLevel: getRiskLevel(riskScore),
  };
}

/**
 * Clear user activity (for testing or after password reset)
 */
export function clearUserActivity(userId: string): void {
  userActivities.delete(userId);
}

/**
 * Block an IP temporarily
 */
const blockedIPs = new Map<string, number>();

export function blockIP(ip: string, durationMs: number = 60 * 60 * 1000): void {
  blockedIPs.set(ip, Date.now() + durationMs);
}

export function isIPBlocked(ip: string): boolean {
  const blockedUntil = blockedIPs.get(ip);
  if (!blockedUntil) return false;

  if (Date.now() > blockedUntil) {
    blockedIPs.delete(ip);
    return false;
  }

  return true;
}

export function unblockIP(ip: string): void {
  blockedIPs.delete(ip);
}
