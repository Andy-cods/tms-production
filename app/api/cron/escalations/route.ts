import { NextRequest, NextResponse } from "next/server";
import { escalationService } from "@/lib/services/escalation-service";

/**
 * Escalation Detection Cron Endpoint
 * 
 * Periodically checks for escalation conditions and creates escalations.
 * Runs every 15 minutes to detect:
 * - NO_CONFIRMATION (L1: 24h)
 * - CLARIFICATION_TIMEOUT (L1C: 8h)
 * - SLA_OVERDUE
 * - STUCK_TASK
 * 
 * Vercel Cron Configuration:
 * Add to vercel.json:
 * ```json
 * {
 *   "crons": [{
 *     "path": "/api/cron/escalations",
 *     "schedule": "every 15 minutes"
 *   }]
 * }
 * ```
 * 
 * Alternative: Use node-cron in lib/init/escalation-scheduler.ts
 * 
 * References: mindmap L1, L1C
 */

// Track escalation counts for alerting
let escalationHistory: Array<{ timestamp: Date; count: number }> = [];

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error("❌ Unauthorized escalation cron attempt");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("🔍 Escalation cron job started...");

    // Run escalation checks
    const summary = await escalationService.checkEscalations();

    const duration = Date.now() - startTime;

    // Track for alerting
    escalationHistory.push({
      timestamp: new Date(),
      count: summary.totalEscalations,
    });

    // Keep only last hour of history
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    escalationHistory = escalationHistory.filter(
      (h) => h.timestamp > oneHourAgo
    );

    // Calculate hourly rate
    const escalationsLastHour = escalationHistory.reduce(
      (sum, h) => sum + h.count,
      0
    );

    // Alert if too many escalations
    if (escalationsLastHour > 10) {
      console.warn(
        `⚠️  High escalation volume: ${escalationsLastHour} in last hour`
      );

      // TODO: Send alert to admin via Telegram or email
      // This could indicate system issues or misconfigured rules
    }

    // Log results
    console.log("✅ Escalation check complete:");
    console.log(`  - Checked: ${summary.totalChecked} rules`);
    console.log(`  - Created: ${summary.totalEscalations} escalations`);
    console.log(`  - Duration: ${duration}ms`);

    if (summary.totalEscalations > 0) {
      console.log("  - By trigger type:", summary.byTriggerType);
      
      // Log each escalation
      summary.escalations.forEach((esc) => {
        console.log(
          `    → ${esc.ruleName}: ${esc.entityType} ${esc.entityId} → ${esc.recipientName}`
        );
      });
    }

    // Track rule effectiveness
    const ruleEffectiveness = summary.escalations.reduce((acc, esc) => {
      acc[esc.ruleName] = (acc[esc.ruleName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Return summary
    return NextResponse.json({
      success: true,
      checked: summary.totalChecked,
      escalated: summary.totalEscalations,
      failed: 0,
      byTriggerType: summary.byTriggerType,
      ruleEffectiveness,
      escalationsLastHour,
      duration,
      timestamp: new Date().toISOString(),
      escalations: summary.escalations.map((esc) => ({
        ruleId: esc.ruleId,
        ruleName: esc.ruleName,
        entityId: esc.entityId,
        entityType: esc.entityType,
        recipientId: esc.recipientId,
        reason: esc.reason,
      })),
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    console.error("❌ Escalation cron job error:", error);

    // Log to Sentry (if configured)
    if (typeof window === "undefined" && (global as any).Sentry) {
      (global as any).Sentry.captureException(error, {
        tags: {
          job: "escalation-cron",
        },
        extra: {
          duration,
        },
      });
    }

    const errorMessage = error instanceof Error ? error.message : "Escalation check failed";
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        duration,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Support POST for flexibility
export const POST = GET;

/**
 * Health check endpoint
 * 
 * GET /api/cron/escalations?health=true
 */
export async function HEAD(request: NextRequest) {
  const url = new URL(request.url);
  
  if (url.searchParams.get("health") === "true") {
    // Get recent escalation stats
    const stats = await escalationService.getEscalationStats();

    return NextResponse.json({
      status: "healthy",
      escalationStats: stats,
      lastRuns: escalationHistory.length,
    });
  }

  return NextResponse.json({ status: "ok" });
}

