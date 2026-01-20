// lib/auth.ts
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import os from "os";
import { decryptPII } from "@/lib/security/crypto";
import { verifyTwoFactorToken } from "@/lib/security/two-factor";
import {
  analyzeLogin,
  isIPBlocked,
  blockIP,
  recordLoginAttempt,
} from "@/lib/security/anomaly-detection";
import {
  securityLogger,
  SecurityEventType,
  SecurityEventSeverity,
} from "@/lib/security/security-logger";

function resolveBaseUrl() {
  const fromEnv =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
    (process.env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
      : undefined);

  if (fromEnv) {
    try {
      // Validate URL
      new URL(fromEnv);
      return fromEnv;
    } catch {
      // Invalid URL, fall through to auto-detect
    }
  }

  const port = process.env.PORT || "3000";
  const nets = os.networkInterfaces();

  for (const name of Object.keys(nets)) {
    const interfaces = nets[name];
    if (!interfaces) continue;

    for (const net of interfaces) {
      if (!net || net.internal) continue;
      // Prefer IPv4
      if (net.family === "IPv4") {
        const url = `${process.env.NODE_ENV === "production" ? "https" : "http"}://${net.address}:${port}`;
        try {
          // Validate URL
          new URL(url);
          return url;
        } catch {
          // Skip invalid URL
          continue;
        }
      }
    }
  }

  // Fallback to localhost
  const localhostUrl = `http://localhost:${port}`;
  try {
    new URL(localhostUrl);
    return localhostUrl;
  } catch {
    // Last resort
    return "http://localhost:3000";
  }
}

const APP_BASE_URL = resolveBaseUrl();
if (!process.env.NEXTAUTH_URL) {
  try {
    // Validate before setting
    new URL(APP_BASE_URL);
    process.env.NEXTAUTH_URL = APP_BASE_URL;
  } catch (error) {
    console.error("[Auth] Invalid NEXTAUTH_URL:", APP_BASE_URL, error);
    // Set a safe default
    process.env.NEXTAUTH_URL = "http://localhost:3000";
  }
}

const APP_URL_OBJECT = (() => {
  try {
    return new URL(APP_BASE_URL);
  } catch {
    return undefined;
  }
})();

const COOKIE_DOMAIN = (() => {
  if (!APP_URL_OBJECT) return undefined;
  const host = APP_URL_OBJECT.hostname;
  if (!host) return undefined;
  if (host === "localhost" || host === "127.0.0.1") return undefined;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    // IP addresses should stay host-only cookies
    return undefined;
  }
  return host;
})();

// For HTTP connections, don't use secure cookies
// Only use secure cookies when actually using HTTPS
const COOKIE_SECURE = APP_URL_OBJECT?.protocol === "https:";

// Don't use __Host- or __Secure- prefix when not using HTTPS
const USE_SECURE_PREFIX = COOKIE_SECURE;

const SESSION_MAX_AGE =
  (Number(process.env.AUTH_SESSION_MAX_AGE_MINUTES) || 30) * 60;
const SESSION_UPDATE_AGE =
  (Number(process.env.AUTH_SESSION_UPDATE_AGE_MINUTES) || 5) * 60;
const MAX_FAILED_LOGINS = Number(process.env.AUTH_LOCKOUT_THRESHOLD) || 5;
const LOCKOUT_MINUTES = Number(process.env.AUTH_LOCKOUT_MINUTES) || 15;

