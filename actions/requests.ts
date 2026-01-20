// actions/requests.ts
"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createRequestSchema } from "@/lib/validations/request";
import bcrypt from "bcryptjs";
import { parseDateOrNull } from "@/lib/utils/dates";
import { Logger } from "@/lib/utils/logger";
import { calculateSlaDeadline } from "@/lib/services/sla-calculator";
import { sendTelegramMessage } from "@/lib/services/telegram-service";
import { requestCreatedTemplate } from "@/lib/telegram/templates";
import { APP_URL } from "@/lib/config/telegram";
import { timelineCalculator } from "@/lib/services/timeline-and-deadline-service";
import { differenceInHours } from "date-fns";
import { fieldValidators } from "@/types/custom-fields";
import { templateService } from "@/lib/services/template-service";
import { getCatalogRule, computeFixedDeadline } from "@/lib/catalog";

// Import from types instead
import { UserRole, normalizeRole } from "@/types";

async function ensureDbUserFromSession() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHORIZED");
  const id = session.user.id as string;
  const email = session.user.email ?? "";
  const name = session.user.name ?? "User";
  const rawRole = (session.user as any)?.role ?? "ASSIGNEE";
  const role = normalizeRole(rawRole as any) as UserRole;
  const dbRole: Role = (role as unknown as Role);

  let me = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true, teamId: true, isActive: true },
  });
  if (!me) {
    const passwordHash = await bcrypt.hash(id + ":auto", 10);
    me = await prisma.user.create({
      data: { id, email, name, role: dbRole, isActive: true, password: passwordHash },
      select: { id: true, email: true, name: true, role: true, teamId: true, isActive: true },
    });
  }
  return me;
}

