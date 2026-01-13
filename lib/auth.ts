// lib/auth.ts
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import os from "os";

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

/** Validate input của Credentials */
const credSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
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
      },
      async authorize(raw) {
        const { email, password } = credSchema.parse(raw);

        const user = await prisma.user.findUnique({ 
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            password: true,
            permissionTickets: true,
          },
        });
        if (!user || !user.password) return null;

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null;

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
