// import cron from "node-cron"; // TODO: Implement via Vercel Cron - see app/api/cron/reminders/route.ts
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { sendTelegramMessage } from "@/lib/services/telegram-service";
import { z } from "zod";

/**
 * Reminder Queue Service
 * 
 * Manages scheduled reminders for tasks based on configurable intervals (R1, R2, R3).
 * Uses node-cron for scheduling and in-memory storage for job tracking.
 * 
 * References: mindmap R1-3, IM (Idle Monitoring)
 */

// =============================================================================
// Types & Interfaces
// =============================================================================

/**
 * Reminder Level
 */
export type ReminderLevel = 1 | 2 | 3;

/**
 * Reminder Job
 */
interface ReminderJob {
  taskId: string;
  level: ReminderLevel;
  scheduledTime: Date;
  // cronJob: cron.ScheduledTask; // TODO: Implement via Vercel Cron
}

/**
 * Upcoming Reminder Info
 */
export interface UpcomingReminder {
  taskId: string;
  taskTitle: string;
  level: ReminderLevel;
  scheduledTime: Date;
  minutesUntil: number;
}

/**
 * Schedule Result
 */
interface ScheduleResult {
  success: boolean;
  scheduledReminders?: number;
  error?: string;
}

// =============================================================================
// Service Class
// =============================================================================

class ReminderService {
  // In-memory storage for scheduled jobs
  private reminderJobs: Map<string, ReminderJob[]> = new Map();
  private isInitialized: boolean = false;

  /**
   * Initialize the reminder service
   * 
   * Called on app startup to reload active tasks and reschedule reminders.
   */
  async initialize() {
    if (this.isInitialized) {
      console.log("ReminderService already initialized");
      return;
    }

    try {
      console.log("🔔 Initializing ReminderService...");

      // Get all active tasks (IN_PROGRESS, not paused)
      const activeTasks = await prisma.task.findMany({
        where: {
          status: "IN_PROGRESS",
          slaPausedAt: null, // Not currently paused
          startedAt: { not: null },
        },
        select: {
          id: true,
          title: true,
          startedAt: true,
        },
      });

      console.log(`Found ${activeTasks.length} active tasks to schedule`);

      // Schedule reminders for all active tasks
      let scheduled = 0;
      for (const task of activeTasks) {
        const result = await this.scheduleReminders(task.id);
        if (result.success) {
          scheduled++;
        }
      }

      this.isInitialized = true;
      console.log(`✅ ReminderService initialized. Scheduled ${scheduled} tasks.`);
    } catch (error) {
      console.error("Failed to initialize ReminderService:", error);
    }
  }

  /**
   * Schedule reminders for a task (R1, R2, R3)
   * 
   * @param taskId - Task ID
   * @returns Schedule result
   */
  async scheduleReminders(taskId: string): Promise<ScheduleResult> {
    try {
      // Validate input
      if (!taskId || typeof taskId !== "string") {
        return {
          success: false,
          error: "Task ID không hợp lệ",
        };
      }

      // Get task
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: {
          id: true,
          title: true,
          status: true,
          startedAt: true,
          completedAt: true,
          slaPausedAt: true,
          assigneeId: true,
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!task) {
        return {
          success: false,
          error: "Task không tồn tại",
        };
      }

      // Validate task is in IN_PROGRESS state
      if (task.status !== "IN_PROGRESS") {
        return {
          success: false,
          error: "Task không ở trạng thái IN_PROGRESS",
        };
      }

      // Validate task has startedAt
      if (!task.startedAt) {
        return {
          success: false,
          error: "Task chưa được start",
        };
      }

      // Don't schedule if task is paused
      if (task.slaPausedAt) {
        return {
          success: false,
          error: "Task đang pause, không schedule reminder",
        };
      }

      // Get reminder config
      const config = await prisma.reminderConfig.findFirst({
        where: { isActive: true },
      });

      if (!config || !config.enableReminders) {
        return {
          success: false,
          error: "Reminders are disabled",
        };
      }

      // Cancel existing reminders for this task
      this.cancelReminders(taskId);

      const now = new Date();
      const startedAt = task.startedAt;

      // Calculate reminder times
      const r1Time = new Date(
        startedAt.getTime() + config.firstReminder * 60 * 1000
      );
      const r2Time = new Date(
        startedAt.getTime() + config.secondReminder * 60 * 1000
      );
      const r3Time = new Date(
        startedAt.getTime() + config.thirdReminder * 60 * 1000
      );

      const jobs: ReminderJob[] = [];

      // Schedule R1 if in future
      if (r1Time > now) {
        const job = this.scheduleCronJob(taskId, 1, r1Time, config.reminderChannels);
        if (job) {
          jobs.push(job);
        }
      }

      // Schedule R2 if in future
      if (r2Time > now) {
        const job = this.scheduleCronJob(taskId, 2, r2Time, config.reminderChannels);
        if (job) {
          jobs.push(job);
        }
      }

      // Schedule R3 if in future
      if (r3Time > now) {
        const job = this.scheduleCronJob(taskId, 3, r3Time, config.reminderChannels);
        if (job) {
          jobs.push(job);
        }
      }

      // Store jobs
      if (jobs.length > 0) {
        this.reminderJobs.set(taskId, jobs);
      }

      return {
        success: true,
        scheduledReminders: jobs.length,
      };
    } catch (error) {
      console.error("scheduleReminders error:", error);
      return {
        success: false,
        error: "Không thể schedule reminders",
      };
    }
  }

