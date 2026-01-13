/**
 * VirusTotal Scanning Service
 * 
 * Provides file security scanning using VirusTotal API v3.
 * Features:
 * - Submit files via URL to VirusTotal
 * - Retrieve scan results with safety scoring
 * - 24-hour result caching to optimize API quota (500 requests/day)
 * - Automatic database updates with scan results
 * - Comprehensive error handling for timeouts, rate limits, and network issues
 * 
 * References: mindmap VSCAN, SCAN_SERVICE, CONF_SCAN
 */

import fetch from "node-fetch";
import { prisma } from "@/lib/prisma";
import type { ScanStatus } from "@prisma/client";

const VIRUSTOTAL_API_BASE = "https://www.virustotal.com/api/v3";
const DEFAULT_TIMEOUT_MS = 30000; // 30 seconds
const DEFAULT_SAFETY_THRESHOLD = 80; // 80/100
const DEFAULT_CACHE_DURATION_HOURS = 24;

/**
 * Scan result from VirusTotal or cache
 */
export interface ScanResult {
  status: ScanStatus;
  score: number; // 0-100
  details: {
    harmless: number;
    malicious: number;
    suspicious: number;
    undetected: number;
    timeout: number;
  };
  scannedAt: Date;
  source: "virustotal" | "cached";
}

/**
 * Cached scan result from database
 */
export interface CachedScan {
  scanScore: number;
  scannedAt: Date;
  isValid: boolean; // within cache duration
}

/**
 * VirusTotal API response structure
 */
interface VirusTotalAnalysisResponse {
  data: {
    id: string;
    type: string;
    attributes: {
      status: "queued" | "completed";
      stats: {
        harmless: number;
        malicious: number;
        suspicious: number;
        undetected: number;
        timeout: number;
      };
      date: number; // Unix timestamp
    };
  };
}

/**
 * VirusTotal file URL submission response
 */
interface VirusTotalSubmitResponse {
  data: {
    type: string;
    id: string; // analysis ID
  };
}

/**
 * Service for scanning files with VirusTotal
 */
export class VirusScanService {
  private apiKey: string;
  private safetyThreshold: number;
  private cacheDurationHours: number;
  private timeoutMs: number;

  constructor() {
    this.apiKey = process.env.VIRUSTOTAL_API_KEY || "";
    this.safetyThreshold = DEFAULT_SAFETY_THRESHOLD;
    this.cacheDurationHours = DEFAULT_CACHE_DURATION_HOURS;
    this.timeoutMs = DEFAULT_TIMEOUT_MS;

    if (!this.apiKey) {
      console.warn(
        "⚠️ VIRUSTOTAL_API_KEY not configured. Virus scanning will be disabled."
      );
    }
  }

  /**
   * Check if VirusTotal API is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Load configuration from database (VirusScanConfig table)
   */
  async loadConfig(): Promise<void> {
    try {
      const config = await prisma.virusScanConfig.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
      });

