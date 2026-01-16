import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notificationService } from "@/lib/services/notification-service";
import { verifyCronAuth } from "@/lib/security/cron-auth";

export async function GET(request: Request) {
  // Verify CRON authentication with timing-safe comparison
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  try {

    const now = new Date();
    const in1h = new Date(now.getTime() + 60 * 60 * 1000);
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const tasksDueSoon = await prisma.task.findMany({
      where: {
        status: { notIn: ["DONE", "CANCELLED"] as any },
        deadline: { gte: now, lte: in24h },
        assigneeId: { not: null },
      },
      select: { id: true, title: true, deadline: true, assigneeId: true },
    });

    let sent = 0;
    for (const t of tasksDueSoon) {
      if (!t.deadline || !t.assigneeId) continue;
      const hoursLeft = Math.max(0, Math.floor((t.deadline.getTime() - now.getTime()) / (1000 * 60 * 60)));
      await notificationService.notifyTaskDueSoon(t.id, t.assigneeId, t.title, hoursLeft);
      sent++;
    }

    const overdue = await prisma.task.findMany({
      where: {
        status: { notIn: ["DONE", "CANCELLED"] as any },
        deadline: { lt: now },
        assigneeId: { not: null },
      },
      select: { id: true, title: true, assigneeId: true },
    });

    for (const t of overdue) {
      if (!t.assigneeId) continue;
      await notificationService.notifyTaskOverdue(t.id, t.assigneeId, t.title);
      sent++;
    }

    return NextResponse.json({ success: true, message: `Sent ${sent} notifications` });
  } catch (error) {
    console.error("[Cron check-deadlines]:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
