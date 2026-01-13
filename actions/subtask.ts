"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subtaskService } from "@/lib/services/subtask-service";
import { sendTelegramMessage } from "@/lib/services/telegram-service";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { APP_URL } from "@/lib/config/telegram";
import type { TaskStatus } from "@prisma/client";

/**
 * Server Actions for Subtask Operations
 * 
 * Provides server-side operations for managing subtasks including
 * creation, deletion, status queries, and permission checks.
 * 
 * References: mindmap ST1-3, I1-3
 */

// =============================================================================
// Validation Schemas
// =============================================================================

const createSubtaskSchema = z.object({
  parentId: z.string().min(1, "Parent ID không hợp lệ"),
  title: z.string()
    .min(3, "Tiêu đề phải có ít nhất 3 ký tự")
    .max(200, "Tiêu đề không được vượt quá 200 ký tự"),
  description: z.string().optional(),
  assigneeId: z.string().optional(),
});

const updateSubtaskStatusSchema = z.object({
  subtaskId: z.string().min(1, "Subtask ID không hợp lệ"),
  status: z.enum([
    "TODO",
    "IN_PROGRESS",
    "BLOCKED",
    "IN_REVIEW",
    "REWORK",
    "DONE",
  ], {
    message: "Trạng thái không hợp lệ",
  }),
});

const getSubtaskTreeSchema = z.object({
  parentTaskId: z.string().min(1, "Parent task ID không hợp lệ"),
});

const deleteSubtaskSchema = z.object({
  subtaskId: z.string().min(1, "Subtask ID không hợp lệ"),
});

const getSubtasksSchema = z.object({
  parentId: z.string().min(1, "Parent ID không hợp lệ"),
});

// =============================================================================
// Server Actions
// =============================================================================

/**
 * Check if subtasks can be added to a task
 * 
 * @param taskId - Task ID to check
 * @returns Can add status with reason
 */
export async function canAddSubtasks(taskId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        canAdd: false,
        reason: "Chưa đăng nhập",
      };
    }

    const result = await subtaskService.canAddSubtasks(taskId);

    return {
      success: true,
      canAdd: result.canAdd,
      reason: result.reason,
    };
  } catch (error) {
    console.error("canAddSubtasks error:", error);
    return {
      success: false,
      canAdd: false,
      reason: "Lỗi kiểm tra task",
    };
  }
}

/**
 * Create a new subtask
 * 
 * @param data - Subtask data
 * @returns Created subtask or error
 */
export async function createSubtask(data: {
  parentId: string;
  title: string;
  description?: string;
  assigneeId?: string;
}) {
  console.log('🔧 Creating subtask with data:', { parentId: data.parentId, title: data.title, assigneeId: data.assigneeId });
  
  try {
    // Validate input
    const validated = createSubtaskSchema.parse(data);
    console.log('✅ Validation passed:', validated);

    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Chưa đăng nhập",
      };
    }

    // Get user role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return {
        success: false,
        error: "User không tồn tại",
      };
    }

    // Create subtask via service
    console.log('🚀 Calling subtaskService.createSubtask with:', {
      parentId: validated.parentId,
      title: validated.title,
      description: validated.description,
      assigneeId: validated.assigneeId,
      userId: session.user.id,
      userRole: user.role,
    });
    
    const result = await subtaskService.createSubtask({
      parentId: validated.parentId,
      title: validated.title,
      description: validated.description,
      assigneeId: validated.assigneeId,
      userId: session.user.id,
      userRole: user.role,
    });
    
    console.log('📋 Service result:', result);

    if (result.success && result.subtask) {
      // Get parent task to revalidate correct path
      const parentTask = await prisma.task.findUnique({
        where: { id: validated.parentId },
        select: { requestId: true },
      });

      // TODO: Telegram notification requires telegramChatId field in User model
      // if (result.subtask.assigneeId) {
      //   try {
      //     const assignee = await prisma.user.findUnique({
      //       where: { id: result.subtask.assigneeId },
      //     });
      //
      //     if (assignee?.telegramChatId) {
      //       const message = [
      //         "📋 *Subtask mới được giao*",
      //         "",
      //         `🔹 *Subtask:* ${result.subtask.title}`,
      //         result.subtask.description ? `📝 ${result.subtask.description}` : "",
      //         result.subtask.deadline
      //           ? `⏰ *Deadline:* ${new Date(result.subtask.deadline).toLocaleString("vi-VN")}`
      //           : "",
      //         "",
      //         `👤 Giao bởi: ${user.name}`,
      //         `🔗 ${APP_URL || ""}/my-tasks`,
      //       ]
      //         .filter(Boolean)
      //         .join("\n");
      //
      //       await sendTelegramMessage({
      //         chatId: assignee.telegramChatId,
      //         message,
      //         parseMode: "Markdown",
      //       });
      //     }
      //   } catch (telegramError) {
      //     console.error("Telegram notification failed:", telegramError);
      //     // Don't fail the whole operation if telegram fails
      //   }
      // }

      // Revalidate paths
      revalidatePath("/my-tasks");
      if (parentTask?.requestId) {
        revalidatePath(`/requests/${parentTask.requestId}`);
      }

      return {
        success: true,
        subtask: result.subtask,
      };
    }

    return {
      success: false,
      error: result.error || "Không thể tạo subtask",
    };
  } catch (error) {
    console.error("[createSubtask] Error:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues?.[0]?.message || "Dữ liệu không hợp lệ"}`,
      };
    }

    return {
      success: false,
      error: error instanceof Error 
        ? `Failed to create subtask: ${error.message}` 
        : "Failed to create subtask",
    };
  }
}

