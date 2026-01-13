import { NextRequest, NextResponse } from "next/server";
import { getTelegramBot } from "@/lib/telegram";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
	const bot = getTelegramBot();
	if (!bot) return NextResponse.json({ ok: false }, { status: 200 });

	try {
		const update = await req.json();
		if (update.callback_query) {
			const cq = update.callback_query;
			const data: string = cq.data || "";
			const chatId = cq.message?.chat?.id;

			const answer = async (text: string) => {
				if (cq.id) await (bot as any).answerCallbackQuery(cq.id, { text, show_alert: false });
				if (chatId) await bot.sendMessage(chatId, text);
			};

			if (data.startsWith("confirm_task_")) {
				const taskId = data.replace("confirm_task_", "");
				const task = await prisma.task.findUnique({ where: { id: taskId }, select: { id: true, title: true } });
				if (!task) return NextResponse.json({ ok: false });
				await prisma.task.update({ where: { id: taskId }, data: { confirmedAt: new Date() } });
				await answer(`✅ Đã xác nhận\n\n📋 ${task.title}`);
				return NextResponse.json({ ok: true });
			}

			if (data.startsWith("reject_task_")) {
				const taskId = data.replace("reject_task_", "");
				const task = await prisma.task.findUnique({ where: { id: taskId }, select: { id: true, title: true } });
				if (!task) return NextResponse.json({ ok: false });
				await prisma.task.update({ where: { id: taskId }, data: { status: "REWORK" as any } });
				await answer(`❌ Đã từ chối, leader sẽ phân công lại\n\n📋 ${task.title}`);
				return NextResponse.json({ ok: true });
			}

			if (data.startsWith("approve_task_")) {
				const taskId = data.replace("approve_task_", "");
				const task = await prisma.task.findUnique({ where: { id: taskId }, select: { id: true, requestId: true, title: true } });
				if (!task) return NextResponse.json({ ok: false });
				await prisma.task.update({ where: { id: taskId }, data: { status: "DONE" as any, completedAt: new Date() } });
				await answer(`✅ Đã duyệt công việc\n\n📋 ${task.title}`);
				return NextResponse.json({ ok: true });
			}

			if (data.startsWith("rework_task_")) {
				const taskId = data.replace("rework_task_", "");
				const task = await prisma.task.findUnique({ where: { id: taskId }, select: { id: true, title: true } });
				if (!task) return NextResponse.json({ ok: false });
				await prisma.task.update({ where: { id: taskId }, data: { status: "REWORK" as any } });
				await answer(`🔄 Yêu cầu sửa lại, vui lòng kiểm tra ghi chú\n\n📋 ${task.title}`);
				return NextResponse.json({ ok: true });
			}

			await answer("⚠️ Hành động không hợp lệ");
			return NextResponse.json({ ok: false });
		}

		// Fallback: let bot process updates for polling mode
		await (bot as any).processUpdate(update);
		return NextResponse.json({ ok: true });
	} catch (e: any) {
		return NextResponse.json({ ok: false, message: e?.message || "ERR" }, { status: 200 });
	}
}