export async function createRequestAction(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      Logger.warn("Unauthorized request creation attempt", { action: "createRequest" });
      return { ok: false, message: "Unauthorized" };
    }

  // Convert FormData -> plain object
  const data = Object.fromEntries(formData) as any;

  // attachments là JSON string (từ client), parse nếu có
  if (typeof data.attachments === "string" && data.attachments.length > 0) {
    try {
      data.attachments = JSON.parse(data.attachments);
    } catch {
      data.attachments = [];
    }
  }

  // tags là chuỗi "a,b,c" -> array
  if (typeof data.tags === "string" && data.tags.trim()) {
    data.tags = data.tags.split(",").map((s: string) => s.trim());
  }

  // validate
  const parsed = createRequestSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0].message };
  }

  // ensure creator exists in DB
  const me = await ensureDbUserFromSession();

  // create request
  const input = parsed.data;

  // Guard category (only required when template is used)
  if (input.templateId && !input.categoryId) {
    return { ok: false, message: "Vui lòng chọn danh mục (category) khi sử dụng template." };
  }
  
  // Calculate priority if scores provided
  let calculatedPriority = input.priority; // Use manual priority as default
  let calculatedScore: number | null = null;
  let priorityReason = 'Đặt thủ công';
  
  if (input.urgencyScore || input.impactScore || input.riskScore) {
    try {
      const { calculatePriorityScore } = await import('@/lib/services/priority-calculator');
      const result = await calculatePriorityScore({
        urgency: input.urgencyScore,
        impact: input.impactScore,
        risk: input.riskScore,
        custom: input.customScores,
      }, input.requesterType || 'INTERNAL');
      
      if (result) {
        calculatedPriority = result.priority;
        calculatedScore = result.totalScore;
        priorityReason = result.reason;
      }
    } catch (error) {
      Logger.warn('Priority calculation failed, using manual priority', { 
        action: 'createRequest', 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      // Fall back to manual priority
    }
  }

  // Catalog enforcement: if using known catalog template, override deadline
  const catalogRule = getCatalogRule(input.templateId as any);
  if (catalogRule?.enforceFixedTime) {
    input.deadline = computeFixedDeadline(catalogRule).toISOString();
  }

  // Calculate estimated timeline from category
  let estimatedTimeline = null;
  if (input.categoryId) {
    estimatedTimeline = await timelineCalculator.calculateEstimatedTimeline(
      input.categoryId,
      new Date()
    );
  }
  
  // Get category for SLA calculation (if provided)
  const categoryForSla = input.categoryId ? await prisma.category.findUnique({
    where: { id: input.categoryId },
    select: { name: true },
  }) : null;

  // Validate timeline if provided manually
  const estimatedStartDate = parseDateOrNull((input as any).estimatedStartDate);
  const estimatedEndDate = parseDateOrNull((input as any).estimatedEndDate);
  
  if (estimatedStartDate || estimatedEndDate) {
    const validation = timelineCalculator.validateTimeline({
      estimatedStartDate,
      estimatedEndDate,
      deadline: parseDateOrNull(input.deadline),
    });

    if (!validation.isValid) {
      return { ok: false, message: validation.errors.join(", ") };
    }
  }

  // Calculate duration
  const estimatedDuration =
    estimatedStartDate && estimatedEndDate
      ? differenceInHours(estimatedEndDate, estimatedStartDate)
      : estimatedTimeline?.estimatedDuration || null;
  
  const created = await prisma.$transaction(async (tx) => {
    const req = await tx.request.create({
      data: {
        title: input.title,
        description: input.description,
        ...(input.categoryId ? { categoryId: input.categoryId } : { categoryId: null }),
        teamId: input.teamId || null,
        priority: calculatedPriority,
        status: "OPEN",
        creatorId: me.id,
        deadline: parseDateOrNull(input.deadline),
        estimatedStartDate: estimatedStartDate || estimatedTimeline?.estimatedStartDate || null,
        estimatedEndDate: estimatedEndDate || estimatedTimeline?.estimatedEndDate || null,
        estimatedDuration,
        isUrgent: !!input.isUrgent,
        tags: input.tags ?? [],
        // Priority scoring fields
        urgencyScore: input.urgencyScore,
        impactScore: input.impactScore,
        riskScore: input.riskScore,
        customScores: input.customScores as any,
        calculatedScore,
        priorityReason,
        requesterType: input.requesterType || 'INTERNAL',
      } as any,
    });

    if (input.attachments?.length) {
      await tx.attachment.createMany({
        data: input.attachments.map((a) => ({
          requestId: req.id,
          fileName: a.fileName,
          fileUrl: a.fileUrl,
          fileSize: 0, // Unknown for Drive links
          mimeType: 'application/octet-stream', // Generic type for Drive links
          uploadedById: me.id,
          uploadMethod: 'DRIVE', // Google Drive link
          driveLink: a.fileUrl, // Also store in driveLink field
        })),
      });
    }

    // AuditLog (basic)
    await tx.auditLog.create({
      data: {
        userId: me.id,
        action: "CREATE_REQUEST",
        entity: "Request",
        entityId: req.id,
        newValue: { title: req.title, priority: req.priority },
        requestId: req.id,
      },
    });

    // Notification stub (gửi cho chính creator – Phase 1)
    await tx.notification.create({
      data: {
        userId: me.id,
        type: "REQUEST_CREATED",
        title: "Tạo yêu cầu thành công",
        message: `Request "${req.title}" đã được tạo.`,
        requestId: req.id,
      },
    });

    // === NOTIFY TARGET TEAM: Leader và Members của team được giao ===
    if (req.teamId) {
      // Get team with leader and members
      const targetTeam = await tx.team.findUnique({
        where: { id: req.teamId },
        include: {
          members: { select: { id: true, name: true } },
        },
      });

      if (targetTeam) {
        // Get leader of the team
        const teamLeader = await tx.user.findFirst({
          where: { teamId: req.teamId, role: "LEADER" as any },
          select: { id: true },
        });

        // Notify team leader (if exists and not the creator)
        if (teamLeader && teamLeader.id !== me.id) {
          await tx.notification.create({
            data: {
              userId: teamLeader.id,
              type: "REQUEST_CREATED" as any,
              title: "📥 Yêu cầu mới cần xử lý",
              message: `"${req.title}" từ ${me.name || "người dùng"} - Vui lòng tiếp nhận và phân công.`,
              requestId: req.id,
              link: `/requests/${req.id}`,
              priority: req.priority === "URGENT" ? "URGENT" : "INFO",
            },
          });
        }

        // Notify all team members (except creator and leader)
        const membersToNotify = targetTeam.members.filter(
          (m) => m.id !== me.id && m.id !== teamLeader?.id
        );

        if (membersToNotify.length > 0) {
          await tx.notification.createMany({
            data: membersToNotify.map((member) => ({
              userId: member.id,
              type: "REQUEST_CREATED" as any,
              title: "📥 Yêu cầu mới cho phòng ban",
              message: `"${req.title}" từ ${me.name || "người dùng"} đã được gửi đến phòng ban của bạn.`,
              requestId: req.id,
              link: `/requests/${req.id}`,
              priority: "INFO" as any,
            })),
          });
        }
      }
    }

    return req;
  });

  // Telegram: notify team leader (if configured)
  try {
    if (!input.categoryId) {
      Logger.warn("No categoryId provided, skipping Telegram notification", { action: "createRequest", requestId: created.id });
    } else {
      const category = await prisma.category.findUnique({
        where: { id: input.categoryId },
        select: { name: true, teamId: true },
      });

      if (category?.teamId) {
      const leader: any = await prisma.user.findFirst({
        where: { role: "LEADER" as any, teamId: category.teamId },
      });

      const wantsTelegram = leader?.notificationChannel === "TELEGRAM" || leader?.notificationChannel === "BOTH";
      if (leader?.telegramChatId && wantsTelegram) {
        const tpl = requestCreatedTemplate({
          leaderName: leader.name || "Leader",
          requesterName: me.name || "Requester",
          requestTitle: created.title,
          priority: created.priority as any,
          category: category.name || "—",
          requestUrl: `${APP_URL || ""}/requests/${created.id}`,
        });
        const tgRes = await sendTelegramMessage({
          chatId: leader.telegramChatId,
          message: tpl.message,
          buttons: tpl.buttons,
          parseMode: "Markdown",
        });
        await prisma.auditLog.create({
          data: {
            userId: me.id,
            action: tgRes.success ? "telegram_sent" : "telegram_failed",
            entity: "Request",
            entityId: created.id,
            newValue: { messageId: tgRes.messageId ?? null },
            requestId: created.id,
          },
        });
      } else {
        Logger.warn("Leader chưa kết nối Telegram hoặc không chọn kênh TELEGRAM", { action: "createRequest", requestId: created.id });
      }
    }
    }
  } catch (e) {
    Logger.warn("Failed to send Telegram for request create", { action: "createRequest", requestId: created.id, error: (e as any)?.message });
  }

  // === SAME-DEPARTMENT BYPASS: Auto-accept if creator and request are in same department ===
  // When request is sent within the same department, skip leader approval step
  const isSameDepartment = me.teamId && input.teamId && me.teamId === input.teamId;

  if (isSameDepartment) {
    try {
      await prisma.request.update({
        where: { id: created.id },
        data: {
          acceptedAt: new Date(),
          acceptedBy: me.id,
        } as any,
      });

      await prisma.auditLog.create({
        data: {
          userId: me.id,
          action: "AUTO_ACCEPTED_SAME_DEPT",
          entity: "Request",
          entityId: created.id,
          newValue: {
            reason: "Yêu cầu cùng phòng ban - tự động chấp nhận",
            creatorTeamId: me.teamId,
            requestTeamId: input.teamId,
          },
          requestId: created.id,
        },
      });

      Logger.info("Request auto-accepted (same department)", {
        action: "createRequest",
        requestId: created.id,
        creatorTeamId: me.teamId,
        requestTeamId: input.teamId,
      });
    } catch (autoAcceptError) {
      Logger.warn("Failed to auto-accept same-department request", {
        action: "createRequest",
        requestId: created.id,
        error: autoAcceptError instanceof Error ? autoAcceptError.message : 'Unknown error',
      });
    }
  }

  // Calculate and set SLA deadline for the request
  try {
    const slaResult = await calculateSlaDeadline({
      entityType: 'REQUEST',
      priority: created.priority,
      category: categoryForSla?.name,
      startTime: new Date(),
    });

    // Update request with SLA information (cast to any to satisfy schema drift)
    await prisma.request.update({
      where: { id: created.id },
      data: {
        slaDeadline: slaResult.deadline,
        slaStartedAt: new Date(),
        slaStatus: 'ON_TIME',
        slaPausedDuration: 0,
      } as any,
    });

    // Add SLA audit log
    await prisma.auditLog.create({
      data: {
        userId: me.id,
        action: "SLA_DEADLINE_SET",
        entity: "Request",
        entityId: created.id,
        newValue: { 
          slaDeadline: slaResult.deadline.toISOString(),
          targetHours: slaResult.targetHours,
          slaConfigId: slaResult.slaConfigId,
        },
        requestId: created.id,
      },
    });

    Logger.info("SLA deadline set for request", {
      action: "createRequest",
      requestId: created.id,
      slaDeadline: slaResult.deadline.toISOString(),
      targetHours: slaResult.targetHours,
    });
  } catch (slaError) {
    // Log warning but don't block request creation
    Logger.warn("Failed to set SLA deadline for request", {
      action: "createRequest",
      requestId: created.id,
      error: slaError instanceof Error ? slaError.message : 'Unknown error',
    });
  }

  revalidatePath("/requests");
  revalidatePath("/dashboard");
  revalidatePath("/personal");
  Logger.info("Request created successfully", { 
    action: "createRequest", 
    requestId: created.id,
    userId: me.id 
  });
  return { ok: true, id: created.id };
  } catch (error) {
    Logger.captureException(error as Error, { action: "createRequest" });
    return { ok: false, message: "Internal server error" };
  }
}

