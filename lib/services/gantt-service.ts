import { prisma } from "@/lib/prisma";
import { Logger } from "@/lib/utils/logger";
import { TaskStatus, type Priority, type Task } from "@prisma/client";
import {
  startOfDay,
  endOfDay,
  addDays,
  differenceInDays,
  subDays,
  min as dateMin,
  max as dateMax,
} from "date-fns";

export interface GanttTask {
  id: string;
  name: string;
  start: Date;
  end: Date;
  progress: number; // 0-100
  dependencies: string[]; // task IDs
  custom_class?: string; // for styling
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
  };
  status: TaskStatus;
  priority: Priority;
}

export interface TeamGanttGroup {
  id: string;
  name: string;
  tasks: GanttTask[];
}

export interface RequestGanttData {
  parent: GanttTask;
  children: GanttTask[];
}

// Custom CSS classes for Gantt styling
export const GANTT_CLASSES = {
  TODO: 'gantt-task-todo',
  IN_PROGRESS: 'gantt-task-progress',
  IN_REVIEW: 'gantt-task-review',
  BLOCKED: 'gantt-task-blocked',
  REWORK: 'gantt-task-rework',
  WAITING_SUBTASKS: 'gantt-task-waiting',
  DONE: 'gantt-task-done',
  OVERDUE: 'gantt-task-overdue',
};

/**
 * Calculate progress based on task status
 */
function calculateProgress(status: TaskStatus): number {
  const progressMap: Record<TaskStatus, number> = {
    TODO: 0,
    IN_PROGRESS: 50,
    IN_REVIEW: 80,
    BLOCKED: 30,
    REWORK: 40,
    WAITING_SUBTASKS: 25,
    DONE: 100,
  };
  return progressMap[status] || 0;
}

/**
 * Get custom class based on status and deadline
 */
function getCustomClass(status: TaskStatus, deadline: Date | null): string {
  const now = new Date();
  
  // Check if overdue
  if (deadline && deadline < now && status !== 'DONE') {
    return GANTT_CLASSES.OVERDUE;
  }
  
  return GANTT_CLASSES[status] || GANTT_CLASSES.TODO;
}

/**
 * Estimate end date for a task
 */
export async function estimateEndDate(task: any): Promise<Date> {
  try {
    // If deadline exists, use it
    if (task.deadline) {
      return task.deadline;
    }

    const startDate = task.slaStartedAt || task.createdAt;

    // Get average completion time for similar priority tasks
    const avgCompletionTime = await prisma.task.findMany({
      where: {
        status: 'DONE',
        completedAt: { not: null },
        request: {
          priority: task.request?.priority || 'MEDIUM',
        },
      },
      select: {
        createdAt: true,
        completedAt: true,
      },
      take: 50,
    });

    if (avgCompletionTime.length > 0) {
      const totalDays = avgCompletionTime.reduce((sum, t) => {
        if (t.completedAt) {
          return sum + differenceInDays(t.completedAt, t.createdAt);
        }
        return sum;
      }, 0);
      
      const avgDays = Math.ceil(totalDays / avgCompletionTime.length);
      return addDays(startDate, avgDays || 3);
    }

    // Default: +3 days
    return addDays(startDate, 3);
  } catch (error) {
    Logger.captureException(error as Error, { action: "estimateEndDate" });
    return addDays(task.createdAt, 3);
  }
}

/**
 * Calculate task dependencies
 */
export function calculateDependencies(tasks: any[]): Map<string, string[]> {
  const dependencyMap = new Map<string, string[]>();

  for (const task of tasks) {
    const dependencies: string[] = [];

    // Check if task has metadata with dependencies
    if (task.metadata && typeof task.metadata === 'object') {
      const metadata = task.metadata as any;
      if (metadata.dependencies && Array.isArray(metadata.dependencies)) {
        dependencies.push(...metadata.dependencies);
      }
    }

    // Simple heuristic: If tasks have order, create sequential dependencies
    if (task.order !== undefined && task.order !== null) {
      const previousTask = tasks.find(t => t.order === task.order - 1);
      if (previousTask) {
        dependencies.push(previousTask.id);
      }
    }

    if (dependencies.length > 0) {
      dependencyMap.set(task.id, dependencies);
    }
  }

  return dependencyMap;
}

/**
 * Format tasks to Gantt format
 */
export async function formatGanttData(tasks: any[]): Promise<GanttTask[]> {
  const ganttTasks: GanttTask[] = [];
  const dependencyMap = calculateDependencies(tasks);

  for (const task of tasks) {
    const startDate = task.slaStartedAt || task.createdAt;
    const endDate = task.deadline || await estimateEndDate(task);

    ganttTasks.push({
      id: task.id,
      name: task.title,
      start: startDate,
      end: endDate,
      progress: calculateProgress(task.status),
      dependencies: dependencyMap.get(task.id) || [],
      custom_class: getCustomClass(task.status, task.deadline),
      assignee: task.assignee ? {
        id: task.assignee.id,
        name: task.assignee.name,
        avatar: undefined, // Add if you have avatar field
      } : undefined,
      status: task.status,
      priority: task.request?.priority || 'MEDIUM',
    });
  }

  return ganttTasks;
}

