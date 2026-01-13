import { prisma } from "@/lib/prisma";
import type { DashboardFilters } from "@/types/dashboard";
import { 
  subDays, 
  startOfDay, 
  endOfDay,
  differenceInHours,
  format,
  startOfWeek,
  eachWeekOfInterval,
} from "date-fns";
import { vi } from "date-fns/locale";
import { Logger } from "@/lib/utils/logger";

export type SLASeverity = 'critical' | 'high' | 'medium';

export interface SLAViolation {
  id: string;
  title: string;
  type: 'REQUEST' | 'TASK';
  priority: string;
  slaDeadline: Date;
  actualCompletion: Date | null;
  delayHours: number;
  severity: SLASeverity;
  assignee: string | null;
  reason?: string;
  status: string;
}

export interface SLATrendData {
  week: string;
  average?: number;
  [teamName: string]: number | string | undefined;
}

export interface AtRiskRequest {
  id: string;
  title: string;
  priority: string;
  deadline: Date;
  hoursRemaining: number;
  percentRemaining: number;
  assignee: string | null;
  status: string;
  type: 'REQUEST' | 'TASK';
}

/**
 * Calculate severity based on delay hours
 */
function calculateSeverity(delayHours: number): SLASeverity {
  if (delayHours > 24) return 'critical';
  if (delayHours > 8) return 'high';
  return 'medium';
}

/**
 * Get SLA violations
 */
export async function getSLAViolations(
  filters: DashboardFilters
): Promise<SLAViolation[]> {
  try {
    const now = new Date();
    const endDate = filters.endDate || now;
    let startDate = filters.startDate;
    
    if (!startDate) {
      const daysMap = { week: 7, month: 30, quarter: 90, year: 365 };
      startDate = subDays(endDate, daysMap[filters.period]);
    }

    const dateFilter = {
      gte: startOfDay(startDate),
      lte: endOfDay(endDate),
    };

    // Query requests with SLA violations
    const baseWhere: any = {
      slaDeadline: { not: null },
      createdAt: dateFilter,
    };

    if (filters.teamId) {
      baseWhere.teamId = filters.teamId;
    }

    const violatedRequests = await prisma.request.findMany({
      where: {
        ...baseWhere,
        OR: [
          // Completed but late
          {
            status: 'DONE',
            completedAt: { not: null },
            slaDeadline: { not: null },
          },
          // Still active but overdue
          {
            status: { in: ['OPEN', 'IN_PROGRESS', 'IN_REVIEW'] },
            slaDeadline: { lt: now },
          },
        ],
      },
      select: {
        id: true,
        title: true,
        priority: true,
        slaDeadline: true,
        completedAt: true,
        status: true,
        creator: {
          select: { name: true },
        },
      },
      orderBy: { slaDeadline: 'asc' },
    });

    // Query tasks with SLA violations
    const violatedTasks = await prisma.task.findMany({
      where: {
        slaDeadline: { not: null },
        createdAt: dateFilter,
        OR: [
          {
            status: 'DONE',
            completedAt: { not: null },
          },
          {
            status: { in: ['TODO', 'IN_PROGRESS', 'IN_REVIEW'] },
            slaDeadline: { lt: now },
          },
        ],
      },
      select: {
        id: true,
        title: true,
        slaDeadline: true,
        completedAt: true,
        status: true,
        assigneeId: true,
        request: {
          select: {
            priority: true,
          },
        },
      },
      orderBy: { slaDeadline: 'asc' },
    });

    const violations: SLAViolation[] = [];

    // Process request violations
    for (const req of violatedRequests) {
      if (!req.slaDeadline) continue;

      const actualCompletion = req.completedAt || now;
      const delayHours = differenceInHours(actualCompletion, req.slaDeadline);

      if (delayHours > 0) {
        violations.push({
          id: req.id,
          title: req.title,
          type: 'REQUEST',
          priority: req.priority,
          slaDeadline: req.slaDeadline,
          actualCompletion: req.completedAt,
          delayHours,
          severity: calculateSeverity(delayHours),
          assignee: req.creator.name,
          status: req.status,
        });
      }
    }

    // Process task violations
    for (const task of violatedTasks) {
      if (!task.slaDeadline) continue;

      const actualCompletion = task.completedAt || now;
      const delayHours = differenceInHours(actualCompletion, task.slaDeadline);

      if (delayHours > 0) {
        violations.push({
          id: task.id,
          title: task.title,
          type: 'TASK',
          priority: task.request.priority,
          slaDeadline: task.slaDeadline,
          actualCompletion: task.completedAt,
          delayHours,
          severity: calculateSeverity(delayHours),
          assignee: task.assigneeId || null,
          status: task.status,
        });
      }
    }

    // Sort by severity and delay
    violations.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2 };
      if (a.severity !== b.severity) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return b.delayHours - a.delayHours;
    });

    return violations;
  } catch (error) {
    Logger.captureException(error as Error, { action: "getSLAViolations" });
    return [];
  }
}

/**
 * Get SLA trend by team
 */
