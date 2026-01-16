import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptPII } from "@/lib/security/crypto";
import { verifyTwoFactorToken } from "@/lib/security/two-factor";

const bodySchema = z.object({
  token: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id as string;
    const data = bodySchema.parse(await req.json());

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true },
    });

    const secret = decryptPII(user?.twoFactorSecret ?? null);
    if (!secret) {
      return NextResponse.json({ ok: false, message: "2FA not initialized" }, { status: 400 });
    }

    const ok = verifyTwoFactorToken(secret, data.token);
    if (!ok) {
      return NextResponse.json({ ok: false, message: "Invalid token" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, message: "Invalid payload" }, { status: 400 });
    }
    return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
  }
}

