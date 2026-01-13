import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AchievementsClient } from "./_components/AchievementsClient";
import { computeAchievementMetrics } from "@/lib/services/achievements-service";

export const metadata = {
  title: "Thành tích | TMS",
};

export default async function AchievementsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Get all achievements (system-wide)
  const allAchievements = await prisma.achievement.findMany({
    orderBy: [{ category: "asc" }, { requirement: "asc" }],
  });

  const userId = (session.user as any).id;

  // Get user's unlocked achievements
  const userAchievements = await prisma.userAchievement.findMany({
    where: { userId },
    include: { achievement: true },
  });

  const metrics = await computeAchievementMetrics(userId);

  // Calculate progress for each achievement
  const achievementsWithProgress = allAchievements.map((achievement) => {
    const unlocked = userAchievements.find(
      (ua) => ua.achievementId === achievement.id
    );

    let progress = 0;
    let currentValue = 0;

    if (unlocked) {
      progress = 100;
      currentValue = achievement.requirement;
    } else {
      switch (true) {
        case achievement.code === "FIRST_TASK":
        case achievement.code.startsWith("TASKS_"):
          currentValue = metrics.totalCompleted;
          progress = Math.min(
            (currentValue / achievement.requirement) * 100,
            100
          );
          break;
        case achievement.code.startsWith("STREAK_"):
          currentValue = metrics.currentStreak;
          progress = Math.min(
            (currentValue / achievement.requirement) * 100,
            100
          );
          break;
        case achievement.code === "SLA_95":
          currentValue = metrics.slaRate;
          progress = Math.min(
            (currentValue / achievement.requirement) * 100,
            100
          );
          break;
        case achievement.code === "PERFECT_WEEK":
          currentValue = metrics.hasPerfectWeek ? 1 : 0;
          progress = metrics.hasPerfectWeek
            ? 100
            : Math.min(metrics.bestWeekOnTimeRate, 99);
          break;
        case achievement.code === "SPEED_5":
          currentValue = metrics.bestDailyCompletion;
          progress = Math.min(
            (currentValue / achievement.requirement) * 100,
            100
          );
          break;
        case achievement.code === "TIME_TRACKER":
          currentValue = metrics.trackedTaskCount;
          progress = Math.min(
            (currentValue / achievement.requirement) * 100,
            100
          );
          break;
        default:
          break;
      }
    }

    return {
      ...achievement,
      unlocked: !!unlocked,
      unlockedAt: unlocked?.unlockedAt?.toISOString() || null,
      progress,
      currentValue,
      createdAt: achievement.createdAt.toISOString(),
    } as any;
  });

  // Group by category
  const groupedAchievements = {
    MILESTONE: achievementsWithProgress.filter((a: any) => a.category === "MILESTONE"),
    STREAK: achievementsWithProgress.filter((a: any) => a.category === "STREAK"),
    QUALITY: achievementsWithProgress.filter((a: any) => a.category === "QUALITY"),
    PERFECT_WEEK: achievementsWithProgress.filter((a: any) => a.category === "PERFECT_WEEK"),
  };

  // Calculate overall stats
  const totalAchievements = allAchievements.length;
  const unlockedCount = userAchievements.length;
  const completionRate = totalAchievements > 0
    ? Math.round((unlockedCount / totalAchievements) * 100)
    : 0;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Thành tích</h1>
        <p className="text-gray-600 mt-1">Mở khóa thành tích bằng cách hoàn thành nhiệm vụ</p>
      </div>

      <AchievementsClient
        groupedAchievements={groupedAchievements as any}
        stats={{ total: totalAchievements, unlocked: unlockedCount, completionRate }}
      />
    </div>
  );
}


