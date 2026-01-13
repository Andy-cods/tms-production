"use server";

import { auth } from "@/lib/auth";
import { timeTrackingService } from "@/lib/services/time-tracking-service";
import { revalidatePath } from "next/cache";
import { getUserId } from "@/lib/auth-helpers";

export async function startTimer(taskId: string) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Chưa đăng nhập" };
  const result = await timeTrackingService.startTimer(taskId, getUserId(session));
  revalidatePath("/my-tasks");
  return result;
}

export async function stopTimer(timeLogId: string) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Chưa đăng nhập" };
  const result = await timeTrackingService.stopTimer(timeLogId);
  revalidatePath("/my-tasks");
  return result;
}

export async function pauseTimer(timeLogId: string) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Chưa đăng nhập" };
  const result = await timeTrackingService.pauseTimer(timeLogId);
  revalidatePath("/my-tasks");
  return result;
}

export async function resumeTimer(timeLogId: string) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Chưa đăng nhập" };
  const result = await timeTrackingService.resumeTimer(timeLogId);
  revalidatePath("/my-tasks");
  return result;
}

export async function getActiveTimer() {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Chưa đăng nhập" };
  const result = await timeTrackingService.getActiveTimer(getUserId(session));
  return result;
}

export async function getTaskTimeLogs(taskId: string) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Chưa đăng nhập" };
  const result = await timeTrackingService.getTaskTimeLogs(taskId);
  return result;
}

export async function addManualTimeLog(data: { taskId: string; startTime: string; endTime: string; notes?: string }) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Chưa đăng nhập" };
  const result = await timeTrackingService.addManualLog(data.taskId, getUserId(session), new Date(data.startTime), new Date(data.endTime), data.notes);
  revalidatePath("/time-logs");
  return result;
}

export async function updateTimeLog(timeLogId: string, data: { notes?: string; isBillable?: boolean }) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Chưa đăng nhập" };
  const result = await timeTrackingService.updateTimeLog(timeLogId, data);
  revalidatePath("/time-logs");
  return result;
}

export async function deleteTimeLog(timeLogId: string) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Chưa đăng nhập" };
  const result = await timeTrackingService.deleteTimeLog(timeLogId);
  revalidatePath("/time-logs");
  return result;
}

export async function getUserAnalytics(days = 7) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Chưa đăng nhập" };
  const result = await timeTrackingService.getUserAnalytics(getUserId(session), days);
  return result;
}