/**
 * Delete a subtask
 * 
 * @param subtaskId - Subtask ID to delete
 * @returns Success status
 */
export async function deleteSubtask(subtaskId: string) {
  try {
    // Validate input
    const validated = deleteSubtaskSchema.parse({ subtaskId });

    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Chưa đăng nhập",
      };
    }

    // Get user role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return {
        success: false,
        error: "User không tồn tại",
      };
    }

    // Get subtask to find parent for revalidation
    const subtask = await prisma.task.findUnique({
      where: { id: validated.subtaskId },
      select: {
        parentTaskId: true,
        parentTask: {
          select: { requestId: true },
        },
      },
    });

    // Delete via service
    const result = await subtaskService.deleteSubtask({
      subtaskId: validated.subtaskId,
      userId: session.user.id,
      userRole: user.role,
    });

    if (result.success) {
      // Revalidate paths
      revalidatePath("/my-tasks");
      if (subtask?.parentTask?.requestId) {
        revalidatePath(`/requests/${subtask.parentTask.requestId}`);
      }
    }

    return result;
  } catch (error) {
    console.error("[deleteSubtask] Error:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues?.[0]?.message || "Dữ liệu không hợp lệ"}`,
      };
    }

    return {
      success: false,
      error: error instanceof Error 
        ? `Failed to delete subtask: ${error.message}` 
        : "Failed to delete subtask",
    };
  }
}

/**
 * Get all subtasks for a parent task
 * 
 * @param parentId - Parent task ID
 * @returns List of subtasks with details
 */
export async function getSubtasks(parentId: string) {
  try {
    // Validate input
    const validated = getSubtasksSchema.parse({ parentId });

    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Chưa đăng nhập",
      };
    }

    // Get subtasks
    const subtasks = await prisma.task.findMany({
      where: { parentTaskId: validated.parentId },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return {
      success: true,
      subtasks,
    };
  } catch (error) {
    console.error("[getSubtasks] Error:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues?.[0]?.message || "Dữ liệu không hợp lệ"}`,
      };
    }

    return {
      success: false,
      error: error instanceof Error 
        ? `Failed to load subtasks: ${error.message}` 
        : "Failed to load subtasks",
    };
  }
}

/**
 * Get subtask status summary for a parent task
 * 
 * @param parentId - Parent task ID
 * @returns Status aggregation result
 */
export async function getSubtaskStatus(parentId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Chưa đăng nhập",
      };
    }

    const result = await subtaskService.aggregateSubtaskStatus(parentId);

    return result;
  } catch (error) {
    console.error("getSubtaskStatus error:", error);
    return {
      success: false,
      error: "Không thể tải trạng thái subtask",
    };
  }
}

