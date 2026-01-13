/**
 * VirusTotal Scanning Service - Usage Examples
 * 
 * This file contains practical examples for using the VirusScanService.
 * DO NOT import this file - it's for reference only.
 */

import { virusScanService } from "./virus-scan-service";
import type { ScanResult, CachedScan } from "./virus-scan-service";

// =============================================================================
// EXAMPLE 1: Scan a newly uploaded file
// =============================================================================
async function exampleScanNewUpload(attachmentId: string) {
  try {
    const result = await virusScanService.scanAttachment(attachmentId);
    
    console.log("Scan complete:", {
      status: result.status,      // "SAFE" | "UNSAFE" | "ERROR" | "SKIPPED"
      score: result.score,        // 0-100
      source: result.source,      // "virustotal" | "cached"
      scannedAt: result.scannedAt,
      details: result.details,    // { harmless, malicious, suspicious, etc. }
    });

    // Handle unsafe files
    if (result.status === "UNSAFE") {
      console.warn("⚠️ Unsafe file detected!");
      // TODO: Notify admin, block download, etc.
    }

    return result;
  } catch (error: any) {
    console.error("Scan failed:", error.message);
    
    // Handle specific errors
    if (error.message === "RATE_LIMIT_EXCEEDED") {
      console.log("Will retry later...");
    } else if (error.message === "SCAN_TIMEOUT") {
      console.log("Scan took too long");
    }
    
    throw error;
  }
}

// =============================================================================
// EXAMPLE 2: Check cache before scanning (optimize quota)
// =============================================================================
async function exampleCheckCache(fileUrl: string) {
  const cached = await virusScanService.checkCachedResult(fileUrl);
  
  if (cached && cached.isValid) {
    console.log("✅ Cache hit! Score:", cached.scanScore);
    return {
      status: cached.scanScore >= 80 ? "SAFE" : "UNSAFE",
      score: cached.scanScore,
      source: "cached",
    };
  }
  
  console.log("❌ Cache miss, need to scan");
  return null;
}

