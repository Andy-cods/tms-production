import { prisma } from "@/lib/prisma";
import { Logger } from "@/lib/utils/logger";
import { 
  subDays, 
  subWeeks,
  addDays,
  differenceInDays,
  startOfWeek,
  eachWeekOfInterval,
  format,
} from "date-fns";
import { vi } from "date-fns/locale";
import { Role, TaskStatus } from "@prisma/client";

export interface ForecastData {
  backlogCount: number;
  avgThroughput: number;
  estimatedDays: number;
  forecastDate: Date;
  confidence: 'low' | 'medium' | 'high';
}

export interface BurnoutRisk {
  userId: string;
  userName: string;
  riskScore: number;
  severity: 'low' | 'medium' | 'high';
  factors: string[];
  recommendation: string;
}

export interface CapacityShortfall {
  week: string;
  demand: number;
  capacity: number;
  shortfall: number;
  severity: 'low' | 'medium' | 'high';
}

/**
 * Forecast completion date for current backlog
 */
export async function forecastCompletionDate(teamId?: string): Promise<ForecastData> {
  try {
    const fourWeeksAgo = subWeeks(new Date(), 4);
    const now = new Date();

    // Get current backlog count
    const backlogWhere: any = {
      status: { in: ['OPEN', 'IN_PROGRESS', 'IN_REVIEW'] },
    };
    if (teamId) {
      backlogWhere.teamId = teamId;
    }

    const backlogCount = await prisma.request.count({ where: backlogWhere });

    // Calculate average throughput (completed in last 4 weeks)
    const completedWhere: any = {
      status: 'DONE',
      completedAt: {
        gte: fourWeeksAgo,
        lte: now,
      },
    };
    if (teamId) {
      completedWhere.teamId = teamId;
    }

    const completedCount = await prisma.request.count({ where: completedWhere });
    const daysPeriod = differenceInDays(now, fourWeeksAgo);
    const avgThroughput = daysPeriod > 0 ? completedCount / daysPeriod : 0;

    // Estimate days to complete backlog
    const estimatedDays = avgThroughput > 0 ? Math.ceil(backlogCount / avgThroughput) : 999;
    const forecastDate = addDays(now, estimatedDays);

    // Calculate confidence based on data consistency
    let confidence: 'low' | 'medium' | 'high' = 'medium';
    if (completedCount < 10) {
      confidence = 'low'; // Not enough data
    } else if (completedCount > 50) {
      confidence = 'high'; // Plenty of data
    }

    return {
      backlogCount,
      avgThroughput: parseFloat(avgThroughput.toFixed(1)),
      estimatedDays,
      forecastDate,
      confidence,
    };
  } catch (error) {
    Logger.captureException(error as Error, { action: "forecastCompletionDate" });
    return {
      backlogCount: 0,
      avgThroughput: 0,
      estimatedDays: 0,
      forecastDate: new Date(),
      confidence: 'low',
    };
  }
}

/**
 * Detect users at risk of burnout
 */
