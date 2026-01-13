import { prisma } from "@/lib/prisma";
import type { DashboardFilters, ChartDataPoint } from "@/types/dashboard";
import { 
  subDays, 
  startOfDay, 
  endOfDay, 
  differenceInDays, 
  format, 
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { vi } from "date-fns/locale";
import { Logger } from "@/lib/utils/logger";

export interface SLAComplianceByPriority {
  priority: string;
  compliance: number;
  total: number;
  onTime: number;
}

export interface WorkloadDistribution {
  status: string;
  count: number;
  percentage: number;
}

type Granularity = 'day' | 'week' | 'month';

/**
 * Determine granularity based on period
 */
function getGranularity(period: DashboardFilters['period']): Granularity {
  switch (period) {
    case 'week':
    case 'month':
      return 'day';
    case 'quarter':
      return 'week';
    case 'year':
      return 'month';
    default:
      return 'day';
  }
}

/**
 * Get completion rate trend data
 */
export async function getCompletionRateTrend(
  filters: DashboardFilters
): Promise<ChartDataPoint[]> {
  try {
    const endDate = filters.endDate || new Date();
    let startDate = filters.startDate;
    
    if (!startDate) {
      const daysMap = { week: 7, month: 30, quarter: 90, year: 365 };
      startDate = subDays(endDate, daysMap[filters.period]);
    }

    const granularity = getGranularity(filters.period);
    let intervals: Date[] = [];

    // Generate time intervals based on granularity
    switch (granularity) {
      case 'day':
        intervals = eachDayOfInterval({ start: startDate, end: endDate });
        break;
      case 'week':
        intervals = eachWeekOfInterval({ start: startDate, end: endDate });
        break;
      case 'month':
        intervals = eachMonthOfInterval({ start: startDate, end: endDate });
        break;
    }

    // Limit to max 30 data points
    if (intervals.length > 30) {
      const step = Math.ceil(intervals.length / 30);
      intervals = intervals.filter((_, index) => index % step === 0);
    }

    const dataPoints: ChartDataPoint[] = [];

    for (const date of intervals) {
      let periodStart: Date;
      let periodEnd: Date;

      switch (granularity) {
        case 'day':
          periodStart = startOfDay(date);
          periodEnd = endOfDay(date);
          break;
        case 'week':
          periodStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday
          periodEnd = endOfWeek(date, { weekStartsOn: 1 });
          break;
        case 'month':
          periodStart = startOfMonth(date);
          periodEnd = endOfMonth(date);
          break;
      }

      const baseWhere: any = {
        createdAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      };

      if (filters.teamId) {
        baseWhere.teamId = filters.teamId;
      }

      // Get total and completed requests for this period
      const [total, completed] = await Promise.all([
        prisma.request.count({ where: baseWhere }),
        prisma.request.count({
          where: {
            ...baseWhere,
            status: 'DONE',
          },
        }),
      ]);

      const rate = total > 0 ? (completed / total) * 100 : 0;

      // Format label based on granularity
      let label: string;
      let dateKey: string;

      switch (granularity) {
        case 'day':
          label = format(date, 'dd/MM', { locale: vi });
          dateKey = format(date, 'dd/MM');
          break;
        case 'week':
          label = `Tuần ${format(date, 'w')}`;
          dateKey = format(date, 'dd/MM');
          break;
        case 'month':
          label = format(date, 'MM/yyyy', { locale: vi });
          dateKey = format(date, 'MM/yyyy');
          break;
      }

      dataPoints.push({
        date: dateKey,
        value: parseFloat(rate.toFixed(1)),
        label,
      });
    }

    return dataPoints;
  } catch (error) {
    Logger.captureException(error as Error, { action: "getCompletionRateTrend" });
    return [];
  }
}

/**
 * Get throughput trend data (requests completed per period)
 */
export async function getThroughputTrend(
  filters: DashboardFilters
): Promise<ChartDataPoint[]> {
  try {
    const endDate = filters.endDate || new Date();
    let startDate = filters.startDate;
    
    if (!startDate) {
      const daysMap = { week: 7, month: 30, quarter: 90, year: 365 };
      startDate = subDays(endDate, daysMap[filters.period]);
    }

    const granularity = getGranularity(filters.period);
    let intervals: Date[] = [];

    switch (granularity) {
      case 'day':
        intervals = eachDayOfInterval({ start: startDate, end: endDate });
        break;
      case 'week':
        intervals = eachWeekOfInterval({ start: startDate, end: endDate });
        break;
      case 'month':
        intervals = eachMonthOfInterval({ start: startDate, end: endDate });
        break;
    }

    if (intervals.length > 30) {
      const step = Math.ceil(intervals.length / 30);
      intervals = intervals.filter((_, index) => index % step === 0);
    }

    const dataPoints: ChartDataPoint[] = [];

    for (const date of intervals) {
      let periodStart: Date;
      let periodEnd: Date;

      switch (granularity) {
        case 'day':
          periodStart = startOfDay(date);
          periodEnd = endOfDay(date);
          break;
        case 'week':
          periodStart = startOfWeek(date, { weekStartsOn: 1 });
          periodEnd = endOfWeek(date, { weekStartsOn: 1 });
          break;
        case 'month':
          periodStart = startOfMonth(date);
          periodEnd = endOfMonth(date);
          break;
      }

      const baseWhere: any = {
        completedAt: {
          gte: periodStart,
          lte: periodEnd,
        },
        status: 'DONE',
      };

      if (filters.teamId) {
        baseWhere.teamId = filters.teamId;
      }

      const completed = await prisma.request.count({ where: baseWhere });

      let label: string;
      let dateKey: string;

      switch (granularity) {
        case 'day':
          label = format(date, 'dd/MM', { locale: vi });
          dateKey = format(date, 'dd/MM');
          break;
        case 'week':
          label = `Tuần ${format(date, 'w')}`;
          dateKey = format(date, 'dd/MM');
          break;
        case 'month':
          label = format(date, 'MM/yyyy', { locale: vi });
          dateKey = format(date, 'MM/yyyy');
          break;
      }

      dataPoints.push({
        date: dateKey,
        value: completed,
        label,
      });
    }

    return dataPoints;
  } catch (error) {
    Logger.captureException(error as Error, { action: "getThroughputTrend" });
    return [];
  }
}

/**
 * Get backlog trend data
 */
export async function getBacklogTrend(
  filters: DashboardFilters
): Promise<ChartDataPoint[]> {
  try {
    const endDate = filters.endDate || new Date();
    let startDate = filters.startDate;
    
    if (!startDate) {
      const daysMap = { week: 7, month: 30, quarter: 90, year: 365 };
      startDate = subDays(endDate, daysMap[filters.period]);
    }

    const granularity = getGranularity(filters.period);
    let intervals: Date[] = [];

    switch (granularity) {
      case 'day':
        intervals = eachDayOfInterval({ start: startDate, end: endDate });
        break;
      case 'week':
        intervals = eachWeekOfInterval({ start: startDate, end: endDate });
        break;
      case 'month':
        intervals = eachMonthOfInterval({ start: startDate, end: endDate });
        break;
    }

    if (intervals.length > 30) {
      const step = Math.ceil(intervals.length / 30);
      intervals = intervals.filter((_, index) => index % step === 0);
    }

    const dataPoints: ChartDataPoint[] = [];

    for (const date of intervals) {
      const periodEnd = granularity === 'day' 
        ? endOfDay(date) 
        : granularity === 'week'
        ? endOfWeek(date, { weekStartsOn: 1 })
        : endOfMonth(date);

      const baseWhere: any = {
        createdAt: { lte: periodEnd },
        status: { in: ['OPEN', 'IN_PROGRESS', 'IN_REVIEW'] },
      };

      if (filters.teamId) {
        baseWhere.teamId = filters.teamId;
      }

      const backlogCount = await prisma.request.count({ where: baseWhere });

      let label: string;
      let dateKey: string;

      switch (granularity) {
        case 'day':
          label = format(date, 'dd/MM', { locale: vi });
          dateKey = format(date, 'dd/MM');
          break;
        case 'week':
          label = `Tuần ${format(date, 'w')}`;
          dateKey = format(date, 'dd/MM');
          break;
        case 'month':
          label = format(date, 'MM/yyyy', { locale: vi });
          dateKey = format(date, 'MM/yyyy');
          break;
      }

      dataPoints.push({
        date: dateKey,
        value: backlogCount,
        label,
      });
    }

    return dataPoints;
  } catch (error) {
    Logger.captureException(error as Error, { action: "getBacklogTrend" });
    return [];
  }
}

/**
 * Get SLA compliance by priority
 */
export async function getSLAComplianceByPriority(
  filters: DashboardFilters
): Promise<SLAComplianceByPriority[]> {
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

    const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    const results: SLAComplianceByPriority[] = [];

    for (const priority of priorities) {
      const baseWhere: any = {
        createdAt: dateFilter,
        priority,
        slaDeadline: { not: null },
      };

      if (filters.teamId) {
        baseWhere.teamId = filters.teamId;
      }

      const [total, onTime] = await Promise.all([
        prisma.request.count({ where: baseWhere }),
        prisma.request.count({
          where: {
            ...baseWhere,
            OR: [
              { completedAt: { lte: prisma.request.fields.slaDeadline } },
              { slaStatus: 'ON_TIME' },
            ],
          },
        }),
      ]);

      const compliance = total > 0 ? (onTime / total) * 100 : 100;

      results.push({
        priority,
        compliance: parseFloat(compliance.toFixed(1)),
        total,
        onTime,
      });
    }

    return results;
  } catch (error) {
    Logger.captureException(error as Error, { action: "getSLAComplianceByPriority" });
    return [];
  }
}

/**
 * Get workload distribution by status
 */
export async function getWorkloadDistribution(
  filters: DashboardFilters
): Promise<WorkloadDistribution[]> {
  try {
    const baseWhere: any = {
      status: { in: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED'] },
    };

    // Filter by team if specified
    if (filters.teamId) {
      baseWhere.request = {
        teamId: filters.teamId,
      };
    }

    // Get task counts by status
    const tasksByStatus = await prisma.task.groupBy({
      by: ['status'],
      where: baseWhere,
      _count: true,
    });

    const totalTasks = tasksByStatus.reduce((sum, item) => sum + item._count, 0);
    
    if (totalTasks === 0) {
      return [];
    }

    const results: WorkloadDistribution[] = tasksByStatus.map((item) => ({
      status: item.status,
      count: item._count,
      percentage: parseFloat(((item._count / totalTasks) * 100).toFixed(1)),
    }));

    return results;
  } catch (error) {
    Logger.captureException(error as Error, { action: "getWorkloadDistribution" });
    return [];
  }
}