// =============================================================================
// EXAMPLE 3: Manual scan workflow (advanced)
// =============================================================================
async function exampleManualScan(fileUrl: string, attachmentId: string) {
  // Step 1: Submit file to VirusTotal
  console.log("Submitting file to VirusTotal...");
  const scanId = await virusScanService.scanFileUrl(fileUrl);
  console.log("Scan ID:", scanId);

  // Step 2: Wait for scan to complete
  await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3s

  // Step 3: Get results
  console.log("Fetching results...");
  let result: ScanResult;
  let attempts = 0;
  
  while (attempts < 5) {
    try {
      result = await virusScanService.getScanResult(scanId);
      break; // Success!
    } catch (error: any) {
      if (error.message === "SCAN_IN_PROGRESS") {
        attempts++;
        console.log(`Still scanning... (attempt ${attempts}/5)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
      throw error; // Other error
    }
  }

  // Step 4: Update database
  console.log("Updating database...");
  await virusScanService.updateAttachmentScan(attachmentId, result!);
  
  return result!;
}

// =============================================================================
// EXAMPLE 4: Background job to scan pending files
// =============================================================================
async function exampleBackgroundScanJob() {
  const { prisma } = await import("@/lib/prisma");
  
  // Load config from database
  await virusScanService.loadConfig();
  
  // Get pending attachments
  const pending = await prisma.attachment.findMany({
    where: {
      scanStatus: "PENDING",
      uploadMethod: "FILE",
      fileUrl: { not: null },
    },
    take: 10, // Limit to avoid rate limits
    orderBy: { createdAt: "asc" },
  });

  console.log(`🔍 Found ${pending.length} files to scan`);

  for (const attachment of pending) {
    try {
      console.log(`Scanning: ${attachment.fileName}...`);
      await virusScanService.scanAttachment(attachment.id);
      console.log(`✅ Done: ${attachment.fileName}`);
      
      // Rate limit protection: 4 req/min = 15s between requests
      await new Promise(resolve => setTimeout(resolve, 15000));
    } catch (error: any) {
      console.error(`❌ Failed: ${attachment.fileName}`, error.message);
      
      // Stop on rate limit
      if (error.message === "RATE_LIMIT_EXCEEDED") {
        console.log("⏸️ Rate limit reached, stopping job");
        break;
      }
    }
  }
}

// =============================================================================
// EXAMPLE 5: Server action for manual rescan
// =============================================================================
async function exampleRescanServerAction(attachmentId: string, userId: string) {
  "use server";
  
  const { prisma } = await import("@/lib/prisma");
  
  // Verify permission
  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
    include: { uploadedBy: true },
  });

  if (!attachment) {
    throw new Error("Attachment not found");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (attachment.uploadedById !== userId && user?.role !== "ADMIN") {
    throw new Error("Forbidden");
  }

  // Force rescan (ignores cache)
  const result = await virusScanService.scanAttachment(attachmentId);

  return {
    success: true,
    status: result.status,
    score: result.score,
    details: result.details,
  };
}

// =============================================================================
// EXAMPLE 6: Check if service is configured
// =============================================================================
function exampleCheckConfiguration() {
  if (!virusScanService.isConfigured()) {
    console.warn("⚠️ VirusTotal API key not configured!");
    console.warn("Add VIRUSTOTAL_API_KEY to .env.local");
    console.warn("Get free key: https://www.virustotal.com/gui/join-us");
    return false;
  }
  
  console.log("✅ VirusTotal service ready");
  return true;
}

// =============================================================================
// EXAMPLE 7: Error handling patterns
// =============================================================================
async function exampleErrorHandling(attachmentId: string) {
  try {
    const result = await virusScanService.scanAttachment(attachmentId);
    return { success: true, result };
  } catch (error: any) {
    const errorMessage = error.message;
    
    switch (true) {
      case errorMessage === "RATE_LIMIT_EXCEEDED":
        return {
          success: false,
          error: "Rate limit exceeded. Please try again later.",
          retryAfter: 60000, // 1 minute
        };
        
      case errorMessage === "SCAN_TIMEOUT":
        return {
          success: false,
          error: "Scan timed out. The file may be too large or VirusTotal is busy.",
        };
        
      case errorMessage.startsWith("NETWORK_ERROR"):
        return {
          success: false,
          error: "Network error. Please check your internet connection.",
        };
        
      case errorMessage === "DATABASE_ERROR":
        return {
          success: false,
          error: "Failed to save scan results. Please contact support.",
        };
        
      case errorMessage === "VirusTotal API key not configured":
        return {
          success: false,
          error: "Virus scanning is not available at this time.",
        };
        
      default:
        return {
          success: false,
          error: "Unknown error occurred during scanning.",
        };
    }
  }
}

// =============================================================================
// EXAMPLE 8: TypeScript type usage
// =============================================================================
function exampleTypeUsage() {
  // ScanResult type
  const scanResult: ScanResult = {
    status: "SAFE",
    score: 92,
    details: {
      harmless: 73,
      malicious: 0,
      suspicious: 2,
      undetected: 4,
      timeout: 0,
    },
    scannedAt: new Date(),
    source: "virustotal",
  };

  // CachedScan type
  const cachedScan: CachedScan = {
    scanScore: 85,
    scannedAt: new Date(Date.now() - 3600000), // 1 hour ago
    isValid: true,
  };

  // Type guards
  if (scanResult.source === "virustotal") {
    console.log("Fresh scan from VirusTotal");
  } else {
    console.log("Using cached result");
  }
}

// =============================================================================
// EXPORT (for reference only)
// =============================================================================
export {
  exampleScanNewUpload,
  exampleCheckCache,
  exampleManualScan,
  exampleBackgroundScanJob,
  exampleRescanServerAction,
  exampleCheckConfiguration,
  exampleErrorHandling,
  exampleTypeUsage,
};

