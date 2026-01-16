import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { passwordSchema } from "@/lib/validations/password";

const bodySchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(80),
  password: passwordSchema,
});

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const parsed = bodySchema.parse(data);

    const existed = await prisma.user.findUnique({ where: { email: parsed.email } });
    if (existed) return NextResponse.json({ ok: false, message: "Email đã tồn tại" }, { status: 409 });

    const hash = await bcrypt.hash(parsed.password, 10);
    await prisma.user.create({
      data: { email: parsed.email, name: parsed.name, password: hash },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok:false, message:"Invalid payload" }, { status: 400 });
  }
}
