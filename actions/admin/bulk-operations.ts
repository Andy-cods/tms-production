"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Logger } from "@/lib/utils/logger";
import { revalidatePath } from "next/cache";

/**
 * Check if user is ADMIN or LEADER
 */
async function assertAdminOrLeader() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  
  const user = session.user as any;
  if (user.role !== "ADMIN" && user.role !== "LEADER") {
    throw new Error("Forbidden: Only ADMIN or LEADER can perform bulk operations");
  }
  
  return { userId: user.id, role: user.role };
}

/**
 * Bulk update request status
 */
export async function bulkUpdateRequestStatus(
  requestIds: string[],
  newStatus: string
) {
  try {
    const { userId } = await assertAdminOrLeader();

    if (requestIds.length === 0) {
      throw new Error("Không có request nào được chọn");
    }

    // Update all requests
    await prisma.request.updateMany({
      where: {
        id: { in: requestIds },
      },
      data: {
        status: newStatus as any,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: "BULK_UPDATE_REQUEST_STATUS",
        entity: "Request",
        entityId: "bulk",
        newValue: {
          requestIds,
          count: requestIds.length,
          newStatus,
        },
      },
    });

    Logger.info("Bulk request status update", {
      action: "bulkUpdateRequestStatus",
      count: requestIds.length,
      newStatus,
      userId,
    });

    revalidatePath("/requests");
    revalidatePath("/admin/bulk-operations");

    return { success: true, count: requestIds.length };
  } catch (error) {
    Logger.captureException(error as Error, { 
      action: "bulkUpdateRequestStatus",
      count: requestIds.length,
    });
    throw error;
  }
}

/**
 * Bulk update request priority
 */
export async function bulkUpdateRequestPriority(
  requestIds: string[],
  newPriority: string
) {
  try {
    const { userId } = await assertAdminOrLeader();

    if (requestIds.length === 0) {
      throw new Error("Không có request nào được chọn");
    }

    await prisma.request.updateMany({
      where: {
        id: { in: requestIds },
      },
      data: {
        priority: newPriority as any,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: "BULK_UPDATE_REQUEST_PRIORITY",
        entity: "Request",
        entityId: "bulk",
        newValue: {
          requestIds,
          count: requestIds.length,
          newPriority,
        },
      },
    });

    Logger.info("Bulk request priority update", {
      action: "bulkUpdateRequestPriority",
      count: requestIds.length,
      newPriority,
      userId,
    });

    revalidatePath("/requests");
    revalidatePath("/admin/bulk-operations");

    return { success: true, count: requestIds.length };
  } catch (error) {
    Logger.captureException(error as Error, { 
      action: "bulkUpdateRequestPriority",
      count: requestIds.length,
    });
    throw error;
  }
}

/**
 * Bulk assign requests to team
 */
export async function bulkAssignRequestsToTeam(
  requestIds: string[],
  teamId: string
) {
  try {
    const { userId } = await assertAdminOrLeader();

    if (requestIds.length === 0) {
      throw new Error("Không có request nào được chọn");
    }

    // Validate team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new Error("Team not found");
    }

    await prisma.request.updateMany({
      where: {
        id: { in: requestIds },
      },
      data: {
        teamId,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: "BULK_ASSIGN_REQUESTS_TO_TEAM",
        entity: "Request",
        entityId: "bulk",
        newValue: {
          requestIds,
          count: requestIds.length,
          teamId,
          teamName: team.name,
        },
      },
    });

    Logger.info("Bulk assign requests to team", {
      action: "bulkAssignRequestsToTeam",
      count: requestIds.length,
      teamId,
      userId,
    });

    revalidatePath("/requests");
    revalidatePath("/admin/bulk-operations");

    return { success: true, count: requestIds.length };
  } catch (error) {
    Logger.captureException(error as Error, { 
      action: "bulkAssignRequestsToTeam",
      count: requestIds.length,
    });
    throw error;
  }
}

/**
 * Bulk archive requests
 */
export async function bulkArchiveRequests(requestIds: string[]) {
  try {
    const { userId } = await assertAdminOrLeader();

    if (requestIds.length === 0) {
      throw new Error("Không có request nào được chọn");
    }

    // Only archive DONE requests
    await prisma.request.updateMany({
      where: {
        id: { in: requestIds },
        status: "DONE",
      },
      data: {
        status: "ARCHIVED" as any,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: "BULK_ARCHIVE_REQUESTS",
        entity: "Request",
        entityId: "bulk",
        newValue: {
          requestIds,
          count: requestIds.length,
        },
      },
    });

    Logger.info("Bulk archive requests", {
      action: "bulkArchiveRequests",
      count: requestIds.length,
      userId,
    });

    revalidatePath("/requests");
    revalidatePath("/admin/bulk-operations");

    return { success: true, count: requestIds.length };
  } catch (error) {
    Logger.captureException(error as Error, { 
      action: "bulkArchiveRequests",
      count: requestIds.length,
    });
    throw error;
  }
}

