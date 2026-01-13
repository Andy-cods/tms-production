import { prisma } from "@/lib/prisma";
import { TaskStatus } from "@prisma/client";
import { startOfWeek } from "date-fns";

export interface AchievementMetrics {
  totalCompleted: number;
  currentStreak: number;
  slaRate: number;
  slaSampleSize: number;
  bestDailyCompletion: number;
  trackedTaskCount: number;
  hasPerfectWeek: boolean;
  bestWeekOnTimeRate: number;
}

export async function computeAchievementMetrics(userId: string): Promise<AchievementMetrics> {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

  const [userStats, completedTasks, trackedTasks] = await Promise.all([
    prisma.userStats.findUnique({ where: { userId } }),
    prisma.task.findMany({
      where: {
        assigneeId: userId,
        status: TaskStatus.DONE,
        completedAt: { not: null, gte: sixMonthsAgo },
      },
      select: {
        id: true,
        completedAt: true,
        deadline: true,
      },
    }),
    prisma.timeLog.findMany({
      where: {
        userId,
      },
      select: {
        taskId: true,
      },
      distinct: ["taskId"],
    }),
  ]);

  const onTimeCountFromStats = userStats?.slaCompliantCount ?? null;
  const violationCountFromStats = userStats?.slaViolationCount ?? null;

  const onTimeFallback = completedTasks.filter(
    (task) => task.completedAt && (!task.deadline || task.completedAt <= task.deadline)
  ).length;
  const totalCompletedFallback = completedTasks.length;

  const onTimeCount = onTimeCountFromStats ?? onTimeFallback;
  const violationCount = violationCountFromStats ?? Math.max(totalCompletedFallback - onTimeFallback, 0);

  const totalCompleted = userStats?.totalTasksCompleted ?? totalCompletedFallback;
  const currentStreak = userStats?.currentStreak ?? 0;
  const slaTotal = onTimeCount + violationCount;
  const slaRate = slaTotal > 0 ? Math.round((onTimeCount / slaTotal) * 100) : 0;

  const completionByDay = new Map<string, number>();
  const completionByWeek = new Map<string, { total: number; onTime: number }>();

  let bestDailyCompletion = 0;

  completedTasks.forEach((task) => {
    if (!task.completedAt) return;
    const dayKey = task.completedAt.toISOString().split("T")[0];
    const dayCount = (completionByDay.get(dayKey) ?? 0) + 1;
    completionByDay.set(dayKey, dayCount);
    if (dayCount > bestDailyCompletion) {
      bestDailyCompletion = dayCount;
    }

    const weekStart = startOfWeek(task.completedAt, { weekStartsOn: 1 });
    const weekKey = weekStart.toISOString().split("T")[0];
    const weekInfo = completionByWeek.get(weekKey) ?? { total: 0, onTime: 0 };
    weekInfo.total += 1;
    if (!task.deadline || task.completedAt <= task.deadline) {
      weekInfo.onTime += 1;
    }
    completionByWeek.set(weekKey, weekInfo);
  });

  let hasPerfectWeek = false;
  let bestWeekOnTimeRate = 0;

  completionByWeek.forEach((info) => {
    if (info.total === 0) return;
    const rate = Math.round((info.onTime / info.total) * 100);
    if (rate > bestWeekOnTimeRate) {
      bestWeekOnTimeRate = rate;
    }
    if (info.total > 0 && info.onTime === info.total) {
      hasPerfectWeek = true;
    }
  });

  const trackedTaskCount = new Set(trackedTasks.map((log) => log.taskId)).size;

  return {
    totalCompleted,
    currentStreak,
    slaRate,
    slaSampleSize: slaTotal,
    bestDailyCompletion,
    trackedTaskCount,
    hasPerfectWeek,
    bestWeekOnTimeRate,
  };
}