export async function archiveRequest(requestId: string): Promise<void> {
  try {
    const me = await ensureDbUserFromSession();
    const req = await prisma.request.findUnique({ where: { id: requestId }, select: { id: true, status: true, creatorId: true, title: true } });
    if (!req) { Logger.warn("Archive request not found", { action: "archiveRequest", requestId }); return; }
    if (req.status !== "DONE") {
      Logger.warn("Attempted to archive non-DONE request", { action: "archiveRequest", requestId, status: req.status });
      return;
    }
    await prisma.$transaction(async (tx) => {
      const updated = await tx.request.update({ where: { id: requestId }, data: { status: "ARCHIVED" } });
      await tx.auditLog.create({ data: { userId: me.id, action: "ARCHIVE_REQUEST", entity: "Request", entityId: requestId, oldValue: { status: req.status }, newValue: { status: updated.status }, requestId } });
      await tx.notification.create({
        data: {
          userId: req.creatorId,
          // Fallback to generic type to satisfy enum
          type: "TASK_UPDATED" as any,
          title: "Request đã được lưu trữ",
          message: `Request "${req.title}" đã được lưu trữ.`,
          requestId,
        },
      });
    });
    Logger.info("Request archived successfully", { action: "archiveRequest", requestId, userId: me.id });
    revalidatePath(`/requests/${requestId}`);
    revalidatePath("/requests");
  } catch (error) {
    Logger.captureException(error as Error, { action: "archiveRequest", requestId });
    throw error;
  }
}

