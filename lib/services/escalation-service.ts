// NOTE: Telegram notifications are disabled until lib/telegram.ts is implemented
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
// import { sendTelegramMessage } from "@/lib/services/telegram-service";
import { slaPauseService } from "./sla-pause-service";
import { z } from "zod";

/**
 * Escalation Detection Service
 * 
 * Detects and manages escalations based on configurable rules.
 * Supports multiple trigger types: NO_CONFIRMATION, CLARIFICATION_TIMEOUT,
 * SLA_OVERDUE, STUCK_TASK.
 * 
 * References: mindmap L1, L1C
 */

// =============================================================================
// Types & Enums
// =============================================================================

/**
 * Trigger Type Enum
 */
export type TriggerType =
  | "NO_CONFIRMATION"
  | "CLARIFICATION_TIMEOUT"
  | "SLA_OVERDUE"
  | "STUCK_TASK";

/**
 * Escalation Target Enum
 */
export type EscalationTarget = "TEAM_LEADER" | "ADMIN" | "CUSTOM";

/**
 * Escalation Status Enum
 */
export type EscalationStatus = "PENDING" | "ACKNOWLEDGED" | "RESOLVED";

/**
 * Escalation Result
 */
export interface EscalationResult {
  entityId: string;
  entityType: "REQUEST" | "TASK";
  ruleId: string;
  ruleName: string;
  recipientId: string;
  recipientName: string;
  reason: string;
  escalationId?: string;
}

/**
 * Escalation Check Summary
 */
export interface EscalationCheckSummary {
  totalChecked: number;
  totalEscalations: number;
  byTriggerType: Record<TriggerType, number>;
  escalations: EscalationResult[];
}

// =============================================================================
// Zod Schemas
// =============================================================================

const escalateSchema = z.object({
  entityId: z.string().min(1),
  entityType: z.enum(["REQUEST", "TASK"]),
  ruleId: z.string().min(1),
});

const acknowledgeEscalationSchema = z.object({
  escalationId: z.string().min(1),
  userId: z.string().min(1),
});

const resolveEscalationSchema = z.object({
  escalationId: z.string().min(1),
  userId: z.string().min(1),
  notes: z.string().optional(),
});

const getActiveEscalationsSchema = z.string().min(1, "User ID không được để trống");

// =============================================================================
// Service Class
// =============================================================================

