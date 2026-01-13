import { prisma } from "@/lib/prisma";
import type { DashboardFilters } from "@/types/dashboard";
import { 
  subDays, 
  startOfDay, 
  endOfDay,
  eachDayOfInterval,
  differenceInDays,
  format,
} from "date-fns";
import { vi } from "date-fns/locale";
import { Logger } from "@/lib/utils/logger";

export interface CFDData {
  date: string;
  TODO: number;
  IN_PROGRESS: number;
  IN_REVIEW: number;
  BLOCKED: number;
  DONE: number;
}

export interface FunnelData {
  stage: string;
  count: number;
  rate: number;
}

export interface AgingData {
  range: string;
  count: number;
  percentage: number;
}

/**
 * Get Cumulative Flow Diagram data
 */
export async function getCumulativeFlowData(
  filters: DashboardFilters
): Promise<CFDData[]> {
  try {
    const endDate = filters.endDate || new Date();
    let startDate = filters.startDate;
    
    if (!startDate) {
      const daysMap = { week: 7, month: 30, quarter: 90, year: 365 };
      startDate = subDays(endDate, daysMap[filters.period]);
    }

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Limit to max 30 days for performance
    let sampledDays = days;
    if (days.length > 30) {
      const step = Math.ceil(days.length / 30);
      sampledDays = days.filter((_, index) => index % step === 0);
    }

    const cfdData: CFDData[] = [];

    for (const date of sampledDays) {
      const dayEnd = endOfDay(date);

      const baseWhere: any = {
        createdAt: { lte: dayEnd },
      };

      if (filters.teamId) {
        baseWhere.request = { teamId: filters.teamId };
      }

      // Count tasks in each status as of this date
      const [todo, inProgress, inReview, blocked, done] = await Promise.all([
        prisma.task.count({
          where: {
            ...baseWhere,
            status: 'TODO',
            completedAt: null,
          },
        }),
        prisma.task.count({
          where: {
            ...baseWhere,
            status: 'IN_PROGRESS',
            completedAt: null,
          },
        }),
        prisma.task.count({
          where: {
            ...baseWhere,
            status: 'IN_REVIEW',
            completedAt: null,
          },
        }),
        prisma.task.count({
          where: {
            ...baseWhere,
            status: 'BLOCKED',
            completedAt: null,
          },
        }),
        prisma.task.count({
          where: {
            ...baseWhere,
            status: 'DONE',
          },
        }),
      ]);

      cfdData.push({
        date: format(date, 'dd/MM', { locale: vi }),
        TODO: todo,
        IN_PROGRESS: inProgress,
        IN_REVIEW: inReview,
        BLOCKED: blocked,
        DONE: done,
      });
    }

    return cfdData;
  } catch (error) {
    Logger.captureException(error as Error, { action: "getCumulativeFlowData" });
    return [];
  }
}

/**
 * Get resolution funnel data
 */
export async function getResolutionFunnel(
  filters: DashboardFilters
): Promise<FunnelData[]> {
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

    // Count requests at each stage
    const [created, assigned, started, completed] = await Promise.all([
      // All created requests
      prisma.request.count({ where: baseWhere }),
      
      // Requests with at least one task
      prisma.request.count({
        where: {
          ...baseWhere,
          tasks: { some: {} },
        },
      }),
      
      // Requests with at least one task in progress or beyond
      prisma.request.count({
        where: {
          ...baseWhere,
          tasks: {
            some: {
              status: { in: ['IN_PROGRESS', 'IN_REVIEW', 'DONE'] },
            },
          },
        },
      }),
      
      // Completed requests
      prisma.request.count({
        where: {
          ...baseWhere,
          status: 'DONE',
        },
      }),
    ]);

    const funnelData: FunnelData[] = [
      {
        stage: 'Tạo yêu cầu',
        count: created,
        rate: 100,
      },
      {
        stage: 'Được phân công',
        count: assigned,
        rate: created > 0 ? (assigned / created) * 100 : 0,
      },
      {
        stage: 'Bắt đầu xử lý',
        count: started,
        rate: created > 0 ? (started / created) * 100 : 0,
      },
      {
        stage: 'Hoàn thành',
        count: completed,
        rate: created > 0 ? (completed / created) * 100 : 0,
      },
    ];

    return funnelData.map(item => ({
      ...item,
      rate: parseFloat(item.rate.toFixed(1)),
    }));
  } catch (error) {
    Logger.captureException(error as Error, { action: "getResolutionFunnel" });
    return [];
  }
}

/**
 * Get aging report (requests by age)
 */
export async function getAgingReport(
  filters: DashboardFilters
): Promise<AgingData[]> {
  try {
    const baseWhere: any = {
      status: { in: ['OPEN', 'IN_PROGRESS', 'IN_REVIEW'] },
    };

    if (filters.teamId) {
      baseWhere.teamId = filters.teamId;
    }

    // Get all active requests
    const activeRequests = await prisma.request.findMany({
      where: baseWhere,
      select: {
        id: true,
        createdAt: true,
      },
    });

    if (activeRequests.length === 0) {
      return [];
    }

    // Calculate age for each request
    const now = new Date();
    const ageBuckets = {
      '<1 ngày': 0,
      '1-3 ngày': 0,
      '3-7 ngày': 0,
      '7-14 ngày': 0,
      '>14 ngày': 0,
    };

    activeRequests.forEach((request) => {
      const ageDays = differenceInDays(now, request.createdAt);

      if (ageDays < 1) {
        ageBuckets['<1 ngày']++;
      } else if (ageDays < 3) {
        ageBuckets['1-3 ngày']++;
      } else if (ageDays < 7) {
        ageBuckets['3-7 ngày']++;
      } else if (ageDays < 14) {
        ageBuckets['7-14 ngày']++;
      } else {
        ageBuckets['>14 ngày']++;
      }
    });

    const total = activeRequests.length;
    const agingData: AgingData[] = Object.entries(ageBuckets).map(([range, count]) => ({
      range,
      count,
      percentage: parseFloat(((count / total) * 100).toFixed(1)),
    }));

    return agingData;
  } catch (error) {
    Logger.captureException(error as Error, { action: "getAgingReport" });
    return [];
  }
}