export async function deleteRequest(requestId: string) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      throw new Error('Unauthorized');
    }
    
    // Get request with relations
    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        creator: true,
        team: true,
      },
    });
    
    if (!request) {
      throw new Error('Yêu cầu không tồn tại');
    }
    
    // Authorization check
    const isCreator = request.creatorId === session.user.id;
    const isAdmin = (session.user as any).role === 'ADMIN';
    
    if (!isCreator && !isAdmin) {
      throw new Error('Bạn không có quyền xóa yêu cầu này');
    }
    
    // Prevent deletion if request has tasks in progress
    const activeTasks = await prisma.task.count({
      where: {
        requestId,
        status: {
          in: ['IN_PROGRESS', 'IN_REVIEW'],
        },
      },
    });
    
    if (activeTasks > 0) {
      throw new Error('Không thể xóa yêu cầu có nhiệm vụ đang thực hiện');
    }
    
    try {
      // Use transaction to delete all related data
      await prisma.$transaction(async (tx) => {
        // Delete comments
        await tx.comment.deleteMany({
          where: { requestId },
        });
        
        // Delete tasks
        await tx.task.deleteMany({
          where: { requestId },
        });
        
        // Delete attachments
        // Note: You should also delete files from storage (Uploadthing/Cloudinary)
        const attachments = await tx.attachment.findMany({
          where: { requestId },
        });
        
        await tx.attachment.deleteMany({
          where: { requestId },
        });
        
        // Delete notifications
        await tx.notification.deleteMany({
          where: {
            requestId: requestId,
          },
        });
        
        // Delete audit logs
        await tx.auditLog.deleteMany({
          where: {
            entity: 'Request',
            entityId: requestId,
          },
        });
        
        // Finally, delete the request
        await tx.request.delete({
          where: { id: requestId },
        });
        
        // Create delete audit log
        await tx.auditLog.create({
          data: {
            entity: 'Request',
            entityId: requestId,
            action: 'DELETE',
            userId: session.user!.id,
            newValue: {
              title: request.title,
              deletedAt: new Date().toISOString(),
            },
          } as any,
        });
        
        // Delete files from storage (best effort - don't block deletion)
        for (const attachment of attachments) {
          try {
            // Skip Google Drive links (can't delete externally)
            if (attachment.driveLink || attachment.fileUrl?.includes('drive.google.com')) {
              Logger.info("Skipping Drive link deletion (external)", {
                action: "deleteRequest",
                attachmentId: attachment.id
              });
              continue;
            }
            // For uploadthing or other storage, attempt deletion
            // Note: Implement specific storage deletion when storage provider is configured
            Logger.info("File marked for deletion", {
              action: "deleteRequest",
              fileUrl: attachment.fileUrl,
              attachmentId: attachment.id
            });
          } catch (fileError) {
            Logger.warn("Failed to delete file from storage", {
              action: "deleteRequest",
              attachmentId: attachment.id,
              error: (fileError as Error).message
            });
            // Continue with request deletion even if file deletion fails
          }
        }
      });
      
      // Only revalidate /requests, not the deleted request detail page
      revalidatePath('/requests');
      revalidatePath('/dashboard');
      revalidatePath('/personal');
      revalidatePath('/leader');
      
      Logger.info("Request deleted successfully", { 
        action: "deleteRequest", 
        requestId, 
        userId: session.user.id 
      });
      
      return { success: true };
    } catch (error) {
      Logger.captureException(error as Error, { action: "deleteRequest", requestId });
      throw new Error('Không thể xóa yêu cầu. Vui lòng thử lại.');
    }
  } catch (error) {
    Logger.captureException(error as Error, { action: "deleteRequest", requestId });
    throw error;
  }
}

/**
 * Update actual start date (when work begins)
 */
export async function updateActualStartDate(requestId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Chưa đăng nhập" };
    }

    const request = await prisma.request.update({
      where: { id: requestId },
      data: {
        actualStartDate: new Date(),
      } as any,
    });

    revalidatePath(`/requests/${requestId}`);

    return { success: true, request };
  } catch (error) {
    console.error("[updateActualStartDate]:", error);
    return { success: false, error: "Lỗi cập nhật" };
  }
}

/**
 * Complete request - update actual end date
 */
export async function completeRequest(requestId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Chưa đăng nhập" };
    }

    // Update actual duration
    await timelineCalculator.updateActualDuration(requestId);

    const request = await prisma.request.update({
      where: { id: requestId },
      data: {
        status: "DONE",
      },
    });

    revalidatePath(`/requests/${requestId}`);
    revalidatePath("/requests");

    return { success: true, request };
  } catch (error) {
    console.error("[completeRequest]:", error);
    return { success: false, error: "Lỗi hoàn thành request" };
  }
}

/**
 * Get timeline deviation
 */
export async function getTimelineDeviation(requestId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Chưa đăng nhập" };
    }

    const deviation = await timelineCalculator.getTimelineDeviation(requestId);

    return { success: true, deviation };
  } catch (error) {
    console.error("[getTimelineDeviation]:", error);
    return { success: false, error: "Lỗi lấy deviation" };
  }
}

/**
 * Accept request - Tiếp nhận yêu cầu
 * Bất kỳ ai nhận được yêu cầu (thường là Leader của team được giao) có thể tiếp nhận
 * Phải tiếp nhận trước khi có thể duyệt
 */
