"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { virusScanService } from "@/lib/services/virus-scan-service";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Attachment, ScanStatus, UploadMethod } from "@prisma/client";

/**
 * Server Actions for File Upload Operations
 * 
 * Provides comprehensive upload workflow including:
 * - Virus scanning with VirusTotal
 * - File deletion with RBAC
 * - File replacement with versioning
 * - Attachment queries
 * - Scan configuration (admin only)
 * 
 * References: mindmap UP, VSCAN, ERR, H2, SCAN_SERVICE
 */

// =============================================================================
// Zod Validation Schemas
// =============================================================================

const triggerVirusScanSchema = z.object({
  attachmentId: z.string().min(1, "ID không hợp lệ"),
});

const uploadDriveLinkSchema = z.object({
  fileName: z.string().min(1, "Tên file không được để trống"),
  driveLink: z.string().url("URL không hợp lệ").refine(
    (url) => url.includes("drive.google.com"),
    "Chỉ chấp nhận link Google Drive"
  ),
  requestId: z.string().optional(),
  taskId: z.string().optional(),
  replacesId: z.string().optional(),
});

const uploadExternalUrlSchema = z.object({
  fileName: z.string().min(1, "Tên file không được để trống"),
  externalUrl: z.string().url("URL không hợp lệ").refine(
    (url) => url.startsWith("https://"),
    "Chỉ chấp nhận URL HTTPS"
  ),
  requestId: z.string().optional(),
  taskId: z.string().optional(),
  replacesId: z.string().optional(),
});

const deleteAttachmentSchema = z.object({
  attachmentId: z.string().min(1, "ID không hợp lệ"),
});

const getAttachmentsByEntitySchema = z.object({
  entityId: z.string().min(1, "ID không hợp lệ"),
  entityType: z.enum(["request", "task"], {
    message: "Loại không hợp lệ",
  }),
});

