import { prisma } from "@/lib/prisma";
import { Logger } from "@/lib/utils/logger";
import type { ReportConfig } from "@/types/report";
import {
  subMonths,
  subWeeks,
  subDays,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  differenceInDays,
  format,
} from "date-fns";
import { vi } from "date-fns/locale";

interface Period {
  label: string;
  start: Date;
  end: Date;
}

interface PeriodMetrics {
  totalRequests: number;
  completedRequests: number;
  completionRate: number;
  slaCompliance: number;
  avgLeadTime: number;
  throughput: number;
}

interface TrendData {
  period: string;
  startDate: Date;
  endDate: Date;
  metrics: PeriodMetrics;
}

interface Comparison {
  completionRate: { value: number; trend: "up" | "down" | "stable" } | null;
  slaCompliance: { value: number; trend: "up" | "down" | "stable" } | null;
  avgLeadTime: { value: number; trend: "up" | "down" | "stable" } | null;
  throughput: { value: number; trend: "up" | "down" | "stable" } | null;
}

export class HistoricalService {
  async getHistoricalTrends(config: ReportConfig) {
    try {
      const { dateRange } = config.filters;
      const periods = this.calculateComparePeriods(dateRange);

      // Fetch data for each period
      const trends = await Promise.all(
        periods.map(async (period) => ({
          period: period.label,
          startDate: period.start,
          endDate: period.end,
          metrics: await this.fetchPeriodMetrics(period, config),
        }))
      );

      return {
        periods,
        trends,
        comparison: this.calculateComparison(trends),
      };
    } catch (error) {
      Logger.captureException(error as Error, { action: "getHistoricalTrends" });
      throw error;
    }
  }

  private calculateComparePeriods(dateRange: { from: Date; to: Date }): Period[] {
    const daysDiff = differenceInDays(dateRange.to, dateRange.from);

    // Current period
    const currentPeriod: Period = {
      label: "Current Period",
      start: dateRange.from,
      end: dateRange.to,
    };

    // Previous period (same duration)
    const previousPeriod: Period = {
      label: "Previous Period",
      start: subDays(dateRange.from, daysDiff + 1),
      end: subDays(dateRange.to, daysDiff + 1),
    };

    // Same period last month
    const lastMonthPeriod: Period = {
      label: "Last Month",
      start: subMonths(dateRange.from, 1),
      end: subMonths(dateRange.to, 1),
    };

    // Same period last quarter
    const lastQuarterPeriod: Period = {
      label: "Last Quarter",
      start: subMonths(dateRange.from, 3),
      end: subMonths(dateRange.to, 3),
    };

    return [currentPeriod, previousPeriod, lastMonthPeriod, lastQuarterPeriod];
  }

  private async fetchPeriodMetrics(period: Period, config: ReportConfig): Promise<PeriodMetrics> {
    const where: any = {
      createdAt: {
        gte: period.start,
        lte: period.end,
      },
    };

    if (config.filters.teamIds && config.filters.teamIds.length > 0) {
      where.teamId = { in: config.filters.teamIds };
    }

    if (config.filters.status && config.filters.status.length > 0) {
      where.status = { in: config.filters.status };
    }

    // Fetch requests for this period
    const requests = await prisma.request.findMany({ where });

    // Calculate metrics
    const totalRequests = requests.length;
    const completedRequests = requests.filter((r) => r.status === "DONE").length;
    const completionRate = totalRequests > 0 ? (completedRequests / totalRequests) * 100 : 0;

    const onTimeRequests = requests.filter(
      (r) => r.completedAt && r.slaDeadline && r.completedAt <= r.slaDeadline
    ).length;
    const slaCompliance = completedRequests > 0 ? (onTimeRequests / completedRequests) * 100 : 0;

    const leadTimes = requests
      .filter((r) => r.completedAt)
      .map((r) => differenceInDays(r.completedAt!, r.createdAt));
    const avgLeadTime = leadTimes.length > 0 ? leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length : 0;

    const daysDiff = differenceInDays(period.end, period.start) || 1;
    const throughput = totalRequests / daysDiff;

    return {
      totalRequests,
      completedRequests,
      completionRate: parseFloat(completionRate.toFixed(1)),
      slaCompliance: parseFloat(slaCompliance.toFixed(1)),
      avgLeadTime: parseFloat(avgLeadTime.toFixed(1)),
      throughput: parseFloat(throughput.toFixed(2)),
    };
  }

  private calculateComparison(trends: TrendData[]): Comparison {
    if (trends.length < 2)
      return {
        completionRate: null,
        slaCompliance: null,
        avgLeadTime: null,
        throughput: null,
      };

    const current = trends[0].metrics;
    const previous = trends[1].metrics;

    const calculate = (curr: number, prev: number): { value: number; trend: "up" | "down" | "stable" } | null => {
      if (prev === 0) return null;
      const change = ((curr - prev) / prev) * 100;
      return {
        value: parseFloat(change.toFixed(1)),
        trend: change > 0.1 ? "up" : change < -0.1 ? "down" : "stable",
      };
    };

    return {
      completionRate: calculate(current.completionRate, previous.completionRate),
      slaCompliance: calculate(current.slaCompliance, previous.slaCompliance),
      avgLeadTime: calculate(current.avgLeadTime, previous.avgLeadTime),
      throughput: calculate(current.throughput, previous.throughput),
    };
  }

  async getMonthlyTrends(months: number, config: ReportConfig) {
    try {
      const trends = [];

      for (let i = 0; i < months; i++) {
        const month = subMonths(new Date(), i);
        const start = startOfMonth(month);
        const end = endOfMonth(month);

        const metrics = await this.fetchPeriodMetrics({ start, end, label: format(month, "MMM yyyy", { locale: vi }) }, config);

        trends.unshift({
          month: format(month, "MMM yyyy", { locale: vi }),
          ...metrics,
        });
      }

      return trends;
    } catch (error) {
      Logger.captureException(error as Error, { action: "getMonthlyTrends" });
      return [];
    }
  }

  async getWeeklyTrends(weeks: number, config: ReportConfig) {
    try {
      const trends = [];

      for (let i = 0; i < weeks; i++) {
        const week = subWeeks(new Date(), i);
        const start = startOfWeek(week, { locale: vi });
        const end = endOfWeek(week, { locale: vi });

        const metrics = await this.fetchPeriodMetrics({ start, end, label: `Week ${format(week, "w", { locale: vi })}` }, config);

        trends.unshift({
          week: `W${format(week, "w", { locale: vi })}`,
          ...metrics,
        });
      }

      return trends;
    } catch (error) {
      Logger.captureException(error as Error, { action: "getWeeklyTrends" });
      return [];
    }
  }
}

export const historicalService = new HistoricalService();

