import { prisma } from "@/lib/prisma";
import type { DashboardFilters } from "@/types/dashboard";
import { 
  subDays, 
  startOfDay, 
  endOfDay, 
  getDay, 
  getHours, 
  differenceInDays,
} from "date-fns";
import { Logger } from "@/lib/utils/logger";

export interface HeatmapDataPoint {
  day: string;
  hour: number;
  count: number;
}

export interface Bottleneck {
  assigneeId: string;
  assigneeName: string;
  blockedCount: number;
  avgStuckDays: number;
  status: string;
  severity: 'high' | 'medium' | 'low';
}

const DAY_NAMES = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']; // Sunday first (getDay() returns 0 for Sunday)

/**
 * Get workload heatmap data
 */
export async function getWorkloadHeatmapData(
  filters: DashboardFilters
): Promise<HeatmapDataPoint[]> {
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

    // Fetch all requests in the period
    const requests = await prisma.request.findMany({
      where: baseWhere,
      select: {
        id: true,
        createdAt: true,
      },
    });

    // Initialize heatmap matrix (7 days × 24 hours = 168 cells)
    const heatmapMap = new Map<string, number>();
    
    // Initialize all cells to 0
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const key = `${day}-${hour}`;
        heatmapMap.set(key, 0);
      }
    }

    // Count requests per cell
    requests.forEach((request) => {
      const day = getDay(request.createdAt); // 0=Sunday, 1=Monday, ..., 6=Saturday
      const hour = getHours(request.createdAt);
      const key = `${day}-${hour}`;
      const current = heatmapMap.get(key) || 0;
      heatmapMap.set(key, current + 1);
    });

    // Convert to array format
    const heatmapData: HeatmapDataPoint[] = [];
    
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const key = `${day}-${hour}`;
        const count = heatmapMap.get(key) || 0;
        
        heatmapData.push({
          day: DAY_NAMES[day],
          hour,
          count,
        });
      }
    }

    return heatmapData;
  } catch (error) {
    Logger.captureException(error as Error, { action: "getWorkloadHeatmapData" });
    return [];
  }
}

/**
 * Detect bottlenecks in workflow
 */
export async function detectBottlenecks(
  filters: DashboardFilters
): Promise<Bottleneck[]> {
  try {
    const threeDaysAgo = subDays(new Date(), 3);

    const baseWhere: any = {
      status: { in: ['IN_PROGRESS', 'IN_REVIEW', 'BLOCKED'] },
      updatedAt: { lt: threeDaysAgo }, // Stuck for >3 days
    };

    // Filter by team if specified
    if (filters.teamId) {
      baseWhere.request = {
        teamId: filters.teamId,
      };
    }

    // Get tasks stuck in same status >3 days
    const stuckTasks = await prisma.task.findMany({
      where: baseWhere,
      select: {
        id: true,
        assigneeId: true,
        status: true,
        updatedAt: true,
        assignee: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Group by assignee
    const assigneeMap = new Map<string, {
      name: string;
      tasks: Array<{ status: string; daysStuck: number }>;
    }>();

    stuckTasks.forEach((task) => {
      if (!task.assigneeId || !task.assignee) return;

      const daysStuck = differenceInDays(new Date(), task.updatedAt);
      
      const existing = assigneeMap.get(task.assigneeId);
      if (existing) {
        existing.tasks.push({ status: task.status, daysStuck });
      } else {
        assigneeMap.set(task.assigneeId, {
          name: task.assignee.name || 'Unknown',
          tasks: [{ status: task.status, daysStuck }],
        });
      }
    });

    // Calculate bottlenecks
    const bottlenecks: Bottleneck[] = [];

    assigneeMap.forEach((data, assigneeId) => {
      const blockedCount = data.tasks.length;
      const avgStuckDays = data.tasks.reduce((sum, t) => sum + t.daysStuck, 0) / blockedCount;
      
      // Find most common stuck status
      const statusCounts = new Map<string, number>();
      data.tasks.forEach((t) => {
        statusCounts.set(t.status, (statusCounts.get(t.status) || 0) + 1);
      });
      
      let maxStatus = 'IN_PROGRESS';
      let maxCount = 0;
      statusCounts.forEach((count, status) => {
        if (count > maxCount) {
          maxCount = count;
          maxStatus = status;
        }
      });

      // Determine severity
      let severity: 'high' | 'medium' | 'low' = 'low';
      if (blockedCount >= 5) {
        severity = 'high';
      } else if (blockedCount >= 3) {
        severity = 'medium';
      }

      bottlenecks.push({
        assigneeId,
        assigneeName: data.name,
        blockedCount,
        avgStuckDays: parseFloat(avgStuckDays.toFixed(1)),
        status: maxStatus,
        severity,
      });
    });

    // Sort by severity and count
    bottlenecks.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[b.severity] - severityOrder[a.severity];
      }
      return b.blockedCount - a.blockedCount;
    });

    return bottlenecks;
  } catch (error) {
    Logger.captureException(error as Error, { action: "detectBottlenecks" });
    return [];
  }
}