/** Validate input của Credentials */
const credSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  otp: z.string().optional(),
  clientIP: z.string().optional(),
  userAgent: z.string().optional(),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE,
    updateAge: SESSION_UPDATE_AGE,
  },
  jwt: {
    maxAge: SESSION_MAX_AGE,
  },
  trustHost: true,
  cookies: {
    sessionToken: {
      name: USE_SECURE_PREFIX
        ? "__Secure-authjs.session-token" 
        : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: COOKIE_SECURE,
        domain: COOKIE_DOMAIN,
        maxAge: SESSION_MAX_AGE,
      },
    },
    callbackUrl: {
      name: USE_SECURE_PREFIX
        ? "__Secure-authjs.callback-url"
        : "authjs.callback-url",
      options: {
        sameSite: "lax",
        path: "/",
        secure: COOKIE_SECURE,
        domain: COOKIE_DOMAIN,
      },
    },
    csrfToken: {
      // __Host- prefix requires secure:true, so only use it with HTTPS and no domain
      name: USE_SECURE_PREFIX && !COOKIE_DOMAIN
        ? "__Host-authjs.csrf-token"
        : "authjs.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: COOKIE_SECURE,
        domain: COOKIE_DOMAIN,
      },
    },
    pkceCodeVerifier: {
      name: USE_SECURE_PREFIX
        ? "__Secure-authjs.pkce.code_verifier"
        : "authjs.pkce.code_verifier",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: COOKIE_SECURE,
        domain: COOKIE_DOMAIN,
      },
    },
    state: {
      name: USE_SECURE_PREFIX
        ? "__Secure-authjs.state"
        : "authjs.state",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: COOKIE_SECURE,
        domain: COOKIE_DOMAIN,
      },
    },
  },

  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        otp: { label: "2FA Code", type: "text" },
        clientIP: { label: "Client IP", type: "hidden" },
        userAgent: { label: "User Agent", type: "hidden" },
      },
      async authorize(raw, request) {
        const { email, password, otp, clientIP, userAgent } = credSchema.parse(raw);

        // Extract real IP from request headers (more reliable than client-provided)
        let ip = "unknown";
        if (request) {
          ip =
            request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            request.headers.get("x-real-ip") ||
            request.headers.get("cf-connecting-ip") ||
            clientIP ||
            "unknown";
        } else if (clientIP && clientIP !== "client") {
          ip = clientIP;
        }

        // === ANOMALY DETECTION: Check if IP is blocked ===
        if (isIPBlocked(ip)) {
          await securityLogger.log({
            type: SecurityEventType.AUTH_LOGIN_FAILURE,
            severity: SecurityEventSeverity.HIGH,
            userEmail: email,
            ipAddress: ip,
            outcome: "BLOCKED",
            details: { reason: "IP is temporarily blocked" },
          });
          throw new Error("IP_BLOCKED");
        }

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            password: true,
            permissionTickets: true,
            failedLoginAttempts: true,
            lockoutUntil: true,
            twoFactorEnabled: true,
            twoFactorSecret: true,
            isActive: true,
          },
        });

        // === ANOMALY DETECTION: Analyze login attempt (even for non-existent users) ===
        if (!user || !user.password) {
          const analysis = await analyzeLogin(null, ip, false, { email, userAgent });

          // Block IP if risk is critical (credential stuffing)
          if (analysis.riskLevel === "CRITICAL") {
            blockIP(ip, 30 * 60 * 1000); // Block for 30 minutes
          }

          await securityLogger.log({
            type: SecurityEventType.AUTH_LOGIN_FAILURE,
            severity: SecurityEventSeverity.LOW,
            userEmail: email,
            ipAddress: ip,
            outcome: "FAILURE",
            details: {
              reason: "User not found",
              riskScore: analysis.riskScore,
              riskLevel: analysis.riskLevel,
            },
          });
          return null;
        }

        // === CHECK ACCOUNT STATUS: Block inactive/disabled users ===
        if (user.isActive === false) {
          await securityLogger.log({
            type: SecurityEventType.AUTH_LOGIN_FAILURE,
            severity: SecurityEventSeverity.MEDIUM,
            userId: user.id,
            userEmail: email,
            ipAddress: ip,
            outcome: "BLOCKED",
            details: { reason: "Account is disabled" },
          });
          throw new Error("ACCOUNT_DISABLED");
        }

        const now = new Date();
        if (user.lockoutUntil && user.lockoutUntil > now) {
          await securityLogger.log({
            type: SecurityEventType.ACCOUNT_LOCKOUT,
            severity: SecurityEventSeverity.MEDIUM,
            userId: user.id,
            userEmail: email,
            ipAddress: ip,
            outcome: "BLOCKED",
            details: { lockoutUntil: user.lockoutUntil },
          });
          throw new Error("ACCOUNT_LOCKED");
        }

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) {
          const failedCount = (user.failedLoginAttempts ?? 0) + 1;
          const lockoutUntil =
            failedCount >= MAX_FAILED_LOGINS
              ? new Date(now.getTime() + LOCKOUT_MINUTES * 60 * 1000)
              : null;

          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: failedCount,
              lockoutUntil,
            },
          });

          // === ANOMALY DETECTION: Record failed login ===
          const analysis = await analyzeLogin(user.id, ip, false, { email, userAgent });

          // Block IP if risk is high or critical
          if (analysis.riskLevel === "CRITICAL") {
            blockIP(ip, 60 * 60 * 1000); // Block for 1 hour
          } else if (analysis.riskLevel === "HIGH") {
            blockIP(ip, 15 * 60 * 1000); // Block for 15 minutes
          }

          await securityLogger.log({
            type: SecurityEventType.AUTH_LOGIN_FAILURE,
            severity: lockoutUntil ? SecurityEventSeverity.MEDIUM : SecurityEventSeverity.LOW,
            userId: user.id,
            userEmail: email,
            ipAddress: ip,
            outcome: "FAILURE",
            details: {
              reason: "Invalid password",
              failedAttempts: failedCount,
              willLockout: !!lockoutUntil,
              riskScore: analysis.riskScore,
              riskLevel: analysis.riskLevel,
              anomalies: analysis.anomalies.map(a => a.type),
            },
          });

          return null;
        }

        if (user.twoFactorEnabled) {
          if (!otp) {
            throw new Error("TWO_FACTOR_REQUIRED");
          }
          const secret = decryptPII(user.twoFactorSecret || "");
          if (!secret || !verifyTwoFactorToken(secret, otp)) {
            const failedCount = (user.failedLoginAttempts ?? 0) + 1;
            const lockoutUntil =
              failedCount >= MAX_FAILED_LOGINS
                ? new Date(now.getTime() + LOCKOUT_MINUTES * 60 * 1000)
                : null;
            await prisma.user.update({
              where: { id: user.id },
              data: {
                failedLoginAttempts: failedCount,
                lockoutUntil,
              },
            });

            // Record failed 2FA attempt
            recordLoginAttempt(user.id, ip, false);

            await securityLogger.log({
              type: SecurityEventType.AUTH_2FA_FAILURE,
              severity: SecurityEventSeverity.MEDIUM,
              userId: user.id,
              userEmail: email,
              ipAddress: ip,
              outcome: "FAILURE",
              details: { reason: "Invalid 2FA code", failedAttempts: failedCount },
            });

            return null;
          }

          // Log successful 2FA
          await securityLogger.log({
            type: SecurityEventType.AUTH_2FA_SUCCESS,
            severity: SecurityEventSeverity.INFO,
            userId: user.id,
            userEmail: email,
            ipAddress: ip,
            outcome: "SUCCESS",
          });
        }

        // Reset failed attempts on successful login
        if (user.failedLoginAttempts || user.lockoutUntil) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: 0,
              lockoutUntil: null,
            },
          });
        }

        // === ANOMALY DETECTION: Analyze successful login ===
        const analysis = await analyzeLogin(user.id, ip, true, { email, userAgent });

        // Log successful login with anomaly info
        await securityLogger.logLoginSuccess(user.id, email, ip, userAgent);

        // If anomalous but successful, log warning
        if (analysis.isAnomaly && analysis.riskLevel !== "LOW") {
          await securityLogger.log({
            type: SecurityEventType.THREAT_SUSPICIOUS_PATTERN,
            severity: analysis.riskLevel === "CRITICAL"
              ? SecurityEventSeverity.CRITICAL
              : analysis.riskLevel === "HIGH"
              ? SecurityEventSeverity.HIGH
              : SecurityEventSeverity.MEDIUM,
            userId: user.id,
            userEmail: email,
            ipAddress: ip,
            outcome: "WARNING",
            details: {
              message: "Anomalous login detected",
              riskScore: analysis.riskScore,
              riskLevel: analysis.riskLevel,
              anomalies: analysis.anomalies.map(a => a.type),
              recommendations: analysis.recommendations,
            },
          });
        }

        // Trả về các field muốn nhúng vào JWT lần đầu
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role, // enum Role trong Prisma
          permissionTickets: (user as any).permissionTickets || [],
        };
      },
    }),
  ],

  // 🔧 Quan trọng: đảm bảo luôn có session.user.id & session.user.role
  callbacks: {
    async jwt({ token, user, trigger }) {
      // Lần đầu đăng nhập: user có mặt -> copy vào token
      if (user) {
        token.id = (user as any).id ?? token.sub;
        (token as any).role = (user as any).role;
        (token as any).permissionTickets = (user as any).permissionTickets || [];
      }
      
      // Khi trigger update (từ server action), refresh permissionTickets từ DB
      if (trigger === "update" && (token as any).id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: (token as any).id },
          select: { permissionTickets: true },
        });
        if (dbUser) {
          (token as any).permissionTickets = (dbUser as any).permissionTickets || [];
        }
      }
      
      // Fallback: nếu thiếu id thì dùng sub (userId mặc định)
      if (!(token as any).id) {
        (token as any).id = token.sub;
      }
      return token;
    },
    async session({ session, token }) {
      (session.user as any) = {
        ...(session.user || {}),
        id: ((token as any).id ?? token.sub) as string,
        role: (token as any).role as string | undefined,
        email: session.user?.email,
        name: session.user?.name,
        permissionTickets: (token as any).permissionTickets || [],
      };
      return session;
    },
    async redirect({ url, baseUrl }) {
      // If URL is relative, use it as-is (NextAuth will handle it)
      if (url && url.startsWith("/")) {
        return url;
      }

      // If no URL provided, return dashboard
      if (!url) {
        return "/dashboard";
      }

      try {
        // Validate baseUrl before using it
        let validBaseUrl = baseUrl;
        if (!validBaseUrl || typeof validBaseUrl !== "string") {
          // Fallback to environment variable or default
          validBaseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
        }

        // Validate baseUrl is a valid URL
        try {
          new URL(validBaseUrl);
        } catch {
          // If baseUrl is invalid, use default
          validBaseUrl = "http://localhost:3000";
        }

        // Try to parse target URL
        let target: URL;
        try {
          target = new URL(url);
        } catch {
          // If url is not a valid absolute URL, treat it as relative
          return url.startsWith("/") ? url : `/${url}`;
        }

        // Parse base URL
        const base = new URL(validBaseUrl);

        // If same origin, return relative path
        if (target.origin === base.origin) {
          return `${target.pathname}${target.search}${target.hash}`;
        }

        // For different origins, return the full URL
        return url;
      } catch (error) {
        // If URL parsing fails, return safe default
        console.error("[Auth] Redirect error:", error, { url, baseUrl });
        return "/dashboard";
      }
    },
  },

  pages: {
    signIn: "/login",
  },
});
