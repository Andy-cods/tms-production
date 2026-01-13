// actions/clarification.ts
"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { clarificationNeededTemplate } from "@/lib/telegram/templates";
import { sendTelegramMessage } from "@/lib/services/telegram-service";
import { APP_URL } from "@/lib/config/telegram";

async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return { id: (session.user as any).id, role: (session.user as any).role as string | undefined, name: (session.user as any).name as string | undefined };
}

export async function requestClarification(input: { requestId: string; message: string }): Promise<void> {
  const me = await getCurrentUser();
  if (!me) return;

  const req = await prisma.request.findUnique({
    where: { id: input.requestId },
    select: { id: true, status: true, creatorId: true, title: true },
  });
  if (!req) return;

  const allowedRoles = new Set(["LEADER", "ADMIN"]);
  if (!me.role || !allowedRoles.has(me.role)) return;

  if (req.status !== "CLARIFICATION") {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.request.update({ where: { id: input.requestId }, data: { status: "CLARIFICATION" } });
      await tx.comment.create({ data: { requestId: input.requestId, content: `[Hệ thống] Yêu cầu làm rõ: ${input.message}`, authorId: me.id } });
      await tx.auditLog.create({ data: { userId: me.id, action: "REQUEST_CLARIFICATION", entity: "Request", entityId: input.requestId, oldValue: { status: req.status }, newValue: { status: updated.status, message: input.message }, requestId: input.requestId } });
      await tx.notification.create({ data: { userId: req.creatorId, type: "CLARIFICATION_NEEDED", title: "Yêu cầu làm rõ", message: `Yêu cầu của bạn cần được làm rõ: ${input.message}`, requestId: input.requestId } });
    });
  }

  // Telegram
  try {
    const requester: any = await prisma.user.findUnique({ where: { id: req.creatorId } });
    const wantsTelegram = requester?.notificationChannel === "TELEGRAM" || requester?.notificationChannel === "BOTH";
    if (requester?.telegramChatId && wantsTelegram) {
      const tpl = clarificationNeededTemplate({
        requesterName: requester.name || "Requester",
        requestTitle: req.title,
        question: input.message,
        askedBy: me.name || "Leader",
        deadline: new Date(Date.now() + 8 * 3600 * 1000),
        requestUrl: `${APP_URL || ""}/requests/${req.id}`,
      });
      const tgRes = await sendTelegramMessage({ chatId: requester.telegramChatId, message: tpl.message, buttons: tpl.buttons, parseMode: "Markdown" });
      await prisma.auditLog.create({ data: { userId: me.id, action: tgRes.success ? "telegram_sent" : "telegram_failed", entity: "Request", entityId: req.id, newValue: { messageId: tgRes.messageId ?? null }, requestId: req.id } });
    }
  } catch {}

  revalidatePath(`/requests/${input.requestId}`);
}

export async function resolveRequestClarification(requestId: string): Promise<void> {
  const me = await getCurrentUser();
  if (!me) return;

  const req = await prisma.request.findUnique({ where: { id: requestId }, select: { id: true, status: true, creatorId: true, title: true } });
  if (!req) return;

  const allowedRoles = new Set(["LEADER", "ADMIN"]);
  if (!me.role || !allowedRoles.has(me.role)) return;

  if (req.status === "CLARIFICATION") {
    await prisma.$transaction(async (tx) => {
      const taskCount = await tx.task.count({ where: { requestId, status: { not: "DONE" } } });
      const nextStatus = taskCount > 0 ? "IN_PROGRESS" : "OPEN";
      const updated = await tx.request.update({ where: { id: requestId }, data: { status: nextStatus } });
      await tx.comment.create({ data: { requestId, content: `[Hệ thống] Đã làm rõ yêu cầu. Trạng thái chuyển về ${nextStatus}.`, authorId: me.id } });
      await tx.auditLog.create({ data: { userId: me.id, action: "RESOLVE_CLARIFICATION", entity: "Request", entityId: requestId, oldValue: { status: req.status }, newValue: { status: updated.status }, requestId } });
      await tx.notification.create({ data: { userId: req.creatorId, type: "TASK_UPDATED", title: "Đã làm rõ yêu cầu", message: `Yêu cầu đã được làm rõ và chuyển về trạng thái ${nextStatus}.`, requestId } });
    });
  }

  // Telegram notify leaders
  try {
    const leaders: any[] = await prisma.user.findMany({ where: { role: "LEADER" as any } });
    for (const leader of leaders) {
      const wantsTelegram = leader?.notificationChannel === "TELEGRAM" || leader?.notificationChannel === "BOTH";
      if (!leader.telegramChatId || !wantsTelegram) continue;
      const message = [
        "✅ *Đã trả lời làm rõ*",
        "",
        `${(me.name || "Người yêu cầu")} đã trả lời câu hỏi về:`,
        `📋 ${req.title}`,
      ].join("\n");
      await sendTelegramMessage({ chatId: leader.telegramChatId, message, parseMode: "Markdown", buttons: [[{ text: "👁️ Xem chi tiết", url: `${APP_URL || ""}/requests/${req.id}` }]] });
    }
  } catch {}

  revalidatePath(`/requests/${requestId}`);
}


