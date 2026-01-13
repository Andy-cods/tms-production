import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";

/**
 * SLA Pause Service
 * 
 * Manages SLA pause/resume functionality for tasks.
 * Tracks pause reasons, calculates durations, and adjusts SLA deadlines.
 * 
 * References: mindmap IM, WC, R1-3
 */

// =============================================================================
// Types & Enums
// =============================================================================

/**
 * Pause Reason Enum
 */
export type PauseReason = 
  | "MEETING" 
  | "CUSTOMER_VISIT" 
  | "CLARIFICATION" 
  | "MANUAL";

/**
 * Pause Log with User Details
 */
export interface PauseLogWithDetails {
  id: string;
  reason: string;
  pausedAt: Date;
  resumedAt: Date | null;
  duration: number | null; // minutes
  pausedBy: string;
  pausedByName: string;
  notes: string | null;
}

/**
 * Pause History Item (formatted)
 */
export interface PauseHistoryItem {
  id: string;
  reason: string;
  pausedAt: string; // ISO string
  resumedAt: string | null; // ISO string
  duration: number | null; // minutes
  pausedBy: string;
  pausedByName: string;
  notes: string | null;
  formattedDuration: string; // "2 hours 15 minutes"
}

/**
 * Active Pause Info
 */
export interface ActivePause {
  id: string;
  taskId: string;
  reason: string;
  pausedAt: Date;
  pausedBy: string;
  pausedByName: string;
  notes: string | null;
  currentDuration: number; // minutes (calculated from now)
}

/**
 * Effective SLA Result
 */
export interface EffectiveSLAResult {
  originalDeadline: Date | null;
  totalPausedMinutes: number;
  adjustedDeadline: Date | null;
  isPaused: boolean;
  currentPauseStartedAt: Date | null;
}

// =============================================================================
// Zod Schemas
// =============================================================================

const pauseSLASchema = z.object({
  taskId: z.string().min(1, "Task ID không được để trống"),
  reason: z.enum(["MEETING", "CUSTOMER_VISIT", "CLARIFICATION", "MANUAL"], {
    message: "Lý do pause không hợp lệ",
  }),
  userId: z.string().min(1, "User ID không được để trống"),
  notes: z.string().optional(),
});

const resumeSLASchema = z.object({
  taskId: z.string().min(1, "Task ID không được để trống"),
  userId: z.string().min(1, "User ID không được để trống"),
});

const taskIdSchema = z.string().min(1, "Task ID không được để trống");

// =============================================================================
// Service Class
// =============================================================================