const updateScanConfigSchema = z.object({
  safetyThreshold: z.number().min(0).max(100).optional(),
  maxFileSize: z.number().positive().optional(),
  scanTimeout: z.number().positive().optional(),
  cacheDuration: z.number().positive().optional(),
  allowedMimeTypes: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Check if user has permission to delete attachment
 * RBAC: Uploader, Request Owner, Team Leader, Admin
 */
async function canDeleteAttachment(
  userId: string,
  userRole: Role,
  attachment: Attachment
): Promise<boolean> {
  // Admin can delete anything
  if (userRole === "ADMIN") return true;

  // Uploader can delete their own files
  if (attachment.uploadedById === userId) return true;

  // Check if user is request owner
  if (attachment.requestId) {
    const request = await prisma.request.findUnique({
      where: { id: attachment.requestId },
      include: { team: true },
    });

    if (request?.creatorId === userId) return true;

    // Check if user is team leader
    if (request?.team) {
      const teamLeader = await prisma.team.findUnique({
        where: { id: request.team.id },
      });
      if (teamLeader?.leaderId === userId) return true;
    }
  }

  // Check if user is task assignee or request owner (via task)
  if (attachment.taskId) {
    const task = await prisma.task.findUnique({
      where: { id: attachment.taskId },
      include: { request: { include: { team: true } } },
    });

    if (task?.assigneeId === userId) return true;
    if (task?.request.creatorId === userId) return true;

    // Check team leader via task's request
    if (task?.request.team) {
      const teamLeader = await prisma.team.findUnique({
        where: { id: task.request.team.id },
      });
      if (teamLeader?.leaderId === userId) return true;
    }
  }

  return false;
}

/**
 * Check if user can view entity (request or task)
 */
async function canViewEntity(
  userId: string,
  userRole: Role,
  entityId: string,
  entityType: "request" | "task"
): Promise<boolean> {
  // Admin can view everything
  if (userRole === "ADMIN") return true;

  if (entityType === "request") {
    const request = await prisma.request.findUnique({
      where: { id: entityId },
      include: { team: { include: { members: true } } },
    });

    if (!request) return false;

    // Creator can view
    if (request.creatorId === userId) return true;

    // Team members can view
    if (request.team?.members.some((m) => m.id === userId)) return true;
  }

  if (entityType === "task") {
    const task = await prisma.task.findUnique({
      where: { id: entityId },
      include: { request: { include: { team: { include: { members: true } } } } },
    });

    if (!task) return false;

    // Assignee can view
    if (task.assigneeId === userId) return true;

    // Request creator can view
    if (task.request.creatorId === userId) return true;

    // Team members can view
    if (task.request.team?.members.some((m) => m.id === userId)) return true;
  }

  return false;
}

// =============================================================================
// Action 1: Trigger Virus Scan
// =============================================================================

/**
 * Trigger virus scan for an attachment
 * 
 * @param attachmentId - Attachment ID to scan
 * @returns Scan result with status and score
 * 
 * Workflow:
 * 1. Validate user authentication
 * 2. Check if user is uploader or admin
 * 3. For FILE uploads: Call VirusScanService
 * 4. For DRIVE/URL: Set status to SKIPPED
 * 5. Update Attachment with scan results
 * 6. Create audit log
 * 
 * Refs: mindmap VSCAN, SCAN_SERVICE
 */
export async function triggerVirusScan(attachmentId: string) {
  try {
    // Validate input
    const validated = triggerVirusScanSchema.parse({ attachmentId });

    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Chưa đăng nhập" };
    }

    // Get attachment
    const attachment = await prisma.attachment.findUnique({
      where: { id: validated.attachmentId },
    });

    if (!attachment) {
      return { success: false, error: "File không tồn tại" };
    }

    // Get user for role check
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    // Permission check: uploader or admin
    if (
      attachment.uploadedById !== session.user.id &&
      user?.role !== "ADMIN"
    ) {
      return { success: false, error: "Không có quyền quét file này" };
    }

    // Handle different upload methods
    if (attachment.uploadMethod === "DRIVE" || attachment.uploadMethod === "URL") {
      // Skip scanning for Drive/URL links
      await prisma.attachment.update({
        where: { id: attachment.id },
        data: { scanStatus: "SKIPPED" as ScanStatus },
      });

      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "VIRUS_SCAN_SKIPPED",
          entity: "Attachment",
          entityId: attachment.id,
          newValue: { scanStatus: "SKIPPED", reason: `${attachment.uploadMethod} link` },
        },
      });

      return {
        success: true,
        status: "SKIPPED" as ScanStatus,
        score: null,
        source: "skipped" as const,
      };
    }

    // Scan FILE uploads
    if (attachment.uploadMethod === "FILE") {
      if (!attachment.fileUrl) {
        return { success: false, error: "File URL không tồn tại" };
      }

      // Update status to SCANNING
      await prisma.attachment.update({
        where: { id: attachment.id },
        data: { scanStatus: "SCANNING" as ScanStatus },
      });

      try {
        // Call VirusScanService with 30s timeout
        const scanPromise = virusScanService.scanAttachment(attachment.id);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("SCAN_TIMEOUT")), 30000)
        );

        const result = await Promise.race([scanPromise, timeoutPromise]) as any;

        // Create audit log
        await prisma.auditLog.create({
          data: {
            userId: session.user.id,
            action: "VIRUS_SCAN_COMPLETED",
            entity: "Attachment",
            entityId: attachment.id,
            oldValue: { scanStatus: "PENDING" },
            newValue: {
              scanStatus: result.status,
              scanScore: result.score,
              source: result.source,
            },
          },
        });

        return {
          success: true,
          status: result.status,
          score: result.score,
          source: result.source,
        };
      } catch (scanError: any) {
        console.error("Scan failed:", scanError);

        // Update status to ERROR
        await prisma.attachment.update({
          where: { id: attachment.id },
          data: {
            scanStatus: "ERROR" as ScanStatus,
            scanDetails: { error: scanError.message },
          },
        });

        // Create audit log for failure
        await prisma.auditLog.create({
          data: {
            userId: session.user.id,
            action: "VIRUS_SCAN_FAILED",
            entity: "Attachment",
            entityId: attachment.id,
            newValue: { error: scanError.message },
          },
        });

        // Handle specific errors
        if (scanError.message === "RATE_LIMIT_EXCEEDED") {
          return {
            success: false,
            error: "Đã vượt giới hạn quét. Vui lòng thử lại sau.",
          };
        }

        if (scanError.message === "SCAN_TIMEOUT") {
          return {
            success: false,
            error: "Quét file quá lâu. Vui lòng thử lại.",
          };
        }

        return {
          success: false,
          error: "Không thể quét file. Vui lòng thử lại.",
        };
      }
    }

    return { success: false, error: "Phương thức upload không hợp lệ" };
  } catch (error) {
    console.error("triggerVirusScan error:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues?.[0]?.message || "Dữ liệu không hợp lệ",
      };
    }

    return {
      success: false,
      error: "Lỗi hệ thống. Vui lòng thử lại.",
    };
  }
}

