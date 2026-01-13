import TelegramBot from "node-telegram-bot-api";
import { BOT_TOKEN, USE_WEBHOOK, WEBHOOK_URL, IS_PRODUCTION } from "@/lib/config/telegram";

let botSingleton: TelegramBot | null = null;

export function getTelegramBot(): TelegramBot | null {
	if (!BOT_TOKEN) return null;
	if (botSingleton) return botSingleton;

	// In development use polling for simplicity; in production prefer webhook
	const options: TelegramBot.ConstructorOptions = USE_WEBHOOK
		? { polling: false }
		: { polling: true };

	const bot = new TelegramBot(BOT_TOKEN, options);

	if (USE_WEBHOOK && WEBHOOK_URL) {
		bot.setWebHook(WEBHOOK_URL).catch((err) => {
			console.warn("[telegram] setWebHook failed:", err?.message || err);
		});
	}

	// Simple dev command
	bot.onText(/^\/start$/, async (msg) => {
		try {
			await bot.sendMessage(msg.chat.id, "Xin chào! Bot TMS đã sẵn sàng.");
		} catch (e: any) {
			console.warn("[telegram] sendMessage error:", e?.message || e);
		}
	});

	botSingleton = bot;
	return botSingleton;
}
