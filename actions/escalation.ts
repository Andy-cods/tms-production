"use server";

import { auth } from "@/lib/auth";
import { escalationService } from "@/lib/services/escalation-service";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";

/**
 * Escalation Management Server Actions
 * 
 * Provides server actions for managing escalations.
 * Includes RBAC: Leaders see team escalations, Admins see all.
 * 
 * References: mindmap L1, L1C
 */

// =============================================================================
// Zod Schemas
// =============================================================================

const acknowledgeEscalationSchema = z.object({
  escalationId: z.string().min(1, "Escalation ID không được để trống"),
});

const resolveEscalationSchema = z.object({
  escalationId: z.string().min(1, "Escalation ID không được để trống"),
  notes: z.string().optional(),
});

const reassignEscalationSchema = z.object({
  escalationId: z.string().min(1, "Escalation ID không được để trống"),
  newRecipientId: z.string().min(1, "Recipient ID không được để trống"),
});

const getEscalationsSchema = z.object({
  status: z.enum(["all", "PENDING", "ACKNOWLEDGED", "RESOLVED"]).optional(),
  triggerType: z
    .enum(["all", "NO_CONFIRMATION", "CLARIFICATION_TIMEOUT", "SLA_OVERDUE", "STUCK_TASK"])
    .optional(),
  assignedTo: z.string().optional(),
});

// =============================================================================
// Server Actions
// =============================================================================

/**
 * Acknowledge Escalation Action
 * 
 * @param escalationId - Escalation ID
 * @returns Action result
 */
export async function acknowledgeEscalationAction(escalationId: string) {
  try {
    // Validate input
    const validated = acknowledgeEscalationSchema.parse({ escalationId });

    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Chưa đăng nhập",
      };
    }

    const userId = session.user.id;

    // Call service
    const result = await escalationService.acknowledgeEscalation(
      validated.escalationId,
      userId
    );

    if (!result.success) {
      return result;
    }

    // Revalidate paths
    revalidatePath("/escalations");
    revalidatePath("/leader");

    return {
      success: true,
    };
  } catch (error) {
    console.error("acknowledgeEscalationAction error:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues?.[0]?.message || "Dữ liệu không hợp lệ",
      };
    }

    return {
      success: false,
      error: "Không thể acknowledge escalation",
    };
  }
}

/**
 * Resolve Escalation Action
 * 
 * @param escalationId - Escalation ID
 * @param notes - Resolution notes
 * @returns Action result
 */
export async function resolveEscalationAction(
  escalationId: string,
  notes?: string
) {
  try {
    // Validate input
    const validated = resolveEscalationSchema.parse({ escalationId, notes });

    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Chưa đăng nhập",
      };
    }

    const userId = session.user.id;

    // Call service
    const result = await escalationService.resolveEscalation(
      validated.escalationId,
      userId,
      validated.notes
    );

    if (!result.success) {
      return result;
    }

    // Revalidate paths
    revalidatePath("/escalations");
    revalidatePath("/leader");

    return {
      success: true,
      resolvedAt: result.resolvedAt,
    };
  } catch (error) {
    console.error("resolveEscalationAction error:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues?.[0]?.message || "Dữ liệu không hợp lệ",
      };
    }

    return {
      success: false,
      error: "Không thể resolve escalation",
    };
  }
}

/**
 * Reassign Escalation Action
 * 
 * @param escalationId - Escalation ID
 * @param newRecipientId - New recipient user ID
 * @returns Action result
 */
