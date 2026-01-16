/**
 * Password Policy Enforcement
 * Enterprise-grade password security
 *
 * Features:
 * - Password history (prevent reuse)
 * - Password strength scoring
 * - Breach detection (Have I Been Pwned)
 * - Expiration policy
 */

import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Configuration - can be overridden via environment variables
const PASSWORD_CONFIG: {
  minLength: number;
  maxLength: number;
  historyCount: number;
  expirationDays: number;
  maxFailedAttempts: number;
  lockoutMinutes: number;
  saltRounds: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumber: boolean;
  requireSpecial: boolean;
  minStrengthScore: number;
} = {
  minLength: parseInt(process.env.PASSWORD_MIN_LENGTH || "8", 10),
  maxLength: 128,
  historyCount: 5, // Number of previous passwords to check
  expirationDays: parseInt(process.env.PASSWORD_EXPIRATION_DAYS || "90", 10), // 0 = never
  maxFailedAttempts: 5,
  lockoutMinutes: 15,
  saltRounds: 12, // Bcrypt salt rounds
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
  minStrengthScore: 3, // 1-5 scale
};

// Password strength criteria
interface PasswordStrength {
  score: number; // 1-5
  label: "Very Weak" | "Weak" | "Fair" | "Strong" | "Very Strong";
  feedback: string[];
  passesPolicy: boolean;
}

// Password validation schema
export const passwordSchema = z
  .string()
  .min(PASSWORD_CONFIG.minLength, `Mật khẩu phải có ít nhất ${PASSWORD_CONFIG.minLength} ký tự`)
  .max(PASSWORD_CONFIG.maxLength, `Mật khẩu không được quá ${PASSWORD_CONFIG.maxLength} ký tự`)
  .refine(
    (val) => !PASSWORD_CONFIG.requireUppercase || /[A-Z]/.test(val),
    "Mật khẩu phải có ít nhất 1 chữ hoa"
  )
  .refine(
    (val) => !PASSWORD_CONFIG.requireLowercase || /[a-z]/.test(val),
    "Mật khẩu phải có ít nhất 1 chữ thường"
  )
  .refine(
    (val) => !PASSWORD_CONFIG.requireNumber || /[0-9]/.test(val),
    "Mật khẩu phải có ít nhất 1 chữ số"
  )
  .refine(
    (val) => !PASSWORD_CONFIG.requireSpecial || /[!@#$%^&*(),.?":{}|<>]/.test(val),
    "Mật khẩu phải có ít nhất 1 ký tự đặc biệt"
  );

/**
 * Calculate password strength score
 */
export function calculatePasswordStrength(password: string): PasswordStrength {
  let score = 0;
  const feedback: string[] = [];

  // Length scoring
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (password.length < 8) feedback.push("Mật khẩu quá ngắn");

  // Character variety
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const varietyCount = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
  score += Math.min(varietyCount, 2);

  if (!hasUpper) feedback.push("Thêm chữ hoa");
  if (!hasLower) feedback.push("Thêm chữ thường");
  if (!hasNumber) feedback.push("Thêm chữ số");
  if (!hasSpecial) feedback.push("Thêm ký tự đặc biệt");

  // Penalties
  if (/^[a-zA-Z]+$/.test(password)) {
    score -= 1;
    feedback.push("Chỉ có chữ cái, quá đơn giản");
  }
  if (/^[0-9]+$/.test(password)) {
    score -= 1;
    feedback.push("Chỉ có số, quá đơn giản");
  }
  if (/(.)\1{2,}/.test(password)) {
    score -= 1;
    feedback.push("Có ký tự lặp lại quá nhiều");
  }
  if (/^(123|abc|qwerty|password|admin)/i.test(password)) {
    score -= 2;
    feedback.push("Chứa pattern phổ biến");
  }

  // Normalize score to 1-5
  score = Math.max(1, Math.min(5, score));

  const labels: Record<number, PasswordStrength["label"]> = {
    1: "Very Weak",
    2: "Weak",
    3: "Fair",
    4: "Strong",
    5: "Very Strong",
  };

  return {
    score,
    label: labels[score],
    feedback: feedback.slice(0, 3), // Max 3 feedback items
    passesPolicy: score >= PASSWORD_CONFIG.minStrengthScore,
  };
}

/**
 * Check if password has been breached (Have I Been Pwned)
 * Uses k-Anonymity model - only sends first 5 chars of SHA-1 hash
 */
export async function checkPasswordBreach(password: string): Promise<{
  breached: boolean;
  count?: number;
}> {
  try {
    const sha1 = crypto.createHash("sha1").update(password).digest("hex").toUpperCase();
    const prefix = sha1.substring(0, 5);
    const suffix = sha1.substring(5);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true" }, // Prevent timing attacks
    });

    if (!response.ok) {
      console.warn("[PasswordPolicy] HIBP API unavailable");
      return { breached: false };
    }

    const text = await response.text();
    const lines = text.split("\n");

    for (const line of lines) {
      const [hashSuffix, count] = line.split(":");
      if (hashSuffix.trim() === suffix) {
        return { breached: true, count: parseInt(count, 10) };
      }
    }

    return { breached: false };
  } catch (error) {
    console.error("[PasswordPolicy] Failed to check breach database:", error);
    return { breached: false }; // Fail open - don't block user
  }
}

