import { prisma } from "@/lib/prisma";
import { getRawMetricsData } from "@/lib/queries/dashboard";
import type { DashboardFilters, KPICard, ChartDataPoint, TeamMetrics } from "@/types/dashboard";
import { subDays, startOfDay, endOfDay, differenceInDays, format, differenceInHours } from "date-fns";
import { unstable_cache } from "next/cache";
import { Logger } from "@/lib/utils/logger";

/**
 * Get previous period for comparison
 */
function getPreviousPeriod(filters: DashboardFilters): DashboardFilters {
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

  const periodDays = differenceInDays(endDate, startDate);
  const previousEndDate = subDays(startDate, 1);
  const previousStartDate = subDays(previousEndDate, periodDays);

  return {
    ...filters,
    startDate: previousStartDate,
    endDate: previousEndDate,
  };
}

/**
 * Format value with unit
 */
function formatValue(value: number, unit: 'percent' | 'count' | 'days' | 'hours' | 'rate'): string {
  if (isNaN(value) || !isFinite(value)) return 'N/A';
  
  switch (unit) {
    case 'percent':
      return `${value.toFixed(1)}%`;
    case 'count':
      return Math.round(value).toString();
    case 'days':
      return `${value.toFixed(1)} ngày`;
    case 'hours':
      return `${value.toFixed(1)} giờ`;
    case 'rate':
      return `${value.toFixed(1)} / ngày`;
    default:
      return value.toString();
  }
}

/**
 * Calculate completion rate
 */
export async function calculateCompletionRate(filters: DashboardFilters): Promise<KPICard> {
  try {
    const currentData = await getRawMetricsData(filters);
    const previousData = await getRawMetricsData(getPreviousPeriod(filters));

    const currentRate = currentData.totalRequests > 0
      ? (currentData.completedRequests / currentData.totalRequests) * 100
      : 0;

    const previousRate = previousData.totalRequests > 0
      ? (previousData.completedRequests / previousData.totalRequests) * 100
      : 0;

    const change = currentRate - previousRate;
    const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';

    return {
      title: "Tỷ lệ hoàn thành",
      value: formatValue(currentRate, 'percent'),
      change: change !== 0 ? parseFloat(change.toFixed(1)) : undefined,
      trend,
      icon: "CheckCircle2",
      color: "green",
      description: change !== 0 
        ? `${change > 0 ? 'Tăng' : 'Giảm'} ${Math.abs(change).toFixed(1)}% so với kỳ trước`
        : 'Không thay đổi so với kỳ trước',
    };
  } catch (error) {
    Logger.captureException(error as Error, { action: "calculateCompletionRate" });
    return {
      title: "Tỷ lệ hoàn thành",
      value: "N/A",
      icon: "CheckCircle2",
      color: "green",
      description: "Không thể tính toán",
    };
  }
}

/**
 * Calculate SLA compliance
 */
export async function calculateSLACompliance(filters: DashboardFilters): Promise<KPICard> {
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
      slaDeadline: { not: null },
    };

    if (filters.teamId) {
      baseWhere.teamId = filters.teamId;
    }

    // Current period
    const [totalWithSLA, onTimeCount] = await Promise.all([
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

    const currentCompliance = totalWithSLA > 0 ? (onTimeCount / totalWithSLA) * 100 : 100;

    // Previous period
    const previousFilters = getPreviousPeriod(filters);
    const prevEndDate = previousFilters.endDate || new Date();
    const prevStartDate = previousFilters.startDate || subDays(prevEndDate, 7);

    const prevDateFilter = {
      gte: startOfDay(prevStartDate),
      lte: endOfDay(prevEndDate),
    };

    const prevBaseWhere: any = {
      createdAt: prevDateFilter,
      slaDeadline: { not: null },
    };

    if (filters.teamId) {
      prevBaseWhere.teamId = filters.teamId;
    }

    const [prevTotalWithSLA, prevOnTimeCount] = await Promise.all([
      prisma.request.count({ where: prevBaseWhere }),
      prisma.request.count({
        where: {
          ...prevBaseWhere,
          OR: [
            { completedAt: { lte: prisma.request.fields.slaDeadline } },
            { slaStatus: 'ON_TIME' },
          ],
        },
      }),
    ]);

    const previousCompliance = prevTotalWithSLA > 0 ? (prevOnTimeCount / prevTotalWithSLA) * 100 : 100;

    const change = currentCompliance - previousCompliance;
    const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';

    return {
      title: "Tuân thủ SLA",
      value: formatValue(currentCompliance, 'percent'),
      change: change !== 0 ? parseFloat(change.toFixed(1)) : undefined,
      trend,
      icon: "Clock",
      color: "blue",
      description: change !== 0
        ? `${change > 0 ? 'Tăng' : 'Giảm'} ${Math.abs(change).toFixed(1)}% so với kỳ trước`
        : 'Không thay đổi so với kỳ trước',
    };
  } catch (error) {
    Logger.captureException(error as Error, { action: "calculateSLACompliance" });
    return {
      title: "Tuân thủ SLA",
      value: "N/A",
      icon: "Clock",
      color: "blue",
      description: "Không thể tính toán",
    };
  }
}

