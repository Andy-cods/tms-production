import type { Priority } from "@prisma/client";
import { format, differenceInMinutes } from "date-fns";
import type { TelegramButton } from "@/lib/services/telegram-service";

export type TelegramTemplate = {
	message: string;
	buttons?: TelegramButton[][];
};

export function getPriorityEmoji(priority: Priority): string {
	switch (priority) {
		case "LOW":
			return "🔵";
		case "MEDIUM":
			return "🟡";
		case "HIGH":
			return "🟠";
		case "URGENT":
			return "🔴";
		default:
			return "";
	}
}

export function formatDeadline(date: Date): string {
	const abs = format(date, "dd/MM/yyyy HH:mm");
	const now = new Date();
	const diffMin = differenceInMinutes(date, now);
	let rel: string;
	if (diffMin === 0) rel = "đúng hạn";
	else if (diffMin > 0) {
		const hours = Math.floor(diffMin / 60);
		const mins = Math.abs(diffMin % 60);
		if (hours > 0 && mins > 0) rel = `còn ${hours} giờ ${mins} phút`;
		else if (hours > 0) rel = `còn ${hours} giờ`;
		else rel = `còn ${mins} phút`;
	} else {
		const overdue = Math.abs(diffMin);
		const hours = Math.floor(overdue / 60);
		const mins = overdue % 60;
		if (hours > 0 && mins > 0) rel = `quá hạn ${hours} giờ ${mins} phút`;
		else if (hours > 0) rel = `quá hạn ${hours} giờ`;
		else rel = `quá hạn ${mins} phút`;
	}
	return `${abs} (${rel})`;
}

export function taskAssignedTemplate(data: {
	assigneeName: string;
	taskTitle: string;
	requestTitle: string;
	deadline: Date;
	priority: Priority;
	taskUrl: string;
}): TelegramTemplate {
	const deadlineStr = formatDeadline(data.deadline);
	const confirmHours = Math.max(1, Math.ceil(Math.max(1, differenceInMinutes(data.deadline, new Date())) / 60));
	const message = [
		"🔔 *Công việc mới được giao*",
		"",
		`👤 Xin chào *${data.assigneeName}*,`,
		"",
		"Bạn được giao công việc mới:",
		`📋 *Task:* ${data.taskTitle}`,
		`🗂️ *Từ yêu cầu:* ${data.requestTitle}`,
		"",
		`${getPriorityEmoji(data.priority)} *Độ ưu tiên:* ${data.priority}`,
		`⏰ *Deadline:* ${deadlineStr}`,
		"",
		`⚠️ Vui lòng xác nhận trong ${confirmHours} giờ`,
	].join("\n");

	const buttons: TelegramButton[][] = [
		[
			{ text: "✅ Xác nhận", callback_data: "task_confirm" },
			{ text: "❌ Từ chối", callback_data: "task_reject" },
		],
		[
			{ text: "👁️ Xem chi tiết", url: data.taskUrl },
		],
	];
	return { message, buttons };
}

export function requestCreatedTemplate(data: {
	leaderName: string;
	requesterName: string;
	requestTitle: string;
	priority: Priority;
	category: string;
	requestUrl: string;
}): TelegramTemplate {
	const message = [
		"🆕 *Yêu cầu mới cần xử lý*",
		"",
		`👤 Leader: *${data.leaderName}*,`,
		"",
		`Có yêu cầu mới từ *${data.requesterName}*`,
		`📝 *Tiêu đề:* ${data.requestTitle}`,
		`📁 *Phân loại:* ${data.category}`,
		`${getPriorityEmoji(data.priority)} *Độ ưu tiên:* ${data.priority}`,
		"",
		"👉 Vui lòng phân công người xử lý",
	].join("\n");

	const buttons: TelegramButton[][] = [
		[
			{ text: "📋 Phân công ngay", callback_data: "request_assign" },
			{ text: "👁️ Xem chi tiết", url: data.requestUrl },
		],
	];
	return { message, buttons };
}