class EscalationService {
  /**
   * Check all escalation rules and create escalations
   * 
   * @returns Escalation check summary
   */
  async checkEscalations(): Promise<EscalationCheckSummary> {
    try {
      console.log("🔍 Checking escalations...");

      // Get all active rules
      const rules = await prisma.escalationRule.findMany({
        where: { isActive: true },
        include: {
          customRecipient: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (rules.length === 0) {
        console.log("No active escalation rules found");
        return {
          totalChecked: 0,
          totalEscalations: 0,
          byTriggerType: {} as any,
          escalations: [],
        };
      }

      const results: EscalationResult[] = [];
      const byTriggerType: Record<string, number> = {};

      // Check each rule
      for (const rule of rules) {
        const ruleResults = await this.checkRule(rule);
        results.push(...ruleResults);

        // Count by trigger type
        if (ruleResults.length > 0) {
          byTriggerType[rule.triggerType] =
            (byTriggerType[rule.triggerType] || 0) + ruleResults.length;
        }
      }

      console.log(
        `✅ Escalation check complete: ${results.length} escalations triggered`
      );

      return {
        totalChecked: rules.length,
        totalEscalations: results.length,
        byTriggerType: byTriggerType as any,
        escalations: results,
      };
    } catch (error) {
      console.error("checkEscalations error:", error);
      return {
        totalChecked: 0,
        totalEscalations: 0,
        byTriggerType: {} as any,
        escalations: [],
      };
    }
  }

  /**
   * Check a specific escalation rule
   * 
   * @param rule - Escalation rule
   * @returns Array of escalation results
   */
  private async checkRule(rule: any): Promise<EscalationResult[]> {
    switch (rule.triggerType as TriggerType) {
      case "NO_CONFIRMATION":
        return this.checkNoConfirmation(rule);
      case "CLARIFICATION_TIMEOUT":
        return this.checkClarificationTimeout(rule);
      case "SLA_OVERDUE":
        return this.checkSLAOverdue(rule);
      case "STUCK_TASK":
        return this.checkStuckTask(rule);
      default:
        console.warn(`Unknown trigger type: ${rule.triggerType}`);
        return [];
    }
  }

  /**
   * Check NO_CONFIRMATION trigger (L1)
   * 
   * Finds tasks that have passed confirmation deadline without confirmation.
   * 
   * @param rule - Escalation rule
   * @returns Escalation results
   */
  private async checkNoConfirmation(rule: any): Promise<EscalationResult[]> {
    const thresholdDate = new Date(
      Date.now() - rule.thresholdHours * 60 * 60 * 1000
    );

    // Find tasks assigned but not confirmed
    const tasks = await prisma.task.findMany({
      where: {
        status: "TODO",
        confirmationDeadline: {
          lt: new Date(), // Deadline has passed
        },
        confirmedAt: null, // Not confirmed
        createdAt: {
          lt: thresholdDate, // Older than threshold
        },
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            teamId: true,
            team: {
              select: {
                leaderId: true,
              },
            },
          },
        },
        request: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    const results: EscalationResult[] = [];

    for (const task of tasks) {
      // Check if escalation already exists for this task
      const existingEscalation = await prisma.escalationLog.findFirst({
        where: {
          taskId: task.id,
          ruleId: rule.id,
          status: { in: ["PENDING", "ACKNOWLEDGED"] },
        },
      });

      if (existingEscalation) {
        continue; // Skip if already escalated
      }

      // Determine recipient
      const recipient = await this.determineRecipient(rule, task.assignee);

      if (!recipient) {
        console.warn(`No recipient found for escalation rule ${rule.name}`);
        continue;
      }

      // Create escalation
      const escalationResult = await this.escalate(
        task.id,
        "TASK",
        rule.id,
        `Task "${task.request?.title || task.title}" chưa được xác nhận sau ${
          rule.thresholdHours
        } giờ`,
        recipient.id
      );

      if (escalationResult.success) {
        results.push({
          entityId: task.id,
          entityType: "TASK",
          ruleId: rule.id,
          ruleName: rule.name,
          recipientId: recipient.id,
          recipientName: recipient.name,
          reason: escalationResult.reason!,
          escalationId: escalationResult.escalationId,
        });
      }
    }

    return results;
  }

  /**
   * Check CLARIFICATION_TIMEOUT trigger (L1C)
   * 
   * Finds clarification requests that haven't been answered.
   * 
   * @param rule - Escalation rule
   * @returns Escalation results
   */
  private async checkClarificationTimeout(rule: any): Promise<EscalationResult[]> {
    const thresholdDate = new Date(
      Date.now() - rule.thresholdHours * 60 * 60 * 1000
    );

    // Find requests with unanswered clarifications
    // Note: Assumes you have a Clarification model or comments with clarification flag
    const requests = await prisma.request.findMany({
      where: {
        status: { in: ["OPEN", "IN_PROGRESS", "IN_REVIEW"] },
        // This assumes you have clarification tracking
        // Adjust based on your actual clarification schema
      },
      include: {
        team: {
          select: {
            leaderId: true,
            members: {
              where: { role: "LEADER" },
              select: {
                id: true,
                name: true,
              },
              take: 1,
            },
          },
        },
      },
      take: 100, // Limit for performance
    });

    const results: EscalationResult[] = [];

    // Note: This is a placeholder - adjust based on your clarification implementation
    // For now, we'll skip this check if no clarification tracking exists

    return results;
  }

  /**
   * Check SLA_OVERDUE trigger
   * 
   * Finds tasks that have exceeded their SLA deadline (accounting for pauses).
   * 
   * @param rule - Escalation rule
   * @returns Escalation results
   */
  private async checkSLAOverdue(rule: any): Promise<EscalationResult[]> {
    const now = new Date();

    // Find tasks with SLA deadline
    const tasks = await prisma.task.findMany({
      where: {
        status: { in: ["TODO", "IN_PROGRESS"] },
        slaDeadline: { not: null },
        slaPausedAt: null, // Not currently paused
        completedAt: null,
      },
      select: {
        id: true,
        title: true,
        slaDeadline: true,
        slaTotalPaused: true,
        slaPausedAt: true,
        assignee: {
          select: {
            id: true,
            name: true,
            teamId: true,
            team: {
              select: {
                leaderId: true,
                members: {
                  where: { role: "LEADER" },
                  select: { id: true, name: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    const results: EscalationResult[] = [];

    for (const task of tasks) {
      // Calculate effective SLA
      const effectiveSLA = await slaPauseService.calculateEffectiveSLA({
        id: task.id,
        slaDeadline: task.slaDeadline,
        slaTotalPaused: task.slaTotalPaused,
        slaPausedAt: task.slaPausedAt,
      });

      // Check if overdue
      if (
        effectiveSLA.adjustedDeadline &&
        effectiveSLA.adjustedDeadline < now
      ) {
        // Check if already escalated
        const existingEscalation = await prisma.escalationLog.findFirst({
          where: {
            taskId: task.id,
            ruleId: rule.id,
            status: { in: ["PENDING", "ACKNOWLEDGED"] },
          },
        });

        if (existingEscalation) {
          continue;
        }

        // Determine recipient
        const recipient = await this.determineRecipient(rule, task.assignee);

        if (!recipient) {
          continue;
        }

        // Calculate how overdue
        const overdueMinutes = Math.floor(
          (now.getTime() - effectiveSLA.adjustedDeadline.getTime()) /
            (1000 * 60)
        );

        // Create escalation
        const escalationResult = await this.escalate(
          task.id,
          "TASK",
          rule.id,
          `Task "${task.title}" đã quá hạn SLA ${this.formatDuration(
            overdueMinutes
          )}`,
          recipient.id
        );

        if (escalationResult.success) {
          results.push({
            entityId: task.id,
            entityType: "TASK",
            ruleId: rule.id,
            ruleName: rule.name,
            recipientId: recipient.id,
            recipientName: recipient.name,
            reason: escalationResult.reason!,
            escalationId: escalationResult.escalationId,
          });
        }
      }
    }

    return results;
  }

  /**
   * Check STUCK_TASK trigger
   * 
   * Finds tasks that haven't been updated for threshold hours.
   * 
   * @param rule - Escalation rule
   * @returns Escalation results
   */
  private async checkStuckTask(rule: any): Promise<EscalationResult[]> {
    const thresholdDate = new Date(
      Date.now() - rule.thresholdHours * 60 * 60 * 1000
    );

    // Find stuck tasks
    const tasks = await prisma.task.findMany({
      where: {
        status: "IN_PROGRESS",
        updatedAt: {
          lt: thresholdDate,
        },
        completedAt: null,
        slaPausedAt: null, // Not paused
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            teamId: true,
            team: {
              select: {
                leaderId: true,
                members: {
                  where: { role: "LEADER" },
                  select: { id: true, name: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    const results: EscalationResult[] = [];

    for (const task of tasks) {
      // Check if already escalated
      const existingEscalation = await prisma.escalationLog.findFirst({
        where: {
          taskId: task.id,
          ruleId: rule.id,
          status: { in: ["PENDING", "ACKNOWLEDGED"] },
        },
      });

      if (existingEscalation) {
        continue;
      }

      // Determine recipient
      const recipient = await this.determineRecipient(rule, task.assignee);

      if (!recipient) {
        continue;
      }

      // Calculate how long stuck
      const stuckHours = Math.floor(
        (Date.now() - task.updatedAt.getTime()) / (1000 * 60 * 60)
      );

      // Create escalation
      const escalationResult = await this.escalate(
        task.id,
        "TASK",
        rule.id,
        `Task "${task.title}" không có cập nhật trong ${stuckHours} giờ`,
        recipient.id
      );

      if (escalationResult.success) {
        results.push({
          entityId: task.id,
          entityType: "TASK",
          ruleId: rule.id,
          ruleName: rule.name,
          recipientId: recipient.id,
          recipientName: recipient.name,
          reason: escalationResult.reason!,
          escalationId: escalationResult.escalationId,
        });
      }
    }

    return results;
  }

  /**
   * Determine escalation recipient based on rule
   * 
   * @param rule - Escalation rule
   * @param assignee - Current assignee (optional)
   * @returns Recipient user
   */
  private async determineRecipient(
    rule: any,
    assignee?: any
  ): Promise<{ id: string; name: string } | null> {
    switch (rule.escalateTo) {
      case "TEAM_LEADER":
        // Get assignee's team leader
        if (assignee?.team?.leaderId) {
          const leader = await prisma.user.findUnique({
            where: { id: assignee.team.leaderId },
            select: { id: true, name: true },
          });
          return leader;
        }

        // Fallback: First leader in team
        if (assignee?.team?.members?.[0]) {
          return {
            id: assignee.team.members[0].id,
            name: assignee.team.members[0].name || "Unknown",
          };
        }

        // Fallback to admin
        return this.getFirstAdmin();

      case "ADMIN":
        return this.getFirstAdmin();

      case "CUSTOM":
        if (rule.customRecipient) {
          return {
            id: rule.customRecipient.id,
            name: rule.customRecipient.name || "Unknown",
          };
        }
        return null;

      default:
        return null;
    }
  }

  /**
   * Get first admin user
   * 
   * @returns Admin user or null
   */
  private async getFirstAdmin(): Promise<{ id: string; name: string } | null> {
    const admin = await prisma.user.findFirst({
      where: { role: "ADMIN", isActive: true },
      select: { id: true, name: true },
    });

    return admin;
  }

  /**
   * Create an escalation
   * 
   * @param entityId - Request or Task ID
   * @param entityType - "REQUEST" or "TASK"
   * @param ruleId - Escalation rule ID
   * @param reason - Escalation reason (optional, will be generated)
   * @param recipientId - Recipient user ID (optional, will be determined)
   * @returns Escalation result
   */
  async escalate(
    entityId: string,
    entityType: "REQUEST" | "TASK",
    ruleId: string,
    reason?: string,
    recipientId?: string
  ) {
    try {
      // Validate input
      const validated = escalateSchema.parse({ entityId, entityType, ruleId });

      // Get rule
      const rule = await prisma.escalationRule.findUnique({
        where: { id: ruleId },
        include: {
          customRecipient: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      if (!rule || !rule.isActive) {
        return {
          success: false,
          error: "Rule không tồn tại hoặc không active",
        };
      }

      // Get entity details
      let entityTitle = "";
      let assignee: any = null;

      if (entityType === "REQUEST") {
        const request = await prisma.request.findUnique({
          where: { id: entityId },
          select: {
            title: true,
            team: {
              select: {
                leaderId: true,
                members: {
                  where: { role: "LEADER" },
                  select: { id: true, name: true },
                  take: 1,
                },
              },
            },
          },
        });

        if (!request) {
          return {
            success: false,
            error: "Request không tồn tại",
          };
        }

        entityTitle = request.title;
        assignee = request.team;
      } else {
        const task = await prisma.task.findUnique({
          where: { id: entityId },
          select: {
            title: true,
            assignee: {
              select: {
                id: true,
                name: true,
                teamId: true,
                team: {
                  select: {
                    leaderId: true,
                    members: {
                      where: { role: "LEADER" },
                      select: { id: true, name: true },
                      take: 1,
                    },
                  },
                },
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

        entityTitle = task.title;
        assignee = task.assignee;
      }

      // Determine recipient if not provided
      let recipient: { id: string; name: string } | null = null;

      if (recipientId) {
        const user = await prisma.user.findUnique({
          where: { id: recipientId },
          select: { id: true, name: true },
        });
        recipient = user;
      } else {
        recipient = await this.determineRecipient(rule, assignee);
      }

      if (!recipient) {
        return {
          success: false,
          error: "Không tìm thấy người nhận escalation",
        };
      }

      // Generate reason if not provided
      const finalReason =
        reason ||
        `${entityType === "REQUEST" ? "Request" : "Task"} "${entityTitle}" cần xử lý escalation`;

      // Create escalation log
      const escalationLog = await prisma.escalationLog.create({
        data: {
          ...(entityType === "REQUEST"
            ? { requestId: entityId }
            : { taskId: entityId }),
          ruleId: rule.id,
          reason: finalReason,
          escalatedTo: recipient.id,
          status: "PENDING",
        },
      });

      // Send notifications
      await this.sendEscalationNotification(
        escalationLog.id,
        recipient.id,
        finalReason,
        rule.notificationChannels
      );

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: recipient.id,
          action: "ESCALATION_TRIGGERED",
          entity: entityType === "REQUEST" ? "Request" : "Task",
          entityId,
          oldValue: Prisma.JsonNull,
          newValue: {
            ruleId: rule.id,
            ruleName: rule.name,
            triggerType: rule.triggerType,
            reason: finalReason,
            escalatedTo: recipient.name,
          } as Prisma.InputJsonValue,
        },
      });

      return {
        success: true,
        escalationId: escalationLog.id,
        reason: finalReason,
        recipientId: recipient.id,
        recipientName: recipient.name,
      };
    } catch (error: any) {
      console.error("escalate error:", error);

      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.issues[0]?.message || "Dữ liệu không hợp lệ",
        };
      }

      return {
        success: false,
        error: "Không thể tạo escalation",
      };
    }
  }

  /**
   * Send escalation notification
   * 
   * @param escalationId - Escalation log ID
   * @param recipientId - Recipient user ID
   * @param reason - Escalation reason
   * @param channels - Notification channels
   */
  private async sendEscalationNotification(
    escalationId: string,
    recipientId: string,
    reason: string,
    channels: string[]
  ) {
    try {
      const message = `🚨 Escalation: ${reason}\n\nVui lòng xử lý ngay.`;

      // Send via configured channels
      if (channels.includes("TELEGRAM")) {
        // TODO: Implement Telegram notifications when telegram service is ready
        // await sendTelegramMessage(recipientId, message);
      }

      if (channels.includes("EMAIL")) {
        // TODO: Implement email sending
        console.log(`Email notification to user ${recipientId}:`, message);
      }
    } catch (error) {
      console.error("Failed to send escalation notification:", error);
    }
  }

  /**
   * Acknowledge an escalation
   * 
   * @param escalationId - Escalation log ID
   * @param userId - User acknowledging
   * @returns Acknowledgment result
   */
  async acknowledgeEscalation(escalationId: string, userId: string) {
    try {
      // Validate input
      const validated = acknowledgeEscalationSchema.parse({
        escalationId,
        userId,
      });

      // Get escalation
      const escalation = await prisma.escalationLog.findUnique({
        where: { id: validated.escalationId },
        include: {
          rule: true,
          request: {
            select: { id: true, title: true },
          },
          task: {
            select: { id: true, title: true, assigneeId: true },
          },
        },
      });

      if (!escalation) {
        return {
          success: false,
          error: "Escalation không tồn tại",
        };
      }

      // Verify user is the recipient
      if (escalation.escalatedTo !== validated.userId) {
        return {
          success: false,
          error: "Chỉ người nhận mới có thể acknowledge escalation",
        };
      }

      // Update status
      await prisma.escalationLog.update({
        where: { id: validated.escalationId },
        data: {
          status: "ACKNOWLEDGED",
        },
      });

      // Notify original assignee (if task escalation)
      if (escalation.task?.assigneeId) {
        // TODO: Implement Telegram notifications when telegram service is ready
        // await sendTelegramMessage(
        //   escalation.task.assigneeId,
        //   `ℹ️ Escalation cho task "${escalation.task.title}" đã được team leader acknowledge.`
        // );
      }

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: validated.userId,
          action: "ESCALATION_ACKNOWLEDGED",
          entity: escalation.taskId ? "Task" : "Request",
          entityId: escalation.taskId || escalation.requestId!,
          oldValue: { status: "PENDING" } as Prisma.InputJsonValue,
          newValue: { status: "ACKNOWLEDGED" } as Prisma.InputJsonValue,
        },
      });

      return {
        success: true,
      };
    } catch (error: any) {
      console.error("acknowledgeEscalation error:", error);

      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.issues[0]?.message || "Dữ liệu không hợp lệ",
        };
      }

      return {
        success: false,
        error: "Không thể acknowledge escalation",
      };
    }
  }

  /**
   * Resolve an escalation
   * 
   * @param escalationId - Escalation log ID
   * @param userId - User resolving
   * @param notes - Resolution notes
   * @returns Resolution result
   */
  async resolveEscalation(
    escalationId: string,
    userId: string,
    notes?: string
  ) {
    try {
      // Validate input
      const validated = resolveEscalationSchema.parse({
        escalationId,
        userId,
        notes,
      });

      // Get escalation
      const escalation = await prisma.escalationLog.findUnique({
        where: { id: validated.escalationId },
        include: {
          rule: true,
          task: {
            select: { assigneeId: true },
          },
        },
      });

      if (!escalation) {
        return {
          success: false,
          error: "Escalation không tồn tại",
        };
      }

      // Verify user is the recipient
      if (escalation.escalatedTo !== validated.userId) {
        return {
          success: false,
          error: "Chỉ người nhận mới có thể resolve escalation",
        };
      }

      // Update status
      await prisma.escalationLog.update({
        where: { id: validated.escalationId },
        data: {
          status: "RESOLVED",
          resolvedAt: new Date(),
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: validated.userId,
          action: "ESCALATION_RESOLVED",
          entity: escalation.taskId ? "Task" : "Request",
          entityId: escalation.taskId || escalation.requestId!,
          oldValue: { status: escalation.status } as Prisma.InputJsonValue,
          newValue: {
            status: "RESOLVED",
            resolvedAt: new Date().toISOString(),
            notes: validated.notes,
          } as Prisma.InputJsonValue,
        },
      });

      return {
        success: true,
        resolvedAt: new Date(),
      };
    } catch (error: any) {
      console.error("resolveEscalation error:", error);

      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.issues[0]?.message || "Dữ liệu không hợp lệ",
        };
      }

      return {
        success: false,
        error: "Không thể resolve escalation",
      };
    }
  }

  /**
   * Get active escalations for a user
   * 
   * @param userId - User ID
   * @returns Array of active escalations
   */
  async getActiveEscalations(userId: string) {
    try {
      // Validate input
      getActiveEscalationsSchema.parse(userId);

      const escalations = await prisma.escalationLog.findMany({
        where: {
          escalatedTo: userId,
          status: { not: "RESOLVED" }, // PENDING or ACKNOWLEDGED
        },
        include: {
          rule: {
            select: {
              name: true,
              triggerType: true,
            },
          },
          request: {
            select: {
              id: true,
              title: true,
              priority: true,
              status: true,
            },
          },
          task: {
            select: {
              id: true,
              title: true,
              status: true,
              assignee: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return {
        success: true,
        escalations: escalations.map((esc) => ({
          id: esc.id,
          reason: esc.reason,
          status: esc.status,
          createdAt: esc.createdAt.toISOString(),
          resolvedAt: esc.resolvedAt?.toISOString() || null,
          rule: {
            name: esc.rule.name,
            triggerType: esc.rule.triggerType,
          },
          entity: esc.requestId
            ? {
                type: "REQUEST" as const,
                id: esc.request!.id,
                title: esc.request!.title,
                priority: esc.request!.priority,
                status: esc.request!.status,
              }
            : {
                type: "TASK" as const,
                id: esc.task!.id,
                title: esc.task!.title,
                status: esc.task!.status,
                assigneeName: esc.task!.assignee?.name || "Unassigned",
              },
        })),
      };
    } catch (error: any) {
      console.error("getActiveEscalations error:", error);

      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.issues[0]?.message || "Dữ liệu không hợp lệ",
        };
      }

      return {
        success: false,
        error: "Không thể lấy danh sách escalations",
      };
    }
  }

  /**
   * Format duration in minutes
   * 
   * @param minutes - Duration in minutes
   * @returns Formatted string
   */
  private formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} phút`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours} giờ`;
    }

    return `${hours} giờ ${remainingMinutes} phút`;
  }

  /**
   * Get escalation statistics
   * 
   * @param userId - Optional user ID to filter by
   * @returns Statistics object
   */
  async getEscalationStats(userId?: string) {
    try {
      const where = userId ? { escalatedTo: userId } : {};

      const [total, pending, acknowledged, resolved, byTriggerType] =
        await Promise.all([
          prisma.escalationLog.count({ where }),
          prisma.escalationLog.count({ where: { ...where, status: "PENDING" } }),
          prisma.escalationLog.count({
            where: { ...where, status: "ACKNOWLEDGED" },
          }),
          prisma.escalationLog.count({ where: { ...where, status: "RESOLVED" } }),
          prisma.escalationLog.groupBy({
            by: ["status"],
            where,
            _count: true,
          }),
        ]);

      return {
        total,
        pending,
        acknowledged,
        resolved,
        byStatus: byTriggerType.reduce(
          (acc, item) => {
            acc[item.status] = item._count;
            return acc;
          },
          {} as Record<string, number>
        ),
      };
    } catch (error) {
      console.error("getEscalationStats error:", error);
      return null;
    }
  }
}

// Export singleton instance
export const escalationService = new EscalationService();

// Export types (already exported individually above)