class SLAPauseService {
  /**
   * Pause SLA for a task
   * 
   * @param taskId - Task ID
   * @param reason - Pause reason
   * @param userId - User performing the pause
   * @param notes - Optional notes
   * @returns Pause result
   */
  async pauseSLA(
    taskId: string,
    reason: PauseReason,
    userId: string,
    notes?: string
  ) {
    try {
      // Validate input
      const validated = pauseSLASchema.parse({ taskId, reason, userId, notes });

      // Get task with current pause status
      const task = await prisma.task.findUnique({
        where: { id: validated.taskId },
        select: {
          id: true,
          title: true,
          slaPausedAt: true,
          slaPausedReason: true,
          slaDeadline: true,
          status: true,
        },
      });

      if (!task) {
        return {
          success: false,
          error: "Task không tồn tại",
        };
      }

      // Validate task not already paused
      if (task.slaPausedAt) {
        return {
          success: false,
          error: "Task đang trong trạng thái pause. Vui lòng resume trước khi pause lại.",
        };
      }

      // Validate task has SLA deadline
      if (!task.slaDeadline) {
        return {
          success: false,
          error: "Task không có SLA deadline",
        };
      }

      const now = new Date();

      // Create pause log
      const pauseLog = await prisma.sLAPauseLog.create({
        data: {
          taskId: validated.taskId,
          reason: validated.reason,
          pausedAt: now,
          pausedBy: validated.userId,
          notes: validated.notes || null,
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      // Update task
      await prisma.task.update({
        where: { id: validated.taskId },
        data: {
          slaPausedAt: now,
          slaPausedReason: validated.reason,
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: validated.userId,
          action: "SLA_PAUSED",
          entity: "Task",
          entityId: validated.taskId,
          oldValue: (null as unknown) as Prisma.InputJsonValue,
          newValue: ({
            slaPausedAt: now.toISOString(),
            slaPausedReason: validated.reason,
            notes: validated.notes,
            pausedBy: pauseLog.user.name,
          } as unknown) as Prisma.InputJsonValue,
        },
      });

      return {
        success: true,
        pauseLog: {
          id: pauseLog.id,
          reason: pauseLog.reason,
          pausedAt: pauseLog.pausedAt,
          pausedBy: pauseLog.pausedBy,
          pausedByName: pauseLog.user.name || "Unknown",
          notes: pauseLog.notes,
        },
      };
    } catch (error: any) {
      console.error("pauseSLA error:", error);

      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.issues[0]?.message || "Dữ liệu không hợp lệ",
        };
      }

      return {
        success: false,
        error: "Không thể pause SLA. Vui lòng thử lại.",
      };
    }
  }

  /**
   * Resume SLA for a task
   * 
   * @param taskId - Task ID
   * @param userId - User performing the resume
   * @returns Resume result with duration
   */
  async resumeSLA(taskId: string, userId: string) {
    try {
      // Validate input
      const validated = resumeSLASchema.parse({ taskId, userId });

      // Get task
      const task = await prisma.task.findUnique({
        where: { id: validated.taskId },
        select: {
          id: true,
          title: true,
          slaPausedAt: true,
          slaPausedReason: true,
          slaTotalPaused: true,
          slaDeadline: true,
          status: true,
        },
      });

      if (!task) {
        return {
          success: false,
          error: "Task không tồn tại",
        };
      }

      // Validate task is paused
      if (!task.slaPausedAt) {
        return {
          success: false,
          error: "Task không trong trạng thái pause",
        };
      }

      // Get active pause log
      const activePauseLog = await prisma.sLAPauseLog.findFirst({
        where: {
          taskId: validated.taskId,
          resumedAt: null, // Still active
        },
        orderBy: {
          pausedAt: "desc",
        },
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!activePauseLog) {
        return {
          success: false,
          error: "Không tìm thấy pause log đang active",
        };
      }

      const now = new Date();

      // Calculate duration in minutes
      const durationMs = now.getTime() - activePauseLog.pausedAt.getTime();
      const duration = Math.floor(durationMs / (1000 * 60));

      // Update pause log
      await prisma.sLAPauseLog.update({
        where: { id: activePauseLog.id },
        data: {
          resumedAt: now,
          duration,
        },
      });

      // Calculate new SLA deadline (add paused duration)
      const newSLADeadline = task.slaDeadline
        ? new Date(task.slaDeadline.getTime() + durationMs)
        : null;

      // Update task
      await prisma.task.update({
        where: { id: validated.taskId },
        data: {
          slaPausedAt: null,
          slaPausedReason: null,
          slaTotalPaused: {
            increment: duration,
          },
          ...(newSLADeadline && {
            slaDeadline: newSLADeadline,
          }),
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: validated.userId,
          action: "SLA_RESUMED",
          entity: "Task",
          entityId: validated.taskId,
          oldValue: {
            slaPausedAt: task.slaPausedAt.toISOString(),
            slaPausedReason: task.slaPausedReason,
            slaTotalPaused: task.slaTotalPaused,
            slaDeadline: task.slaDeadline?.toISOString(),
          },
          newValue: {
            slaPausedAt: null,
            slaPausedReason: null,
            slaTotalPaused: task.slaTotalPaused + duration,
            slaDeadline: newSLADeadline?.toISOString(),
            pauseDuration: duration,
            pausedBy: activePauseLog.user.name,
          },
        },
      });

      return {
        success: true,
        duration,
        formattedDuration: this.formatDuration(duration),
        newSLADeadline,
        totalPaused: task.slaTotalPaused + duration,
      };
    } catch (error: any) {
      console.error("resumeSLA error:", error);

      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.issues[0]?.message || "Dữ liệu không hợp lệ",
        };
      }

      return {
        success: false,
        error: "Không thể resume SLA. Vui lòng thử lại.",
      };
    }
  }

  /**
   * Get active pauses for a task
   * 
   * @param taskId - Task ID
   * @returns Array of active pauses
   */
  async getActivePauses(taskId: string): Promise<ActivePause[]> {
    try {
      // Validate input
      taskIdSchema.parse(taskId);

      const activePauses = await prisma.sLAPauseLog.findMany({
        where: {
          taskId,
          resumedAt: null, // Only active pauses
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          pausedAt: "desc",
        },
      });

      const now = new Date();

      return activePauses.map((pause) => {
        const currentDuration = Math.floor(
          (now.getTime() - pause.pausedAt.getTime()) / (1000 * 60)
        );

        return {
          id: pause.id,
          taskId: pause.taskId,
          reason: pause.reason,
          pausedAt: pause.pausedAt,
          pausedBy: pause.pausedBy,
          pausedByName: pause.user.name || "Unknown",
          notes: pause.notes,
          currentDuration,
        };
      });
    } catch (error) {
      console.error("getActivePauses error:", error);
      return [];
    }
  }

