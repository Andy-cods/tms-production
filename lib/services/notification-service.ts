import { prisma } from "@/lib/prisma";
import type { NotificationType, NotificationPriority } from "@prisma/client";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  priority?: NotificationPriority;
  metadata?: any;
}

export const notificationService = {
  async create(params: CreateNotificationParams) {
    const { userId, type, title, message, link, priority, metadata } = params;

    const settings = await this.getSettings(userId);
    if (settings && this.isDNDActive(settings)) {
      if (priority !== "URGENT") {
        console.log(`[Notification] Skipped (DND): ${title}`);
        return null;
      }
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link,
        priority: priority || ("INFO" as NotificationPriority),
        metadata: metadata ?? {},
      },
    });

    console.log(`[Notification] Created for ${userId}: ${title}`);
    return notification;
  },

  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({ where: { userId, isRead: false } });
  },

  async getRecent(userId: string, limit = 20) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },

  async markAsRead(notificationId: string) {
    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });
  },

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  },

  async deleteOld(daysOld = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysOld);
    return prisma.notification.deleteMany({
      where: { createdAt: { lt: cutoff }, isRead: true },
    });
  },

  async getSettings(userId: string) {
    let settings = await prisma.notificationSetting.findUnique({ where: { userId } });
    if (!settings) {
      settings = await prisma.notificationSetting.create({ data: { userId } });
    }
    return settings;
  },

  async updateSettings(userId: string, data: any) {
    return prisma.notificationSetting.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  },

  isDNDActive(settings: any): boolean {
    if (!settings.dndEnabled) return false;
    const now = new Date();
    const hh = now.getHours().toString().padStart(2, "0");
    const mm = now.getMinutes().toString().padStart(2, "0");
    const current = `${hh}:${mm}`;
    const day = now.getDay();

    const days: number[] = (settings.dndDays as any) || [];
    if (days.length > 0 && !days.includes(day)) return false;

    if (settings.dndStartTime && settings.dndEndTime) {
      return current >= settings.dndStartTime && current <= settings.dndEndTime;
    }
    return false;
  },

  async notifyTaskAssigned(taskId: string, assigneeId: string, taskTitle: string) {
    return this.create({
      userId: assigneeId,
      type: "TASK_ASSIGNED" as NotificationType,
      title: "Công việc mới",
      message: `Bạn được giao: ${taskTitle}`,
      link: `/my-tasks/${taskId}`,
      priority: "INFO" as NotificationPriority,
      metadata: { taskId },
    });
  },

  async notifyTaskDueSoon(taskId: string, assigneeId: string, taskTitle: string, hoursLeft: number) {
    const prio = (hoursLeft <= 1 ? "URGENT" : "WARNING") as NotificationPriority;
    return this.create({
      userId: assigneeId,
      type: "DEADLINE_APPROACHING" as NotificationType,
      title: hoursLeft <= 1 ? "⚠️ Khẩn cấp!" : "⏰ Sắp đến hạn",
      message: `"${taskTitle}" còn ${hoursLeft} giờ` ,
      link: `/requests/${taskId}`,
      priority: prio,
      metadata: { taskId, hoursLeft },
    });
  },

  async notifyTaskOverdue(taskId: string, assigneeId: string, taskTitle: string) {
    return this.create({
      userId: assigneeId,
      type: "OVERDUE" as NotificationType,
      title: "🔴 Quá hạn!",
      message: `"${taskTitle}" đã quá hạn`,
      link: `/requests/${taskId}`,
      priority: "URGENT" as NotificationPriority,
      metadata: { taskId },
    });
  },

  async notifyTaskCompleted(taskId: string, requesterId: string, taskTitle: string) {
    return this.create({
      userId: requesterId,
      type: "COMPLETED" as NotificationType,
      title: "✅ Hoàn thành",
      message: `"${taskTitle}" đã hoàn thành`,
      link: `/requests/${taskId}`,
      priority: "INFO" as NotificationPriority,
      metadata: { taskId },
    });
  },

  async notifyApproval(taskId: string, assigneeId: string, taskTitle: string, approved: boolean) {
    return this.create({
      userId: assigneeId,
      type: (approved ? "REVIEW_NEEDED" : "REVIEW_NEEDED") as NotificationType,
      title: approved ? "✅ Đã duyệt" : "❌ Yêu cầu làm lại",
      message: `"${taskTitle}" ${approved ? "đã được duyệt" : "cần làm lại"}`,
      link: `/requests/${taskId}`,
      priority: (approved ? "INFO" : "WARNING") as NotificationPriority,
      metadata: { taskId, approved },
    });
  },
};