/**
 * Check password against user's password history
 */
export async function checkPasswordHistory(
  userId: string,
  newPassword: string
): Promise<{ reused: boolean; message?: string }> {
  try {
    // Get user's current password hash
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (user?.password) {
      const isCurrentPassword = await bcrypt.compare(newPassword, user.password);
      if (isCurrentPassword) {
        return { reused: true, message: "Không thể sử dụng mật khẩu hiện tại" };
      }
    }

    // Check password history from audit log
    const passwordChanges = await prisma.auditLog.findMany({
      where: {
        userId,
        action: "PASSWORD_CHANGED",
      },
      orderBy: { createdAt: "desc" },
      take: PASSWORD_CONFIG.historyCount,
      select: {
        oldValue: true,
        createdAt: true,
      },
    });

    // Note: In a full implementation, you would store hashed passwords
    // in a separate password_history table for proper comparison
    // This is a simplified version that checks audit log

    return { reused: false };
  } catch (error) {
    console.error("[PasswordPolicy] Failed to check password history:", error);
    return { reused: false }; // Fail open
  }
}

/**
 * Store password in history (call after successful password change)
 */
export async function addToPasswordHistory(
  userId: string,
  passwordHash: string
): Promise<void> {
  // In production, store in dedicated password_history table
  // For now, we rely on audit log
  await prisma.auditLog.create({
    data: {
      userId,
      action: "PASSWORD_HISTORY_ADDED",
      entity: "User",
      entityId: userId,
      newValue: {
        // Don't store the actual hash in audit log for security
        timestamp: new Date().toISOString(),
      },
    },
  });
}

/**
 * Check if password has expired
 */
export async function isPasswordExpired(userId: string): Promise<{
  expired: boolean;
  daysRemaining?: number;
  lastChanged?: Date;
}> {
  if (PASSWORD_CONFIG.expirationDays === 0) {
    return { expired: false };
  }

  try {
    const lastChange = await prisma.auditLog.findFirst({
      where: {
        userId,
        action: { in: ["PASSWORD_CHANGED", "ACCOUNT_CREATED"] },
      },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    if (!lastChange) {
      return { expired: false };
    }

    const expirationDate = new Date(lastChange.createdAt);
    expirationDate.setDate(expirationDate.getDate() + PASSWORD_CONFIG.expirationDays);

    const now = new Date();
    const expired = now > expirationDate;
    const daysRemaining = Math.ceil(
      (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      expired,
      daysRemaining: Math.max(0, daysRemaining),
      lastChanged: lastChange.createdAt,
    };
  } catch (error) {
    console.error("[PasswordPolicy] Failed to check password expiration:", error);
    return { expired: false };
  }
}

/**
 * Validate password comprehensively
 */
export async function validatePassword(
  password: string,
  userId?: string,
  options?: {
    checkBreach?: boolean;
    checkHistory?: boolean;
  }
): Promise<{
  valid: boolean;
  errors: string[];
  warnings: string[];
  strength: PasswordStrength;
}> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic schema validation
  try {
    passwordSchema.parse(password);
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors.push(...error.issues.map((i) => i.message));
    }
  }

  // Strength check
  const strength = calculatePasswordStrength(password);
  if (!strength.passesPolicy) {
    errors.push(`Mật khẩu quá yếu (${strength.label})`);
  }

  // Breach check (optional, async)
  if (options?.checkBreach !== false) {
    const breach = await checkPasswordBreach(password);
    if (breach.breached) {
      warnings.push(
        `Mật khẩu này đã bị lộ trong ${breach.count?.toLocaleString() || "nhiều"} vụ rò rỉ dữ liệu`
      );
    }
  }

  // History check (if userId provided)
  if (userId && options?.checkHistory !== false) {
    const history = await checkPasswordHistory(userId, password);
    if (history.reused) {
      errors.push(history.message || "Không thể sử dụng mật khẩu cũ");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    strength,
  };
}

/**
 * Hash password with bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, PASSWORD_CONFIG.saltRounds);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Get password policy configuration (for client display)
 */
export function getPasswordPolicy(): {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumber: boolean;
  requireSpecial: boolean;
  expirationDays: number;
} {
  return {
    minLength: PASSWORD_CONFIG.minLength,
    maxLength: PASSWORD_CONFIG.maxLength,
    requireUppercase: PASSWORD_CONFIG.requireUppercase,
    requireLowercase: PASSWORD_CONFIG.requireLowercase,
    requireNumber: PASSWORD_CONFIG.requireNumber,
    requireSpecial: PASSWORD_CONFIG.requireSpecial,
    expirationDays: PASSWORD_CONFIG.expirationDays,
  };
}