  /**
   * Schedule a single cron job for a reminder
   * 
   * @param taskId - Task ID
   * @param level - Reminder level (1, 2, or 3)
   * @param scheduledTime - When to trigger
   * @param channels - Notification channels
   * @returns ReminderJob or null
   */
  private scheduleCronJob(
    taskId: string,
    level: ReminderLevel,
    scheduledTime: Date,
    channels: string[]
  ): ReminderJob | null {
    try {
      // Create cron expression for specific time
      const cronExpression = this.dateToCronExpression(scheduledTime);

      // TODO: Implement via Vercel Cron - see app/api/cron/reminders/route.ts
      // const cronJob = cron.schedule(
      //   cronExpression,
      //   async () => {
      //     // Verify task still needs reminder
      //     const shouldSend = await this.shouldSendReminder(taskId);
      //
      //     if (shouldSend) {
      //       await this.sendReminder(taskId, level, channels);
      //     }
      //
      //     // Clean up this job after execution
      //     this.removeJob(taskId, level);
      //   },
      //   {
      //     scheduled: true,
      //     timezone: "Asia/Ho_Chi_Minh",
      //   }
      // );

      return {
        taskId,
        level,
        scheduledTime,
        // cronJob, // TODO: Implement via Vercel Cron
      };
    } catch (error) {
      console.error("Failed to schedule cron job:", error);
      return null;
    }
  }

  /**
   * Cancel all reminders for a task
   * 
   * Called when task is completed, paused, or reassigned.
   * 
   * @param taskId - Task ID
   */
  cancelReminders(taskId: string) {
    const jobs = this.reminderJobs.get(taskId);

    if (jobs) {
      // Stop all cron jobs
      // TODO: Implement via Vercel Cron - see app/api/cron/reminders/route.ts
      // jobs.forEach((job) => {
      //   try {
      //     job.cronJob.stop();
      //   } catch (error) {
      //     console.error("Error stopping cron job:", error);
      //   }
      // });

      // Remove from map
      this.reminderJobs.delete(taskId);

      console.log(`Cancelled ${jobs.length} reminders for task ${taskId}`);
    }
  }