export async function acceptRequest(requestId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Chưa đăng nhập" };
    }

    const userId = session.user.id as string;
    const userRole = (session.user as any).role as Role;

    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        team: {
          select: { leaderId: true, name: true, members: { select: { id: true } } },
        },
        creator: {
          select: { id: true, name: true },
        },
      },
    }) as any;

    if (!request) {
      return { success: false, error: "Yêu cầu không tồn tại" };
    }

    // Kiểm tra đã tiếp nhận chưa
    if (request.acceptedAt) {
      return { success: false, error: "Yêu cầu đã được tiếp nhận rồi" };
    }

    // Kiểm tra quyền: Admin, Leader của team được giao, hoặc member của team
    const isAdmin = userRole === Role.ADMIN;
    const isTeamLeader = request.team && request.team.leaderId === userId;
    const isTeamMember = request.team?.members.some((m: any) => m.id === userId) || false;

    if (!isAdmin && !isTeamLeader && !isTeamMember) {
      return { success: false, error: "Bạn không có quyền tiếp nhận yêu cầu này" };
    }

    // Update request - đánh dấu đã tiếp nhận
    await prisma.request.update({
      where: { id: requestId },
      data: {
        acceptedAt: new Date(),
        acceptedBy: userId,
      } as any,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: "ACCEPT_REQUEST",
        entity: "Request",
        entityId: requestId,
        newValue: ({ acceptedAt: new Date().toISOString(), acceptedBy: userId } as unknown) as Prisma.InputJsonValue,
      },
    });

    // Create comment
    await prisma.comment.create({
      data: {
        requestId,
        authorId: userId,
        content: `✅ Yêu cầu đã được tiếp nhận bởi ${(session.user as any).name || "Người dùng"}`,
      },
    });

    // Notification to creator
    if (request.creator && request.creator.id !== userId) {
      await prisma.notification.create({
        data: {
          userId: request.creator.id,
          type: "TASK_UPDATED" as any,
          title: "Yêu cầu đã được tiếp nhận",
          message: `Yêu cầu "${request.title}" đã được tiếp nhận bởi ${(session.user as any).name || "Người dùng"}.`,
          requestId,
        },
      });
    }

    revalidatePath(`/requests/${requestId}`);
    revalidatePath("/requests");
    revalidatePath("/leader");
    revalidatePath("/dashboard");

    return { success: true, message: "Đã tiếp nhận yêu cầu thành công" };
  } catch (error) {
    console.error("[acceptRequest]:", error);
    return { success: false, error: error instanceof Error ? error.message : "Lỗi tiếp nhận yêu cầu" };
  }
}

/**
 * Approve request - Duyệt yêu cầu (Bước 1: Leader duyệt)
 * Chỉ Leader của team được giao hoặc Admin mới được duyệt
 * 
 * Quy trình 3 bước:
 * 1. Tiếp nhận yêu cầu (acceptRequest) - bắt buộc
 * 2. Leader duyệt → IN_REVIEW (chờ người yêu cầu duyệt cuối)
 * 3. Người yêu cầu duyệt cuối → DONE (xem requesterApproveRequest)
 * 
 * Admin có thể duyệt thẳng → DONE ở bất kỳ bước nào (nhưng vẫn cần tiếp nhận trước)
 */
export async function approveRequest(requestId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Chưa đăng nhập" };
    }

    const userId = session.user.id as string;
    const userRole = (session.user as any).role as Role;

    // RBAC: Chỉ Leader hoặc Admin
    if (userRole !== Role.LEADER && userRole !== Role.ADMIN) {
      return { success: false, error: "Chỉ Leader hoặc Admin mới được duyệt yêu cầu" };
    }

    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        tasks: {
          where: { status: { not: "DONE" } },
        },
        team: {
          select: { leaderId: true, name: true },
        },
        creator: {
          select: { id: true, name: true },
        },
      },
    }) as any;

    if (!request) {
      return { success: false, error: "Yêu cầu không tồn tại" };
    }

    // Kiểm tra đã tiếp nhận chưa (bắt buộc phải tiếp nhận trước khi duyệt)
    if (!request.acceptedAt) {
      return { success: false, error: "Yêu cầu phải được tiếp nhận trước khi duyệt" };
    }

    // Additional RBAC check: Leader can only approve requests of their team
    if (userRole === Role.LEADER) {
      if (!request.team || request.team.leaderId !== userId) {
        return { success: false, error: "Bạn chỉ có thể duyệt yêu cầu của team mình" };
      }
    }

    // Kiểm tra nếu có task chưa hoàn thành
    if (request.tasks.length > 0) {
      return { success: false, error: "Không thể duyệt yêu cầu khi còn nhiệm vụ chưa hoàn thành" };
    }

    // Quyết định status tiếp theo
    // - Admin: Duyệt thẳng → DONE
    // - Leader: Chuyển → IN_REVIEW (chờ người yêu cầu duyệt cuối)
    const newStatus = userRole === Role.ADMIN ? "DONE" : "IN_REVIEW";

    // Update request status
    await prisma.request.update({
      where: { id: requestId },
      data: {
        status: newStatus,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: userRole === Role.ADMIN ? "APPROVE_REQUEST" : "LEADER_APPROVE_REQUEST",
        entity: "Request",
        entityId: requestId,
        newValue: ({ status: newStatus } as unknown) as Prisma.InputJsonValue,
      },
    });

    // Create comment
    const commentContent = userRole === Role.ADMIN 
      ? `✅ Yêu cầu đã được duyệt bởi Admin ${(session.user as any).name || "Admin"}`
      : `✅ Leader ${(session.user as any).name || "Leader"} (${request.team?.name}) đã duyệt yêu cầu. Chờ người yêu cầu xác nhận cuối cùng.`;

    await prisma.comment.create({
      data: {
        requestId,
        authorId: userId,
        content: commentContent,
      },
    });

    // Notification
    if (userRole === Role.LEADER && request.creator) {
      // Notify requester that leader has approved, waiting for final confirmation
      await prisma.notification.create({
        data: {
          userId: request.creator.id,
          type: "REVIEW_NEEDED",
          title: "Yêu cầu đã được Leader duyệt",
          message: `Leader đã duyệt yêu cầu "${request.title}". Vui lòng xác nhận hoàn thành cuối cùng.`,
          requestId,
        },
      });
    }

    revalidatePath(`/requests/${requestId}`);
    revalidatePath("/requests");
    revalidatePath("/leader");
    revalidatePath("/dashboard");
    revalidatePath("/personal");

    return { 
      success: true, 
      message: userRole === Role.ADMIN 
        ? "Đã duyệt yêu cầu thành công" 
        : "Đã duyệt yêu cầu. Đang chờ người yêu cầu xác nhận cuối cùng."
    };
  } catch (error) {
    console.error("[approveRequest]:", error);
    return { success: false, error: error instanceof Error ? error.message : "Lỗi duyệt yêu cầu" };
  }
}

