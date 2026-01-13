import { prisma } from "@/lib/prisma";
import { startOfDay } from "date-fns";

/**
 * Initialize UserStats for a user if not exists
 */
export async function initializeUserStats(userId: string) {
  try {
    // Check if already exists
    const existing = await prisma.userStats.findUnique({
      where: { userId },
    });

    if (existing) {
      return { success: true, stats: existing };
    }

    // Create new stats
    const stats = await prisma.userStats.create({
      data: {
        userId,
        currentStreak: 0,
        longestStreak: 0,
        totalTasksCompleted: 0,
        onTimeCompletions: 0,
        lateCompletions: 0,
        avgCompletionDays: 0,
        slaCompliantCount: 0,
        slaViolationCount: 0,
        totalTimeTrackedSeconds: 0,
        level: 1,
        experiencePoints: 0,
      },
    });

    console.log(`✅ Initialized UserStats for user ${userId}`);

    return { success: true, stats };
  } catch (error) {
    console.error("[initializeUserStats] Error:", error);
    return { success: false, error: "Lỗi khởi tạo stats" };
  }
}

/**
 * Recalculate stats from existing tasks (one-time sync)
 */
export async function recalculateUserStats(userId: string) {
  try {
    // Get all completed tasks
    const completedTasks = await prisma.task.findMany({
      where: {
        assigneeId: userId,
        status: "DONE",
        completedAt: { not: null },
      },
      orderBy: {
        completedAt: "asc",
      },
    });

    if (completedTasks.length === 0) {
      // Create empty stats
      const result = await initializeUserStats(userId);
      return result;
    }

    let totalCompleted = completedTasks.length;
    let onTimeCount = 0;
    let lateCount = 0;
    let totalDays = 0;

    let currentStreak = 0;
    let longestStreak = 0;
    let lastCompletionDate: Date | null = null;

    // Calculate metrics from all completed tasks
    completedTasks.forEach((task) => {
      if (!task.completedAt) return;

      // On-time check
      const isOnTime = task.deadline
        ? task.completedAt <= task.deadline
        : true;

      if (isOnTime) {
        onTimeCount++;
      } else {
        lateCount++;
      }

      // Completion days
      const days = Math.ceil(
        (task.completedAt.getTime() - task.createdAt.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      totalDays += days;

      // Streak calculation
      if (isOnTime) {
        const completionDate = startOfDay(new Date(task.completedAt));
        const prevDate = lastCompletionDate ? startOfDay(new Date(lastCompletionDate)) : null;

        if (!prevDate) {
          currentStreak = 1;
          longestStreak = 1;
        } else {
          const daysDiff = Math.floor(
            (completionDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysDiff === 0) {
            // Same day
          } else if (daysDiff === 1) {
            // Consecutive day
            currentStreak++;
            longestStreak = Math.max(longestStreak, currentStreak);
          } else {
            // Streak broken
            longestStreak = Math.max(longestStreak, currentStreak);
            currentStreak = 1;
          }
        }

        lastCompletionDate = completionDate;
      } else {
        // Late completion resets streak
        longestStreak = Math.max(longestStreak, currentStreak);
        currentStreak = 0;
      }
    });

    const avgDays = totalCompleted > 0 ? totalDays / totalCompleted : 0;
    const experiencePoints = onTimeCount * 10 + lateCount * 5;
    const level = Math.floor(experiencePoints / 100) + 1;

    // Update stats
    const stats = await prisma.userStats.upsert({
      where: { userId },
      create: {
        userId,
        currentStreak,
        longestStreak,
        lastCompletionDate: lastCompletionDate || null,
        totalTasksCompleted: totalCompleted,
        onTimeCompletions: onTimeCount,
        lateCompletions: lateCount,
        avgCompletionDays: avgDays,
        slaCompliantCount: onTimeCount,
        slaViolationCount: lateCount,
        totalTimeTrackedSeconds: 0,
        level,
        experiencePoints,
      },
      update: {
        currentStreak,
        longestStreak,
        lastCompletionDate: lastCompletionDate || null,
        totalTasksCompleted: totalCompleted,
        onTimeCompletions: onTimeCount,
        lateCompletions: lateCount,
        avgCompletionDays: avgDays,
        slaCompliantCount: onTimeCount,
        slaViolationCount: lateCount,
        level,
        experiencePoints,
      },
    });

    console.log(`✅ Recalculated stats for user ${userId}:`);
    console.log(`  - Total tasks: ${totalCompleted}`);
    console.log(`  - On-time: ${onTimeCount}`);
    console.log(`  - Current streak: ${currentStreak}`);
    console.log(`  - Longest streak: ${longestStreak}`);
    console.log(`  - Level: ${level} (${experiencePoints} XP)`);

    return { success: true, stats: { totalCompleted, onTimeCount, currentStreak } };
  } catch (error) {
    console.error("[recalculateUserStats] Error:", error);
    return { success: false, error: "Lỗi tính toán stats" };
  }
}
