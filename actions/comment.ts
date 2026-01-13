// actions/comment.ts
"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Logger } from "@/lib/utils/logger";

const commentSchema = z.object({
  requestId: z.string().uuid("ID yêu cầu không hợp lệ"),
  content: z
    .string()
    .trim()
    .min(3, "Nội dung bình luận phải có ít nhất 3 ký tự")
    .max(1000, "Nội dung bình luận không vượt quá 1000 ký tự"),
});

export async function addRequestComment(input: { requestId: string; content: string }): Promise<void> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      Logger.warn("Unauthorized comment attempt", { action: "addRequestComment" });
      return;
    }

    const parsed = commentSchema.safeParse(input);
    if (!parsed.success) {
      Logger.warn("Invalid comment input", { action: "addRequestComment", errors: parsed.error.issues });
      return;
    }

    const { requestId, content } = parsed.data;

    // ensure request exists
    const request = await prisma.request.findUnique({ where: { id: requestId }, select: { id: true } });
    if (!request) {
      Logger.warn("Request not found for comment", { action: "addRequestComment", requestId });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.comment.create({
        data: {
          requestId,
          content,
          authorId: (session.user as any).id,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: (session.user as any).id,
          action: "ADD_COMMENT",
          entity: "Request",
          entityId: requestId,
          newValue: { content: content.slice(0, 140) },
          requestId,
        },
      });
    });

    Logger.info("Request comment added successfully", { 
      action: "addRequestComment", 
      requestId, 
      userId: (session.user as any).id 
    });

    revalidatePath(`/requests/${requestId}`);
  } catch (error) {
    Logger.captureException(error as Error, { action: "addRequestComment", requestId: input.requestId });
    throw error;
  }
}

export async function createTaskComment(input: { taskId: string; content: string }): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const parsed = commentSchema.extend({ taskId: z.string().uuid(), requestId: z.undefined().optional() })
    .omit({ requestId: true })
    .safeParse(input);
  if (!parsed.success) return;

  const { taskId, content } = parsed.data as { taskId: string; content: string };

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, request: { select: { id: true, teamId: true } } },
  });
  if (!task) return;

  // Simple team check: commenter must be in the same team as the request (if team bound)
  const me = await prisma.user.findUnique({ where: { id: (session.user as any).id }, select: { teamId: true } });
  if (task.request?.teamId && me?.teamId !== task.request.teamId) return;

  await prisma.$transaction(async (tx) => {
    await tx.comment.create({
      data: {
        taskId,
        content,
        authorId: (session.user as any).id,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: "COMMENT_TASK",
        entity: "Task",
        entityId: taskId,
        newValue: { content: content.slice(0, 140) },
        taskId,
        requestId: task.request?.id,
      },
    });
  });

  if (task.request?.id) {
    revalidatePath(`/requests/${task.request.id}`);
  }
}


