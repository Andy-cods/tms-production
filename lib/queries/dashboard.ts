import { prisma } from "@/lib/prisma";
import type { DashboardFilters, RawMetricsData } from "@/types/dashboard";
import { subDays, startOfDay, endOfDay } from "date-fns";

/**
 * Get raw metrics data for dashboard calculations
 */
export async function getRawMetricsData(filters: DashboardFilters): Promise<RawMetricsData> {
  // Calculate date range based on period
  const endDate = filters.endDate || new Date();
  let startDate = filters.startDate;
  
  if (!startDate) {
    const daysMap = {
      week: 7,
      month: 30,
      quarter: 90,
      year: 365,
    };
    startDate = subDays(endDate, daysMap[filters.period]);
  }

  const dateFilter = {
    gte: startOfDay(startDate),
    lte: endOfDay(endDate),
  };

  // Build base where clause
  const baseWhere: any = {
    createdAt: dateFilter,
  };

  if (filters.teamId) {
    baseWhere.teamId = filters.teamId;
  }

  // Fetch requests data
  const [
    totalRequests,
    completedRequests,
    overdueRequests,
    requestsByPriority,
    requestsByStatus,
  ] = await Promise.all([
    // Total requests
    prisma.request.count({
      where: baseWhere,
    }),

    // Completed requests
    prisma.request.count({
      where: {
        ...baseWhere,
        status: 'DONE',
      },
    }),

    // Overdue requests (deadline passed, not done)
    prisma.request.count({
      where: {
        ...baseWhere,
        deadline: { lt: new Date() },
        status: { not: 'DONE' },
      },
    }),

    // Requests by priority
    prisma.request.groupBy({
      by: ['priority'],
      where: baseWhere,
      _count: true,
    }),

    // Requests by status
    prisma.request.groupBy({
      by: ['status'],
      where: baseWhere,
      _count: true,
    }),
  ]);

  // Fetch tasks data
  const taskBaseWhere: any = {
    createdAt: dateFilter,
  };

  // If filtering by team, filter tasks by request's teamId
  if (filters.teamId) {
    taskBaseWhere.request = {
      teamId: filters.teamId,
    };
  }

  const [
    totalTasks,
    completedTasks,
    overdueTasks,
  ] = await Promise.all([
    prisma.task.count({
      where: taskBaseWhere,
    }),

    prisma.task.count({
      where: {
        ...taskBaseWhere,
        status: 'DONE',
      },
    }),

    prisma.task.count({
      where: {
        ...taskBaseWhere,
        deadline: { lt: new Date() },
        status: { not: 'DONE' },
      },
    }),
  ]);

  // Calculate average lead time (only for completed requests)
  const completedRequestsWithTimes = await prisma.request.findMany({
    where: {
      ...baseWhere,
      status: 'DONE',
      completedAt: { not: null },
    },
    select: {
      createdAt: true,
      completedAt: true,
    },
  });

  let avgLeadTime = 0;
  if (completedRequestsWithTimes.length > 0) {
    const totalLeadTime = completedRequestsWithTimes.reduce((sum, req) => {
      if (req.completedAt) {
        const leadTime = (req.completedAt.getTime() - req.createdAt.getTime()) / (1000 * 60 * 60); // hours
        return sum + leadTime;
      }
      return sum;
    }, 0);
    avgLeadTime = totalLeadTime / completedRequestsWithTimes.length;
  }

  // Aggregate by priority
  const byPriority = {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
    URGENT: 0,
  };

  requestsByPriority.forEach((item) => {
    byPriority[item.priority as keyof typeof byPriority] = item._count;
  });

  // Aggregate by status
  const byStatus = {
    OPEN: 0,
    IN_PROGRESS: 0,
    IN_REVIEW: 0,
    DONE: 0,
    REJECTED: 0,
  };

  requestsByStatus.forEach((item) => {
    if (item.status in byStatus) {
      byStatus[item.status as keyof typeof byStatus] = item._count;
    }
  });

  return {
    totalRequests,
    completedRequests,
    totalTasks,
    completedTasks,
    overdueRequests,
    overdueTasks,
    avgLeadTime,
    byPriority,
    byStatus,
  };
}

/**
 * Get team metrics for all teams
 */
export async function getAllTeamsMetrics(filters: DashboardFilters) {
  const teams = await prisma.team.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
    },
  });

  const teamMetrics = await Promise.all(
    teams.map(async (team) => {
      const teamFilters = { ...filters, teamId: team.id };
      const rawData = await getRawMetricsData(teamFilters);

      const completionRate = rawData.totalRequests > 0
        ? (rawData.completedRequests / rawData.totalRequests) * 100
        : 0;

      // SLA compliance: requests not overdue / total requests
      const slaCompliance = rawData.totalRequests > 0
        ? ((rawData.totalRequests - rawData.overdueRequests) / rawData.totalRequests) * 100
        : 100;

      // Active requests: not DONE or REJECTED
      const activeRequests = await prisma.request.count({
        where: {
          teamId: team.id,
          status: { notIn: ['DONE', 'REJECTED', 'ARCHIVED'] },
        },
      });

      // Active tasks: not DONE
      const activeTasks = await prisma.task.count({
        where: {
          request: { teamId: team.id },
          status: { not: 'DONE' },
        },
      });

      return {
        teamId: team.id,
        teamName: team.name,
        completionRate: Math.round(completionRate * 10) / 10,
        slaCompliance: Math.round(slaCompliance * 10) / 10,
        activeRequests,
        activeTasks,
      };
    })
  );

  return teamMetrics;
}

/**
 * Get chart data for a specific metric over time
 */
export async function getMetricChartData(
  metricType: string,
  filters: DashboardFilters,
  granularity: 'day' | 'week' | 'month' = 'day'
) {
  // This is a placeholder for now
  // In a real implementation, you would:
  // 1. Query data grouped by date
  // 2. Calculate the metric for each date bucket
  // 3. Return as ChartDataPoint[]
  
  return [];
}

