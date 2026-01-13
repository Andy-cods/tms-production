"use server";

import { auth } from "@/lib/auth";
import { dashboardService } from "@/lib/services/dashboard-service";

export async function getUserDashboard() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Chưa đăng nhập" };
    }

    const userId = session.user.id;
    const result = await dashboardService.getUserDashboard(userId);

    if (!result.success || !result.dashboard) {
      return result;
    }

    // Serialize dates
    return {
      success: true,
      dashboard: {
        ...result.dashboard,
        todaysFocus: (result.dashboard?.todaysFocus || []).map((task: any) => ({
          ...task,
          deadline: task.deadline?.toISOString() || null,
          createdAt: task.createdAt.toISOString(),
        })),
        upcomingDeadlines: (result.dashboard?.upcomingDeadlines || []).map((task: any) => ({
          ...task,
          deadline: task.deadline?.toISOString() || null,
          createdAt: task.createdAt.toISOString(),
        })),
        userStats: {
          ...result.dashboard.userStats,
          lastCompletionDate:
            result.dashboard.userStats?.lastCompletionDate?.toISOString() || null,
          createdAt: result.dashboard.userStats?.createdAt.toISOString(),
          updatedAt: result.dashboard.userStats?.updatedAt.toISOString(),
        },
        recentAchievements: (result.dashboard?.recentAchievements || []).map((ua: any) => ({
          ...ua,
          unlockedAt: ua.unlockedAt.toISOString(),
          achievement: {
            ...ua.achievement,
            createdAt: ua.achievement.createdAt.toISOString(),
          },
        })),
      },
    };
  } catch (error) {
    console.error("[getUserDashboard]:", error);
    return { success: false, error: "Lỗi tải dashboard" };
  }
}
