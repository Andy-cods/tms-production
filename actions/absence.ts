"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Role } from "@prisma/client";

/**
 * Absence Management Server Actions
 * 
 * Allows users to set/clear absence status and delegate tasks.
 * 
 * References: mindmap B5
 */

// =============================================================================
// Zod Schemas
// =============================================================================

const setAbsenceSchema = z.object({
  absenceReason: z.string().min(1, "Lý do không được để trống"),
  absenceUntil: z.string().min(1, "Ngày kết thúc không được để trống"),
  delegateTo: z.string().nullable(),
});

// =============================================================================
// Server Actions
// =============================================================================

/**
 * Set Absence Status
 * 
 * @param data - Absence data
 * @returns Action result
 */
export async function setAbsenceAction(data: {
  absenceReason: string;
  absenceUntil: string;
  delegateTo: string | null;
}) {
  try {
    // Validate input
    const validated = setAbsenceSchema.parse(data);

    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Chưa đăng nhập",
      };
    }

    const userId = session.user.id;

    // Validate absenceUntil is in future
    const absenceUntil = new Date(validated.absenceUntil);
    if (absenceUntil < new Date()) {
      return {
        success: false,
        error: "Ngày kết thúc phải là ngày trong tương lai",
      };
    }

    // Validate delegate exists if provided
    if (validated.delegateTo) {
      const delegate = await prisma.user.findUnique({
        where: { id: validated.delegateTo },
      });

      if (!delegate) {
        return {
          success: false,
          error: "Người nhận ủy quyền không tồn tại",
        };
      }

      if (delegate.isAbsent) {
        return {
          success: false,
          error: "Không thể ủy quyền cho người đang vắng mặt",
        };
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isAbsent: true,
        absenceReason: validated.absenceReason,
        absenceUntil,
        delegateTo: validated.delegateTo,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: "ABSENCE_SET",
        entity: "User",
        entityId: userId,
        oldValue: { isAbsent: false },
        newValue: {
          isAbsent: true,
          absenceReason: validated.absenceReason,
          absenceUntil: absenceUntil.toISOString(),
          delegateTo: validated.delegateTo,
        },
      },
    });

    // Revalidate paths
    revalidatePath("/profile/absence");
    revalidatePath("/admin/users");

    return {
      success: true,
    };
  } catch (error) {
    console.error("setAbsenceAction error:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues?.[0]?.message || "Dữ liệu không hợp lệ",
      };
    }

    return {
      success: false,
      error: "Không thể đặt trạng thái vắng mặt",
    };
  }
}

/**
 * Get Absence Status
 * 
 * @returns Current absence status
 */
export async function getAbsenceStatus() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        isAbsent: true,
        absenceReason: true,
        absenceUntil: true,
        delegateTo: true,
        delegate: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return {
      success: true,
      data: user,
    };
  } catch (error) {
    console.error("getAbsenceStatus error:", error);
    return {
      success: false,
      error: "Failed to get absence status",
    };
  }
}

/**
 * Get Available Users for Delegation
 * 
 * @returns List of available users
 */
export async function getAvailableUsers() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const users = await prisma.user.findMany({
      where: {
        id: { not: session.user.id },
        isActive: true,
        isAbsent: false,
        role: { in: [Role.STAFF, Role.LEADER] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        team: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return {
      success: true,
      data: users,
    };
  } catch (error) {
    console.error("getAvailableUsers error:", error);
    return {
      success: false,
      error: "Failed to get available users",
    };
  }
}

/**
 * Set Absence (New API)
 * 
 * @param data - Absence data
 * @returns Action result
 */
export async function setAbsence(data: {
  reason: string;
  startDate: Date;
  endDate: Date;
  delegateToId?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const userId = session.user.id;

    // Validate dates
    if (data.endDate < data.startDate) {
      return {
        success: false,
        error: "End date must be after start date",
      };
    }

    if (data.endDate < new Date()) {
      return {
        success: false,
        error: "End date must be in the future",
      };
    }

    // Validate delegate if provided
    if (data.delegateToId) {
      const delegate = await prisma.user.findUnique({
        where: { id: data.delegateToId },
      });

      if (!delegate || delegate.isAbsent) {
        return {
          success: false,
          error: "Selected delegate is not available",
        };
      }
    }

    // Update user
    await prisma.user.update({
      where: { id: userId },
      data: {
        isAbsent: true,
        absenceReason: data.reason,
        absenceUntil: data.endDate,
        delegateTo: data.delegateToId || null,
      },
    });

    revalidatePath("/profile/absence");
    revalidatePath("/admin/users");

    return {
      success: true,
    };
  } catch (error) {
    console.error("setAbsence error:", error);
    return {
      success: false,
      error: "Failed to set absence",
    };
  }
}

/**
 * Clear Absence (New API)
 * 
 * @returns Action result
 */
export async function clearAbsence() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const userId = session.user.id;

    await prisma.user.update({
      where: { id: userId },
      data: {
        isAbsent: false,
        absenceReason: null,
        absenceUntil: null,
        delegateTo: null,
      },
    });

    revalidatePath("/profile/absence");
    revalidatePath("/admin/users");

    return {
      success: true,
    };
  } catch (error) {
    console.error("clearAbsence error:", error);
    return {
      success: false,
      error: "Failed to clear absence",
    };
  }
}

/**
 * Clear Absence Status (Legacy)
 * 
 * @returns Action result
 */
export async function clearAbsenceAction() {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Chưa đăng nhập",
      };
    }

    const userId = session.user.id;

    // Update user
    await prisma.user.update({
      where: { id: userId },
      data: {
        isAbsent: false,
        absenceReason: null,
        absenceUntil: null,
        delegateTo: null,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: "ABSENCE_CLEARED",
        entity: "User",
        entityId: userId,
        oldValue: { isAbsent: true },
        newValue: { isAbsent: false },
      },
    });

    // Revalidate paths
    revalidatePath("/profile/absence");
    revalidatePath("/admin/users");

    return {
      success: true,
    };
  } catch (error) {
    console.error("clearAbsenceAction error:", error);

    return {
      success: false,
      error: "Không thể xóa trạng thái vắng mặt",
    };
  }
}