// =============================================================================
// Action 2: Delete Attachment
// =============================================================================

/**
 * Delete an attachment with RBAC checks
 * 
 * @param attachmentId - Attachment ID to delete
 * @returns Success status
 * 
 * RBAC: Uploader, Request Owner, Team Leader, Admin
 * 
 * Note: Uploadthing files auto-delete after 30 days on free tier.
 * For immediate deletion, upgrade to paid plan and use UTApi.
 */
export async function deleteAttachment(attachmentId: string) {
  try {
    // Validate input
    const validated = deleteAttachmentSchema.parse({ attachmentId });

    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Chưa đăng nhập" };
    }

    // Get attachment
    const attachment = await prisma.attachment.findUnique({
      where: { id: validated.attachmentId },
    });

    if (!attachment) {
      return { success: false, error: "File không tồn tại" };
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return { success: false, error: "User không tồn tại" };
    }

    // Check permissions with RBAC
    const hasPermission = await canDeleteAttachment(
      session.user.id,
      user.role,
      attachment
    );

    if (!hasPermission) {
      return { success: false, error: "Không có quyền xóa file này" };
    }

    // Delete attachment from database
    await prisma.attachment.delete({
      where: { id: attachment.id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "ATTACHMENT_DELETED",
        entity: "Attachment",
        entityId: attachment.id,
        oldValue: {
          fileName: attachment.fileName,
          fileSize: attachment.fileSize,
          uploadMethod: attachment.uploadMethod,
        },
      },
    });

    // Revalidate cache
    if (attachment.requestId) {
      revalidatePath(`/requests/${attachment.requestId}`);
      revalidatePath("/requests");
    }
    if (attachment.taskId) {
      revalidatePath(`/my-tasks`);
    }

    return { success: true };
  } catch (error) {
    console.error("deleteAttachment error:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues?.[0]?.message || "Dữ liệu không hợp lệ",
      };
    }

    return {
      success: false,
      error: "Không thể xóa file. Vui lòng thử lại.",
    };
  }
}

// =============================================================================
// Action 3: Replace Attachment (Versioning)
// =============================================================================

/**
 * Replace an attachment with a new version
 * 
 * @param oldAttachmentId - ID of attachment to replace
 * @param newFileData - New file data from upload
 * @returns New attachment with incremented version
 * 
 * Workflow:
 * 1. Get old attachment
 * 2. Create new attachment with version = old.version + 1
 * 3. Link via replacesId
 * 4. Trigger virus scan on new file
 * 5. Create audit log
 * 
 * Refs: mindmap H2 (Versioning)
 */
export async function replaceAttachment(
  oldAttachmentId: string,
  newFileData: {
    fileName: string;
    fileSize: number;
    mimeType: string;
    fileUrl: string;
  }
) {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Chưa đăng nhập" };
    }

    // Get old attachment
    const oldAttachment = await prisma.attachment.findUnique({
      where: { id: oldAttachmentId },
    });

    if (!oldAttachment) {
      return { success: false, error: "File cũ không tồn tại" };
    }

    // Permission check
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    const hasPermission = await canDeleteAttachment(
      session.user.id,
      user?.role ?? Role.STAFF,
      oldAttachment
    );

    if (!hasPermission) {
      return { success: false, error: "Không có quyền thay thế file này" };
    }

    // Create new attachment with incremented version
    const newAttachment = await prisma.attachment.create({
      data: {
        fileName: newFileData.fileName,
        fileSize: newFileData.fileSize,
        mimeType: newFileData.mimeType,
        fileUrl: newFileData.fileUrl,
        uploadMethod: "FILE" as UploadMethod,
        scanStatus: "PENDING" as ScanStatus,
        version: oldAttachment.version + 1,
        replacesId: oldAttachment.id,
        uploadedById: session.user.id,
        requestId: oldAttachment.requestId,
        taskId: oldAttachment.taskId,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "ATTACHMENT_REPLACED",
        entity: "Attachment",
        entityId: newAttachment.id,
        oldValue: {
          id: oldAttachment.id,
          fileName: oldAttachment.fileName,
          version: oldAttachment.version,
        },
        newValue: {
          id: newAttachment.id,
          fileName: newAttachment.fileName,
          version: newAttachment.version,
        },
      },
    });

    // Trigger virus scan on new file
    await triggerVirusScan(newAttachment.id);

    // Revalidate cache
    if (oldAttachment.requestId) {
      revalidatePath(`/requests/${oldAttachment.requestId}`);
    }

    return { success: true, newAttachment };
  } catch (error) {
    console.error("replaceAttachment error:", error);

    return {
      success: false,
      error: "Không thể thay thế file. Vui lòng thử lại.",
    };
  }
}

