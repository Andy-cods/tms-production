import { prisma } from "@/lib/prisma";
import { startOfWeek, endOfWeek, startOfDay, endOfDay, subDays } from "date-fns";
import { initializeUserStats, recalculateUserStats } from "./user-stats-init";
import { computeAchievementMetrics } from "./achievements-service";

export const dashboardService = {
  /**
   * Get user's personal dashboard data
   */
  async getUserDashboard(userId: string) {
    try {
      const now = new Date();
      const todayStart = startOfDay(now);
      const todayEnd = endOfDay(now);
      const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

      // Today's focus - Top 3 priority tasks
      // Get tasks with today's deadline OR urgent tasks
      const todaysTasks = await prisma.task.findMany({
        where: {
          assigneeId: userId,
          status: { in: ["TODO", "IN_PROGRESS", "REWORK", "BLOCKED", "IN_REVIEW"] },
          OR: [
            { deadline: { gte: todayStart, lte: todayEnd } },
            { request: { priority: "URGENT" } },
            {
              deadline: {
                gte: todayStart,
                lte: new Date(todayEnd.getTime() + 24 * 60 * 60 * 1000),
              },
            },
          ],
        },
        include: {
          request: {
            select: {
              id: true,
              title: true,
              priority: true,
            },
          },
        },
        orderBy: [
          { deadline: "asc" },
        ],
        take: 5,
      });

      // Sort in-memory by priority (URGENT > HIGH > MEDIUM > LOW) then deadline
      const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      const sortedTasks = todaysTasks.sort((a, b) => {
        const aPriority = priorityOrder[a.request?.priority as keyof typeof priorityOrder] || 0;
        const bPriority = priorityOrder[b.request?.priority as keyof typeof priorityOrder] || 0;
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        const aDeadline = a.deadline ? new Date(a.deadline).getTime() : Infinity;
        const bDeadline = b.deadline ? new Date(b.deadline).getTime() : Infinity;
        return aDeadline - bDeadline;
      });

      const todaysFocus = sortedTasks.slice(0, 3);

      // This week's progress
      const weekTasks = await prisma.task.findMany({
        where: {
          assigneeId: userId,
          OR: [
            { completedAt: { gte: weekStart, lte: weekEnd } },
            { deadline: { gte: weekStart, lte: weekEnd } },
            { createdAt: { gte: weekStart, lte: weekEnd } },
          ],
        },
        select: {
          status: true,
          completedAt: true,
        },
      });

      let weekStats = {
        total: weekTasks.length,
        done: weekTasks.filter((t) => t.status === "DONE").length,
        inProgress: weekTasks.filter((t) => t.status === "IN_PROGRESS" || t.status === "IN_REVIEW").length,
        todo: weekTasks.filter((t) => t.status === "TODO" || t.status === "REWORK" || t.status === "BLOCKED").length,
      };

      if (weekStats.total === 0) {
        const fallbackCounts = await prisma.task.groupBy({
          by: ["status"],
          where: { assigneeId: userId },
          _count: { status: true },
        });
        const countMap = Object.fromEntries(
          fallbackCounts.map((item) => [item.status, item._count.status])
        );
        const fallbackTotal = fallbackCounts.reduce((acc, cur) => acc + cur._count.status, 0);
        weekStats = {
          total: fallbackTotal,
          done: (countMap as Record<string, number>)["DONE"] || 0,
          inProgress:
            ((countMap as Record<string, number>)["IN_PROGRESS"] || 0) +
            ((countMap as Record<string, number>)["IN_REVIEW"] || 0),
          todo:
            ((countMap as Record<string, number>)["TODO"] || 0) +
            ((countMap as Record<string, number>)["REWORK"] || 0) +
            ((countMap as Record<string, number>)["BLOCKED"] || 0),
        };
      }

      // Last week comparison
      const lastWeekStart = subDays(weekStart, 7);
      const lastWeekEnd = subDays(weekEnd, 7);
      const lastWeekDone = await prisma.task.count({
        where: {
          assigneeId: userId,
          status: "DONE",
          completedAt: { gte: lastWeekStart, lte: lastWeekEnd },
        },
      });

      const weekComparison =
        lastWeekDone > 0
          ? Math.round(((weekStats.done - lastWeekDone) / lastWeekDone) * 100)
          : 0;

      // User stats - Initialize if not exists
      let userStats = await prisma.userStats.findUnique({
        where: { userId },
      });

      if (!userStats) {
        const result = await initializeUserStats(userId);
        userStats = result.stats || null;
      }

      if (!userStats) {
        throw new Error("Không thể tạo UserStats");
      }

      // Always ensure stats reflect latest task data
      const recalculated = await recalculateUserStats(userId);
      if (recalculated.success) {
        userStats = await prisma.userStats.findUnique({ where: { userId } });
      }

      await this.checkAchievements(userId);

      // Upcoming deadlines (next 7 days)
      const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const upcomingTasks = await prisma.task.findMany({
        where: {
          assigneeId: userId,
          status: { not: "DONE" },
          deadline: {
            gte: now,
            lte: sevenDaysLater,
          },
        },
        include: {
          request: {
            select: {
              id: true,
              title: true,
              priority: true,
            },
          },
        },
        orderBy: {
          deadline: "asc",
        },
        take: 10,
      });

      // Today's completed tasks
      const todayCompleted = await prisma.task.count({
        where: {
          assigneeId: userId,
          status: "DONE",
          completedAt: { gte: todayStart, lte: todayEnd },
        },
      });

      // Active tasks
      const activeTasks = await prisma.task.count({
        where: {
          assigneeId: userId,
          status: { in: ["TODO", "IN_PROGRESS", "IN_REVIEW", "REWORK", "BLOCKED"] },
        },
      });

      const totalAssignedTasks = await prisma.task.count({
        where: { assigneeId: userId },
      });

      const overdueTasks = await prisma.task.count({
        where: {
          assigneeId: userId,
          status: { not: "DONE" },
          deadline: { lt: now },
        },
      });

      // Time tracked today
      const todayTimeLogs = await prisma.timeLog.aggregate({
        where: {
          userId,
          startTime: { gte: todayStart, lte: todayEnd },
          duration: { not: null },
        },
        _sum: {
          duration: true,
        },
      });

      const todayTimeSeconds = todayTimeLogs._sum.duration || 0;

      // Recent achievements
      const recentAchievements = await prisma.userAchievement.findMany({
        where: { userId },
        include: {
          achievement: true,
        },
        orderBy: {
          unlockedAt: "desc",
        },
        take: 5,
      });

      // Calendar heatmap data (last 60 days)
      const sixtyDaysAgo = subDays(now, 60);
      const heatmapData = await prisma.task.groupBy({
        by: ["completedAt"],
        where: {
          assigneeId: userId,
          status: "DONE",
          completedAt: {
            gte: sixtyDaysAgo,
            lte: now,
          },
        },
        _count: true,
      });

      // Format heatmap
      const heatmap: Record<string, number> = {};
      heatmapData.forEach((item) => {
        if (item.completedAt) {
          const date = item.completedAt.toISOString().split("T")[0];
          heatmap[date] = item._count;
        }
      });

      return {
        success: true,
        dashboard: {
          todaysFocus,
          weekProgress: weekStats,
          weekComparison,
          userStats,
          upcomingDeadlines: upcomingTasks,
          quickStats: {
            totalTasks: totalAssignedTasks,
            activeTasks,
            completedToday: todayCompleted,
            timeTrackedToday: todayTimeSeconds,
            overdueTasks,
          },
          recentAchievements,
          heatmap,
        },
      };
    } catch (error) {
      console.error("[dashboardService] Error:", error);
      return { success: false, error: "Lỗi tải dashboard" };
    }
  },

  /**
   * Update user stats after task completion
   */
  async updateUserStats(userId: string, taskId: string) {
    try {
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: {
          completedAt: true,
          deadline: true,
          createdAt: true,
          status: true,
        },
      });

      if (!task || task.status !== "DONE" || !task.completedAt) {
        return { success: false, error: "Task chưa hoàn thành" };
      }

      // Initialize stats if not exists
      let userStats = await prisma.userStats.findUnique({
        where: { userId },
      });

      if (!userStats) {
        const result = await initializeUserStats(userId);
        userStats = result.stats || null;
      }

      if (!userStats) {
        return { success: false, error: "Không thể tạo UserStats" };
      }

      // Check if on-time
      const onTime = task.deadline
        ? task.completedAt <= task.deadline
        : true;

      // Calculate completion days
      const completionDays = Math.ceil(
        (task.completedAt.getTime() - task.createdAt.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      // Update stats
      const newTotalCompleted = userStats.totalTasksCompleted + 1;
      const newOnTime = onTime
        ? userStats.onTimeCompletions + 1
        : userStats.onTimeCompletions;
      const newLate = !onTime
        ? userStats.lateCompletions + 1
        : userStats.lateCompletions;

      // Update average
      const newAvg =
        (userStats.avgCompletionDays * userStats.totalTasksCompleted +
          completionDays) /
        newTotalCompleted;

      // Check streak
      let newStreak = userStats.currentStreak;
      const today = startOfDay(new Date());
      const lastCompletion = userStats.lastCompletionDate
        ? startOfDay(userStats.lastCompletionDate)
        : null;

      if (onTime) {
        if (!lastCompletion) {
          newStreak = 1;
        } else {
          const daysDiff = Math.floor(
            (today.getTime() - lastCompletion.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysDiff === 0) {
            // Same day, keep streak
          } else if (daysDiff === 1) {
            // Consecutive day
            newStreak += 1;
          } else {
            // Streak broken
            newStreak = 1;
          }
        }
      } else {
        // Late completion breaks streak
        newStreak = 0;
      }

      const newLongestStreak = Math.max(userStats.longestStreak, newStreak);

      // Calculate XP and level
      const xpGained = onTime ? 10 : 5;
      const newXP = userStats.experiencePoints + xpGained;
      const newLevel = Math.floor(newXP / 100) + 1;

      // Update pet stats if user has a pet
      let petUpdateData: any = {};
      if (userStats.petType) {
        // Pet gains experience when task is completed
        const petXPGained = onTime ? 15 : 10; // More XP for on-time completion
        const newPetXP = (userStats.petExperience || 0) + petXPGained;
        const newPetLevel = Math.floor(newPetXP / 100) + 1;
        
        // Pet happiness increases when task is completed (max 100)
        const currentHappiness = userStats.petHappiness || 100;
        const happinessGain = onTime ? 5 : 3; // More happiness for on-time
        const newPetHappiness = Math.min(100, currentHappiness + happinessGain);
        
        petUpdateData = {
          petExperience: newPetXP,
          petLevel: newPetLevel,
          petHappiness: newPetHappiness,
        };
      }

      // Update database
      await prisma.userStats.update({
        where: { userId },
        data: {
          totalTasksCompleted: newTotalCompleted,
          onTimeCompletions: newOnTime,
          lateCompletions: newLate,
          avgCompletionDays: newAvg,
          currentStreak: newStreak,
          longestStreak: newLongestStreak,
          lastCompletionDate: task.completedAt,
          experiencePoints: newXP,
          level: newLevel,
          slaCompliantCount: newOnTime,
          slaViolationCount: newLate,
          ...petUpdateData,
        },
      });

      console.log(`✅ Updated stats for user ${userId}:`);
      console.log(`  - Task completed: ${onTime ? "On-time ⚡" : "Late ⏰"}`);
      console.log(`  - Streak: ${newStreak} days 🔥`);
      console.log(`  - XP: +${xpGained} (Total: ${newXP})`);
      console.log(`  - Level: ${newLevel}`);
      if (userStats.petType && petUpdateData.petLevel) {
        console.log(`  - Pet XP: +${onTime ? 15 : 10} (Level: ${petUpdateData.petLevel}) 🐾`);
        console.log(`  - Pet Happiness: ${petUpdateData.petHappiness}%`);
      }

      // Check for new achievements
      await this.checkAchievements(userId);

      return {
        success: true,
        xpGained,
        newLevel: newLevel > userStats.level ? newLevel : null,
        newStreak: newStreak > userStats.currentStreak,
      };
    } catch (error) {
      console.error("[updateUserStats] Error:", error);
      return { success: false, error: "Lỗi cập nhật stats" };
    }
  },

  /**
   * Check and unlock achievements
   */
  async checkAchievements(userId: string) {
    try {
      const [achievements, userAchievementRows, metrics] = await Promise.all([
        prisma.achievement.findMany(),
        prisma.userAchievement.findMany({
          where: { userId },
          select: { achievementId: true },
        }),
        computeAchievementMetrics(userId),
      ]);

      const unlockedIds = new Set(userAchievementRows.map((row) => row.achievementId));

      for (const achievement of achievements) {
        if (unlockedIds.has(achievement.id)) continue;

        let shouldUnlock = false;

        switch (true) {
          case achievement.code === "FIRST_TASK":
            shouldUnlock = metrics.totalCompleted >= achievement.requirement;
            break;
          case achievement.code.startsWith("TASKS_"):
            shouldUnlock = metrics.totalCompleted >= achievement.requirement;
            break;
          case achievement.code.startsWith("STREAK_"):
            shouldUnlock = metrics.currentStreak >= achievement.requirement;
            break;
          case achievement.code === "SLA_95":
            shouldUnlock =
              metrics.slaSampleSize > 0 && metrics.slaRate >= achievement.requirement;
            break;
          case achievement.code === "PERFECT_WEEK":
            shouldUnlock = metrics.hasPerfectWeek;
            break;
          case achievement.code === "SPEED_5":
            shouldUnlock = metrics.bestDailyCompletion >= achievement.requirement;
            break;
          case achievement.code === "TIME_TRACKER":
            shouldUnlock = metrics.trackedTaskCount >= achievement.requirement;
            break;
          default:
            break;
        }

        if (!shouldUnlock) {
          continue;
        }

        await prisma.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id,
          },
        });

        unlockedIds.add(achievement.id);

        console.log(
          `🏆 Achievement unlocked: ${achievement.name} for user ${userId}`
        );

        // TODO: Send notification to the user when achievements unlock
      }
    } catch (error) {
      console.error("[checkAchievements] Error:", error);
    }
  },

  /**
   * Seed default achievements
   */
  async seedAchievements() {
    const achievements = [
      // Milestones
      {
        code: "TASKS_10",
        name: "Khởi đầu",
        description: "Hoàn thành 10 tasks",
        icon: "🎯",
        category: "MILESTONE",
        requirement: 10,
      },
      {
        code: "TASKS_50",
        name: "Chuyên nghiệp",
        description: "Hoàn thành 50 tasks",
        icon: "💼",
        category: "MILESTONE",
        requirement: 50,
      },
      {
        code: "TASKS_100",
        name: "Bậc thầy",
        description: "Hoàn thành 100 tasks",
        icon: "🏆",
        category: "MILESTONE",
        requirement: 100,
      },
      {
        code: "TASKS_500",
        name: "Huyền thoại",
        description: "Hoàn thành 500 tasks",
        icon: "👑",
        category: "MILESTONE",
        requirement: 500,
      },

      // Streaks
      {
        code: "STREAK_7",
        name: "Tuần hoàn hảo",
        description: "7 ngày liên tiếp hoàn thành đúng hạn",
        icon: "🔥",
        category: "STREAK",
        requirement: 7,
      },
      {
        code: "STREAK_30",
        name: "Tháng vàng",
        description: "30 ngày liên tiếp hoàn thành đúng hạn",
        icon: "⭐",
        category: "STREAK",
        requirement: 30,
      },
      {
        code: "STREAK_100",
        name: "Bất khả chiến bại",
        description: "100 ngày liên tiếp hoàn thành đúng hạn",
        icon: "💎",
        category: "STREAK",
        requirement: 100,
      },

      // Quality
      {
        code: "SLA_95",
        name: "Đúng giờ",
        description: "SLA compliance ≥95%",
        icon: "⏰",
        category: "QUALITY",
        requirement: 95,
      },
      {
        code: "PERFECT_WEEK",
        name: "Tuần hoàn mỹ",
        description: "Hoàn thành 100% tasks trong tuần",
        icon: "✨",
        category: "PERFECT_WEEK",
        requirement: 100,
      },
    ];

    let createdCount = 0;
    let updatedCount = 0;

    for (const achievement of achievements) {
      const existing = await prisma.achievement.findUnique({
        where: { code: achievement.code },
      });

      await prisma.achievement.upsert({
        where: { code: achievement.code },
        create: achievement as any,
        update: achievement as any,
      });

      if (existing) {
        updatedCount++;
        console.log(`  🔄 Updated: ${achievement.icon} ${achievement.name}`);
      } else {
        createdCount++;
        console.log(`  ✅ Created: ${achievement.icon} ${achievement.name}`);
      }
    }

    console.log(`\n📊 Summary: ${createdCount} created, ${updatedCount} updated`);
  },
};
