import TelegramBot from "node-telegram-bot-api";
import { getTelegramBot } from "@/lib/telegram";
import { BOT_USERNAME } from "@/lib/config/telegram";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export type TelegramButton = {
	text: string;
	callback_data?: string;
	url?: string;
};

export type TelegramMessagePayload = {
	chatId: string | number;
	message: string;
	buttons?: TelegramButton[][];
	parseMode?: "Markdown" | "HTML";
	disableNotification?: boolean;
};

export type TelegramResult = {
	success: boolean;
	messageId?: number;
	error?: string;
};

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createInlineKeyboard(buttons: TelegramButton[][] | undefined) {
	if (!buttons || buttons.length === 0) return undefined;
	return {
		inline_keyboard: buttons.map((row) =>
			row.map((btn) => ({
				text: btn.text,
				...(btn.url ? { url: btn.url } : {}),
				...(btn.callback_data ? { callback_data: btn.callback_data } : {}),
			}))
		),
	};
}

export function formatTaskNotification(input: {
	title: string;
	priority: string;
	deadline?: Date | string | null;
	url?: string;
	assigneeName?: string | null;
}) {
	const deadlineStr = input.deadline
		? new Date(input.deadline).toLocaleString("vi-VN")
		: "—";
	return [
		"🔔 *Công việc mới được giao*",
		"",
		`📋 *Task:* ${input.title}`,
		`⚡ *Độ ưu tiên:* ${input.priority}`,
		`⏰ *Deadline:* ${deadlineStr}`,
		"",
		input.assigneeName ? `👤 Giao cho: ${input.assigneeName}` : "",
		input.url ? `🔗 ${input.url}` : "",
	]
		.filter(Boolean)
		.join("\n");
}

export function formatRequestNotification(input: {
	title: string;
	priority: string;
	deadline?: Date | string | null;
	url?: string;
	creatorName?: string | null;
}) {
	const deadlineStr = input.deadline
		? new Date(input.deadline).toLocaleString("vi-VN")
		: "—";
	return [
		"📝 *Yêu cầu mới*",
		"",
		`📋 *Request:* ${input.title}`,
		`⚡ *Độ ưu tiên:* ${input.priority}`,
		`⏰ *Deadline:* ${deadlineStr}`,
		"",
		input.creatorName ? `👤 Người tạo: ${input.creatorName}` : "",
		input.url ? `🔗 ${input.url}` : "",
	]
		.filter(Boolean)
		.join("\n");
}

export function formatClarificationNotification(input: {
	title: string;
	url?: string;
	deadline?: Date | string | null;
}) {
	const deadlineStr = input.deadline
		? new Date(input.deadline).toLocaleString("vi-VN")
		: "—";
	return [
		"❓ *Yêu cầu làm rõ*",
		"",
		`💬 ${input.title}`,
		`⏰ Hạn phản hồi: ${deadlineStr}`,
		input.url ? `🔔 ${input.url}` : "",
	]
		.filter(Boolean)
		.join("\n");
}

let auditUserIdCache: string | null | undefined;
async function getAuditUserId(): Promise<string | null> {
	if (auditUserIdCache !== undefined) return auditUserIdCache;
	try {
		const admin = await prisma.user.findFirst({ where: { role: "ADMIN" as any }, select: { id: true } });
		auditUserIdCache = admin?.id ?? null;
		return auditUserIdCache;
	} catch {
		auditUserIdCache = null;
		return null;
	}
}

async function writeAudit(entityId: string, newValue: Record<string, unknown>) {
	try {
		const userId = await getAuditUserId();
		if (!userId) return; // cannot write without required user relation
		await prisma.auditLog.create({
			data: {
				userId,
				action: "TELEGRAM_SEND",
				entity: "TELEGRAM",
				entityId,
				newValue: newValue as Prisma.InputJsonValue,
			},
		});
	} catch {
		// swallow
	}
}

export async function sendTelegramMessage(payload: TelegramMessagePayload): Promise<TelegramResult> {
	const bot = getTelegramBot();
	if (!bot) {
		return { success: false, error: "BOT_DISABLED" };
	}
	if (payload == null || payload.chatId == null || payload.chatId === "") {
		return { success: false, error: "INVALID_CHAT_ID" };
	}
	if (!payload.message || payload.message.trim().length === 0) {
		return { success: false, error: "EMPTY_MESSAGE" };
	}

	const options: TelegramBot.SendMessageOptions = {
		parse_mode: payload.parseMode || "Markdown",
		disable_notification: payload.disableNotification ?? false,
		reply_markup: createInlineKeyboard(payload.buttons) as any,
		disable_web_page_preview: true,
	};

	try {
		const res = await bot.sendMessage(payload.chatId, payload.message, options);
		await writeAudit(String(payload.chatId), {
			messagePreview: payload.message.slice(0, 100),
			status: "SUCCESS",
			messageId: res.message_id,
		});
		return { success: true, messageId: res.message_id };
	} catch (err: any) {
		const msg = String(err?.message || err);
		const code = Number(err?.response?.statusCode || err?.code);

		if (msg.includes("403") || msg.includes("bot was blocked") || code === 403) {
			await writeAudit(String(payload.chatId), {
				messagePreview: payload.message.slice(0, 100),
				status: "USER_BLOCKED",
			});
			return { success: false, error: "USER_BLOCKED" };
		}
		if (msg.includes("400") || msg.includes("chat not found") || code === 400) {
			await writeAudit(String(payload.chatId), {
				messagePreview: payload.message.slice(0, 100),
				status: "CHAT_NOT_FOUND",
			});
			return { success: false, error: "CHAT_NOT_FOUND" };
		}
		if (msg.includes("429") || msg.includes("Too Many Requests") || code === 429) {
			const retryAfter = Number(err?.response?.body?.parameters?.retry_after || 1);
			await sleep(retryAfter * 1000);
			try {
				const res2 = await bot.sendMessage(payload.chatId, payload.message, options);
				await writeAudit(String(payload.chatId), {
					messagePreview: payload.message.slice(0, 100),
					status: "SUCCESS_RETRY",
					messageId: res2.message_id,
				});
				return { success: true, messageId: res2.message_id };
			} catch (e2: any) {
				await writeAudit(String(payload.chatId), {
					messagePreview: payload.message.slice(0, 100),
					status: "FAILED_RETRY",
					error: String(e2?.message || e2),
				});
				return { success: false, error: "RATE_LIMIT" };
			}
		}

		await writeAudit(String(payload.chatId), {
			messagePreview: payload.message.slice(0, 100),
			status: "ERROR",
			error: msg,
		});
		return { success: false, error: msg };
	}
}

export async function sendBulkTelegramMessages(payloads: TelegramMessagePayload[]): Promise<TelegramResult[]> {
	const results: TelegramResult[] = [];
	for (const p of payloads) {
		const res = await sendTelegramMessage(p);
		results.push(res);
		await sleep(50);
	}
	return results;
}
