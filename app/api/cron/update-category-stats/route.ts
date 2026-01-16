import { NextRequest, NextResponse } from "next/server";
import { deadlineCalculator } from "@/lib/services/timeline-and-deadline-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const results = await deadlineCalculator.updateAllCategoryStats();

    const summary = {
      total: results.length,
      updated: results.filter((r) => r.stats).length,
      failed: results.filter((r) => !r.stats).length,
    };

    return NextResponse.json({
      success: true,
      message: "Category stats updated",
      summary,
      results: results.map((r) => ({
        categoryId: r.categoryId,
        categoryName: r.categoryName,
        avgHours: r.stats?.avgHours ? Math.round(r.stats.avgHours * 10) / 10 : null,
        medianHours: r.stats?.medianHours ? Math.round(r.stats.medianHours * 10) / 10 : null,
      })),
    });
  } catch (error) {
    console.error("[Cron] Error updating category stats:", error);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
