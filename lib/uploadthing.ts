import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UploadMethod } from "@prisma/client";

const f = createUploadthing();

/**
 * Uploadthing FileRouter
 * Handles file uploads with:
 * - Authentication required
 * - 16MB max file size
 * - MIME type whitelist
 * - Auto-create Attachment with PENDING scan status
 * - Audit logging
 */
export const uploadRouter = {
  // Main file uploader for requests and tasks
  fileUploader: f({
    // Allowed MIME types based on mindmap (UP)
    "application/pdf": { maxFileSize: "16MB" },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      maxFileSize: "16MB",
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
      maxFileSize: "16MB",
    },
    "image/jpeg": { maxFileSize: "16MB" },
    "image/png": { maxFileSize: "16MB" },
    "application/zip": { maxFileSize: "16MB" },
  })
    .middleware(async ({ req }) => {
      // Auth guard: check session
      const session = await auth();
      if (!session?.user?.id) {
        throw new UploadThingError("Unauthorized - You must be logged in to upload files");
      }

      // Return metadata to be available in onUploadComplete
      return {
        userId: session.user.id,
        userName: session.user.name || "Unknown",
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Create Attachment record with PENDING scan status
      const attachment = await prisma.attachment.create({
        data: {
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          fileUrl: file.url,
          uploadMethod: "FILE" as UploadMethod,
          scanStatus: "PENDING", // Will be scanned by background job
          uploadedById: metadata.userId,
        },
      });

      // Log to AuditLog
      await prisma.auditLog.create({
        data: {
          userId: metadata.userId,
          action: "FILE_UPLOAD",
          entity: "Attachment",
          entityId: attachment.id,
          newValue: {
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            uploadMethod: "FILE",
          },
        },
      });

      console.log("✅ File uploaded:", {
        attachmentId: attachment.id,
        fileName: file.name,
        uploadedBy: metadata.userName,
      });

      // Return attachment ID for client to associate with request/task
      return {
        attachmentId: attachment.id,
        fileUrl: file.url,
        fileName: file.name,
        fileSize: file.size,
        uploadedAt: attachment.createdAt.toISOString(),
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;

