"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getUserId } from "@/lib/auth-helpers";

export async function updateTaskStatus(taskId: string, newStatus: string) {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Chưa đăng nhập" };

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { assigneeId: true, status: true, requestId: true },
    });
    if (!task) return { success: false, error: "Không tìm thấy công việc" };
    const userId = getUserId(session);
    if (task.assigneeId !== userId)
      return { success: false, error: "Bạn không có quyền cập nhật công việc này" };

    const validStatuses = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "BLOCKED"] as const;
    if (!validStatuses.includes(newStatus as any))
      return { success: false, error: "Trạng thái không hợp lệ" };

    const updateData: any = { status: newStatus };
    if (newStatus === "DONE" && task.status !== "DONE") updateData.completedAt = new Date();
    if (newStatus !== "DONE" && task.status === "DONE") updateData.completedAt = null;

    await prisma.task.update({ where: { id: taskId }, data: updateData });

    await prisma.auditLog.create({
      data: {
        action: "UPDATE",
        entity: "Task",
        entityId: taskId,
        userId: userId,
        oldValue: { status: task.status },
        newValue: { status: newStatus },
        taskId: taskId,
      },
    });

    revalidatePath("/my-tasks");
    if (task.requestId) revalidatePath(`/requests/${task.requestId}`);
    return { success: true, message: "Đã cập nhật trạng thái thành công" };
  } catch (error) {
    console.error("[updateTaskStatus] Error:", error);
    return { success: false, error: "Lỗi cập nhật trạng thái" };
  }
}

export async function addTaskComment(taskId: string, content: string) {
  try {
    const session = await auth();
    if (!session?.user) return { success: false, error: "Chưa đăng nhập" };

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { assigneeId: true, requestId: true },
    });
    if (!task) return { success: false, error: "Không tìm thấy công việc" };
    const userId = getUserId(session);
    if (task.assigneeId !== userId) return { success: false, error: "Bạn không có quyền bình luận" };

    await prisma.comment.create({
      data: { content, requestId: task.requestId!, authorId: userId },
    });

    revalidatePath("/my-tasks");
    if (task.requestId) revalidatePath(`/requests/${task.requestId}`);
    return { success: true, message: "Đã thêm bình luận" };
  } catch (error) {
    console.error("[addTaskComment] Error:", error);
    return { success: false, error: "Lỗi thêm bình luận" };
  }
}


