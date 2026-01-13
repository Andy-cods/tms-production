"use server"

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

async function ensureAdminUser() {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error("UNAUTHORIZED");
	}
	const user = await prisma.user.findUnique({
		where: { id: session.user.id as string },
		select: { id: true, role: true },
	});
	if (!user || user.role !== "ADMIN") {
		throw new Error("FORBIDDEN");
	}
	return user;
}

const baseSchema = z.object({
	name: z.string().min(3, "Tên tối thiểu 3 ký tự"),
	description: z.string().max(500).optional().nullable(),
	targetHours: z.number().positive("Thời gian mục tiêu phải > 0"),
	priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional().nullable(),
	category: z.string().min(1).optional().nullable(),
	isActive: z.boolean().optional(),
});

export async function updateSlaConfig(
	input: { id: string } & z.infer<typeof baseSchema>
): Promise<{ ok: boolean; message: string }> {
	try {
		await ensureAdminUser();
		const { id, ...rest } = input;
		const parsed = baseSchema.safeParse(rest);
		if (!parsed.success) {
			return { ok: false, message: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
		}
		await prisma.slaConfig.update({
			where: { id },
			data: {
				name: parsed.data.name,
				description: parsed.data.description ?? null,
				targetHours: parsed.data.targetHours,
				priority: (parsed.data.priority as any) ?? null,
				category: parsed.data.category ?? null,
				isActive: parsed.data.isActive ?? undefined,
			},
		});
		revalidatePath("/admin/sla-config");
		return { ok: true, message: "Cập nhật SLA thành công" };
	} catch (e: any) {
		return { ok: false, message: e?.message ?? "Lỗi khi cập nhật SLA" };
	}
}

export async function createSlaConfig(
	input: {
		name: string;
		targetEntity: "REQUEST" | "TASK";
		targetHours: number;
		description?: string | null;
		priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | null;
		category?: string | null;
		isActive?: boolean;
	}
): Promise<{ ok: boolean; message: string }> {
	try {
		await ensureAdminUser();
		const schema = baseSchema.extend({
			targetEntity: z.enum(["REQUEST", "TASK"]),
		});
		const parsed = schema.safeParse(input);
		if (!parsed.success) {
			return { ok: false, message: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
		}
		await prisma.slaConfig.create({
			data: {
				name: parsed.data.name,
				targetEntity: parsed.data.targetEntity,
				targetHours: parsed.data.targetHours,
				description: parsed.data.description ?? null,
				priority: (parsed.data.priority as any) ?? null,
				category: parsed.data.category ?? null,
				isActive: parsed.data.isActive ?? true,
			},
		});
		revalidatePath("/admin/sla-config");
		return { ok: true, message: "Tạo SLA mới thành công" };
	} catch (e: any) {
		return { ok: false, message: e?.message ?? "Lỗi khi tạo SLA" };
	}
}

export async function toggleSlaConfig(
	id: string,
	isActive: boolean
): Promise<{ ok: boolean; message: string }> {
	try {
		await ensureAdminUser();
		// Optional: warn when disabling critical rule
		const config = await prisma.slaConfig.findUnique({ where: { id } });
		if (!config) return { ok: false, message: "Không tìm thấy SLA" };
		await prisma.slaConfig.update({ where: { id }, data: { isActive } });
		revalidatePath("/admin/sla-config");
		return { ok: true, message: isActive ? "Đã bật SLA" : "Đã tắt SLA" };
	} catch (e: any) {
		return { ok: false, message: e?.message ?? "Lỗi khi thay đổi trạng thái" };
	}
}
