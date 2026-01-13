import { prisma } from "@/lib/prisma";
import type { DashboardFilters } from "@/types/dashboard";
import { 
  subDays, 
  startOfDay, 
  endOfDay,
  eachWeekOfInterval,
  startOfWeek,
  endOfWeek,
  format,
} from "date-fns";
import { vi } from "date-fns/locale";
import { Logger } from "@/lib/utils/logger";

export interface ReworkData {
  overall: number; // percentage
  trend: Array<{ week: string; rate: number }>;
  byAssignee: Array<{ name: string; rate: number; count: number; assigneeId: string }>;
}

export interface ApprovalData {
  overall: number; // percentage
  byAssignee: Array<{ 
    name: string; 
    rate: number; 
    totalTasks: number; 
    approvedFirstTime: number;
    assigneeId: string;
  }>;
}

export interface ClarificationData {
  overall: number; // percentage
  byRequester: Array<{
    name: string;
    rate: number;
    count: number;
    totalRequests: number;
    avgResponseHours: number;
    requesterId: string;
  }>;
}

/**
 * Get rework rate analysis
 */
export async function getReworkRate(
  filters: DashboardFilters
): Promise<ReworkData> {
  try {
    const endDate = filters.endDate || new Date();
    let startDate = filters.startDate;
    
    if (!startDate) {
      const daysMap = { week: 7, month: 30, quarter: 90, year: 365 };
      startDate = subDays(endDate, daysMap[filters.period]);
    }

    const dateFilter = {
      gte: startOfDay(startDate),
      lte: endOfDay(endDate),
    };

    const baseWhere: any = {
      createdAt: dateFilter,
      status: { in: ['DONE', 'REWORK'] },
    };

    if (filters.teamId) {
      baseWhere.request = { teamId: filters.teamId };
    }

    // Get all completed/reworked tasks
    const tasks = await prisma.task.findMany({
      where: baseWhere,
      select: {
        id: true,
        status: true,
        createdAt: true,
        assigneeId: true,
        assignee: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const totalTasks = tasks.length;
    const reworkTasks = tasks.filter(t => t.status === 'REWORK').length;
    const overall = totalTasks > 0 ? (reworkTasks / totalTasks) * 100 : 0;

    // Trend by week
    const weeks = eachWeekOfInterval({ start: startDate, end: endDate });
    const trend = weeks.map(weekStart => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const weekTasks = tasks.filter(t => 
        t.createdAt >= weekStart && t.createdAt <= weekEnd
      );
      const weekRework = weekTasks.filter(t => t.status === 'REWORK').length;
      const rate = weekTasks.length > 0 ? (weekRework / weekTasks.length) * 100 : 0;

      return {
        week: `Tuần ${format(weekStart, 'w', { locale: vi })}`,
        rate: parseFloat(rate.toFixed(1)),
      };
    });

    // By assignee
    const assigneeMap = new Map<string, { name: string; total: number; rework: number }>();
    
    tasks.forEach(task => {
      if (!task.assigneeId || !task.assignee) return;
      
      const existing = assigneeMap.get(task.assigneeId);
      if (existing) {
        existing.total++;
        if (task.status === 'REWORK') existing.rework++;
      } else {
        assigneeMap.set(task.assigneeId, {
          name: task.assignee.name || 'Unknown',
          total: 1,
          rework: task.status === 'REWORK' ? 1 : 0,
        });
      }
    });

    const byAssignee = Array.from(assigneeMap.entries())
      .map(([assigneeId, data]) => ({
        assigneeId,
        name: data.name,
        count: data.rework,
        rate: data.total > 0 ? parseFloat(((data.rework / data.total) * 100).toFixed(1)) : 0,
      }))
      .filter(a => a.count > 0)
      .sort((a, b) => b.rate - a.rate);

    return {
      overall: parseFloat(overall.toFixed(1)),
      trend,
      byAssignee,
    };
  } catch (error) {
    Logger.captureException(error as Error, { action: "getReworkRate" });
    return { overall: 0, trend: [], byAssignee: [] };
  }
}

/**
 * Get first-time approval rate
 */
export async function getFirstTimeApprovalRate(
  filters: DashboardFilters
): Promise<ApprovalData> {
  try {
    const endDate = filters.endDate || new Date();
    let startDate = filters.startDate;
    
    if (!startDate) {
      const daysMap = { week: 7, month: 30, quarter: 90, year: 365 };
      startDate = subDays(endDate, daysMap[filters.period]);
    }

    const dateFilter = {
      gte: startOfDay(startDate),
      lte: endOfDay(endDate),
    };

    const baseWhere: any = {
      createdAt: dateFilter,
      status: 'DONE',
      assigneeId: { not: null },
    };

    if (filters.teamId) {
      baseWhere.request = { teamId: filters.teamId };
    }

    // Get completed tasks grouped by assignee
    const completedTasks = await prisma.task.findMany({
      where: baseWhere,
      select: {
        id: true,
        assigneeId: true,
        assignee: {
          select: {
            id: true,
            name: true,
          },
        },
        auditLogs: {
          where: {
            action: { in: ['UPDATE_TASK_STATUS', 'REWORK'] },
          },
          select: {
            action: true,
            newValue: true,
          },
        },
      },
    });

    const assigneeMap = new Map<string, { 
      name: string; 
      total: number; 
      approvedFirstTime: number;
    }>();

    completedTasks.forEach(task => {
      if (!task.assigneeId || !task.assignee) return;

      // Check if task went through REWORK (not first-time approval)
      const hasRework = task.auditLogs.some(log => 
        (log.newValue as any)?.status === 'REWORK' || log.action === 'REWORK'
      );

      const existing = assigneeMap.get(task.assigneeId);
      if (existing) {
        existing.total++;
        if (!hasRework) existing.approvedFirstTime++;
      } else {
        assigneeMap.set(task.assigneeId, {
          name: task.assignee.name || 'Unknown',
          total: 1,
          approvedFirstTime: hasRework ? 0 : 1,
        });
      }
    });

    const byAssignee = Array.from(assigneeMap.entries())
      .map(([assigneeId, data]) => ({
        assigneeId,
        name: data.name,
        totalTasks: data.total,
        approvedFirstTime: data.approvedFirstTime,
        rate: data.total > 0 ? parseFloat(((data.approvedFirstTime / data.total) * 100).toFixed(1)) : 0,
      }))
      .filter(a => a.totalTasks >= 3) // Only show assignees with 3+ tasks
      .sort((a, b) => b.rate - a.rate);

    const totalAll = Array.from(assigneeMap.values()).reduce((sum, d) => sum + d.total, 0);
    const approvedAll = Array.from(assigneeMap.values()).reduce((sum, d) => sum + d.approvedFirstTime, 0);
    const overall = totalAll > 0 ? (approvedAll / totalAll) * 100 : 0;

    return {
      overall: parseFloat(overall.toFixed(1)),
      byAssignee,
    };
  } catch (error) {
    Logger.captureException(error as Error, { action: "getFirstTimeApprovalRate" });
    return { overall: 0, byAssignee: [] };
  }
}

/**
 * Get clarification rate analysis
 */
export async function getClarificationRate(
  filters: DashboardFilters
): Promise<ClarificationData> {
  try {
    const endDate = filters.endDate || new Date();
    let startDate = filters.startDate;
    
    if (!startDate) {
      const daysMap = { week: 7, month: 30, quarter: 90, year: 365 };
      startDate = subDays(endDate, daysMap[filters.period]);
    }

    const dateFilter = {
      gte: startOfDay(startDate),
      lte: endOfDay(endDate),
    };

    const baseWhere: any = {
      createdAt: dateFilter,
    };

    if (filters.teamId) {
      baseWhere.teamId = filters.teamId;
    }

    // Get requests with clarification audit logs
    const requests = await prisma.request.findMany({
      where: baseWhere,
      select: {
        id: true,
        creatorId: true,
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        auditLogs: {
          where: {
            action: { in: ['REQUEST_CLARIFICATION', 'RESOLVE_CLARIFICATION'] },
          },
          select: {
            action: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    const requesterMap = new Map<string, {
      name: string;
      total: number;
      clarifications: number;
      responseTimes: number[]; // in hours
    }>();

    requests.forEach(request => {
      const hasClarification = request.auditLogs.some(log => 
        log.action === 'REQUEST_CLARIFICATION'
      );

      // Calculate response time if clarification was resolved
      let responseHours = 0;
      const clarificationLog = request.auditLogs.find(l => l.action === 'REQUEST_CLARIFICATION');
      const resolveLog = request.auditLogs.find(l => l.action === 'RESOLVE_CLARIFICATION');
      
      if (clarificationLog && resolveLog) {
        const diff = resolveLog.createdAt.getTime() - clarificationLog.createdAt.getTime();
        responseHours = diff / (1000 * 60 * 60); // milliseconds to hours
      }

      const existing = requesterMap.get(request.creatorId);
      if (existing) {
        existing.total++;
        if (hasClarification) {
          existing.clarifications++;
          if (responseHours > 0) existing.responseTimes.push(responseHours);
        }
      } else {
        requesterMap.set(request.creatorId, {
          name: request.creator.name || 'Unknown',
          total: 1,
          clarifications: hasClarification ? 1 : 0,
          responseTimes: responseHours > 0 ? [responseHours] : [],
        });
      }
    });

    const byRequester = Array.from(requesterMap.entries())
      .map(([requesterId, data]) => ({
        requesterId,
        name: data.name,
        totalRequests: data.total,
        count: data.clarifications,
        rate: data.total > 0 ? parseFloat(((data.clarifications / data.total) * 100).toFixed(1)) : 0,
        avgResponseHours: data.responseTimes.length > 0
          ? parseFloat((data.responseTimes.reduce((sum, h) => sum + h, 0) / data.responseTimes.length).toFixed(1))
          : 0,
      }))
      .filter(r => r.totalRequests >= 3) // Only show requesters with 3+ requests
      .sort((a, b) => b.rate - a.rate);

    const totalAll = Array.from(requesterMap.values()).reduce((sum, d) => sum + d.total, 0);
    const clarificationsAll = Array.from(requesterMap.values()).reduce((sum, d) => sum + d.clarifications, 0);
    const overall = totalAll > 0 ? (clarificationsAll / totalAll) * 100 : 0;

    return {
      overall: parseFloat(overall.toFixed(1)),
      byRequester,
    };
  } catch (error) {
    Logger.captureException(error as Error, { action: "getClarificationRate" });
    return { overall: 0, byRequester: [] };
  }
}

