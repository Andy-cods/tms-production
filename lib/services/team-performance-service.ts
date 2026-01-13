import { prisma } from "@/lib/prisma";
import { getRawMetricsData } from "@/lib/queries/dashboard";
import type { DashboardFilters } from "@/types/dashboard";
import { subDays, differenceInDays } from "date-fns";
import { Logger } from "@/lib/utils/logger";

export interface TeamLeaderboardData {
  rank: number;
  teamId: string;
  teamName: string;
  score: number;
  completionRate: number;
  slaCompliance: number;
  avgLeadTime: number;
  throughput: number;
  members: number;
  trend: 'up' | 'down' | 'stable';
}

export interface TeamRadarData {
  teamName: string;
  teamId: string;
  speed: number;      // 0-100 (inverse of lead time)
  quality: number;    // 0-100 (approval rate)
  capacity: number;   // 0-100 (throughput normalized)
  sla: number;        // 0-100 (compliance %)
  volume: number;     // 0-100 (completed count normalized)
}

/**
 * Normalize value to 0-100 scale
 */
function normalize(value: number, min: number, max: number): number {
  if (max === min) return 50; // Default to middle if no range
  const normalized = ((value - min) / (max - min)) * 100;
  return Math.max(0, Math.min(100, normalized));
}

/**
 * Get team leaderboard with comprehensive metrics
 */
export async function getTeamLeaderboard(
  filters: DashboardFilters
): Promise<TeamLeaderboardData[]> {
  try {
    const teams = await prisma.team.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        members: {
          where: { isActive: true },
          select: { id: true },
        },
      },
    });

    const teamMetrics = await Promise.all(
      teams.map(async (team) => {
        const teamFilters = { ...filters, teamId: team.id };
        const rawData = await getRawMetricsData(teamFilters);

        // Completion rate
        const completionRate = rawData.totalRequests > 0
          ? (rawData.completedRequests / rawData.totalRequests) * 100
          : 0;

        // SLA compliance
        const slaRequests = await prisma.request.count({
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

        const slaCompliance = slaRequests > 0 ? (onTimeSLA / slaRequests) * 100 : 100;

        // Average lead time
        const avgLeadTime = rawData.avgLeadTime / 24; // Convert to days

        // Throughput
        const endDate = filters.endDate || new Date();
        let startDate = filters.startDate;
        
        if (!startDate) {
          const daysMap = { week: 7, month: 30, quarter: 90, year: 365 };
          startDate = subDays(endDate, daysMap[filters.period]);
        }

        const periodDays = Math.max(1, differenceInDays(endDate, startDate) + 1);
        const throughput = rawData.completedRequests / periodDays;

        // Calculate overall score (weighted average)
        const score = (
          completionRate * 0.3 +        // 30% weight
          slaCompliance * 0.3 +          // 30% weight
          (100 - Math.min(100, avgLeadTime * 10)) * 0.2 + // 20% weight (lower is better)
          Math.min(100, throughput * 10) * 0.2  // 20% weight
        );

        // Get previous period for trend
        const previousFilters = {
          ...filters,
          startDate: subDays(startDate, periodDays),
          endDate: subDays(endDate, periodDays),
          teamId: team.id,
        };
        const previousData = await getRawMetricsData(previousFilters);
        const previousCompletionRate = previousData.totalRequests > 0
          ? (previousData.completedRequests / previousData.totalRequests) * 100
          : 0;
        
        const trend: 'up' | 'down' | 'stable' = 
          completionRate > previousCompletionRate + 5 ? 'up' :
          completionRate < previousCompletionRate - 5 ? 'down' :
          'stable';

        return {
          rank: 0, // Will be assigned after sorting
          teamId: team.id,
          teamName: team.name,
          score: parseFloat(score.toFixed(1)),
          completionRate: parseFloat(completionRate.toFixed(1)),
          slaCompliance: parseFloat(slaCompliance.toFixed(1)),
          avgLeadTime: parseFloat(avgLeadTime.toFixed(1)),
          throughput: parseFloat(throughput.toFixed(1)),
          members: team.members.length,
          trend,
        };
      })
    );

    // Sort by score and assign ranks
    teamMetrics.sort((a, b) => b.score - a.score);
    teamMetrics.forEach((team, index) => {
      team.rank = index + 1;
    });

    return teamMetrics;
  } catch (error) {
    Logger.captureException(error as Error, { action: "getTeamLeaderboard" });
    return [];
  }
}

/**
 * Get team radar chart data
 */
export async function getTeamRadarData(
  teamIds: string[],
  filters?: DashboardFilters
): Promise<TeamRadarData[]> {
  try {
    const defaultFilters: DashboardFilters = filters || { period: 'month' };
    
    const teams = await prisma.team.findMany({
      where: { 
        id: { in: teamIds },
        isActive: true 
      },
      select: { id: true, name: true },
    });

    const teamRadarData = await Promise.all(
      teams.map(async (team) => {
        const teamFilters = { ...defaultFilters, teamId: team.id };
        const rawData = await getRawMetricsData(teamFilters);

        // Calculate metrics
        const completionRate = rawData.totalRequests > 0
          ? (rawData.completedRequests / rawData.totalRequests) * 100
          : 0;

        const avgLeadTimeDays = rawData.avgLeadTime / 24;
        
        // Speed: inverse of lead time (faster = higher score)
        // If avgLeadTime is 1 day → 95, 5 days → 50, 10+ days → 0
        const speed = Math.max(0, 100 - (avgLeadTimeDays * 10));

        // Quality: Based on completion rate (proxy for quality)
        const quality = completionRate;

        // Capacity: Throughput normalized
        const endDate = defaultFilters.endDate || new Date();
        let startDate = defaultFilters.startDate;
        
        if (!startDate) {
          const daysMap = { week: 7, month: 30, quarter: 90, year: 365 };
          startDate = subDays(endDate, daysMap[defaultFilters.period]);
        }

        const periodDays = Math.max(1, differenceInDays(endDate, startDate) + 1);
        const throughput = rawData.completedRequests / periodDays;
        const capacity = Math.min(100, throughput * 10); // Cap at 100

        // SLA: Compliance percentage
        const slaRequests = await prisma.request.count({
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

        const sla = slaRequests > 0 ? (onTimeSLA / slaRequests) * 100 : 100;

        // Volume: Completed requests normalized
        const volume = Math.min(100, rawData.completedRequests * 2); // Assuming 50 = 100%

        return {
          teamId: team.id,
          teamName: team.name,
          speed: parseFloat(speed.toFixed(1)),
          quality: parseFloat(quality.toFixed(1)),
          capacity: parseFloat(capacity.toFixed(1)),
          sla: parseFloat(sla.toFixed(1)),
          volume: parseFloat(volume.toFixed(1)),
        };
      })
    );

    return teamRadarData;
  } catch (error) {
    Logger.captureException(error as Error, { action: "getTeamRadarData" });
    return [];
  }
}

