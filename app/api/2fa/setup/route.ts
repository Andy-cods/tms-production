import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encryptPII } from "@/lib/security/crypto";
import { generateTwoFactorSecret } from "@/lib/security/two-factor";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });

  if (!user) {
    return NextResponse.json({ ok: false, message: "User not found" }, { status: 404 });
  }

  const issuer = process.env.APP_2FA_ISSUER || "TMS";
  const label = user.email || user.name || userId;
  const { secret, otpauthUrl } = generateTwoFactorSecret(label, issuer);

  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorSecret: encryptPII(secret),
      twoFactorEnabled: false,
    },
  });

  // Only return otpauthUrl for QR code generation
  // Secret is NOT returned to prevent exposure in logs/network
  return NextResponse.json({
    ok: true,
    otpauthUrl, // Contains secret encoded in URL for QR scanning only
    // secret is intentionally NOT returned for security
  });
}