/**
 * Requester approve request - Người yêu cầu duyệt cuối cùng (Bước 2)
 * Chỉ người tạo yêu cầu mới được duyệt cuối cùng
 * Request phải ở trạng thái IN_REVIEW (đã được Leader duyệt)
 */
export async function requesterApproveRequest(requestId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Chưa đăng nhập" };
    }

    const userId = session.user.id as string;

    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        team: {
          select: { leaderId: true, name: true },
        },
        creator: {
          select: { id: true, name: true },
        },
      },
    });

    if (!request) {
      return { success: false, error: "Yêu cầu không tồn tại" };
    }

    // RBAC: Chỉ người tạo yêu cầu mới được duyệt cuối
    if (request.creatorId !== userId) {
      return { success: false, error: "Chỉ người tạo yêu cầu mới có thể xác nhận hoàn thành cuối cùng" };
    }

    // Kiểm tra request phải đang ở trạng thái IN_REVIEW
    if (request.status !== "IN_REVIEW") {
      return { 
        success: false, 
        error: "Yêu cầu phải được Leader duyệt trước khi bạn có thể xác nhận cuối cùng" 
      };
    }

    // Update request status to DONE
    await prisma.request.update({
      where: { id: requestId },
      data: {
        status: "DONE",
        completedAt: new Date(),
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: "REQUESTER_APPROVE_REQUEST",
        entity: "Request",
        entityId: requestId,
        newValue: ({ status: "DONE" } as unknown) as Prisma.InputJsonValue,
      },
    });

    // Create comment
    await prisma.comment.create({
      data: {
        requestId,
        authorId: userId,
        content: `✅ Người yêu cầu đã xác nhận hoàn thành. Yêu cầu đã được duyệt hoàn toàn.`,
      },
    });

    // Notification to team leader
    if (request.team?.leaderId) {
      await prisma.notification.create({
        data: {
          userId: request.team.leaderId,
          type: "COMPLETED",
          title: "Yêu cầu đã hoàn thành",
          message: `Người yêu cầu đã xác nhận hoàn thành yêu cầu "${request.title}".`,
          requestId,
        },
      });
    }

    revalidatePath(`/requests/${requestId}`);
    revalidatePath("/requests");
    revalidatePath("/leader");
    revalidatePath("/dashboard");
    revalidatePath("/personal");

    return { success: true, message: "Đã xác nhận hoàn thành yêu cầu" };
  } catch (error) {
    console.error("[requesterApproveRequest]:", error);
    return { success: false, error: error instanceof Error ? error.message : "Lỗi xác nhận yêu cầu" };
  }
}

/**
 * Reject request and send back for review - Từ chối và gửi lại để làm lại
 * Chỉ Leader của team được giao hoặc Admin mới được từ chối
 */
export async function rejectRequest(requestId: string, comment: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Chưa đăng nhập" };
    }

    const userId = session.user.id as string;
    const userRole = (session.user as any).role as Role;

    // RBAC: Chỉ Leader hoặc Admin
    if (userRole !== Role.LEADER && userRole !== Role.ADMIN) {
      return { success: false, error: "Chỉ Leader hoặc Admin mới được từ chối yêu cầu" };
    }

    if (!comment || comment.trim().length < 10) {
      return { success: false, error: "Vui lòng nhập lý do từ chối (tối thiểu 10 ký tự)" };
    }

    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        tasks: true,
        team: {
          select: { leaderId: true },
        },
      },
    });

    if (!request) {
      return { success: false, error: "Yêu cầu không tồn tại" };
    }

    // Additional RBAC check: Leader can only reject requests of their team
    if (userRole === Role.LEADER) {
      if (!request.team || request.team.leaderId !== userId) {
        return { success: false, error: "Bạn chỉ có thể từ chối yêu cầu của team mình" };
      }
    }

    // Update request status to CLARIFICATION (cần làm rõ/làm lại)
    await prisma.request.update({
      where: { id: requestId },
      data: {
        status: "CLARIFICATION",
      },
    });

    // Update all tasks to REWORK
    await prisma.task.updateMany({
      where: {
        requestId,
        status: { not: "DONE" },
      },
      data: {
        status: "REWORK",
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: "REJECT_REQUEST",
        entity: "Request",
        entityId: requestId,
        newValue: ({ status: "CLARIFICATION", comment: comment.trim() } as unknown) as Prisma.InputJsonValue,
      },
    });

    // Create comment with rejection reason
    await prisma.comment.create({
      data: {
        requestId,
        authorId: userId,
        content: `❌ Yêu cầu bị từ chối và cần làm lại:\n\n${comment.trim()}\n\n---\nTừ chối bởi: ${(session.user as any).name || "Admin"}`,
      },
    });

    revalidatePath(`/requests/${requestId}`);
    revalidatePath("/requests");
    revalidatePath("/leader");
    revalidatePath("/dashboard");
    revalidatePath("/personal");

    return { success: true };
  } catch (error) {
    console.error("[rejectRequest]:", error);
    return { success: false, error: error instanceof Error ? error.message : "Lỗi từ chối yêu cầu" };
  }
}