export async function reassignEscalationAction(
  escalationId: string,
  newRecipientId: string
) {
  try {
    // Validate input
    const validated = reassignEscalationSchema.parse({
      escalationId,
      newRecipientId,
    });

    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Chưa đăng nhập",
      };
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        role: true,
      },
    });

    // RBAC: Only ADMIN or current recipient can reassign
    const escalation = await prisma.escalationLog.findUnique({
      where: { id: validated.escalationId },
    });

    if (!escalation) {
      return {
        success: false,
        error: "Escalation không tồn tại",
      };
    }

    const canReassign =
      currentUser?.role === "ADMIN" ||
      escalation.escalatedTo === session.user.id;

    if (!canReassign) {
      return {
        success: false,
        error: "Chỉ Admin hoặc người nhận mới có thể reassign escalation",
      };
    }

    // Get new recipient
    const newRecipient = await prisma.user.findUnique({
      where: { id: validated.newRecipientId },
      select: { id: true, name: true },
    });

    if (!newRecipient) {
      return {
        success: false,
        error: "User mới không tồn tại",
      };
    }

    const oldRecipient = escalation.escalatedTo;

    // Update escalation
    await prisma.escalationLog.update({
      where: { id: validated.escalationId },
      data: {
        escalatedTo: validated.newRecipientId,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "ESCALATION_REASSIGNED",
        entity: escalation.taskId ? "Task" : "Request",
        entityId: escalation.taskId || escalation.requestId!,
        oldValue: { escalatedTo: oldRecipient } as Prisma.InputJsonValue,
        newValue: { escalatedTo: validated.newRecipientId } as Prisma.InputJsonValue,
      },
    });

    // Revalidate paths
    revalidatePath("/escalations");

    return {
      success: true,
      newRecipientName: newRecipient.name ?? "Unknown User",
    };
  } catch (error) {
    console.error("reassignEscalationAction error:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues?.[0]?.message || "Dữ liệu không hợp lệ",
      };
    }

    return {
      success: false,
      error: "Không thể reassign escalation",
    };
  }
}

/**
 * Get Escalations Action
 * 
 * @param filters - Filter options
 * @returns Escalations list
 */
export async function getEscalationsAction(filters?: {
  status?: string;
  triggerType?: string;
  assignedTo?: string;
}) {
  try {
    // Validate input
    const validated = getEscalationsSchema.parse(filters || {});

    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Chưa đăng nhập",
      };
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, teamId: true },
    });

    if (!currentUser) {
      return {
        success: false,
        error: "User không tồn tại",
      };
    }

    // Build where clause based on RBAC
    const where: any = {};

    // RBAC: Leaders see team escalations, Admins see all
    if (currentUser.role === "LEADER") {
      // Get team members
      const teamMembers = await prisma.user.findMany({
        where: { teamId: currentUser.teamId },
        select: { id: true },
      });

      const teamMemberIds = teamMembers.map((m) => m.id);

      where.escalatedTo = { in: teamMemberIds };
    }
    // Admins see all escalations (no filter)

    // Apply filters
    if (validated.status && validated.status !== "all") {
      where.status = validated.status;
    }

    if (validated.assignedTo) {
      where.escalatedTo = validated.assignedTo;
    }

    // Get escalations
    const escalations = await prisma.escalationLog.findMany({
      where,
      include: {
        rule: {
          select: {
            name: true,
            triggerType: true,
          },
        },
        recipient: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
        request: {
          select: {
            id: true,
            title: true,
            priority: true,
            status: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
            status: true,
            assignee: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Filter by trigger type if specified
    let filteredEscalations = escalations;

    if (validated.triggerType && validated.triggerType !== "all") {
      filteredEscalations = escalations.filter(
        (esc) => esc.rule.triggerType === validated.triggerType
      );
    }

    return {
      success: true,
      escalations: filteredEscalations.map((esc) => ({
        id: esc.id,
        reason: esc.reason,
        status: esc.status,
        createdAt: esc.createdAt.toISOString(),
        resolvedAt: esc.resolvedAt?.toISOString() || null,
        rule: {
          name: esc.rule.name,
          triggerType: esc.rule.triggerType,
        },
        recipient: {
          name: esc.recipient.name ?? "Unknown User",
          email: esc.recipient.email ?? "no-email@unknown.com",
          role: esc.recipient.role,
        },
        entity: esc.requestId
          ? {
              type: "REQUEST" as const,
              id: esc.request!.id,
              title: esc.request!.title,
              priority: esc.request!.priority,
              status: esc.request!.status,
            }
          : {
              type: "TASK" as const,
              id: esc.task!.id,
              title: esc.task!.title,
              status: esc.task!.status,
              assigneeName: esc.task!.assignee?.name || "Unassigned",
            },
      })),
    };
  } catch (error) {
    console.error("getEscalationsAction error:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues?.[0]?.message || "Dữ liệu không hợp lệ",
      };
    }

    return {
      success: false,
      error: "Không thể lấy danh sách escalations",
    };
  }
}

