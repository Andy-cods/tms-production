"use server";

import { auth } from "@/lib/auth";
import { notificationService } from "@/lib/services/notification-service";
import { revalidatePath } from "next/cache";
import { getUserId } from "@/lib/auth-helpers";

export async function getNotifications() {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Chưa đăng nhập" };

    const [notifications, unreadCount] = await Promise.all([
      notificationService.getRecent(getUserId(session)),
      notificationService.getUnreadCount(getUserId(session)),
    ]);

    return {
      success: true,
      notifications: notifications.map((n) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
        readAt: n.readAt ? n.readAt.toISOString() : null,
      })),
      unreadCount,
    };
  } catch (error) {
    console.error("[getNotifications]:", error);
    return { success: false, error: "Lỗi tải thông báo" };
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Chưa đăng nhập" };

    await notificationService.markAsRead(notificationId);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[markNotificationAsRead]:", error);
    return { success: false, error: "Lỗi đánh dấu đã đọc" };
  }
}

export async function markAllNotificationsAsRead() {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Chưa đăng nhập" };

    await notificationService.markAllAsRead(getUserId(session));
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[markAllNotificationsAsRead]:", error);
    return { success: false, error: "Lỗi đánh dấu tất cả" };
  }
}

export async function getNotificationSettings() {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Chưa đăng nhập" };

    const settings = await notificationService.getSettings(getUserId(session));
    return {
      success: true,
      settings: {
        ...settings,
        createdAt: settings.createdAt.toISOString(),
        updatedAt: settings.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("[getNotificationSettings]:", error);
    return { success: false, error: "Lỗi tải cài đặt" };
  }
}

export async function updateNotificationSettings(data: any) {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Chưa đăng nhập" };

    await notificationService.updateSettings(getUserId(session), data);
    revalidatePath("/");
    return { success: true, message: "Đã cập nhật cài đặt" };
  } catch (error) {
    console.error("[updateNotificationSettings]:", error);
    return { success: false, error: "Lỗi cập nhật cài đặt" };
  }
}
