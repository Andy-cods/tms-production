/**
 * Subtask Service
 * 
 * Business logic for managing task hierarchies and subtasks.
 * 
 * Features:
 * - Create subtasks with parent-child relationships
 * - Aggregate subtask status to determine parent status
 * - Validate subtask operations
 * - Auto-update parent task status based on children
 * - RBAC permission checks
 * 
 * References: mindmap PARENT, ST1-3, I (status aggregation)
 */

import { prisma } from "@/lib/prisma";
import { Prisma, Role } from "@prisma/client";
import { z } from "zod";
import type { Task, TaskStatus } from "@prisma/client";

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * Result of subtask status aggregation
 */
export interface ParentStatus {
  canComplete: boolean;     // Can parent be marked as DONE?
  recommendedStatus: TaskStatus;  // Recommended status for parent
  summary: string;          // Human-readable summary
  subtaskCounts: {
    total: number;
    done: number;
    inProgress: number;
    blocked: number;
    todo: number;
    inReview: number;
    rework: number;
  };
}

/**
 * Options for creating a subtask
 */
export interface CreateSubtaskOptions {
  parentId: string;
  title: string;
  description?: string;
  assigneeId?: string;      // Optional override, defaults to parent's assignee
  deadline?: Date;
  userId: string;           // User creating the subtask (for RBAC)
  userRole: Role;          // User role (for RBAC)
}

/**
 * Options for deleting a subtask
 */
export interface DeleteSubtaskOptions {
  subtaskId: string;
  userId: string;
  userRole: Role;
}

// =============================================================================
// Zod Validation Schemas
// =============================================================================

const createSubtaskSchema = z.object({
  parentId: z.string().min(1, "Parent task ID không hợp lệ"),
  title: z.string().min(1, "Tiêu đề không được để trống").max(255, "Tiêu đề quá dài"),
  description: z.string().optional(),
  assigneeId: z.string().optional(),
  deadline: z.date().optional(),
  userId: z.string().min(1, "User ID không hợp lệ"),
  userRole: z.enum(["ASSIGNEE", "LEADER", "ADMIN"]),
});

const deleteSubtaskSchema = z.object({
  subtaskId: z.string().min(1, "Subtask ID không hợp lệ"),
  userId: z.string().min(1, "User ID không hợp lệ"),
  userRole: z.enum(["ASSIGNEE", "LEADER", "ADMIN"]),
});

const canAddSubtasksSchema = z.object({
  taskId: z.string().min(1, "Task ID không hợp lệ"),
});

const aggregateSubtaskStatusSchema = z.object({
  parentId: z.string().min(1, "Parent task ID không hợp lệ"),
});

// =============================================================================
// SubtaskService Class
// =============================================================================

export class SubtaskService {
  /**
   * Check if subtasks can be added to a task
   * 
   * @param taskId - Task ID to check
   * @returns True if subtasks can be added
   * 
   * Rules:
   * - Task must not be a subtask itself (parentTaskId === null)
   * - Task status must not be DONE or CANCELLED
   * - Task must exist
   */
  async canAddSubtasks(taskId: string): Promise<{
    canAdd: boolean;
    reason?: string;
  }> {
    try {
      // Validate input
      const validated = canAddSubtasksSchema.parse({ taskId });

      // Get task
      const task = await prisma.task.findUnique({
        where: { id: validated.taskId },
        select: {
          id: true,
          parentTaskId: true,
          status: true,
        },
      });

      if (!task) {
        return {
          canAdd: false,
          reason: "Task không tồn tại",
        };
      }

      // Check if task is already a subtask
      if (task.parentTaskId !== null) {
        return {
          canAdd: false,
          reason: "Không thể tạo subtask cho một subtask",
        };
      }

      // Check task status
      if (task.status === "DONE") {
        return {
          canAdd: false,
          reason: "Không thể tạo subtask cho task đã hoàn thành",
        };
      }

      return { canAdd: true };
    } catch (error: any) {
      console.error("canAddSubtasks error:", error);

      if (error instanceof z.ZodError) {
        return {
          canAdd: false,
          reason: error.issues[0]?.message || "Dữ liệu không hợp lệ",
        };
      }

      return {
        canAdd: false,
        reason: "Lỗi kiểm tra task",
      };
    }
  }

