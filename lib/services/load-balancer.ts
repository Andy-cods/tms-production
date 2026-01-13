/**
 * Load Balancer Service
 * 
 * Intelligent task assignment service with:
 * - Workload calculation and tracking
 * - WIP (Work In Progress) limit enforcement
 * - Weighted scoring for optimal assignment
 * - Task rebalancing recommendations
 * - Performance metrics and analytics
 * 
 * References: mindmap LB, WL, WIP, CONF_W, CONF_WIP
 */

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { User, Task } from "@prisma/client";
import { Role, TaskStatus } from "@prisma/client";

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * User workload data
 */
export interface WorkloadData {
  userId: string;
  activeCount: number;      // IN_PROGRESS tasks
  pendingCount: number;     // TODO tasks
  utilization: number;      // activeCount / wipLimit (0-1)
  wipLimit: number;         // Personal WIP limit
  avgLeadTime: number | null; // Average completion time (hours)
  isAtLimit: boolean;       // utilization >= 1.0
  isOverloaded: boolean;    // utilization > 0.9
}

/**
 * WIP limit check result
 */
export interface WIPLimitCheck {
  exceeded: boolean;
  current: number;
  limit: number;
  available: number;
  utilizationPercent: number;
}

/**
 * Task rebalancing suggestion
 */
export interface RebalanceSuggestion {
  taskId: string;
  taskTitle: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  reason: string;
  priorityScore: number;
}

/**
 * Rebalance result
 */
export interface RebalanceResult {
  success: boolean;
  suggestions: RebalanceSuggestion[];
  overloadedUsers: number;
  underloadedUsers: number;
  error?: string;
}

/**
 * User scoring for assignment
 */
interface UserScore {
  userId: string;
  userName: string;
  workloadScore: number;    // 0-1 (higher = less busy)
  skillScore: number;       // 0-1 (higher = better match)
  positionScore?: number;   // 0-1 (higher = better match)
  slaScore: number;         // 0-1 (higher = better compliance)
  randomScore: number;      // 0-1 (random factor)
  totalScore: number;       // Weighted sum
  utilization: number;      // Current utilization
}

// =============================================================================
// Validation Schemas
// =============================================================================

const calculateWorkloadSchema = z.object({
  userId: z.string().min(1, "User ID không hợp lệ"),
});

const findBestAssigneeSchema = z.object({
  requestId: z.string().min(1, "Request ID không hợp lệ"),
  teamId: z.string().min(1, "Team ID không hợp lệ"),
  categoryId: z.string().optional(),
});

const checkWIPLimitSchema = z.object({
  userId: z.string().min(1, "User ID không hợp lệ"),
});

const rebalanceTasksSchema = z.object({
  teamId: z.string().min(1, "Team ID không hợp lệ"),
});

// =============================================================================
// LoadBalancerService Class
// =============================================================================

