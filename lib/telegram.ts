import { BOT_TOKEN } from "@/lib/config/telegram";

export type TelegramApiResponse<T> =
	| { ok: true; result: T }
	| {
			ok: false;
			error_code?: number;
			description?: string;
			parameters?: { retry_after?: number };
	  };

const TELEGRAM_API_BASE = BOT_TOKEN
	? `https://api.telegram.org/bot${BOT_TOKEN}`
	: "";

export function isTelegramEnabled() {
	return Boolean(BOT_TOKEN);
}

export async function telegramRequest<T>(
	method: string,
	payload: Record<string, unknown>
): Promise<TelegramApiResponse<T>> {
	if (!BOT_TOKEN || !TELEGRAM_API_BASE) {
		return { ok: false, description: "BOT_DISABLED" };
	}

	try {
		const res = await fetch(`${TELEGRAM_API_BASE}/${method}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});

		const data = (await res.json().catch(() => null)) as TelegramApiResponse<T> | null;
		if (!data) {
			return { ok: false, description: "INVALID_RESPONSE" };
		}
		return data;
	} catch (error: any) {
		return { ok: false, description: String(error?.message || error) };
	}
}