/**
 * Get available assignees for a subtask
 * 
 * @param requestId - Request ID to get team members
 * @returns List of potential assignees
 */
export async function getAvailableAssignees(requestId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Chưa đăng nhập",
      };
    }

    // Get request with team
    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        team: {
          include: {
            members: {
              where: { isActive: true },
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!request) {
      return {
        success: false,
        error: "Request không tồn tại",
      };
    }

    // Return team members
    const assignees = request.team?.members || [];

    return {
      success: true,
      assignees,
    };
  } catch (error) {
    console.error("[getAvailableAssignees] Error:", error);
    return {
      success: false,
      error: error instanceof Error 
        ? `Failed to load assignees: ${error.message}` 
        : "Failed to load assignees",
    };
  }
}

/**
 * Update parent task status after subtask changes
 * (Called automatically after subtask status updates)
 * 
 * @param parentId - Parent task ID
 * @returns Updated parent task
 */
export async function updateParentTaskStatus(parentId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Chưa đăng nhập",
      };
    }

    const result = await subtaskService.updateParentStatus(parentId);

    if (result.success) {
      // Get parent to revalidate
      const parent = await prisma.task.findUnique({
        where: { id: parentId },
        select: { requestId: true },
      });

      // Revalidate paths
      revalidatePath("/my-tasks");
      if (parent?.requestId) {
        revalidatePath(`/requests/${parent.requestId}`);
      }
    }

    return result;
  } catch (error) {
    console.error("updateParentTaskStatus error:", error);
    return {
      success: false,
      error: "Không thể cập nhật trạng thái parent task",
    };
  }
}

/**
 * Update subtask status
 * 
 * @param subtaskId - Subtask ID to update
 * @param status - New status
 * @returns Success status
 * 
 * Workflow:
 * 1. Update subtask status
 * 2. Trigger aggregateSubtaskStatus on parent
 * 3. If all subtasks DONE → Notify leader parent is ready for review
 * 4. Create audit log
 */
export async function updateSubtaskStatus(
  subtaskId: string,
  status: TaskStatus
) {
  try {
    // Validate input
    const validated = updateSubtaskStatusSchema.parse({ subtaskId, status });

    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Chưa đăng nhập",
      };
    }

    // Get subtask
    const subtask = await prisma.task.findUnique({
      where: { id: validated.subtaskId },
      include: {
        parentTask: {
          include: {
            request: {
              include: {
                team: true,
              },
            },
          },
        },
      },
    });

    if (!subtask) {
      return {
        success: false,
        error: "Subtask không tồn tại",
      };
    }

    if (!subtask.parentTaskId || !subtask.parentTask) {
      return {
        success: false,
        error: "Task này không phải là subtask",
      };
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return {
        success: false,
        error: "User không tồn tại",
      };
    }

    // Permission check (can manage subtask)
    const isAdmin = user.role === "ADMIN";
    const isAssignee = subtask.assigneeId === session.user.id;
    const isCreator = subtask.parentTask.request?.creatorId === session.user.id;
    const isLeader = subtask.parentTask.request?.team?.leaderId === session.user.id;

    if (!isAdmin && !isAssignee && !isCreator && !isLeader) {
      return {
        success: false,
        error: "Không có quyền cập nhật subtask này",
      };
    }

    const oldStatus = subtask.status;

    // Update subtask status
    const updatedSubtask = await prisma.task.update({
      where: { id: validated.subtaskId },
      data: {
        status: validated.status,
        ...(validated.status === "DONE" && { completedAt: new Date() }),
        ...(validated.status === "IN_PROGRESS" && !subtask.startedAt && { startedAt: new Date() }),
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "SUBTASK_STATUS_CHANGED",
        entity: "Task",
        entityId: subtask.id,
        taskId: subtask.id,
        oldValue: { status: oldStatus },
        newValue: { status: validated.status },
      },
    });

    // Aggregate parent status
    const statusResult = await subtaskService.aggregateSubtaskStatus(subtask.parentTaskId);

    if (statusResult.success && statusResult.status) {
      // Update parent task status
      await subtaskService.updateParentStatus(subtask.parentTaskId);

      // If all subtasks are DONE, notify team leader
      if (statusResult.status.canComplete && subtask.parentTask.request?.team) {
        // TODO: Telegram notification requires telegramChatId field in User model
        // try {
        //   const team = await prisma.team.findUnique({
        //     where: { id: subtask.parentTask.request.team.id },
        //   });
        //
        //   if (team?.leaderId) {
        //     const leader = await prisma.user.findUnique({
        //       where: { id: team.leaderId },
        //     });
        //
        //     if (leader?.telegramChatId) {
        //       const message = [
        //         "✅ *Tất cả subtasks đã hoàn thành!*",
        //         "",
        //         `📋 *Parent Task:* ${subtask.parentTask.title}`,
        //         `🔹 *Subtasks:* ${statusResult.status.subtaskCounts.total}/${statusResult.status.subtaskCounts.total} hoàn thành`,
        //         "",
        //         "Parent task đã sẵn sàng để review và đánh dấu hoàn thành.",
        //         "",
        //         `🔗 ${APP_URL || ""}/my-tasks`,
        //       ].join("\n");
        //
        //       await sendTelegramMessage({
        //         chatId: leader.telegramChatId,
        //         message,
        //         parseMode: "Markdown",
        //       });
        //     }
        //   }
        // } catch (telegramError) {
        //   console.error("Leader notification failed:", telegramError);
        //   // Don't fail the operation
        // }
      }
    }

    // Revalidate paths
    revalidatePath("/my-tasks");
    if (subtask.parentTask.requestId) {
      revalidatePath(`/requests/${subtask.parentTask.requestId}`);
    }

    return {
      success: true,
      subtask: updatedSubtask,
    };
  } catch (error) {
    console.error("updateSubtaskStatus error:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues?.[0]?.message || "Dữ liệu không hợp lệ",
      };
    }

    return {
      success: false,
      error: "Không thể cập nhật trạng thái subtask. Vui lòng thử lại.",
    };
  }
}