  /**
   * Send a reminder notification
   * 
   * @param taskId - Task ID
   * @param level - Reminder level (1, 2, or 3)
   * @param channels - Notification channels
   */
  async sendReminder(
    taskId: string,
    level: ReminderLevel,
    channels: string[] = ["TELEGRAM"]
  ) {
    try {
      // Get task with assignee
      const task = await prisma.task.findUnique({
        where: { id: taskId },
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

      if (!task || !task.assignee) {
        console.error("Task or assignee not found for reminder:", taskId);
        return;
      }

      // Get reminder config for timing info
      const config = await prisma.reminderConfig.findFirst({
        where: { isActive: true },
      });

      const timeInfo = this.getReminderTimeInfo(level, config);

      // Create message based on level
      const message = this.getReminderMessage(
        task.title,
        task.request.title,
        level,
        timeInfo
      );

      // Send via configured channels
      if (channels.includes("TELEGRAM")) {
        await this.sendTelegramReminder(task.assignee.id, message);
      }

      if (channels.includes("EMAIL")) {
        await this.sendEmailReminder(task.assignee.email, message, task.title);
      }

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: task.assignee.id,
          action: "REMINDER_SENT",
          entity: "Task",
          entityId: taskId,
          oldValue: Prisma.JsonNull,
          newValue: {
            level,
            message,
            channels,
            timeInfo,
          },
        },
      });

      console.log(
        `✅ Sent R${level} reminder for task ${taskId} to ${task.assignee.name}`
      );
    } catch (error) {
      console.error("sendReminder error:", error);
    }
  }

  /**
   * Get upcoming reminders for a user
   * 
   * @param userId - User ID
   * @returns Array of upcoming reminders
   */
  async getUpcomingReminders(userId: string): Promise<UpcomingReminder[]> {
    try {
      // Get user's tasks
      const userTasks = await prisma.task.findMany({
        where: {
          assigneeId: userId,
          status: "IN_PROGRESS",
          slaPausedAt: null,
        },
        select: {
          id: true,
          title: true,
        },
      });

      const taskIds = userTasks.map((t) => t.id);
      const upcomingReminders: UpcomingReminder[] = [];
      const now = new Date();

      // Get reminders from map
      for (const taskId of taskIds) {
        const jobs = this.reminderJobs.get(taskId);
        if (jobs) {
          jobs.forEach((job) => {
            if (job.scheduledTime > now) {
              const task = userTasks.find((t) => t.id === taskId);
              if (task) {
                const minutesUntil = Math.floor(
                  (job.scheduledTime.getTime() - now.getTime()) / (1000 * 60)
                );

                upcomingReminders.push({
                  taskId: job.taskId,
                  taskTitle: task.title,
                  level: job.level,
                  scheduledTime: job.scheduledTime,
                  minutesUntil,
                });
              }
            }
          });
        }
      }

      // Sort by scheduled time
      return upcomingReminders.sort(
        (a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime()
      );
    } catch (error) {
      console.error("getUpcomingReminders error:", error);
      return [];
    }
  }

  /**
   * Check if a reminder should be sent
   * 
   * Verifies task is still IN_PROGRESS, not paused, not completed.
   * 
   * @param taskId - Task ID
   * @returns True if should send
   */
  private async shouldSendReminder(taskId: string): Promise<boolean> {
    try {
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: {
          status: true,
          completedAt: true,
          slaPausedAt: true,
        },
      });

      if (!task) {
        return false;
      }

      // Don't send if completed
      if (task.completedAt) {
        return false;
      }

      // Don't send if not IN_PROGRESS
      if (task.status !== "IN_PROGRESS") {
        return false;
      }

      // Don't send if paused
      if (task.slaPausedAt) {
        return false;
      }

      return true;
    } catch (error) {
      console.error("shouldSendReminder error:", error);
      return false;
    }
  }

  /**
   * Get reminder message template
   * 
   * @param taskTitle - Task title
   * @param requestTitle - Request title
   * @param level - Reminder level
   * @param timeInfo - Time elapsed info
   * @returns Message string
   */
  private getReminderMessage(
    taskTitle: string,
    requestTitle: string,
    level: ReminderLevel,
    timeInfo: string
  ): string {
    const messages: Record<ReminderLevel, string> = {
      1: `🔔 Nhắc nhở: Task "${taskTitle}" (Request: ${requestTitle}) đang chờ xử lý (${timeInfo})`,
      2: `⚠️ Nhắc nhở lần 2: Task "${taskTitle}" (Request: ${requestTitle}) chưa cập nhật (${timeInfo})`,
      3: `🚨 Cảnh báo: Task "${taskTitle}" (Request: ${requestTitle}) có nguy cơ trễ SLA (${timeInfo})`,
    };

    return messages[level];
  }

  /**
   * Get reminder time info text
   * 
   * @param level - Reminder level
   * @param config - Reminder config
   * @returns Time info string
   */
  private getReminderTimeInfo(
    level: ReminderLevel,
    config: any
  ): string {
    if (!config) {
      const defaults: Record<ReminderLevel, string> = {
        1: "1 giờ",
        2: "2 giờ",
        3: "3 giờ",
      };
      return defaults[level];
    }

    const minutes: Record<ReminderLevel, number> = {
      1: config.firstReminder,
      2: config.secondReminder,
      3: config.thirdReminder,
    };

    const m = minutes[level];
    if (m < 60) {
      return `${m} phút`;
    }

    const hours = Math.floor(m / 60);
    const remainingMinutes = m % 60;

    if (remainingMinutes === 0) {
      return `${hours} giờ`;
    }

    return `${hours} giờ ${remainingMinutes} phút`;
  }

  /**
   * Send Telegram reminder
   * 
   * @param userId - User ID
   * @param message - Message text
   */
  private async sendTelegramReminder(userId: string, message: string) {
    try {
      // TODO: Implement Telegram notifications when telegram service is ready
      // await sendTelegramMessage(userId, message);
    } catch (error) {
      console.error("Failed to send Telegram reminder:", error);
    }
  }

  /**
   * Send Email reminder
   * 
   * @param email - User email
   * @param message - Message text
   * @param taskTitle - Task title for subject
   */
  private async sendEmailReminder(
    email: string,
    message: string,
    taskTitle: string
  ) {
    try {
      // TODO: Implement email sending
      console.log(`Email reminder to ${email}:`, message);
      // You can integrate with services like SendGrid, AWS SES, etc.
    } catch (error) {
      console.error("Failed to send email reminder:", error);
    }
  }

  /**
   * Convert Date to cron expression
   * 
   * @param date - Target date
   * @returns Cron expression
   */
  private dateToCronExpression(date: Date): string {
    const minute = date.getMinutes();
    const hour = date.getHours();
    const dayOfMonth = date.getDate();
    const month = date.getMonth() + 1; // 0-indexed

    // Format: minute hour day month *
    return `${minute} ${hour} ${dayOfMonth} ${month} *`;
  }

  /**
   * Remove a specific job from storage
   * 
   * @param taskId - Task ID
   * @param level - Reminder level
   */
  private removeJob(taskId: string, level: ReminderLevel) {
    const jobs = this.reminderJobs.get(taskId);
    if (jobs) {
      const updatedJobs = jobs.filter((job) => job.level !== level);

      if (updatedJobs.length > 0) {
        this.reminderJobs.set(taskId, updatedJobs);
      } else {
        this.reminderJobs.delete(taskId);
      }
    }
  }

  /**
   * Get reminder statistics
   * 
   * @returns Stats object
   */
  getStats() {
    const totalTasks = this.reminderJobs.size;
    let totalJobs = 0;
    let r1Count = 0;
    let r2Count = 0;
    let r3Count = 0;

    this.reminderJobs.forEach((jobs) => {
      totalJobs += jobs.length;
      jobs.forEach((job) => {
        if (job.level === 1) r1Count++;
        if (job.level === 2) r2Count++;
        if (job.level === 3) r3Count++;
      });
    });

    return {
      totalTasks,
      totalJobs,
      r1Count,
      r2Count,
      r3Count,
      isInitialized: this.isInitialized,
    };
  }

  /**
   * Manually trigger a reminder (for testing)
   * 
   * @param taskId - Task ID
   * @param level - Reminder level
   */
  async triggerReminder(taskId: string, level: ReminderLevel) {
    const shouldSend = await this.shouldSendReminder(taskId);

    if (shouldSend) {
      const config = await prisma.reminderConfig.findFirst({
        where: { isActive: true },
      });

      await this.sendReminder(
        taskId,
        level,
        config?.reminderChannels || ["TELEGRAM"]
      );
    }
  }

  /**
   * Reschedule reminders for a task
   * 
   * Called when task is resumed from pause.
   * 
   * @param taskId - Task ID
   */
  async rescheduleReminders(taskId: string) {
    // Cancel existing
    this.cancelReminders(taskId);

    // Schedule new
    await this.scheduleReminders(taskId);
  }

  /**
   * Shutdown service (cleanup)
   */
  shutdown() {
    console.log("🛑 Shutting down ReminderService...");

    // Stop all jobs
    this.reminderJobs.forEach((jobs, taskId) => {
      this.cancelReminders(taskId);
    });

    this.reminderJobs.clear();
    this.isInitialized = false;

    console.log("✅ ReminderService shutdown complete");
  }
}

// Export singleton instance
export const reminderService = new ReminderService();

// Auto-initialize on import (optional - can also call manually)
// reminderService.initialize().catch(console.error);

// Export types (already exported individually above)