// =============================================================================
// Action 4: Get Attachments by Entity
// =============================================================================

/**
 * Get all attachments for a request or task
 * 
 * @param entityId - Request or Task ID
 * @param entityType - "request" or "task"
 * @returns List of attachments with metadata
 * 
 * Features:
 * - Includes uploader information
 * - Includes scan status
 * - Sorted by version DESC (latest first)
 * - RBAC: Only accessible to authorized users
 */
export async function getAttachmentsByEntity(
  entityId: string,
  entityType: "request" | "task"
) {
  try {
    // Validate input
    const validated = getAttachmentsByEntitySchema.parse({ entityId, entityType });

    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Chưa đăng nhập" };
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return { success: false, error: "User không tồn tại" };
    }

    // Check if user can view entity
    const canView = await canViewEntity(
      session.user.id,
      user.role,
      validated.entityId,
      validated.entityType
    );

    if (!canView) {
      return { success: false, error: "Không có quyền xem file" };
    }

    // Query attachments
    const whereClause = validated.entityType === "request"
      ? { requestId: validated.entityId }
      : { taskId: validated.entityId };

    const attachments = await prisma.attachment.findMany({
      where: whereClause,
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        replaces: {
          select: {
            id: true,
            fileName: true,
            version: true,
          },
        },
      },
      orderBy: [
        { version: "desc" },
        { createdAt: "desc" },
      ],
    });

    return { success: true, attachments };
  } catch (error) {
    console.error("getAttachmentsByEntity error:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues?.[0]?.message || "Dữ liệu không hợp lệ",
      };
    }

    return {
      success: false,
      error: "Không thể tải danh sách file. Vui lòng thử lại.",
    };
  }
}

// =============================================================================
// Action 5: Update Scan Configuration (Admin Only)
// =============================================================================

/**
 * Update virus scan configuration
 * 
 * @param config - Partial configuration to update
 * @returns Success status
 * 
 * RBAC: ADMIN only
 * 
 * Configurable:
 * - safetyThreshold: 0-100 (default: 80)
 * - maxFileSize: bytes (default: 20MB)
 * - scanTimeout: seconds (default: 30)
 * - cacheDuration: seconds (default: 86400 = 24h)
 * - allowedMimeTypes: string array
 * - isActive: boolean
 * 
 * Refs: mindmap CONF_SCAN
 */
export async function updateScanConfig(
  config: {
    safetyThreshold?: number;
    maxFileSize?: number;
    scanTimeout?: number;
    cacheDuration?: number;
    allowedMimeTypes?: string[];
    isActive?: boolean;
  }
) {
  try {
    // Validate input
    const validated = updateScanConfigSchema.parse(config);

    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Chưa đăng nhập" };
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    // Admin only
    if (user?.role !== "ADMIN") {
      return { success: false, error: "Chỉ Admin mới có quyền thay đổi cấu hình" };
    }

    // Upsert configuration
    const updatedConfig = await prisma.virusScanConfig.upsert({
      where: { name: "default" },
      create: {
        name: "default",
        safetyThreshold: validated.safetyThreshold ?? 80,
        maxFileSize: validated.maxFileSize ?? 20971520,
        scanTimeout: validated.scanTimeout ?? 30,
        cacheDuration: validated.cacheDuration ?? 86400,
        allowedMimeTypes: validated.allowedMimeTypes ?? [
          "application/pdf",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "image/jpeg",
          "image/png",
          "application/zip",
        ],
        isActive: validated.isActive ?? true,
      },
      update: validated,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "SCAN_CONFIG_UPDATED",
        entity: "VirusScanConfig",
        entityId: updatedConfig.id,
        newValue: validated,
      },
    });

    // Reload config in VirusScanService
    await virusScanService.loadConfig();

    return { success: true, config: updatedConfig };
  } catch (error) {
    console.error("updateScanConfig error:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues?.[0]?.message || "Dữ liệu không hợp lệ",
      };
    }

    return {
      success: false,
      error: "Không thể cập nhật cấu hình. Vui lòng thử lại.",
    };
  }
}

