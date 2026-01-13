import { escalationService } from "@/lib/services/escalation-service";

/**
 * Escalation Scheduler
 * 
 * Alternative to Vercel cron for traditional server deployments.
 * Runs escalation checks every 15 minutes using setInterval.
 * 
 * References: mindmap L1, L1C
 */

let intervalId: NodeJS.Timeout | null = null;
let isRunning = false;

// Track run history for monitoring
const runHistory: Array<{
  timestamp: Date;
  checked: number;
  escalated: number;
  duration: number;
}> = [];

/**
 * Start escalation scheduler
 * 
 * Runs escalation checks every 15 minutes.
 */
export function startEscalationScheduler() {
  if (intervalId) {
    console.log("⏭️  Escalation scheduler already running");
    return;
  }

  console.log("🚀 Starting escalation scheduler (every 15 minutes)...");

  // Run immediately on start
  runEscalationCheck().catch((error) => {
    console.error("Initial escalation check failed:", error);
  });

  // Schedule to run every 15 minutes
  intervalId = setInterval(() => {
    runEscalationCheck().catch((error) => {
      console.error("Scheduled escalation check failed:", error);
    });
  }, 15 * 60 * 1000); // 15 minutes

  console.log("✅ Escalation scheduler started");
}

/**
 * Stop escalation scheduler
 */
export function stopEscalationScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("🛑 Escalation scheduler stopped");
  }
}

/**
 * Run escalation check
 * 
 * Internal method called by interval.
 */
async function runEscalationCheck() {
  if (isRunning) {
    console.log("⏭️  Escalation check already in progress, skipping...");
    return;
  }

  isRunning = true;
  const startTime = Date.now();

  try {
    console.log("🔍 Running escalation check...");

    const summary = await escalationService.checkEscalations();

    const duration = Date.now() - startTime;

    // Track history
    runHistory.push({
      timestamp: new Date(),
      checked: summary.totalChecked,
      escalated: summary.totalEscalations,
      duration,
    });

    // Keep only last 100 runs
    if (runHistory.length > 100) {
      runHistory.shift();
    }

    // Calculate hourly escalation rate
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentRuns = runHistory.filter((r) => r.timestamp > oneHourAgo);
    const escalationsLastHour = recentRuns.reduce(
      (sum, r) => sum + r.escalated,
      0
    );

    // Alert if high volume
    if (escalationsLastHour > 10) {
      console.warn(
        `⚠️  High escalation volume: ${escalationsLastHour} escalations in last hour`
      );
      console.warn("   This may indicate:");
      console.warn("   - System overload");
      console.warn("   - Misconfigured rules");
      console.warn("   - Urgent issues requiring attention");
    }

    // Log results
    console.log("✅ Escalation check complete:");
    console.log(`  - Rules checked: ${summary.totalChecked}`);
    console.log(`  - Escalations created: ${summary.totalEscalations}`);
    console.log(`  - Duration: ${duration}ms`);
    console.log(`  - Last hour total: ${escalationsLastHour}`);

    if (summary.totalEscalations > 0) {
      console.log("  - By trigger type:");
      Object.entries(summary.byTriggerType).forEach(([type, count]) => {
        console.log(`    * ${type}: ${count}`);
      });

      // Log each escalation
      summary.escalations.forEach((esc, index) => {
        console.log(
          `  ${index + 1}. ${esc.ruleName}: ${esc.entityType} "${esc.reason}" → ${esc.recipientName}`
        );
      });
    }
  } catch (error: any) {
    console.error("❌ Escalation check error:", error);

    // Log to Sentry if available
    if (typeof global !== "undefined" && (global as any).Sentry) {
      (global as any).Sentry.captureException(error, {
        tags: {
          job: "escalation-scheduler",
        },
      });
    }
  } finally {
    isRunning = false;
  }
}

/**
 * Get scheduler status
 * 
 * @returns Status information
 */
export function getEscalationSchedulerStatus() {
  const recentRuns = runHistory.slice(-10); // Last 10 runs
  const avgDuration =
    recentRuns.length > 0
      ? Math.round(
          recentRuns.reduce((sum, r) => sum + r.duration, 0) / recentRuns.length
        )
      : 0;

  const totalEscalations = recentRuns.reduce(
    (sum, r) => sum + r.escalated,
    0
  );

  return {
    isRunning: !!intervalId,
    lastRun: runHistory[runHistory.length - 1]?.timestamp || null,
    totalRuns: runHistory.length,
    recentRuns: recentRuns.map((r) => ({
      timestamp: r.timestamp.toISOString(),
      checked: r.checked,
      escalated: r.escalated,
      duration: r.duration,
    })),
    avgDuration,
    totalEscalations,
  };
}

/**
 * Manually trigger escalation check
 * 
 * For testing or manual runs.
 */
export async function triggerEscalationCheck() {
  console.log("🔧 Manual escalation check triggered");
  await runEscalationCheck();
}

// Graceful shutdown
if (typeof process !== "undefined") {
  process.on("SIGTERM", () => {
    console.log("SIGTERM received - stopping escalation scheduler");
    stopEscalationScheduler();
  });

  process.on("SIGINT", () => {
    console.log("SIGINT received - stopping escalation scheduler");
    stopEscalationScheduler();
  });
}

