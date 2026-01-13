import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PersonalDashboardClient } from "./_components/PersonalDashboardClient";
import { dashboardService } from "@/lib/services/dashboard-service";
import { getUserId } from "@/lib/auth-helpers";

export const metadata = {
  title: "Dashboard cá nhân | TMS",
};

export default async function PersonalDashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const result = await dashboardService.getUserDashboard(getUserId(session));

  if (!result.success || !('dashboard' in result) || !result.dashboard) {
    return (
      <div className="p-6">
        <p className="text-red-600">Lỗi tải dashboard</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <PersonalDashboardClient
        userId={getUserId(session)}
        dashboard={{
          ...result.dashboard,
          todaysFocus: (result.dashboard.todaysFocus || []).map((t: any) => ({
            ...t,
            deadline: t.deadline?.toISOString() || null,
            createdAt: t.createdAt.toISOString(),
          })),
          upcomingDeadlines: (result.dashboard.upcomingDeadlines || []).map((t: any) => ({
            ...t,
            deadline: t.deadline?.toISOString() || null,
            createdAt: t.createdAt.toISOString(),
          })),
          userStats: {
            ...result.dashboard.userStats,
            lastCompletionDate:
              result.dashboard.userStats?.lastCompletionDate?.toISOString() || null,
            createdAt: result.dashboard.userStats?.createdAt.toISOString(),
            updatedAt: result.dashboard.userStats?.updatedAt.toISOString(),
          },
          recentAchievements: (result.dashboard.recentAchievements || []).map((ua: any) => ({
            ...ua,
            unlockedAt: ua.unlockedAt.toISOString(),
            achievement: {
              ...ua.achievement,
              createdAt: ua.achievement.createdAt.toISOString(),
            },
          })),
        }}
      />
    </div>
  );
}