export async function detectBurnoutRisk(): Promise<BurnoutRisk[]> {
  try {
    const tenDaysAgo = subDays(new Date(), 10);
    const now = new Date();

    // Get all users with active tasks
    const users = await prisma.user.findMany({
      where: {
        role: { in: [Role.STAFF, Role.LEADER] },
      },
      select: {
        id: true,
        name: true,
      },
    });

    // Get tasks per user
    const userTasks = await Promise.all(
      users.map(async (user) => ({
        user,
        tasks: await prisma.task.findMany({
          where: {
            assigneeId: user.id,
            status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.IN_REVIEW] },
          },
          include: {
            request: {
              select: {
                priority: true,
              },
            },
          },
        }),
        logs: await prisma.auditLog.findMany({
          where: {
            userId: user.id,
            createdAt: {
              gte: tenDaysAgo,
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        }),
      }))
    );

    const burnoutRisks: BurnoutRisk[] = [];

    for (const userData of userTasks) {
      const { user, tasks, logs } = userData;
      const factors: string[] = [];
      let riskScore = 0;

      // Factor 1: High task count
      const activeTaskCount = tasks.length;
      if (activeTaskCount > 5) {
        factors.push(`${activeTaskCount} task đang xử lý`);
        riskScore += 30;
      }

      // Factor 2: Check activity pattern (working late hours)
      if (logs.length > 0) {
        const lateWorkDays = logs.filter((log) => {
          const hour = log.createdAt.getHours();
          return hour >= 20 || hour <= 6; // 8 PM - 6 AM
        }).length;

        if (lateWorkDays >= 3) {
          factors.push(`Làm việc ngoài giờ ${lateWorkDays}/10 ngày`);
          riskScore += 25;
        }

        // Factor 3: Consistent high activity (potential overwork)
        const activityDays = new Set(logs.map((log) => 
          format(log.createdAt, 'yyyy-MM-dd')
        )).size;

        if (activityDays >= 9) {
          factors.push('Làm việc liên tục 9/10 ngày');
          riskScore += 20;
        }
      }

      // Factor 4: High-priority tasks
      const urgentTasks = tasks.filter((task) => 
        task.request?.priority === 'URGENT' || task.request?.priority === 'HIGH'
      ).length;

      if (urgentTasks >= 3) {
        factors.push(`${urgentTasks} task ưu tiên cao`);
        riskScore += 25;
      }

      // Only flag if risk score >= 50
      if (riskScore >= 50 && factors.length > 0) {
        let severity: 'low' | 'medium' | 'high' = 'low';
        if (riskScore >= 80) severity = 'high';
        else if (riskScore >= 60) severity = 'medium';

        let recommendation = 'Theo dõi workload';
        if (severity === 'high') {
          recommendation = 'Giảm workload hoặc redistribute tasks ngay';
        } else if (severity === 'medium') {
          recommendation = 'Xem xét điều chỉnh workload';
        }

        burnoutRisks.push({
          userId: user.id,
          userName: user.name,
          riskScore,
          severity,
          factors,
          recommendation,
        });
      }
    }

    // Sort by risk score (highest first)
    burnoutRisks.sort((a, b) => b.riskScore - a.riskScore);

    return burnoutRisks;
  } catch (error) {
    Logger.captureException(error as Error, { action: "detectBurnoutRisk" });
    return [];
  }
}

/**
 * Predict capacity shortfall for upcoming weeks
 */
export async function predictCapacityShortfall(weeks: number = 4): Promise<CapacityShortfall[]> {
  try {
    const now = new Date();
    const fourWeeksAgo = subWeeks(now, 4);

    // Calculate historical average incoming requests per week
    const historicalRequests = await prisma.request.count({
      where: {
        createdAt: {
          gte: fourWeeksAgo,
          lte: now,
        },
      },
    });
    const avgRequestsPerWeek = historicalRequests / 4;

    // Get team capacities (assume 5 tasks per member per week)
    const teams = await prisma.team.findMany({
      include: {
        members: true,
      },
    });

    const totalCapacityPerWeek = teams.reduce((sum, team) => {
      return sum + (team.members.length * 5); // 5 tasks per person per week
    }, 0);

    // Project for next N weeks
    const shortfalls: CapacityShortfall[] = [];
    const startWeek = startOfWeek(now, { locale: vi });
    const endDate = addDays(now, weeks * 7);
    const weeksList = eachWeekOfInterval(
      { start: startWeek, end: endDate },
      { locale: vi }
    );

    for (let i = 1; i <= weeks && i < weeksList.length; i++) {
      const week = weeksList[i];
      const weekLabel = `W${format(week, 'w', { locale: vi })} ${format(week, 'MMM', { locale: vi })}`;

      // Use historical average as demand forecast
      const demand = Math.round(avgRequestsPerWeek);
      const capacity = totalCapacityPerWeek;
      const shortfall = Math.max(0, demand - capacity);

      let severity: 'low' | 'medium' | 'high' = 'low';
      if (shortfall > capacity * 0.2) severity = 'high';
      else if (shortfall > capacity * 0.1) severity = 'medium';

      shortfalls.push({
        week: weekLabel,
        demand,
        capacity,
        shortfall,
        severity,
      });
    }

    return shortfalls;
  } catch (error) {
    Logger.captureException(error as Error, { action: "predictCapacityShortfall" });
    return [];
  }
}