/**
 * Get subtask tree with full relations
 * 
 * @param parentTaskId - Parent task ID
 * @returns Subtask tree with status summary
 * 
 * Returns tree structure with:
 * - All subtasks with assignee info
 * - Parent task info
 * - Status aggregation summary
 * - Sorted by creation date
 */
export async function getSubtaskTree(parentTaskId: string) {
  try {
    // Validate input
    const validated = getSubtaskTreeSchema.parse({ parentTaskId });

    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Chưa đăng nhập",
      };
    }

    // Get parent task
    const parentTask = await prisma.task.findUnique({
      where: { id: validated.parentTaskId },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        request: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!parentTask) {
      return {
        success: false,
        error: "Parent task không tồn tại",
      };
    }

    // Get all subtasks with relations
    const subtasks = await prisma.task.findMany({
      where: { parentTaskId: validated.parentTaskId },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        parentTask: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Get status aggregation
    const statusResult = await subtaskService.aggregateSubtaskStatus(validated.parentTaskId);

    // Build tree structure
    const tree = {
      parent: {
        id: parentTask.id,
        title: parentTask.title,
        status: parentTask.status,
        assignee: parentTask.assignee,
        request: parentTask.request,
        createdAt: parentTask.createdAt,
        updatedAt: parentTask.updatedAt,
      },
      subtasks: subtasks.map((subtask) => ({
        id: subtask.id,
        title: subtask.title,
        description: subtask.description,
        status: subtask.status,
        assignee: subtask.assignee,
        deadline: subtask.deadline,
        startedAt: subtask.startedAt,
        completedAt: subtask.completedAt,
        createdAt: subtask.createdAt,
        updatedAt: subtask.updatedAt,
      })),
      summary: statusResult.success && statusResult.status
        ? {
            canComplete: statusResult.status.canComplete,
            recommendedStatus: statusResult.status.recommendedStatus,
            summary: statusResult.status.summary,
            counts: statusResult.status.subtaskCounts,
          }
        : null,
    };

    return {
      success: true,
      tree,
    };
  } catch (error) {
    console.error("getSubtaskTree error:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues?.[0]?.message || "Dữ liệu không hợp lệ",
      };
    }

    return {
      success: false,
      error: "Không thể tải cây subtask. Vui lòng thử lại.",
    };
  }
}