export function clarificationNeededTemplate(data: {
	requesterName: string;
	requestTitle: string;
	question: string;
	askedBy: string;
	deadline: Date;
	requestUrl: string;
}): TelegramTemplate {
	const message = [
		"❓ *Cần làm rõ thông tin*",
		"",
		`👤 *${data.requesterName}*,`,
		"",
		`*${data.askedBy}* cần bạn làm rõ về yêu cầu:`,
		`📋 ${data.requestTitle}`,
		"",
		"💬 *Câu hỏi:*",
		data.question,
		"",
		`⏰ *Hạn trả lời:* ${formatDeadline(data.deadline)}`,
		"",
		"⚠️ Yêu cầu sẽ bị tạm dừng nếu không trả lời",
	].join("\n");
	const buttons: TelegramButton[][] = [
		[
			{ text: "💬 Trả lời ngay", callback_data: "request_reply" },
			{ text: "👁️ Xem chi tiết", url: data.requestUrl },
		],
	];
	return { message, buttons };
}

export function taskCompletedTemplate(data: {
	leaderName: string;
	assigneeName: string;
	taskTitle: string;
	requestTitle: string;
	taskUrl: string;
}): TelegramTemplate {
	const message = [
		"✅ *Công việc đã hoàn thành*",
		"",
		`👤 *${data.leaderName}*,`,
		"",
		`*${data.assigneeName}* đã hoàn thành`,
		`📋 *Task:* ${data.taskTitle}`,
		`🗂️ *Thuộc yêu cầu:* ${data.requestTitle}`,
		"",
		"👉 Vui lòng kiểm tra và duyệt",
	].join("\n");
	const buttons: TelegramButton[][] = [
		[
			{ text: "✅ Duyệt", callback_data: "task_approve" },
			{ text: "🔄 Yêu cầu sửa", callback_data: "task_rework" },
			{ text: "👁️ Xem chi tiết", url: data.taskUrl },
		],
	];
	return { message, buttons };
}

export function slaWarningTemplate(data: {
	recipientName: string;
	entityType: string;
	title: string;
	deadline: Date;
	timeRemaining: string;
	entityUrl: string;
}): TelegramTemplate {
	const message = [
		"⚠️ *CẢNH BÁO SLA*",
		"",
		`👤 *${data.recipientName}*,`,
		"",
		`${data.entityType} sắp quá hạn`,
		`📋 *${data.title}*`,
		"",
		`⏰ *Deadline:* ${formatDeadline(data.deadline)}`,
		`⏳ *Thời gian còn lại:* ${data.timeRemaining}`,
		"",
		"🚨 Vui lòng xử lý gấp!",
	].join("\n");
	const buttons: TelegramButton[][] = [
		[
			{ text: "🚀 Xử lý ngay", callback_data: "sla_take_action" },
			{ text: "👁️ Xem chi tiết", url: data.entityUrl },
		],
	];
	return { message, buttons };
}

export function slaOverdueTemplate(data: {
	recipientName: string;
	entityType: string;
	title: string;
	deadline: Date;
	entityUrl: string;
}): TelegramTemplate {
	const message = [
		"🔴 *CẢNH BÁO SLA - ĐÃ QUÁ HẠN*",
		"",
		`👤 *${data.recipientName}*,`,
		"",
		`${data.entityType} *ĐÃ QUÁ HẠN*`,
		`📋 *${data.title}*`,
		"",
		`⏰ *Deadline:* ${formatDeadline(data.deadline)}`,
		"",
		"🚨 Vui lòng xử lý gấp!",
	].join("\n");
	const buttons: TelegramButton[][] = [
		[
			{ text: "🚀 Xử lý ngay", callback_data: "sla_take_action" },
			{ text: "👁️ Xem chi tiết", url: data.entityUrl },
		],
	];
	return { message, buttons };
}
