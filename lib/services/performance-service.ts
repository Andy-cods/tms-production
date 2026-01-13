import { prisma } from "@/lib/prisma";
import type { DashboardFilters } from "@/types/dashboard";
import { 
  subDays, 
  startOfDay, 
  endOfDay, 
  differenceInHours,
  differenceInDays,
  eachWeekOfInterval,
  eachMonthOfInterval,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
} from "date-fns";
import { vi } from "date-fns/locale";
import { Logger } from "@/lib/utils/logger";

export interface ResponseTimeData {
  range: string;
  count: number;
  percentage: number;
}

export interface CycleTimeData {
  period: string;
  avgDays: number;
  byPriority: {
    URGENT: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
}

/**
 * Get response time distribution (creation to first assignment)
 */
export async function getResponseTimeDistribution(
  filters: DashboardFilters
): Promise<ResponseTimeData[]> {
  try {
    const endDate = filters.endDate || new Date();
    let startDate = filters.startDate;
    
    if (!startDate) {
      const daysMap = { week: 7, month: 30, quarter: 90, year: 365 };
      startDate = subDays(endDate, daysMap[filters.period]);
    }

    const baseWhere: any = {
      createdAt: {
        gte: startOfDay(startDate),
        lte: endOfDay(endDate),
      },
    };

    if (filters.teamId) {
      baseWhere.teamId = filters.teamId;
    }

    // Get requests with their first task assignment time
    const requests = await prisma.request.findMany({
      where: baseWhere,
      select: {
        id: true,
        createdAt: true,
        tasks: {
          select: {
            createdAt: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
          take: 1, // Only first task
        },
      },
    });

    // Calculate response time for each request
    const buckets = {
      '<1h': 0,
      '1-4h': 0,
      '4-8h': 0,
      '8-24h': 0,
      '>24h': 0,
    };

    requests.forEach((request) => {
      if (request.tasks.length === 0) return; // No tasks yet

      const firstTaskTime = request.tasks[0].createdAt;
      const responseHours = differenceInHours(firstTaskTime, request.createdAt);

      if (responseHours < 1) {
        buckets['<1h']++;
      } else if (responseHours < 4) {
        buckets['1-4h']++;
      } else if (responseHours < 8) {
        buckets['4-8h']++;
      } else if (responseHours < 24) {
        buckets['8-24h']++;
      } else {
        buckets['>24h']++;
      }
    });

    const total = Object.values(buckets).reduce((sum, count) => sum + count, 0);
    
    if (total === 0) {
      return [];
    }

    const result: ResponseTimeData[] = Object.entries(buckets).map(([range, count]) => ({
      range,
      count,
      percentage: parseFloat(((count / total) * 100).toFixed(1)),
    }));

    return result;
  } catch (error) {
    Logger.captureException(error as Error, { action: "getResponseTimeDistribution" });
    return [];
  }
}

/**
 * Get cycle time trend (creation to completion)
 */
export async function getCycleTimeTrend(
  filters: DashboardFilters
): Promise<CycleTimeData[]> {
  try {
    const endDate = filters.endDate || new Date();
    let startDate = filters.startDate;
    
    if (!startDate) {
      const daysMap = { week: 7, month: 30, quarter: 90, year: 365 };
      startDate = subDays(endDate, daysMap[filters.period]);
    }

    // Determine granularity based on period
    const granularity = filters.period === 'week' || filters.period === 'month' ? 'week' : 'month';
    
    let intervals: Date[] = [];
    if (granularity === 'week') {
      intervals = eachWeekOfInterval({ start: startDate, end: endDate });
    } else {
      intervals = eachMonthOfInterval({ start: startDate, end: endDate });
    }

    const result: CycleTimeData[] = [];

    for (const date of intervals) {
      let periodStart: Date;
      let periodEnd: Date;
      let periodLabel: string;

      if (granularity === 'week') {
        periodStart = startOfWeek(date, { weekStartsOn: 1 });
        periodEnd = endOfWeek(date, { weekStartsOn: 1 });
        periodLabel = `Tuần ${format(date, 'w', { locale: vi })}`;
      } else {
        periodStart = startOfMonth(date);
        periodEnd = endOfMonth(date);
        periodLabel = format(date, 'MM/yyyy', { locale: vi });
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

      // Get completed requests by priority
      const priorities = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];
      const byPriority: any = {};
      let totalDays = 0;
      let totalCount = 0;

      for (const priority of priorities) {
        const requests = await prisma.request.findMany({
          where: {
            ...baseWhere,
            priority,
          },
          select: {
            createdAt: true,
            completedAt: true,
          },
        });

        if (requests.length > 0) {
          const cycleDays = requests.map(r => 
            r.completedAt ? differenceInDays(r.completedAt, r.createdAt) : 0
          );
          const avgDays = cycleDays.reduce((sum, days) => sum + days, 0) / cycleDays.length;
          byPriority[priority] = parseFloat(avgDays.toFixed(1));
          totalDays += cycleDays.reduce((sum, days) => sum + days, 0);
          totalCount += requests.length;
        } else {
          byPriority[priority] = 0;
        }
      }

      const avgDays = totalCount > 0 ? totalDays / totalCount : 0;

      result.push({
        period: periodLabel,
        avgDays: parseFloat(avgDays.toFixed(1)),
        byPriority: {
          URGENT: byPriority['URGENT'] || 0,
          HIGH: byPriority['HIGH'] || 0,
          MEDIUM: byPriority['MEDIUM'] || 0,
          LOW: byPriority['LOW'] || 0,
        },
      });
    }

    return result;
  } catch (error) {
    Logger.captureException(error as Error, { action: "getCycleTimeTrend" });
    return [];
  }
}

/**
 * Generate performance insights
 */
export async function getPerformanceInsights(
  filters: DashboardFilters
): Promise<string[]> {
  try {
    const insights: string[] = [];

    // Response time insights
    const responseData = await getResponseTimeDistribution(filters);
    if (responseData.length > 0) {
      const fastResponse = responseData.filter(d => d.range === '<1h' || d.range === '1-4h');
      const fastPercentage = fastResponse.reduce((sum, d) => sum + d.percentage, 0);
      
      if (fastPercentage >= 70) {
        insights.push(`✅ Xuất sắc: ${fastPercentage.toFixed(0)}% yêu cầu được phản hồi trong 4h`);
      } else if (fastPercentage >= 50) {
        insights.push(`⚠️ Khá tốt: ${fastPercentage.toFixed(0)}% yêu cầu được phản hồi trong 4h`);
      } else {
        insights.push(`🔴 Cần cải thiện: Chỉ ${fastPercentage.toFixed(0)}% yêu cầu được phản hồi trong 4h`);
      }
    }

    // Cycle time insights
    const cycleData = await getCycleTimeTrend(filters);
    if (cycleData.length >= 2) {
      const recent = cycleData[cycleData.length - 1];
      const previous = cycleData[cycleData.length - 2];
      const change = ((recent.avgDays - previous.avgDays) / previous.avgDays) * 100;

      if (change < -10) {
        insights.push(`📈 Cải thiện: Thời gian xử lý giảm ${Math.abs(change).toFixed(0)}% kỳ này`);
      } else if (change > 10) {
        insights.push(`📉 Chậm lại: Thời gian xử lý tăng ${change.toFixed(0)}% kỳ này`);
      } else {
        insights.push(`➡️ Ổn định: Thời gian xử lý không đổi (${recent.avgDays} ngày)`);
      }

      // Priority comparison
      const urgentVsLow = recent.byPriority.LOW - recent.byPriority.URGENT;
      if (urgentVsLow > 0) {
        insights.push(`⚡ URGENT nhanh hơn LOW: ${urgentVsLow.toFixed(1)} ngày`);
      }
    }

    return insights;
  } catch (error) {
    Logger.captureException(error as Error, { action: "getPerformanceInsights" });
    return [];
  }
}

