import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

const databaseUrl = process.env.DATABASE_URL;
const requireSsl =
  process.env.NODE_ENV === "production" &&
  process.env.DB_SSL_REQUIRED !== "false";

if (requireSsl) {
  const hasSsl =
    typeof databaseUrl === "string" &&
    (databaseUrl.includes("sslmode=require") || databaseUrl.includes("ssl=true"));
  if (!hasSsl) {
    throw new Error(
      "DATABASE_URL must enable SSL in production (add sslmode=require or ssl=true)"
    );
  }
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