export async function getSLATrendByTeam(
  filters: DashboardFilters
): Promise<SLATrendData[]> {
  try {
    const endDate = filters.endDate || new Date();
    let startDate = filters.startDate;
    
    if (!startDate) {
      const daysMap = { week: 7, month: 30, quarter: 90, year: 365 };
      startDate = subDays(endDate, daysMap[filters.period]);
    }

    const weeks = eachWeekOfInterval(
      { start: startDate, end: endDate },
      { locale: vi }
    );

    // Get all teams
    const teams = await prisma.team.findMany({
      select: { id: true, name: true },
    });

    const trendData: SLATrendData[] = [];

    for (const week of weeks) {
      const weekStart = startOfWeek(week, { locale: vi });
      const weekEnd = endOfDay(subDays(weekStart, -6));
      const weekLabel = `W${format(week, 'w', { locale: vi })} ${format(week, 'MMM', { locale: vi })}`;

      const dataPoint: SLATrendData = {
        week: weekLabel,
      };

      let totalCompliance = 0;
      let teamCount = 0;

      for (const team of teams) {
        // Get requests completed this week
        const completedRequests = await prisma.request.findMany({
          where: {
            teamId: team.id,
            status: 'DONE',
            completedAt: {
              gte: weekStart,
              lte: weekEnd,
            },
            slaDeadline: { not: null },
          },
          select: {
            completedAt: true,
            slaDeadline: true,
          },
        });

        if (completedRequests.length > 0) {
          const onTime = completedRequests.filter(
            (r) => r.completedAt && r.slaDeadline && r.completedAt <= r.slaDeadline
          ).length;
          
          const compliance = (onTime / completedRequests.length) * 100;
          dataPoint[team.name] = parseFloat(compliance.toFixed(1));
          
          totalCompliance += compliance;
          teamCount++;
        }
      }

      if (teamCount > 0) {
        dataPoint.average = parseFloat((totalCompliance / teamCount).toFixed(1));
      }

      trendData.push(dataPoint);
    }

    return trendData;
  } catch (error) {
    Logger.captureException(error as Error, { action: "getSLATrendByTeam" });
    return [];
  }
}

/**
 * Get at-risk requests (close to SLA deadline)
 */
export async function getAtRiskRequests(
  filters: DashboardFilters
): Promise<AtRiskRequest[]> {
  try {
    const now = new Date();

    const baseWhere: any = {
      status: { in: ['OPEN', 'IN_PROGRESS', 'IN_REVIEW'] },
      slaDeadline: { not: null, gt: now },
    };

    if (filters.teamId) {
      baseWhere.teamId = filters.teamId;
    }

    // Get active requests
    const activeRequests = await prisma.request.findMany({
      where: baseWhere,
      select: {
        id: true,
        title: true,
        priority: true,
        slaDeadline: true,
        slaStartedAt: true,
        status: true,
        creator: {
          select: { name: true },
        },
      },
    });

    // Get active tasks
    const activeTasks = await prisma.task.findMany({
      where: {
        status: { in: ['TODO', 'IN_PROGRESS', 'IN_REVIEW'] },
        slaDeadline: { not: null, gt: now },
      },
      select: {
        id: true,
        title: true,
        slaDeadline: true,
        slaStartedAt: true,
        status: true,
        assigneeId: true,
        request: {
          select: {
            priority: true,
          },
        },
      },
    });

    const atRiskItems: AtRiskRequest[] = [];

    // Process requests
    for (const req of activeRequests) {
      if (!req.slaDeadline || !req.slaStartedAt) continue;

      const hoursRemaining = differenceInHours(req.slaDeadline, now);
      const totalHours = differenceInHours(req.slaDeadline, req.slaStartedAt);
      const percentRemaining = totalHours > 0 ? (hoursRemaining / totalHours) * 100 : 0;

      // Only include if < 20% remaining
      if (percentRemaining < 20 && percentRemaining > 0) {
        atRiskItems.push({
          id: req.id,
          title: req.title,
          priority: req.priority,
          deadline: req.slaDeadline,
          hoursRemaining: Math.max(0, hoursRemaining),
          percentRemaining: Math.max(0, percentRemaining),
          assignee: req.creator.name,
          status: req.status,
          type: 'REQUEST',
        });
      }
    }

    // Process tasks
    for (const task of activeTasks) {
      if (!task.slaDeadline || !task.slaStartedAt) continue;

      const hoursRemaining = differenceInHours(task.slaDeadline, now);
      const totalHours = differenceInHours(task.slaDeadline, task.slaStartedAt);
      const percentRemaining = totalHours > 0 ? (hoursRemaining / totalHours) * 100 : 0;

      if (percentRemaining < 20 && percentRemaining > 0) {
        atRiskItems.push({
          id: task.id,
          title: task.title,
          priority: task.request.priority,
          deadline: task.slaDeadline,
          hoursRemaining: Math.max(0, hoursRemaining),
          percentRemaining: Math.max(0, percentRemaining),
          assignee: task.assigneeId || null,
          status: task.status,
          type: 'TASK',
        });
      }
    }

    // Sort by urgency (least time first)
    atRiskItems.sort((a, b) => a.hoursRemaining - b.hoursRemaining);

    return atRiskItems;
  } catch (error) {
    Logger.captureException(error as Error, { action: "getAtRiskRequests" });
    return [];
  }
}

