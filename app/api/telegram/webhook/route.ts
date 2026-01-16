import { NextRequest, NextResponse } from "next/server";
import { isTelegramEnabled, telegramRequest } from "@/lib/telegram";
import { prisma } from "@/lib/prisma";
import { timingSafeEqual } from "crypto";

export const dynamic = "force-dynamic";

/**
 * Verify that the request is from Telegram using secret token
 * Set TELEGRAM_WEBHOOK_SECRET in environment and configure in Telegram Bot API
 */
function verifyTelegramRequest(req: NextRequest): boolean {
	const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

	// If no secret configured, log warning and reject in production
	if (!webhookSecret) {
		if (process.env.NODE_ENV === "production") {
			console.error("[Telegram Webhook] TELEGRAM_WEBHOOK_SECRET not configured - rejecting request");
			return false;
		}
		// Allow in development for testing
		console.warn("[Telegram Webhook] TELEGRAM_WEBHOOK_SECRET not set - allowing request in dev mode");
		return true;
	}

	// Get secret token from Telegram header
	const secretToken = req.headers.get("x-telegram-bot-api-secret-token");
	if (!secretToken) {
		console.warn("[Telegram Webhook] Missing secret token header");
		return false;
	}

	// Timing-safe comparison to prevent timing attacks
	try {
		const expected = Buffer.from(webhookSecret, "utf8");
		const received = Buffer.from(secretToken, "utf8");

		if (expected.length !== received.length) {
			return false;
		}

		return timingSafeEqual(expected, received);
	} catch {
		return false;
	}
}

export async function POST(req: NextRequest) {
	if (!isTelegramEnabled()) return NextResponse.json({ ok: false }, { status: 200 });

	// Verify request is from Telegram
	if (!verifyTelegramRequest(req)) {
		return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
	}

	try {
		const update = await req.json();
		if (update.callback_query) {
			const cq = update.callback_query;
			const data: string = cq.data || "";
			const chatId = cq.message?.chat?.id;

			const answer = async (text: string) => {
				if (cq.id) {
					await telegramRequest("answerCallbackQuery", {
						callback_query_id: cq.id,
						text,
						show_alert: false,
					});
				}
				if (chatId) {
					await telegramRequest("sendMessage", {
						chat_id: chatId,
						text,
						disable_web_page_preview: true,
					});
				}
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

		return NextResponse.json({ ok: true });
	} catch (e: any) {
		return NextResponse.json({ ok: false, message: e?.message || "ERR" }, { status: 200 });
	}
}