/**
 * Get Gantt data for user's tasks
 */
export async function getMyTasksGantt(
  userId: string,
  filters?: {
    includeCompleted?: boolean;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<GanttTask[]> {
  try {
    const thirtyDaysAgo = subDays(new Date(), 30);

    const where: any = {
      assigneeId: userId,
      OR: [
        // Active tasks
        { status: { in: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED'] } },
        // Recently completed (if includeCompleted)
        ...(filters?.includeCompleted ? [{
          status: 'DONE',
          completedAt: { gte: thirtyDaysAgo },
        }] : []),
      ],
    };

    // Date range filter
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = startOfDay(filters.startDate);
      if (filters.endDate) where.createdAt.lte = endOfDay(filters.endDate);
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
          },
        },
        request: {
          select: {
            priority: true,
          },
        },
      },
      orderBy: [
        { slaStartedAt: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    return await formatGanttData(tasks);
  } catch (error) {
    Logger.captureException(error as Error, { action: "getMyTasksGantt" });
    return [];
  }
}

/**
 * Get Gantt data for a team
 */
export async function getTeamGantt(
  teamId: string,
  filters?: {
    includeCompleted?: boolean;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<TeamGanttGroup[]> {
  try {
    const thirtyDaysAgo = subDays(new Date(), 30);

    // Get team members
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!team) return [];

    const ganttGroups: TeamGanttGroup[] = [];

    for (const member of team.members) {
      const where: any = {
        assigneeId: member.id,
        OR: [
          { status: { in: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED'] } },
          ...(filters?.includeCompleted ? [{
            status: 'DONE',
            completedAt: { gte: thirtyDaysAgo },
          }] : []),
        ],
      };

      if (filters?.startDate || filters?.endDate) {
        where.createdAt = {};
        if (filters.startDate) where.createdAt.gte = startOfDay(filters.startDate);
        if (filters.endDate) where.createdAt.lte = endOfDay(filters.endDate);
      }

      const tasks = await prisma.task.findMany({
        where,
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
            },
          },
          request: {
            select: {
              priority: true,
            },
          },
        },
        orderBy: [
          { slaStartedAt: 'asc' },
          { createdAt: 'asc' },
        ],
      });

      if (tasks.length > 0) {
        ganttGroups.push({
          id: member.id,
          name: member.name,
          tasks: await formatGanttData(tasks),
        });
      }
    }

    return ganttGroups;
  } catch (error) {
    Logger.captureException(error as Error, { action: "getTeamGantt" });
    return [];
  }
}

/**
 * Get Gantt data for a request and its tasks
 */
export async function getRequestGantt(requestId: string): Promise<RequestGanttData | null> {
  try {
    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
              },
            },
            request: {
              select: {
                priority: true,
              },
            },
          },
          orderBy: [
            { slaStartedAt: 'asc' },
            { createdAt: 'asc' },
          ],
        },
      },
    });

    if (!request) return null;

    const children = await formatGanttData(request.tasks);

    if (children.length === 0) {
      // No tasks, create parent only
      const startDate = request.createdAt;
      const endDate = request.deadline || addDays(startDate, 7);

      return {
        parent: {
          id: request.id,
          name: request.title,
          start: startDate,
          end: endDate,
          progress: request.status === 'DONE' ? 100 : 0,
          dependencies: [],
          custom_class: request.status === 'DONE' ? GANTT_CLASSES.DONE : GANTT_CLASSES.TODO,
          status: TaskStatus.TODO, // Requests don't have TaskStatus, default to TODO
          priority: request.priority,
        },
        children: [],
      };
    }

    // Calculate parent span from children
    const startDates = children.map(c => c.start);
    const endDates = children.map(c => c.end);
    const parentStart = dateMin(startDates);
    const parentEnd = dateMax(endDates);

    // Calculate average progress
    const avgProgress = Math.round(
      children.reduce((sum, c) => sum + c.progress, 0) / children.length
    );

    return {
      parent: {
        id: request.id,
        name: request.title,
        start: parentStart,
        end: parentEnd,
        progress: avgProgress,
        dependencies: [],
        custom_class: request.status === 'DONE' ? GANTT_CLASSES.DONE : GANTT_CLASSES.IN_PROGRESS,
        status: TaskStatus.TODO,
        priority: request.priority,
      },
      children,
    };
  } catch (error) {
    Logger.captureException(error as Error, { action: "getRequestGantt" });
    return null;
  }
}