/**
 * Calculate average lead time
 */
export async function calculateAvgLeadTime(filters: DashboardFilters): Promise<KPICard> {
  try {
    const currentData = await getRawMetricsData(filters);
    const previousData = await getRawMetricsData(getPreviousPeriod(filters));

    const currentLeadTime = currentData.avgLeadTime;
    const previousLeadTime = previousData.avgLeadTime;

    // Convert hours to days if > 24 hours
    const unit = currentLeadTime > 24 ? 'days' : 'hours';
    const currentValue = unit === 'days' ? currentLeadTime / 24 : currentLeadTime;
    const previousValue = unit === 'days' ? previousLeadTime / 24 : previousLeadTime;

    const change = currentValue - previousValue;
    // For lead time, lower is better, so trend is inverted
    const trend = change < 0 ? 'up' : change > 0 ? 'down' : 'stable';

    return {
      title: "Thời gian xử lý TB",
      value: formatValue(currentValue, unit),
      change: change !== 0 ? parseFloat(change.toFixed(1)) : undefined,
      trend,
      icon: "Timer",
      color: "orange",
      description: change !== 0
        ? `${change < 0 ? 'Nhanh hơn' : 'Chậm hơn'} ${Math.abs(change).toFixed(1)} ${unit === 'days' ? 'ngày' : 'giờ'} so với kỳ trước`
        : 'Không thay đổi so với kỳ trước',
    };
  } catch (error) {
    Logger.captureException(error as Error, { action: "calculateAvgLeadTime" });
    return {
      title: "Thời gian xử lý TB",
      value: "N/A",
      icon: "Timer",
      color: "orange",
      description: "Không thể tính toán",
    };
  }
}

/**
 * Calculate backlog count
 */
export async function calculateBacklogCount(filters: DashboardFilters): Promise<KPICard> {
  try {
    const baseWhere: any = {
      status: { in: ['OPEN', 'IN_PROGRESS', 'IN_REVIEW'] },
    };

    if (filters.teamId) {
      baseWhere.teamId = filters.teamId;
    }

    const [currentBacklog, overdueCount] = await Promise.all([
      prisma.request.count({ where: baseWhere }),
      prisma.request.count({
        where: {
          ...baseWhere,
          deadline: { lt: new Date() },
        },
      }),
    ]);

    // For comparison, get backlog at start of current period
    const endDate = filters.endDate || new Date();
    let startDate = filters.startDate;
    
    if (!startDate) {
      const daysMap = { week: 7, month: 30, quarter: 90, year: 365 };
      startDate = subDays(endDate, daysMap[filters.period]);
    }

    const previousBacklog = await prisma.request.count({
      where: {
        ...baseWhere,
        createdAt: { lt: startDate },
      },
    });

    const change = currentBacklog - previousBacklog;
    // For backlog, lower is better, so trend is inverted
    const trend = change < 0 ? 'up' : change > 0 ? 'down' : 'stable';

    return {
      title: "Tồn đọng",
      value: formatValue(currentBacklog, 'count'),
      change: change !== 0 ? change : undefined,
      trend,
      icon: "Inbox",
      color: currentBacklog > 50 ? "red" : "purple",
      description: overdueCount > 0
        ? `${overdueCount} yêu cầu quá hạn`
        : 'Không có yêu cầu quá hạn',
    };
  } catch (error) {
    Logger.captureException(error as Error, { action: "calculateBacklogCount" });
    return {
      title: "Tồn đọng",
      value: "N/A",
      icon: "Inbox",
      color: "purple",
      description: "Không thể tính toán",
    };
  }
}

/**
 * Calculate throughput
 */
export async function calculateThroughput(filters: DashboardFilters): Promise<KPICard> {
  try {
    const currentData = await getRawMetricsData(filters);
    const previousData = await getRawMetricsData(getPreviousPeriod(filters));

    const endDate = filters.endDate || new Date();
    let startDate = filters.startDate;
    
    if (!startDate) {
      const daysMap = { week: 7, month: 30, quarter: 90, year: 365 };
      startDate = subDays(endDate, daysMap[filters.period]);
    }

    const currentDays = Math.max(1, differenceInDays(endDate, startDate) + 1);
    const currentThroughput = currentData.completedRequests / currentDays;

    const prevEndDate = getPreviousPeriod(filters).endDate || new Date();
    const prevStartDate = getPreviousPeriod(filters).startDate || subDays(prevEndDate, 7);
    const previousDays = Math.max(1, differenceInDays(prevEndDate, prevStartDate) + 1);
    const previousThroughput = previousData.completedRequests / previousDays;

    const change = currentThroughput - previousThroughput;
    const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';

    return {
      title: "Năng suất",
      value: formatValue(currentThroughput, 'rate'),
      change: change !== 0 ? parseFloat(change.toFixed(1)) : undefined,
      trend,
      icon: "TrendingUp",
      color: "purple",
      description: change !== 0
        ? `${change > 0 ? 'Tăng' : 'Giảm'} ${Math.abs(change).toFixed(1)} yêu cầu/ngày so với kỳ trước`
        : 'Không thay đổi so với kỳ trước',
    };
  } catch (error) {
    Logger.captureException(error as Error, { action: "calculateThroughput" });
    return {
      title: "Năng suất",
      value: "N/A",
      icon: "TrendingUp",
      color: "purple",
      description: "Không thể tính toán",
    };
  }
}

