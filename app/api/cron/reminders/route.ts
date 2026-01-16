import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reminderService } from "@/lib/services/reminder-service";
import { verifyCronAuth } from "@/lib/security/cron-auth";

/**
 * Vercel Cron Endpoint for Reminders
 *
 * Alternative to node-cron for serverless environments.
 * Checks all tasks and sends due reminders.
 *
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/reminders",
 *     "schedule": "* * * * *"
 *   }]
 * }
 *
 * Or use external cron service to hit this endpoint every minute.
 *
 * References: mindmap R1-3, IM
 */

export async function GET(request: NextRequest) {
  // Verify CRON authentication with timing-safe comparison
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  try {
    console.log("🔔 Cron job: Checking for due reminders...");

    const now = new Date();

    // Get reminder config
    const config = await prisma.reminderConfig.findFirst({
      where: { isActive: true },
    });

    if (!config || !config.enableReminders) {
      return NextResponse.json({
        success: true,
        message: "Reminders disabled",
        checked: 0,
        sent: 0,
      });
    }

    // Get all IN_PROGRESS tasks (not paused, not completed)
    const tasks = await prisma.task.findMany({
      where: {
        status: "IN_PROGRESS",
        slaPausedAt: null,
        completedAt: null,
        startedAt: { not: null },
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        request: {
          select: {
            title: true,
          },
        },
      },
    });

    let sentCount = 0;
    const results: Array<{ taskId: string; level: number; sent: boolean }> = [];

    // Check each task for due reminders
    for (const task of tasks) {
      if (!task.startedAt || !task.assignee) {
        continue;
      }

      const startedAt = task.startedAt;
      const elapsedMinutes = Math.floor(
        (now.getTime() - startedAt.getTime()) / (1000 * 60)
      );

      // Check R1
      if (
        elapsedMinutes >= config.firstReminder &&
        elapsedMinutes < config.firstReminder + 5 // 5-minute window
      ) {
        await reminderService.sendReminder(
          task.id,
          1,
          config.reminderChannels
        );
        sentCount++;
        results.push({ taskId: task.id, level: 1, sent: true });
      }

      // Check R2
      else if (
        elapsedMinutes >= config.secondReminder &&
        elapsedMinutes < config.secondReminder + 5
      ) {
        await reminderService.sendReminder(
          task.id,
          2,
          config.reminderChannels
        );
        sentCount++;
        results.push({ taskId: task.id, level: 2, sent: true });
      }

      // Check R3
      else if (
        elapsedMinutes >= config.thirdReminder &&
        elapsedMinutes < config.thirdReminder + 5
      ) {
        await reminderService.sendReminder(
          task.id,
          3,
          config.reminderChannels
        );
        sentCount++;
        results.push({ taskId: task.id, level: 3, sent: true });
      }
    }

    console.log(
      `✅ Cron job complete: Checked ${tasks.length} tasks, sent ${sentCount} reminders`
    );

    return NextResponse.json({
      success: true,
      checked: tasks.length,
      sent: sentCount,
      results,
      timestamp: now.toISOString(),
    });
  } catch (error: any) {
    console.error("❌ Cron job error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Cron job failed",
      },
      { status: 500 }
    );
  }
}

// Also support POST for flexibility
export const POST = GET;

