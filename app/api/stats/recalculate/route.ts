import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { recalculateUserStats } from "@/lib/services/user-stats-init";
import { getUserId } from "@/lib/auth-helpers";
import { dashboardService } from "@/lib/services/dashboard-service";

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = getUserId(session);
    const result = await recalculateUserStats(userId);

    if (!result.success) {
      return NextResponse.json(
        { error: (result as any).error || "Failed to recalculate" },
        { status: 500 }
      );
    }

    await dashboardService.checkAchievements(userId);

    return NextResponse.json({
      success: true,
      message: "Stats đã được tính toán lại",
      stats: result.stats,
    });
  } catch (error) {
    console.error("[recalculate-stats] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
