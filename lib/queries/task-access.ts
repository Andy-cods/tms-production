// lib/queries/task-access.ts
import { prisma } from "@/lib/prisma";
import { UserRole, normalizeRole } from "@/types";

/**
 * Check if user can view a task
 */
export async function canViewTask(
  taskId: string,
  userId: string,
  userRole: UserRole | string
): Promise<boolean> {
  const role = normalizeRole(userRole as any);
  
  if (role === "ADMIN" || role === "LEADER") {
    return true;
  }

  // Staff: Only tasks assigned to them OR tasks in requests they created
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      OR: [
        { assigneeId: userId },
        { request: { creatorId: userId } },
      ],
    },
  });

  return !!task;
}

/**
 * Get accessible tasks for user
 */
export async function getAccessibleTasks(
  userId: string,
  userRole: UserRole | string
) {
  const role = normalizeRole(userRole as any);
  
  if (role === "ADMIN" || role === "LEADER") {
    return prisma.task.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  // Staff: Only their assigned tasks + tasks in their requests
  return prisma.task.findMany({
    where: {
      OR: [
        { assigneeId: userId },
        { request: { creatorId: userId } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Build where clause for tasks based on user role
 */
export function buildTaskWhereClause(
  userId: string,
  userRole: UserRole | string,
  additionalWhere: any = {}
): any {
  const role = normalizeRole(userRole as any);
  
  if (role === "ADMIN" || role === "LEADER") {
    return additionalWhere;
  }
  
  return {
    ...additionalWhere,
    OR: [
      { assigneeId: userId },
      { request: { creatorId: userId } },
    ],
  };
}

