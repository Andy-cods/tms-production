"use server";

import { auth } from "@/lib/auth";
import { slaPauseService } from "@/lib/services/sla-pause-service";
import { reminderService } from "@/lib/services/reminder-service";
import { revalidatePath } from "next/cache";
import { z } from "zod";

/**
 * SLA Pause Server Actions
 * 
 * Provides server actions for pausing/resuming task SLA.
 * Integrates with SLA Pause Service and Reminder Service.
 * 
 * References: mindmap IM, WC, ACL
 */

// =============================================================================
// Zod Schemas
// =============================================================================

const pauseSLASchema = z.object({
  taskId: z.string().min(1, "Task ID không được để trống"),
  reason: z.enum(["MEETING", "CUSTOMER_VISIT", "CLARIFICATION", "MANUAL"], {
    message: "Lý do pause không hợp lệ",
  }),
  notes: z.string().optional(),
});

const resumeSLASchema = z.object({
  taskId: z.string().min(1, "Task ID không được để trống"),
});

const getPauseHistorySchema = z.string().min(1, "Task ID không được để trống");

// =============================================================================
// Server Actions
// =============================================================================

/**
 * Pause SLA Action
 * 
 * @param taskId - Task ID
 * @param reason - Pause reason
 * @param notes - Optional notes
 * @returns Action result
 */
export async function pauseSLAAction(
  taskId: string,
  reason: string,
  notes?: string
) {
  try {
    // Validate input
    const validated = pauseSLASchema.parse({ taskId, reason, notes });

    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Chưa đăng nhập",
      };
    }

    const userId = session.user.id;

    // Call SLA pause service
    const result = await slaPauseService.pauseSLA(
      validated.taskId,
      validated.reason as any,
      userId,
      validated.notes
    );

    if (!result.success) {
      return result;
    }

    // Cancel reminders while paused
    reminderService.cancelReminders(validated.taskId);

    // Revalidate relevant paths
    revalidatePath(`/requests/${validated.taskId}`);
    revalidatePath("/my-tasks");
    revalidatePath("/leader");

    return {
      success: true,
      pauseLog: result.pauseLog,
    };
  } catch (error) {
    console.error("pauseSLAAction error:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues?.[0]?.message || "Dữ liệu không hợp lệ",
      };
    }

    return {
      success: false,
      error: "Không thể pause SLA. Vui lòng thử lại.",
    };
  }
}

/**
 * Resume SLA Action
 * 
 * @param taskId - Task ID
 * @returns Action result with duration
 */
export async function resumeSLAAction(taskId: string) {
  try {
    // Validate input
    const validated = resumeSLASchema.parse({ taskId });

    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Chưa đăng nhập",
      };
    }

    const userId = session.user.id;

    // Call SLA pause service
    const result = await slaPauseService.resumeSLA(validated.taskId, userId);

    if (!result.success) {
      return result;
    }

    // Reschedule reminders after resume
    await reminderService.rescheduleReminders(validated.taskId);

    // Revalidate relevant paths
    revalidatePath(`/requests/${validated.taskId}`);
    revalidatePath("/my-tasks");
    revalidatePath("/leader");

    return {
      success: true,
      duration: result.duration,
      formattedDuration: result.formattedDuration,
      newSLADeadline: result.newSLADeadline,
      totalPaused: result.totalPaused,
    };
  } catch (error) {
    console.error("resumeSLAAction error:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues?.[0]?.message || "Dữ liệu không hợp lệ",
      };
    }

    return {
      success: false,
      error: "Không thể resume SLA. Vui lòng thử lại.",
    };
  }
}

/**
 * Get Pause History Action
 * 
 * @param taskId - Task ID
 * @returns Pause history
 */
export async function getPauseHistoryAction(taskId: string) {
  try {
    // Validate input
    getPauseHistorySchema.parse(taskId);

    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Chưa đăng nhập",
      };
    }

    // Get pause history from service
    const history = await slaPauseService.getPauseHistory(taskId);

    return {
      success: true,
      history,
    };
  } catch (error) {
    console.error("getPauseHistoryAction error:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues?.[0]?.message || "Dữ liệu không hợp lệ",
      };
    }

    return {
      success: false,
      error: "Không thể lấy lịch sử pause",
    };
  }
}

/**
 * Get Pause Stats Action
 * 
 * @param taskId - Task ID
 * @returns Pause statistics
 */
export async function getPauseStatsAction(taskId: string) {
  try {
    // Validate input
    getPauseHistorySchema.parse(taskId);

    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Chưa đăng nhập",
      };
    }

    // Get pause stats from service
    const stats = await slaPauseService.getPauseStats(taskId);

    if (!stats) {
      return {
        success: false,
        error: "Task không tồn tại",
      };
    }

    return {
      success: true,
      stats,
    };
  } catch (error) {
    console.error("getPauseStatsAction error:", error);

    return {
      success: false,
      error: "Không thể lấy thống kê pause",
    };
  }
}

/**
 * Check if Task is Paused Action
 * 
 * @param taskId - Task ID
 * @returns Pause status
 */
export async function isTaskPausedAction(taskId: string) {
  try {
    // Validate input
    getPauseHistorySchema.parse(taskId);

    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Chưa đăng nhập",
      };
    }

    // Check pause status
    const isPaused = await slaPauseService.isPaused(taskId);

    return {
      success: true,
      isPaused,
    };
  } catch (error) {
    console.error("isTaskPausedAction error:", error);

    return {
      success: false,
      error: "Không thể kiểm tra trạng thái pause",
    };
  }
}