/**
 * Update request - với logic phân biệt catalog vs custom
 * Catalog requests (có createdFromTemplateId): CHỈ cho sửa title và description
 * Custom requests: Cho sửa title, description, teamId, deadline, priority, categoryId
 */
export async function updateRequestAction(requestId: string, formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { ok: false, message: "Chưa đăng nhập" };
    }

    const me = await ensureDbUserFromSession();
    const userRole = (session.user as any).role as Role;

    // Get current request to check if it's catalog or custom
    const currentRequest = await prisma.request.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        createdFromTemplateId: true,
        creatorId: true,
        teamId: true,
        team: {
          select: { leaderId: true },
        },
      },
    });

    if (!currentRequest) {
      return { ok: false, message: "Yêu cầu không tồn tại" };
    }

    // Permission check: Admin hoặc Leader của team hoặc creator
    const isAdmin = userRole === Role.ADMIN;
    const isLeader = userRole === Role.LEADER && currentRequest.team?.leaderId === me.id;
    const isCreator = currentRequest.creatorId === me.id;

    if (!isAdmin && !isLeader && !isCreator) {
      return { ok: false, message: "Bạn không có quyền chỉnh sửa yêu cầu này" };
    }

    // Determine if this is a catalog request
    const isCatalogRequest = !!currentRequest.createdFromTemplateId;

    // Extract form data
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const teamId = formData.get("teamId") as string | null;
    const deadline = formData.get("deadline") as string | null;
    const priority = formData.get("priority") as string;
    const categoryId = formData.get("categoryId") as string | null;

    // Validate required fields
    if (!title || title.trim().length < 5) {
      return { ok: false, message: "Tiêu đề phải có ít nhất 5 ký tự" };
    }
    if (!description || description.trim().length === 0) {
      return { ok: false, message: "Nội dung không được để trống" };
    }

    // Prepare update data
    const updateData: any = {
      title: title.trim(),
      description: description.trim(),
    };

    // Catalog request: CHỈ cho sửa title và description
    if (isCatalogRequest) {
      // Không cho sửa teamId, deadline, priority, categoryId
      // Chỉ update title và description
    } else {
      // Custom request: Cho sửa tất cả
      if (teamId) {
        updateData.teamId = teamId;
      } else {
        updateData.teamId = null;
      }

      if (deadline) {
        const deadlineDate = new Date(deadline);
        if (deadlineDate < new Date()) {
          return { ok: false, message: "Deadline phải là ngày trong tương lai" };
        }
        updateData.deadline = deadlineDate;
      } else {
        updateData.deadline = null;
      }

      if (priority && ["LOW", "MEDIUM", "HIGH", "URGENT"].includes(priority)) {
        updateData.priority = priority as any;
      }

      if (categoryId) {
        updateData.categoryId = categoryId;
      } else {
        updateData.categoryId = null;
      }
    }

    // Update request
    const updated = await prisma.request.update({
      where: { id: requestId },
      data: updateData,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: me.id,
        action: "UPDATE",
        entity: "Request",
        entityId: requestId,
        oldValue: ({
          title: currentRequest.id, // We don't store full old value to save space
          isCatalogRequest,
        } as unknown) as Prisma.InputJsonValue,
        newValue: ({
          title: updated.title,
          description: updated.description,
          ...(isCatalogRequest ? {} : {
            teamId: updated.teamId,
            deadline: updated.deadline,
            priority: updated.priority,
            categoryId: updated.categoryId,
          }),
        } as unknown) as Prisma.InputJsonValue,
      },
    });

    revalidatePath(`/requests/${requestId}`);
    revalidatePath("/requests");
    revalidatePath("/dashboard");
    revalidatePath("/leader");

    return { 
      ok: true, 
      message: isCatalogRequest 
        ? "Đã cập nhật tiêu đề và nội dung (catalog request chỉ cho sửa 2 field này)" 
        : "Đã cập nhật yêu cầu thành công" 
    };
  } catch (error) {
    console.error("[updateRequestAction]:", error);
    return { 
      ok: false, 
      message: error instanceof Error ? error.message : "Lỗi cập nhật yêu cầu" 
    };
  }
}

/**
 * Create request with template and custom fields
 */