  /**
   * Create a new subtask
   * 
   * @param options - Creation options
   * @returns Created subtask
   * 
   * Workflow:
   * 1. Validate parent task exists and can have subtasks
   * 2. Check RBAC permissions (can user create subtask?)
   * 3. Create subtask with parentTaskId
   * 4. Auto-set requestId from parent
   * 5. Auto-set assigneeId from parent if not provided
   * 6. Update parent status to WAITING_SUBTASKS
   * 7. Create audit log
   */
  async createSubtask(options: CreateSubtaskOptions): Promise<{
    success: boolean;
    subtask?: Task;
    error?: string;
  }> {
    try {
      const validated = createSubtaskSchema.parse(options);

      const parentTask = await prisma.task.findUnique({
        where: { id: validated.parentId },
        include: {
          request: {
            include: {
              team: true,
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

      const canAdd = await this.canAddSubtasks(validated.parentId);

      if (!canAdd.canAdd) {
        return {
          success: false,
          error: canAdd.reason || "Không thể tạo subtask",
        };
      }

      const mappedRole = (validated.userRole as unknown as Role);
      const hasPermission = await this.canManageSubtask(
        validated.userId,
        mappedRole,
        parentTask
      );

      if (!hasPermission) {
        return {
          success: false,
          error: "Không có quyền tạo subtask",
        };
      }

      const assigneeId = validated.assigneeId || parentTask.assigneeId;

      const subtask = await prisma.task.create({
        data: {
          title: validated.title,
          description: validated.description,
          requestId: parentTask.requestId,
          parentTaskId: validated.parentId,
          assigneeId: assigneeId,
          deadline: validated.deadline,
          status: "TODO",
        },
      });

      await prisma.task.update({
        where: { id: validated.parentId },
        data: { status: "WAITING_SUBTASKS" },
      });

      await prisma.auditLog.create({
        data: {
          userId: validated.userId,
          action: "SUBTASK_CREATED",
          entity: "Task",
          entityId: subtask.id,
          newValue: ({
            title: subtask.title,
            parentTaskId: validated.parentId,
            requestId: parentTask.requestId,
          } as unknown) as Prisma.InputJsonValue,
        },
      });

      return {
        success: true,
        subtask,
      };
    } catch (error: any) {
      console.error("createSubtask error:", error);

      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.issues[0]?.message || "Dữ liệu không hợp lệ",
        };
      }

      return {
        success: false,
        error: "Không thể tạo subtask. Vui lòng thử lại.",
      };
    }
  }

  /**
   * Aggregate subtask status to determine parent status
   * 
   * @param parentId - Parent task ID
   * @returns Status summary and recommendations
   * 
   * Logic (mindmap I):
   * - All DONE → Parent can be marked DONE
   * - Any IN_PROGRESS → Parent should be IN_PROGRESS
   * - All TODO → Parent should be TODO
   * - Any BLOCKED → Parent might be BLOCKED
   */
  async aggregateSubtaskStatus(parentId: string): Promise<{
    success: boolean;
    status?: ParentStatus;
    error?: string;
  }> {
    try {
      // Validate input
      const validated = aggregateSubtaskStatusSchema.parse({ parentId });

      // Get all subtasks
      const subtasks = await prisma.task.findMany({
        where: { parentTaskId: validated.parentId },
        select: { status: true },
      });

      if (subtasks.length === 0) {
        return {
          success: true,
          status: {
            canComplete: true,
            recommendedStatus: "TODO",
            summary: "Không có subtask",
            subtaskCounts: {
              total: 0,
              done: 0,
              inProgress: 0,
              blocked: 0,
              todo: 0,
              inReview: 0,
              rework: 0,
            },
          },
        };
      }

      // Count subtasks by status
      const counts = {
        total: subtasks.length,
        done: subtasks.filter((s) => s.status === "DONE").length,
        inProgress: subtasks.filter((s) => s.status === "IN_PROGRESS").length,
        blocked: subtasks.filter((s) => s.status === "BLOCKED").length,
        todo: subtasks.filter((s) => s.status === "TODO").length,
        inReview: subtasks.filter((s) => s.status === "IN_REVIEW").length,
        rework: subtasks.filter((s) => s.status === "REWORK").length,
      };

      // Determine parent status based on subtask states
      let canComplete = false;
      let recommendedStatus: TaskStatus = "WAITING_SUBTASKS";
      let summary = "";

      // All subtasks are DONE
      if (counts.done === counts.total) {
        canComplete = true;
        recommendedStatus = "DONE";
        summary = `Tất cả ${counts.total} subtask đã hoàn thành`;
      }
      // Any subtask is IN_PROGRESS
      else if (counts.inProgress > 0) {
        canComplete = false;
        recommendedStatus = "IN_PROGRESS";
        summary = `${counts.inProgress}/${counts.total} subtask đang thực hiện`;
      }
      // Any subtask is BLOCKED
      else if (counts.blocked > 0) {
        canComplete = false;
        recommendedStatus = "BLOCKED";
        summary = `${counts.blocked}/${counts.total} subtask bị chặn`;
      }
      // Any subtask is IN_REVIEW
      else if (counts.inReview > 0) {
        canComplete = false;
        recommendedStatus = "IN_REVIEW";
        summary = `${counts.inReview}/${counts.total} subtask đang review`;
      }
      // Any subtask is REWORK
      else if (counts.rework > 0) {
        canComplete = false;
        recommendedStatus = "REWORK";
        summary = `${counts.rework}/${counts.total} subtask cần làm lại`;
      }
      // All subtasks are TODO
      else if (counts.todo === counts.total) {
        canComplete = false;
        recommendedStatus = "TODO";
        summary = `${counts.total} subtask chưa bắt đầu`;
      }
      // Mixed statuses
      else {
        canComplete = false;
        recommendedStatus = "WAITING_SUBTASKS";
        summary = `${counts.done}/${counts.total} subtask hoàn thành`;
      }

      return {
        success: true,
        status: {
          canComplete,
          recommendedStatus,
          summary,
          subtaskCounts: counts,
        },
      };
    } catch (error: any) {
      console.error("aggregateSubtaskStatus error:", error);

      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.issues[0]?.message || "Dữ liệu không hợp lệ",
        };
      }

      return {
        success: false,
        error: "Không thể tính toán trạng thái subtask",
      };
    }
  }

  /**
   * Delete a subtask
   * 
   * @param options - Deletion options
   * @returns Success status
   * 
   * Workflow:
   * 1. Validate subtask exists and is actually a subtask
   * 2. Check RBAC permissions
   * 3. Delete subtask
   * 4. Recalculate parent status
   * 5. Update parent if needed
   * 6. Create audit log
   */
  async deleteSubtask(options: DeleteSubtaskOptions): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Validate input
      const validated = deleteSubtaskSchema.parse(options);

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

      // Verify it's actually a subtask
      if (!subtask.parentTaskId || !subtask.parentTask) {
        return {
          success: false,
          error: "Task này không phải là subtask",
        };
      }

      // RBAC check
      const mappedRole = (validated.userRole as unknown as Role);
      const hasPermission = await this.canManageSubtask(
        validated.userId,
        mappedRole,
        subtask.parentTask
      );

      if (!hasPermission) {
        return {
          success: false,
          error: "Không có quyền xóa subtask",
        };
      }

      const parentId = subtask.parentTaskId;
      const subtaskTitle = subtask.title;

      // Delete subtask
      await prisma.task.delete({
        where: { id: validated.subtaskId },
      });

      // Recalculate parent status
      const statusResult = await this.aggregateSubtaskStatus(parentId);

      if (statusResult.success && statusResult.status) {
        // Update parent status based on remaining subtasks
        await prisma.task.update({
          where: { id: parentId },
          data: {
            status: statusResult.status.recommendedStatus,
          },
        });
      }

      await prisma.auditLog.create({
        data: {
          userId: validated.userId,
          action: "SUBTASK_DELETED",
          entity: "Task",
          entityId: validated.subtaskId,
          oldValue: {
            title: subtaskTitle,
            parentTaskId: parentId,
          },
        },
      });

      return { success: true };
    } catch (error: any) {
      console.error("deleteSubtask error:", error);

      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.issues[0]?.message || "Dữ liệu không hợp lệ",
        };
      }

      return {
        success: false,
        error: "Không thể xóa subtask. Vui lòng thử lại.",
      };
    }
  }

  /**
   * Update parent task status based on subtasks
   * 
   * @param parentId - Parent task ID
   * @returns Updated parent task
   */
  async updateParentStatus(parentId: string): Promise<{
    success: boolean;
    task?: Task;
    error?: string;
  }> {
    try {
      // Get aggregated status
      const statusResult = await this.aggregateSubtaskStatus(parentId);

      if (!statusResult.success || !statusResult.status) {
        return {
          success: false,
          error: statusResult.error || "Không thể tính toán trạng thái",
        };
      }

      const { recommendedStatus, canComplete } = statusResult.status;

      // Prepare update data
      const updateData: any = {
        status: recommendedStatus,
      };

      // If all subtasks complete, set completedAt
      if (canComplete && recommendedStatus === "DONE") {
        updateData.completedAt = new Date();
      }

      const updatedTask = await prisma.task.update({
        where: { id: parentId },
        data: updateData,
      });

      return {
        success: true,
        task: updatedTask,
      };
    } catch (error: any) {
      console.error("updateParentStatus error:", error);

      return {
        success: false,
        error: "Không thể cập nhật trạng thái parent task",
      };
    }
  }

  // =============================================================================
  // Helper Methods
  // =============================================================================

  /**
   * Check if user can manage subtasks for a task
   * 
   * @param userId - User ID
   * @param userRole - User role
   * @param task - Task (parent or subtask)
   * @returns True if user has permission
   * 
   * RBAC Rules:
   * - ADMIN: always yes
   * - Request creator: yes
   * - Team leader: yes (if task belongs to their team)
   * - Task assignee: yes
   */
  private async canManageSubtask(
    userId: string,
    userRole: Role,
    task: Task & { request?: any }
  ): Promise<boolean> {
    // Admin can do anything
    if (userRole === "ADMIN") return true;

    // Request creator can manage
    if (task.request?.creatorId === userId) return true;

    // Task assignee can manage
    if (task.assigneeId === userId) return true;

    // Team leader can manage
    if (task.request?.team) {
      const team = await prisma.team.findUnique({
        where: { id: task.request.team.id },
      });

      if (team?.leaderId === userId) return true;
    }

    return false;
  }
}

// Export singleton instance
export const subtaskService = new SubtaskService();

