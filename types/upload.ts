/**
 * Upload Types
 * Type definitions for file upload responses and errors
 */

import type { UploadMethod, ScanStatus } from "@prisma/client";

/**
 * Response from successful file upload
 */
export interface UploadResponse {
  attachmentId: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
}

/**
 * Upload error codes
 */
export type UploadErrorCode =
  | "UNAUTHORIZED"
  | "FILE_TOO_LARGE"
  | "INVALID_FILE_TYPE"
  | "UPLOAD_FAILED"
  | "SCAN_FAILED"
  | "DATABASE_ERROR";

/**
 * Error response from file upload
 */
export interface UploadError {
  code: UploadErrorCode;
  message: string;
}

/**
 * Attachment metadata for display
 */
export interface AttachmentMetadata {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileUrl: string | null;
  driveLink: string | null;
  externalUrl: string | null;
  uploadMethod: UploadMethod;
  scanStatus: ScanStatus;
  scanScore: number | null;
  version: number;
  uploadedById: string;
  uploadedBy?: {
    name: string;
    email: string;
  };
  createdAt: Date;
}

/**
 * File upload options
 */
export interface FileUploadOptions {
  requestId?: string;
  taskId?: string;
  replacesId?: string; // For versioning - ID of file to replace
}

/**
 * Drive link upload payload
 */
export interface DriveLinkUpload {
  fileName: string;
  driveLink: string;
  fileSize: number;
  mimeType: string;
  requestId?: string;
  taskId?: string;
}

/**
 * External URL upload payload
 */
export interface ExternalUrlUpload {
  fileName: string;
  externalUrl: string;
  mimeType: string;
  requestId?: string;
  taskId?: string;
}

/**
 * Virus scan result
 */
export interface VirusScanResult {
  attachmentId: string;
  scanStatus: ScanStatus;
  scanScore: number | null;
  scanDetails: Record<string, any> | null;
  scannedAt: Date | null;
  isSafe: boolean;
}