/**
 * Bulk update task status
 */
export async function bulkUpdateTaskStatus(
  taskIds: string[],
  newStatus: string
) {
  try {
    const { userId } = await assertAdminOrLeader();

    if (taskIds.length === 0) {
      throw new Error("Không có task nào được chọn");
    }

    await prisma.task.updateMany({
      where: {
        id: { in: taskIds },
      },
      data: {
        status: newStatus as any,
        completedAt: newStatus === "DONE" ? new Date() : undefined,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: "BULK_UPDATE_TASK_STATUS",
        entity: "Task",
        entityId: "bulk",
        newValue: {
          taskIds,
          count: taskIds.length,
          newStatus,
        },
      },
    });

    Logger.info("Bulk task status update", {
      action: "bulkUpdateTaskStatus",
      count: taskIds.length,
      newStatus,
      userId,
    });

    revalidatePath("/my-tasks");
    revalidatePath("/leader/inbox");
    revalidatePath("/admin/bulk-operations");

    return { success: true, count: taskIds.length };
  } catch (error) {
    Logger.captureException(error as Error, { 
      action: "bulkUpdateTaskStatus",
      count: taskIds.length,
    });
    throw error;
  }
}

/**
 * Bulk assign tasks to user
 */
export async function bulkAssignTasks(
  taskIds: string[],
  assigneeId: string | null
) {
  try {
    const { userId } = await assertAdminOrLeader();

    if (taskIds.length === 0) {
      throw new Error("Không có task nào được chọn");
    }

    // Validate assignee if provided
    if (assigneeId) {
      const assignee = await prisma.user.findUnique({
        where: { id: assigneeId },
      });

      if (!assignee) {
        throw new Error("Assignee not found");
      }
    }

    await prisma.task.updateMany({
      where: {
        id: { in: taskIds },
      },
      data: {
        assigneeId,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: "BULK_ASSIGN_TASKS",
        entity: "Task",
        entityId: "bulk",
        newValue: {
          taskIds,
          count: taskIds.length,
          assigneeId,
        },
      },
    });

    Logger.info("Bulk assign tasks", {
      action: "bulkAssignTasks",
      count: taskIds.length,
      assigneeId,
      userId,
    });

    revalidatePath("/my-tasks");
    revalidatePath("/leader/inbox");
    revalidatePath("/admin/bulk-operations");

    return { success: true, count: taskIds.length };
  } catch (error) {
    Logger.captureException(error as Error, { 
      action: "bulkAssignTasks",
      count: taskIds.length,
    });
    throw error;
  }
}

/**
 * Bulk delete requests (soft delete)
 */
export async function bulkDeleteRequests(requestIds: string[]) {
  try {
    const { userId, role } = await assertAdminOrLeader();

    if (role !== "ADMIN") {
      throw new Error("Only ADMIN can delete requests");
    }

    if (requestIds.length === 0) {
      throw new Error("Không có request nào được chọn");
    }

    // Soft delete: mark as ARCHIVED
    await prisma.request.updateMany({
      where: {
        id: { in: requestIds },
      },
      data: {
        status: "ARCHIVED" as any,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: "BULK_DELETE_REQUESTS",
        entity: "Request",
        entityId: "bulk",
        newValue: {
          requestIds,
          count: requestIds.length,
        },
      },
    });

    Logger.info("Bulk delete requests", {
      action: "bulkDeleteRequests",
      count: requestIds.length,
      userId,
    });

    revalidatePath("/requests");
    revalidatePath("/admin/bulk-operations");

    return { success: true, count: requestIds.length };
  } catch (error) {
    Logger.captureException(error as Error, { 
      action: "bulkDeleteRequests",
      count: requestIds.length,
    });
    throw error;
  }
}

/**
 * Bulk export data to CSV
 */
export async function bulkExportRequests(requestIds: string[]) {
  try {
    const { userId } = await assertAdminOrLeader();

    const requests = await prisma.request.findMany({
      where: {
        id: { in: requestIds },
      },
      include: {
        creator: {
          select: { name: true, email: true },
        },
        team: {
          select: { name: true },
        },
        category: {
          select: { name: true },
        },
      },
    });

    // Audit log export action
    await prisma.auditLog.create({
      data: {
        userId,
        action: "BULK_EXPORT_REQUESTS",
        entity: "Request",
        entityId: "bulk",
        newValue: {
          count: requests.length,
        },
      },
    });

    Logger.info("Bulk export requests", {
      action: "bulkExportRequests",
      count: requests.length,
      userId,
    });

    return { success: true, data: requests };
  } catch (error) {
    Logger.captureException(error as Error, { 
      action: "bulkExportRequests",
      count: requestIds.length,
    });
    throw error;
  }
}