export async function createRequestWithTemplate(data: {
  title: string;
  description: string;
  priority: string;
  categoryId: string;
  teamId?: string;
  deadline?: string;
  requesterType?: string;
  attachments?: Array<{ fileName: string; fileUrl: string }>;
  templateId?: string;
  customFields?: Record<string, any>;
}) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Chưa đăng nhập" };
    }

    const me = await ensureDbUserFromSession();

    // Optionally load template for validation or defaults
    let template: any = null;
    if (data.templateId) {
      try {
        template = await templateService.getTemplateById(data.templateId, me.id);
      } catch {}
    }

    // Validate custom fields if template used
    if (data.templateId && data.customFields) {

      if (!template) {
        return { success: false, error: "Template không tồn tại" };
      }

      const validationErrors: Record<string, string[]> = {};

      for (const field of ((template as any)?.fields ?? [])) {
        const value = data.customFields[field.id];
        const validation = fieldValidators.validate(value, {
          id: field.id,
          name: field.name,
          label: field.label,
          description: field.description || undefined,
          type: field.type as any,
          isRequired: field.isRequired,
          minLength: field.minLength || undefined,
          maxLength: field.maxLength || undefined,
          minValue: field.minValue || undefined,
          maxValue: field.maxValue || undefined,
          pattern: field.pattern || undefined,
          options: field.options ? JSON.parse(JSON.stringify(field.options)) : undefined,
          defaultValue: field.defaultValue || undefined,
          placeholder: field.placeholder || undefined,
          order: field.order,
        });

        if (!validation.isValid) {
          validationErrors[field.id] = validation.errors;
        }
      }

      if (Object.keys(validationErrors).length > 0) {
        return { success: false, error: "Validation errors", validationErrors };
      }
    }

    // Resolve category from explicit selection or template default
    const resolvedCategoryId = data.categoryId ?? template?.defaultCategoryId ?? template?.defaultCategory?.id;
    if (!resolvedCategoryId) {
      return { success: false, error: "Vui lòng chọn danh mục (category)." };
    }

    // Create request
    const request = await (prisma as any).request.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority as any,
        categoryId: resolvedCategoryId,
        teamId: data.teamId || null,
        creatorId: me.id,
        deadline: data.deadline ? new Date(data.deadline) : null,
        requesterType: (data.requesterType || "INTERNAL") as any,
        createdFromTemplateId: data.templateId || null,
      } as any,
    });

    // Create attachments if provided
    if (data.attachments && data.attachments.length > 0) {
      await prisma.attachment.createMany({
        data: data.attachments.map((a) => ({
          requestId: request.id,
          fileName: a.fileName,
          fileUrl: a.fileUrl,
          fileSize: 0, // Unknown for Drive links
          mimeType: 'application/octet-stream', // Generic type for Drive links
          uploadedById: me.id,
          uploadMethod: 'DRIVE', // Google Drive link
          driveLink: a.fileUrl, // Also store in driveLink field
        })) as any,
      });
    }

    // Create custom field values
    if (data.templateId && data.customFields) {
      const fieldValues = Object.entries(data.customFields).map(([fieldId, value]) => ({
        fieldId,
        requestId: request.id,
        value: value as any,
      }));

      // Note: Requires Prisma migration to be run first
      await (prisma as any).customFieldValue.createMany({
        data: fieldValues,
      });

      await (templateService as any).incrementUsage(data.templateId);
    }

    await prisma.auditLog.create({
      data: {
        action: "CREATE",
        entity: "Request",
        entityId: request.id,
        userId: me.id,
        newValue: ({
          title: request.title,
          templateId: data.templateId,
        } as unknown) as Prisma.InputJsonValue,
      },
    });

    revalidatePath("/requests");

    return { success: true, request };
  } catch (error) {
    console.error("[createRequestWithTemplate]:", error);
    return { success: false, error: "Lỗi tạo request" };
  }
}

/**
 * Update request (legacy wrapper)
 * @deprecated Use updateRequestAction instead
 */
export async function updateRequest(data: {
  id: string;
  title?: string;
  description?: string;
  teamId?: string | null;
  deadline?: string | null;
  priority?: string;
  categoryId?: string | null;
}) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Chưa đăng nhập" };
    }

    if (!data.id) {
      return { success: false, error: "Request ID is required" };
    }

    // Convert to FormData and use updateRequestAction
    const formData = new FormData();
    if (data.title) formData.set("title", data.title);
    if (data.description) formData.set("description", data.description);
    if (data.teamId !== undefined) formData.set("teamId", data.teamId || "");
    if (data.deadline !== undefined) formData.set("deadline", data.deadline || "");
    if (data.priority) formData.set("priority", data.priority);
    if (data.categoryId !== undefined) formData.set("categoryId", data.categoryId || "");

    const result = await updateRequestAction(data.id, formData);
    return { success: result.ok, error: result.ok ? undefined : result.message };
  } catch (error) {
    console.error("[updateRequest]:", error);
    return { success: false, error: "Lỗi cập nhật request" };
  }
}

/**
 * Simple createRequest function (legacy support)
 * For backward compatibility with request-confirm-step.tsx
 */
export async function createRequest(data: any) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Chưa đăng nhập" };
    }

    const userId = (session.user as any).id as string;

    // Determine teamId
    let teamId: string | null | undefined = data.teamId;

    // Validate category (only required when template is used)
    if (data?.templateId && !data?.categoryId) {
      return { success: false, error: "Vui lòng chọn danh mục (category) khi sử dụng template." };
    }

    const request = await prisma.request.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority,
        categoryId: data.categoryId || null,
        teamId: teamId || null,
        creatorId: userId,
        requesterType: data.requesterType,
        deadline: data.deadlineTo ? new Date(data.deadlineTo) : null,
      } as any,
    });

    await prisma.auditLog.create({
      data: {
        action: "CREATE",
        entity: "Request",
        entityId: request.id,
        userId,
        newValue: ({ title: request.title } as unknown) as import("@prisma/client").Prisma.InputJsonValue,
      },
    });

    return { success: true, requestId: request.id };
  } catch (error) {
    console.error("[createRequest]:", error);
    return { success: false, error: "Lỗi tạo yêu cầu" };
  }
}