// =============================================================================
// Legacy Actions (Keep for backward compatibility)
// =============================================================================

/**
 * Upload Google Drive link
 * @deprecated Use FileUpload component with Drive tab instead
 */
export async function uploadDriveLink(data: {
  fileName: string;
  driveLink: string;
  requestId?: string;
  taskId?: string;
  replacesId?: string;
}) {
  try {
    const validated = uploadDriveLinkSchema.parse(data);
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: "Chưa đăng nhập" };
    }

    let version = 1;
    if (validated.replacesId) {
      const old = await prisma.attachment.findUnique({
        where: { id: validated.replacesId },
      });
      if (old) version = old.version + 1;
    }

    const attachment = await prisma.attachment.create({
      data: {
        fileName: validated.fileName,
        fileSize: 0,
        mimeType: "application/octet-stream",
        driveLink: validated.driveLink,
        uploadMethod: "DRIVE",
        scanStatus: "SKIPPED",
        uploadedById: session.user.id,
        requestId: validated.requestId,
        taskId: validated.taskId,
        version,
        replacesId: validated.replacesId,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DRIVE_LINK_UPLOAD",
        entity: "Attachment",
        entityId: attachment.id,
        newValue: { fileName: validated.fileName, driveLink: validated.driveLink, version },
      },
    });

    if (validated.requestId) {
      revalidatePath(`/requests/${validated.requestId}`);
    }

    return { success: true, attachment };
  } catch (error) {
    console.error("uploadDriveLink error:", error);

    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues?.[0]?.message || "Dữ liệu không hợp lệ" };
    }

    return { success: false, error: "Không thể thêm link Drive. Vui lòng thử lại." };
  }
}

/**
 * Upload external URL
 * @deprecated Use FileUpload component with URL tab instead
 */
export async function uploadExternalUrl(data: {
  fileName: string;
  externalUrl: string;
  requestId?: string;
  taskId?: string;
  replacesId?: string;
}) {
  try {
    const validated = uploadExternalUrlSchema.parse(data);
    const session = await auth();

    if (!session?.user?.id) {
      return { success: false, error: "Chưa đăng nhập" };
    }

    let version = 1;
    if (validated.replacesId) {
      const old = await prisma.attachment.findUnique({
        where: { id: validated.replacesId },
      });
      if (old) version = old.version + 1;
    }

    const attachment = await prisma.attachment.create({
      data: {
        fileName: validated.fileName,
        fileSize: 0,
        mimeType: "application/octet-stream",
        externalUrl: validated.externalUrl,
        uploadMethod: "URL",
        scanStatus: "SKIPPED",
        uploadedById: session.user.id,
        requestId: validated.requestId,
        taskId: validated.taskId,
        version,
        replacesId: validated.replacesId,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "EXTERNAL_URL_UPLOAD",
        entity: "Attachment",
        entityId: attachment.id,
        newValue: { fileName: validated.fileName, externalUrl: validated.externalUrl, version },
      },
    });

    if (validated.requestId) {
      revalidatePath(`/requests/${validated.requestId}`);
    }

    return { success: true, attachment };
  } catch (error) {
    console.error("uploadExternalUrl error:", error);

    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues?.[0]?.message || "Dữ liệu không hợp lệ" };
    }

    return { success: false, error: "Không thể thêm URL. Vui lòng thử lại." };
  }
}

/**
 * Get single attachment with scan status
 * @deprecated Use getAttachmentsByEntity instead for batch queries
 */
export async function getAttachment(attachmentId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Chưa đăng nhập" };
    }

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: {
        uploadedBy: {
          select: { name: true, email: true },
        },
      },
    });

    if (!attachment) {
      return { success: false, error: "File không tồn tại" };
    }

    return { success: true, attachment };
  } catch (error) {
    console.error("getAttachment error:", error);
    return { success: false, error: "Không thể tải thông tin file." };
  }
}