  /**
   * Get complete pause history for a task
   * 
   * @param taskId - Task ID
   * @returns Array of pause history items
   */
  async getPauseHistory(taskId: string): Promise<PauseHistoryItem[]> {
    try {
      // Validate input
      taskIdSchema.parse(taskId);

      const pauseLogs = await prisma.sLAPauseLog.findMany({
        where: { taskId },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          pausedAt: "desc",
        },
      });

      return pauseLogs.map((log) => ({
        id: log.id,
        reason: log.reason,
        pausedAt: log.pausedAt.toISOString(),
        resumedAt: log.resumedAt?.toISOString() || null,
        duration: log.duration,
        pausedBy: log.pausedBy,
        pausedByName: log.user.name || "Unknown",
        notes: log.notes,
        formattedDuration: log.duration
          ? this.formatDuration(log.duration)
          : "Đang pause",
      }));
    } catch (error) {
      console.error("getPauseHistory error:", error);
      return [];
    }
  }

  /**
   * Calculate effective SLA deadline for a task
   * 
   * Adjusts the original deadline by subtracting total paused time.
   * 
   * @param task - Task object with SLA fields
   * @returns Effective SLA info
   */
  async calculateEffectiveSLA(task: {
    id: string;
    slaDeadline: Date | null;
    slaTotalPaused: number;
    slaPausedAt: Date | null;
  }): Promise<EffectiveSLAResult> {
    const { slaDeadline, slaTotalPaused, slaPausedAt } = task;

    // If no SLA deadline, return null
    if (!slaDeadline) {
      return {
        originalDeadline: null,
        totalPausedMinutes: slaTotalPaused,
        adjustedDeadline: null,
        isPaused: !!slaPausedAt,
        currentPauseStartedAt: slaPausedAt,
      };
    }

    // Calculate adjusted deadline
    // Original deadline + total paused time
    const adjustedDeadline = new Date(
      slaDeadline.getTime() + slaTotalPaused * 60 * 1000
    );

    return {
      originalDeadline: slaDeadline,
      totalPausedMinutes: slaTotalPaused,
      adjustedDeadline,
      isPaused: !!slaPausedAt,
      currentPauseStartedAt: slaPausedAt,
    };
  }

  /**
   * Check if a task's SLA is currently paused
   * 
   * @param taskId - Task ID
   * @returns Pause status
   */
  async isPaused(taskId: string): Promise<boolean> {
    try {
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: { slaPausedAt: true },
      });

      return !!task?.slaPausedAt;
    } catch (error) {
      console.error("isPaused error:", error);
      return false;
    }
  }

  /**
   * Get pause statistics for a task
   * 
   * @param taskId - Task ID
   * @returns Pause statistics
   */
  async getPauseStats(taskId: string) {
    try {
      const [task, pauseLogs] = await Promise.all([
        prisma.task.findUnique({
          where: { id: taskId },
          select: {
            slaTotalPaused: true,
            slaPausedAt: true,
          },
        }),
        prisma.sLAPauseLog.findMany({
          where: { taskId },
        }),
      ]);

      if (!task) {
        return null;
      }

      const totalPauses = pauseLogs.length;
      const completedPauses = pauseLogs.filter((p) => p.resumedAt).length;
      const activePauses = pauseLogs.filter((p) => !p.resumedAt).length;

      // Calculate average pause duration (only completed pauses)
      const completedPauseDurations = pauseLogs
        .filter((p) => p.duration !== null)
        .map((p) => p.duration!);

      const avgPauseDuration =
        completedPauseDurations.length > 0
          ? Math.round(
              completedPauseDurations.reduce((a, b) => a + b, 0) /
                completedPauseDurations.length
            )
          : 0;

      // Count pauses by reason
      const pausesByReason = pauseLogs.reduce((acc, log) => {
        acc[log.reason] = (acc[log.reason] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalPauses,
        completedPauses,
        activePauses,
        totalPausedMinutes: task.slaTotalPaused,
        avgPauseDuration,
        pausesByReason,
        isPaused: !!task.slaPausedAt,
        formattedTotalPaused: this.formatDuration(task.slaTotalPaused),
      };
    } catch (error) {
      console.error("getPauseStats error:", error);
      return null;
    }
  }

  /**
   * Format duration in minutes to human-readable string
   * 
   * @param minutes - Duration in minutes
   * @returns Formatted string
   */
  private formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} phút`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours} giờ`;
    }

    return `${hours} giờ ${remainingMinutes} phút`;
  }

  /**
   * Validate pause reason
   * 
   * @param reason - Reason string
   * @returns True if valid
   */
  isValidPauseReason(reason: string): reason is PauseReason {
    return ["MEETING", "CUSTOMER_VISIT", "CLARIFICATION", "MANUAL"].includes(
      reason
    );
  }

  /**
   * Get pause reason label in Vietnamese
   * 
   * @param reason - Pause reason
   * @returns Vietnamese label
   */
  getPauseReasonLabel(reason: string): string {
    const labels: Record<string, string> = {
      MEETING: "Họp",
      CUSTOMER_VISIT: "Thăm khách hàng",
      CLARIFICATION: "Chờ làm rõ",
      MANUAL: "Thủ công",
    };

    return labels[reason] || reason;
  }
}

// Export singleton instance
export const slaPauseService = new SLAPauseService();

// Export types (already exported individually above)

