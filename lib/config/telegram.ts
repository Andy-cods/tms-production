export const IS_PRODUCTION = process.env.NODE_ENV === "production";

export const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
export const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || "";
export const WEBHOOK_URL = process.env.TELEGRAM_WEBHOOK_URL || "";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "";

export const USE_WEBHOOK = IS_PRODUCTION ? true : false;

if (!BOT_TOKEN) {
	console.warn("[telegram] Missing TELEGRAM_BOT_TOKEN env. Bot will be disabled.");
}
