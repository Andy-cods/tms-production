import { reminderService } from "@/lib/services/reminder-service";
import {
  startEscalationScheduler,
  stopEscalationScheduler as stopEscalations,
} from "./escalation-scheduler";

/**
 * Scheduler Initialization
 * 
 * Initializes the reminder service and escalation scheduler on server startup.
 * Loads all active tasks and schedules reminders for them.
 * 
 * References: mindmap R1-3, IM, L1, L1C
 */

let isInitialized = false;

/**
 * Initialize scheduler on server startup
 * 
 * This should be called once when the server starts.
 * It will reload all active tasks and schedule reminders for them.
 * Also starts the escalation scheduler.
 */
export async function init() {
  if (isInitialized) {
    console.log("⏭️  Scheduler already initialized");
    return;
  }

  try {
    console.log("🚀 Initializing schedulers...");

    // Initialize reminder service
    await reminderService.initialize();

    // Start escalation scheduler (node-cron alternative)
    // Comment out if using Vercel cron instead
    startEscalationScheduler();

    isInitialized = true;
    console.log("✅ Scheduler initialization complete");
  } catch (error) {
    console.error("❌ Failed to initialize scheduler:", error);
    // Don't throw - allow server to start even if scheduler fails
    // Retry can be implemented with a cron job
  }
}

/**
 * Shutdown scheduler gracefully
 */
export function shutdown() {
  if (!isInitialized) {
    return;
  }

  try {
    console.log("🛑 Shutting down schedulers...");

    // Shutdown reminder service
    reminderService.shutdown();

    // Stop escalation scheduler
    stopEscalations();

    isInitialized = false;
    console.log("✅ Scheduler shutdown complete");
  } catch (error) {
    console.error("❌ Error shutting down scheduler:", error);
  }
}

/**
 * Check scheduler status
 */
export function getStatus() {
  const { getEscalationSchedulerStatus } = require("./escalation-scheduler");

  return {
    isInitialized,
    reminderStats: reminderService.getStats(),
    escalationScheduler: getEscalationSchedulerStatus(),
  };
}

// Handle process signals for graceful shutdown
if (typeof process !== "undefined") {
  process.on("SIGTERM", () => {
    console.log("SIGTERM received");
    shutdown();
    process.exit(0);
  });

  process.on("SIGINT", () => {
    console.log("SIGINT received");
    shutdown();
    process.exit(0);
  });
}