export class LoadBalancerService {
  private workloadCache: Map<string, { data: WorkloadData; timestamp: number }> = new Map();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Calculate user workload with caching
   * 
   * @param userId - User ID to calculate
   * @returns Workload data with utilization metrics
   * 
   * Features:
   * - Count IN_PROGRESS and TODO tasks
   * - Calculate utilization rate
   * - Calculate average lead time from completed tasks
   * - Update WorkloadSnapshot
   * - 5-minute cache
   */
  async calculateWorkload(userId: string): Promise<WorkloadData> {
    try {
      // Validate input
      const validated = calculateWorkloadSchema.parse({ userId });

      // Check cache first
      const cached = this.workloadCache.get(validated.userId);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
        console.log("✅ Using cached workload for user:", validated.userId);
        return cached.data;
      }

      // Get user with tasks
      const user = await prisma.user.findUnique({
        where: { id: validated.userId },
        include: {
          tasksAssigned: {
            where: {
              status: { in: ["IN_PROGRESS", "TODO"] },
            },
            select: {
              status: true,
              startedAt: true,
              completedAt: true,
            },
          },
        },
      });

      if (!user) {
        throw new Error("User không tồn tại");
      }

      // Count active and pending tasks
      const activeCount = user.tasksAssigned.filter(
        (t) => t.status === "IN_PROGRESS"
      ).length;

      const pendingCount = user.tasksAssigned.filter(
        (t) => t.status === "TODO"
      ).length;

      // Calculate utilization
      const utilization = activeCount / user.wipLimit;

      // Calculate average lead time from completed tasks (last 30 days)
      const completedTasks = await prisma.task.findMany({
        where: {
          assigneeId: validated.userId,
          status: "DONE",
          completedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
          startedAt: { not: null },
        },
        select: {
          startedAt: true,
          completedAt: true,
        },
      });

      let avgLeadTime: number | null = null;
      if (completedTasks.length > 0) {
        const leadTimes = completedTasks
          .filter((t) => t.startedAt && t.completedAt)
          .map((t) => {
            const started = new Date(t.startedAt!).getTime();
            const completed = new Date(t.completedAt!).getTime();
            return (completed - started) / (1000 * 60 * 60); // Convert to hours
          });

        if (leadTimes.length > 0) {
          avgLeadTime = leadTimes.reduce((sum, time) => sum + time, 0) / leadTimes.length;
        }
      }

      // Create workload snapshot
      await prisma.workloadSnapshot.create({
        data: {
          userId: validated.userId,
          activeTaskCount: activeCount,
          pendingCount,
          avgLeadTime,
          utilizationRate: utilization,
        },
      });

      // Build workload data
      const workloadData: WorkloadData = {
        userId: validated.userId,
        activeCount,
        pendingCount,
        utilization,
        wipLimit: user.wipLimit,
        avgLeadTime,
        isAtLimit: utilization >= 1.0,
        isOverloaded: utilization > 0.9,
      };

      // Cache the result
      this.workloadCache.set(validated.userId, {
        data: workloadData,
        timestamp: Date.now(),
      });

      console.log("✅ Workload calculated for user:", {
        userId: validated.userId,
        utilization: `${(utilization * 100).toFixed(1)}%`,
        active: activeCount,
        limit: user.wipLimit,
      });

      return workloadData;
    } catch (error: any) {
      console.error("calculateWorkload error:", error);

      if (error instanceof z.ZodError) {
        throw new Error(error.issues[0]?.message || "Dữ liệu không hợp lệ");
      }

      throw error;
    }
  }

  /**
   * Find best assignee using weighted scoring
   * 
   * @param requestId - Request ID for context
   * @param teamId - Team to search within
   * @param categoryId - Optional category for skill matching
   * @returns Best assignee user ID
   * 
   * Algorithm (mindmap LB + CONF_W):
   * 1. Get eligible users (team members, ASSIGNEE/LEADER role)
   * 2. Filter: utilization < 100% (not at WIP limit)
   * 3. Calculate weighted score per user:
   *    - score = (1 - utilization) * w1 + skillMatch * w2 + slaCompliance * w3 + random * w4
   * 4. Sort by score DESC
   * 5. Return top user ID
   */
  async findBestAssignee(
    requestId: string,
    teamId: string,
    categoryId?: string
  ): Promise<string> {
    try {
      // Validate input
      const validated = findBestAssigneeSchema.parse({ requestId, teamId, categoryId });

      // Get assignment config
      const config = await prisma.assignmentConfig.findUnique({
        where: { name: "default" },
      });

      if (!config) {
        throw new Error("Assignment config not found");
      }

      if (!config.enableAutoAssign || !config.isActive) {
        throw new Error("Auto-assignment is disabled");
      }

      // Get eligible team members
      const eligibleUsers = await prisma.user.findMany({
        where: {
          teamId: validated.teamId,
          isActive: true,
          isAbsent: false, // B5: Filter out absent users
          role: { in: [Role.STAFF, Role.LEADER] },
        },
        include: {
          delegate: {
            select: {
              id: true,
              name: true,
            },
          },
          tasksAssigned: {
            where: {
              status: { in: [TaskStatus.IN_PROGRESS, TaskStatus.TODO, TaskStatus.DONE] },
            },
            select: {
              id: true,
              status: true,
              slaDeadline: true,
              completedAt: true,
            },
          },
        },
      });

      if (eligibleUsers.length === 0) {
        throw new Error("No eligible assignees found in team");
      }

      // Calculate scores for each user
      const userScores: UserScore[] = [];

      for (const user of eligibleUsers) {
        // Calculate workload
        const activeCount = user.tasksAssigned.filter(
          (t) => t.status === TaskStatus.IN_PROGRESS
        ).length;
        const utilization = activeCount / user.wipLimit;

        // Skip if at WIP limit
        if (utilization >= 1.0) {
          console.log(`⚠️ User ${user.name} at WIP limit, skipping`);
          continue;
        }

        // Calculate workload score (inverse of utilization)
        const workloadScore = 1 - utilization;

        // Calculate skill score
        let skillScore = 0.5; // Default: neutral
        // TODO: Implement category-based skill matching when Task-Category relation is available
        // if (validated.categoryId) {
        //   // Check if user has experience with this category
        //   const categoryTasks = user.tasksAssigned.filter(
        //     (t) => t.category?.id === validated.categoryId
        //   );
        //   if (categoryTasks.length > 0) {
        //     skillScore = 1.0; // Has experience
        //   }
        // }

        // Calculate position score (schema-safe neutral)
        const positionScore = 0.5;

        // Calculate SLA compliance score
        const completedTasks = user.tasksAssigned.filter(
          (t) => t.status === "DONE" && t.completedAt && t.slaDeadline
        );
        let slaScore = 1.0; // Default: perfect compliance
        if (completedTasks.length > 0) {
          const onTimeTasks = completedTasks.filter(
            (t) => new Date(t.completedAt!) <= new Date(t.slaDeadline!)
          );
          slaScore = onTimeTasks.length / completedTasks.length;
        }

        // Random factor (prevent bias)
        const randomScore = Math.random();

        // Calculate weighted total score (CONF_W)
        const totalScore =
          workloadScore * config.weightWorkload +
          skillScore * config.weightSkill +
          (positionScore * ((config as any).weightPosition ?? 0)) +
          slaScore * config.weightSLA +
          randomScore * config.weightRandom;

        userScores.push({
          userId: user.id,
          userName: user.name,
          workloadScore,
          skillScore,
          positionScore,
          slaScore,
          randomScore,
          totalScore,
          utilization,
        });
      }

      if (userScores.length === 0) {
        throw new Error("All team members are at WIP limit");
      }

      // Sort by total score (highest first)
      userScores.sort((a, b) => b.totalScore - a.totalScore);

      const bestUser = userScores[0];

      console.log("✅ Best assignee found:", {
        userId: bestUser.userId,
        userName: bestUser.userName,
        totalScore: bestUser.totalScore.toFixed(3),
        utilization: `${(bestUser.utilization * 100).toFixed(1)}%`,
        breakdown: {
          workload: bestUser.workloadScore.toFixed(3),
          skill: bestUser.skillScore.toFixed(3),
          sla: bestUser.slaScore.toFixed(3),
          random: bestUser.randomScore.toFixed(3),
        },
      });

      return bestUser.userId;
    } catch (error: any) {
      console.error("findBestAssignee error:", error);

      if (error instanceof z.ZodError) {
        throw new Error(error.issues[0]?.message || "Dữ liệu không hợp lệ");
      }

      throw error;
    }
  }

  /**
   * Check if user has exceeded WIP limit
   * 
   * @param userId - User ID to check
   * @returns WIP status with current count and limit
   */
  async checkWIPLimit(userId: string): Promise<WIPLimitCheck> {
    try {
      // Validate input
      const validated = checkWIPLimitSchema.parse({ userId });

      // Get user workload
      const workload = await this.calculateWorkload(validated.userId);

      const available = workload.wipLimit - workload.activeCount;

      return {
        exceeded: workload.isAtLimit,
        current: workload.activeCount,
        limit: workload.wipLimit,
        available: Math.max(0, available),
        utilizationPercent: workload.utilization * 100,
      };
    } catch (error: any) {
      console.error("checkWIPLimit error:", error);

      if (error instanceof z.ZodError) {
        throw new Error(error.issues[0]?.message || "Dữ liệu không hợp lệ");
      }

      throw error;
    }
  }

  /**
   * Rebalance tasks across team members
   * 
   * @param teamId - Team ID to rebalance
   * @returns Rebalancing suggestions
   * 
   * Algorithm:
   * 1. Find overloaded users (utilization > 90%)
   * 2. Find underloaded users (utilization < 50%)
   * 3. Suggest moving TODO tasks from overloaded to underloaded
   * 4. Prioritize by task priority and deadline
   */
  async rebalanceTasks(teamId: string): Promise<RebalanceResult> {
    try {
      // Validate input
      const validated = rebalanceTasksSchema.parse({ teamId });

      // Get team members with tasks
      const team = await prisma.team.findUnique({
        where: { id: validated.teamId },
        include: {
          members: {
            where: { isActive: true },
            include: {
              tasksAssigned: {
                where: {
                  status: { in: ["IN_PROGRESS", "TODO"] },
                },
                include: {
                  request: {
                    select: {
                      title: true,
                      priority: true,
                      deadline: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!team) {
        return {
          success: false,
          suggestions: [],
          overloadedUsers: 0,
          underloadedUsers: 0,
          error: "Team không tồn tại",
        };
      }

      // Calculate workload for each member
      const memberWorkloads = await Promise.all(
        team.members.map(async (member) => {
          const workload = await this.calculateWorkload(member.id);
          return {
            user: member,
            workload,
          };
        })
      );

      // Find overloaded and underloaded users
      const overloaded = memberWorkloads.filter((m) => m.workload.isOverloaded);
      const underloaded = memberWorkloads.filter(
        (m) => m.workload.utilization < 0.5 && !m.workload.isAtLimit
      );

      if (overloaded.length === 0) {
        return {
          success: true,
          suggestions: [],
          overloadedUsers: 0,
          underloadedUsers: underloaded.length,
        };
      }

      if (underloaded.length === 0) {
        return {
          success: true,
          suggestions: [],
          overloadedUsers: overloaded.length,
          underloadedUsers: 0,
        };
      }

      // Generate suggestions
      const suggestions: RebalanceSuggestion[] = [];

      for (const overloadedMember of overloaded) {
        // Get TODO tasks from overloaded user (easier to reassign than IN_PROGRESS)
        const todoTasks = overloadedMember.user.tasksAssigned.filter(
          (t) => t.status === "TODO"
        );

        // Sort by priority and deadline
        const sortedTasks = todoTasks.sort((a, b) => {
          // Priority order: URGENT > HIGH > MEDIUM > LOW
          const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
          const aPriority = (a.request as any)?.priority || "MEDIUM";
          const bPriority = (b.request as any)?.priority || "MEDIUM";

          const priorityDiff =
            priorityOrder[bPriority as keyof typeof priorityOrder] -
            priorityOrder[aPriority as keyof typeof priorityOrder];

          if (priorityDiff !== 0) return priorityDiff;

          // Then by deadline
          const aDeadline = (a.request as any)?.deadline || new Date(9999, 0);
          const bDeadline = (b.request as any)?.deadline || new Date(9999, 0);
          return new Date(aDeadline).getTime() - new Date(bDeadline).getTime();
        });

        // Suggest moving tasks to least loaded user
        const leastLoaded = underloaded.sort(
          (a, b) => a.workload.utilization - b.workload.utilization
        )[0];

        if (leastLoaded && sortedTasks.length > 0) {
          // Suggest moving 1-2 tasks
          const tasksToMove = sortedTasks.slice(0, 2);

          for (const task of tasksToMove) {
            suggestions.push({
              taskId: task.id,
              taskTitle: (task.request as any)?.title || "Unknown",
              fromUserId: overloadedMember.user.id,
              fromUserName: overloadedMember.user.name,
              toUserId: leastLoaded.user.id,
              toUserName: leastLoaded.user.name,
              reason: `Cân bằng tải: ${overloadedMember.user.name} (${(overloadedMember.workload.utilization * 100).toFixed(1)}%) → ${leastLoaded.user.name} (${(leastLoaded.workload.utilization * 100).toFixed(1)}%)`,
              priorityScore:
                overloadedMember.workload.utilization - leastLoaded.workload.utilization,
            });
          }
        }
      }

      // Sort suggestions by priority score (highest first)
      suggestions.sort((a, b) => b.priorityScore - a.priorityScore);

      console.log("✅ Rebalance analysis complete:", {
        overloaded: overloaded.length,
        underloaded: underloaded.length,
        suggestions: suggestions.length,
      });

      return {
        success: true,
        suggestions,
        overloadedUsers: overloaded.length,
        underloadedUsers: underloaded.length,
      };
    } catch (error: any) {
      console.error("rebalanceTasks error:", error);

      if (error instanceof z.ZodError) {
        return {
          success: false,
          suggestions: [],
          overloadedUsers: 0,
          underloadedUsers: 0,
          error: error.issues[0]?.message || "Dữ liệu không hợp lệ",
        };
      }

      return {
        success: false,
        suggestions: [],
        overloadedUsers: 0,
        underloadedUsers: 0,
        error: error.message || "Không thể phân tích cân bằng tải",
      };
    }
  }

  /**
   * Clear workload cache for a user
   * @param userId - User ID to clear cache for
   */
  clearCache(userId?: string) {
    if (userId) {
      this.workloadCache.delete(userId);
    } else {
      this.workloadCache.clear();
    }
  }

  /**
   * Get cached workload data (if available)
   * @param userId - User ID
   * @returns Cached data or null
   */
  getCachedWorkload(userId: string): WorkloadData | null {
    const cached = this.workloadCache.get(userId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.data;
    }
    return null;
  }
}

// Export singleton instance
export const loadBalancerService = new LoadBalancerService();