      if (config) {
        this.safetyThreshold = config.safetyThreshold;
        this.cacheDurationHours = config.cacheDuration / 3600; // seconds to hours
        this.timeoutMs = config.scanTimeout * 1000; // seconds to ms
        console.log("✅ VirusScan config loaded:", {
          threshold: this.safetyThreshold,
          cacheDuration: this.cacheDurationHours + "h",
          timeout: this.timeoutMs + "ms",
        });
      }
    } catch (error) {
      console.error("❌ Failed to load VirusScanConfig:", error);
      // Use defaults if config load fails
    }
  }

  /**
   * Submit a file URL to VirusTotal for scanning
   * 
   * @param fileUrl - Public URL of the file to scan
   * @returns Scan ID for retrieving results
   * @throws Error if submission fails
   */
  async scanFileUrl(fileUrl: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error("VirusTotal API key not configured");
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      const formData = new URLSearchParams();
      formData.append("url", fileUrl);

      const response = await fetch(`${VIRUSTOTAL_API_BASE}/urls`, {
        method: "POST",
        headers: {
          "x-apikey": this.apiKey,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("RATE_LIMIT_EXCEEDED");
        }
        throw new Error(`VirusTotal API error: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as VirusTotalSubmitResponse;
      const scanId = data.data.id;

      console.log("✅ File submitted to VirusTotal:", { fileUrl, scanId });
      return scanId;
    } catch (error: any) {
      if (error.name === "AbortError") {
        throw new Error("SCAN_TIMEOUT");
      }
      if (error.message === "RATE_LIMIT_EXCEEDED") {
        throw error;
      }
      console.error("❌ VirusTotal submission failed:", error);
      throw new Error(`NETWORK_ERROR: ${error.message}`);
    }
  }

  /**
   * Get scan results from VirusTotal
   * 
   * @param scanId - Analysis ID from scanFileUrl
   * @returns Scan result with status and score
   * @throws Error if retrieval fails
   */
  async getScanResult(scanId: string): Promise<ScanResult> {
    if (!this.isConfigured()) {
      throw new Error("VirusTotal API key not configured");
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(
        `${VIRUSTOTAL_API_BASE}/analyses/${scanId}`,
        {
          method: "GET",
          headers: {
            "x-apikey": this.apiKey,
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("RATE_LIMIT_EXCEEDED");
        }
        throw new Error(`VirusTotal API error: ${response.status}`);
      }

      const data = (await response.json()) as VirusTotalAnalysisResponse;

      if (data.data.attributes.status !== "completed") {
        throw new Error("SCAN_IN_PROGRESS");
      }

      const stats = data.data.attributes.stats;
      const totalScans =
        stats.harmless +
        stats.malicious +
        stats.suspicious +
        stats.undetected +
        stats.timeout;

      // Calculate safety score: (harmless / total) * 100
      const score = totalScans > 0 ? (stats.harmless / totalScans) * 100 : 0;

      // Determine status based on threshold
      const status: ScanStatus = score >= this.safetyThreshold ? "SAFE" : "UNSAFE";

      const result: ScanResult = {
        status,
        score: Math.round(score),
        details: stats,
        scannedAt: new Date(data.data.attributes.date * 1000),
        source: "virustotal",
      };

      console.log("✅ Scan result retrieved:", { scanId, status, score });
      return result;
    } catch (error: any) {
      if (error.name === "AbortError") {
        throw new Error("SCAN_TIMEOUT");
      }
      if (error.message === "RATE_LIMIT_EXCEEDED" || error.message === "SCAN_IN_PROGRESS") {
        throw error;
      }
      console.error("❌ VirusTotal result retrieval failed:", error);
      throw new Error(`NETWORK_ERROR: ${error.message}`);
    }
  }

  /**
   * Check for cached scan results in database
   * 
   * @param fileUrl - File URL to check
   * @returns Cached scan if valid, null otherwise
   */
  async checkCachedResult(fileUrl: string): Promise<CachedScan | null> {
    try {
      // Find attachments with same URL that have been scanned
      const attachment = await prisma.attachment.findFirst({
        where: {
          fileUrl,
          scanStatus: { in: ["SAFE", "UNSAFE"] },
          scannedAt: { not: null },
          scanScore: { not: null },
        },
        orderBy: { scannedAt: "desc" },
      });

      if (!attachment || !attachment.scannedAt || attachment.scanScore === null) {
        return null;
      }

      // Check if cache is still valid
      const cacheExpiryMs = this.cacheDurationHours * 60 * 60 * 1000;
      const ageMs = Date.now() - attachment.scannedAt.getTime();
      const isValid = ageMs < cacheExpiryMs;

      if (isValid) {
        console.log("✅ Using cached scan result:", {
          fileUrl,
          score: attachment.scanScore,
          age: Math.round(ageMs / 1000 / 60) + "m",
        });
      }

      return {
        scanScore: attachment.scanScore,
        scannedAt: attachment.scannedAt,
        isValid,
      };
    } catch (error) {
      console.error("❌ Cache check failed:", error);
      return null;
    }
  }

  /**
   * Update attachment record with scan results
   * 
   * @param attachmentId - Attachment ID to update
   * @param result - Scan result to save
   */
  async updateAttachmentScan(
    attachmentId: string,
    result: ScanResult
  ): Promise<void> {
    try {
      // Update attachment
      const attachment = await prisma.attachment.update({
        where: { id: attachmentId },
        data: {
          scanStatus: result.status,
          scanScore: result.score,
          scanDetails: result.details as any,
          scannedAt: result.scannedAt,
        },
        include: {
          uploadedBy: { select: { name: true } },
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: attachment.uploadedById,
          action: "VIRUS_SCAN_COMPLETED",
          entity: "Attachment",
          entityId: attachmentId,
          oldValue: { scanStatus: "PENDING" },
          newValue: {
            scanStatus: result.status,
            scanScore: result.score,
            source: result.source,
          },
        },
      });

      console.log("✅ Attachment scan updated:", {
        attachmentId,
        status: result.status,
        score: result.score,
        uploadedBy: attachment.uploadedBy.name,
      });
    } catch (error) {
      console.error("❌ Failed to update attachment scan:", error);
      throw new Error("DATABASE_ERROR");
    }
  }

  /**
   * Scan a file with automatic caching
   * High-level method that combines cache check + scan + update
   * 
   * @param attachmentId - Attachment ID to scan
   * @returns Scan result
   */
  async scanAttachment(attachmentId: string): Promise<ScanResult> {
    try {
      const attachment = await prisma.attachment.findUnique({
        where: { id: attachmentId },
      });

      if (!attachment) {
        throw new Error("Attachment not found");
      }

      // Skip scanning for Drive links and external URLs
      if (attachment.uploadMethod === "DRIVE" || attachment.uploadMethod === "URL") {
        const result: ScanResult = {
          status: "SKIPPED",
          score: 0,
          details: { harmless: 0, malicious: 0, suspicious: 0, undetected: 0, timeout: 0 },
          scannedAt: new Date(),
          source: "cached",
        };
        await this.updateAttachmentScan(attachmentId, result);
        return result;
      }

      // Check cache first
      if (attachment.fileUrl) {
        const cached = await this.checkCachedResult(attachment.fileUrl);
        if (cached && cached.isValid) {
          const result: ScanResult = {
            status: cached.scanScore >= this.safetyThreshold ? "SAFE" : "UNSAFE",
            score: cached.scanScore,
            details: { harmless: 0, malicious: 0, suspicious: 0, undetected: 0, timeout: 0 },
            scannedAt: cached.scannedAt,
            source: "cached",
          };
          await this.updateAttachmentScan(attachmentId, result);
          return result;
        }
      }

      if (!attachment.fileUrl) {
        throw new Error("File URL not available");
      }

      // Submit to VirusTotal
      await prisma.attachment.update({
        where: { id: attachmentId },
        data: { scanStatus: "SCANNING" },
      });

      const scanId = await this.scanFileUrl(attachment.fileUrl);

      // Poll for results (with retry logic)
      let result: ScanResult;
      let retries = 0;
      const maxRetries = 5;

      while (retries < maxRetries) {
        try {
          await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2s between polls
          result = await this.getScanResult(scanId);
          break;
        } catch (error: any) {
          if (error.message === "SCAN_IN_PROGRESS") {
            retries++;
            if (retries >= maxRetries) {
              throw new Error("SCAN_TIMEOUT");
            }
            continue;
          }
          throw error;
        }
      }

      // Update database
      await this.updateAttachmentScan(attachmentId, result!);
      return result!;
    } catch (error: any) {
      console.error("❌ Scan attachment failed:", error);

      // Update attachment with error status
      let errorStatus: ScanStatus = "ERROR";
      if (error.message === "RATE_LIMIT_EXCEEDED") {
        errorStatus = "PENDING"; // Retry later
      }

      await prisma.attachment.update({
        where: { id: attachmentId },
        data: {
          scanStatus: errorStatus,
          scanDetails: { error: error.message },
          scannedAt: new Date(),
        },
      });

      throw error;
    }
  }
}

// Export singleton instance
export const virusScanService = new VirusScanService();