/**
 * Get all KPIs with caching
 */
export async function getAllKPIs(filters: DashboardFilters): Promise<KPICard[]> {
  const cacheKey = ['dashboard-kpis', JSON.stringify(filters)];
  
  const cached = unstable_cache(
    async () => {
      Logger.info("Calculating KPIs", { filters });
      
      const [completion, sla, leadTime, backlog, throughput] = await Promise.all([
        calculateCompletionRate(filters),
        calculateSLACompliance(filters),
        calculateAvgLeadTime(filters),
        calculateBacklogCount(filters),
        calculateThroughput(filters),
      ]);
      
      return [completion, sla, leadTime, backlog, throughput];
    },
    cacheKey,
    { revalidate: 300 } // 5 minutes
  );

  return cached();
}

/**
 * Get metrics for specific teams
 */
export async function getTeamMetrics(teamIds?: string[]): Promise<TeamMetrics[]> {
  try {
    const teams = await prisma.team.findMany({
      where: teamIds ? { id: { in: teamIds } } : { isActive: true },
      select: { id: true, name: true },
    });

    const metrics = await Promise.all(
      teams.map(async (team) => {
        const filters: DashboardFilters = {
          teamId: team.id,
          period: 'month',
        };

        const rawData = await getRawMetricsData(filters);
        
        const completionRate = rawData.totalRequests > 0
          ? (rawData.completedRequests / rawData.totalRequests) * 100
          : 0;

        const totalWithSLA = await prisma.request.count({
          where: {
            teamId: team.id,
            slaDeadline: { not: null },
          },
        });

        const onTimeSLA = await prisma.request.count({
          where: {
            teamId: team.id,
            slaDeadline: { not: null },
            OR: [
              { completedAt: { lte: prisma.request.fields.slaDeadline } },
              { slaStatus: 'ON_TIME' },
            ],
          },
        });

        const slaCompliance = totalWithSLA > 0 ? (onTimeSLA / totalWithSLA) * 100 : 100;

        const [activeRequests, activeTasks] = await Promise.all([
          prisma.request.count({
            where: {
              teamId: team.id,
              status: { notIn: ['DONE', 'REJECTED', 'ARCHIVED'] },
            },
          }),
          prisma.task.count({
            where: {
              request: { teamId: team.id },
              status: { not: 'DONE' },
            },
          }),
        ]);

        return {
          teamId: team.id,
          teamName: team.name,
          completionRate: parseFloat(completionRate.toFixed(1)),
          slaCompliance: parseFloat(slaCompliance.toFixed(1)),
          activeRequests,
          activeTasks,
        };
      })
    );

    return metrics;
  } catch (error) {
    Logger.captureException(error as Error, { action: "getTeamMetrics" });
    return [];
  }
}

/**
 * Get trend data for charts
 */
export async function getTrendData(
  metricType: string,
  filters: DashboardFilters
): Promise<ChartDataPoint[]> {
  try {
    const endDate = filters.endDate || new Date();
    let startDate = filters.startDate;
    
    if (!startDate) {
      const daysMap = { week: 7, month: 30, quarter: 90, year: 365 };
      startDate = subDays(endDate, daysMap[filters.period]);
    }

    const days = differenceInDays(endDate, startDate) + 1;
    const dataPoints: ChartDataPoint[] = [];

    // For now, return daily aggregation
    for (let i = 0; i < days; i++) {
      const date = subDays(endDate, days - i - 1);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const dayFilters: DashboardFilters = {
        ...filters,
        startDate: dayStart,
        endDate: dayEnd,
      };

      let value = 0;

      switch (metricType) {
        case 'COMPLETION_RATE': {
          const data = await getRawMetricsData(dayFilters);
          value = data.totalRequests > 0 ? (data.completedRequests / data.totalRequests) * 100 : 0;
          break;
        }
        case 'THROUGHPUT': {
          const data = await getRawMetricsData(dayFilters);
          value = data.completedRequests;
          break;
        }
        case 'BACKLOG_COUNT': {
          const count = await prisma.request.count({
            where: {
              createdAt: { lte: dayEnd },
              status: { in: ['OPEN', 'IN_PROGRESS', 'IN_REVIEW'] },
              ...(filters.teamId && { teamId: filters.teamId }),
            },
          });
          value = count;
          break;
        }
      }

      dataPoints.push({
        date: format(date, 'yyyy-MM-dd'),
        value: parseFloat(value.toFixed(1)),
        label: format(date, 'dd/MM'),
      });
    }

    return dataPoints;
  } catch (error) {
    Logger.captureException(error as Error, { action: "getTrendData", metricType });
    return [];
  }
}

