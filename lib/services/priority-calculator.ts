import { Prisma, Priority, RequesterType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

// Interfaces
export interface ScoreInput {
  urgency?: number;
  impact?: number;
  risk?: number;
  custom?: Record<string, number>;
}

export interface CalculationResult {
  totalScore: number;
  priority: Priority;
  reason: string;
}

// Cache configuration
const CACHE_TTL = 5 * 60; // 5 minutes

/**
 * Get active priority configurations, cached for 5 minutes
 */
export async function getActivePriorityConfigs() {
  return unstable_cache(
    async () => {
      return await prisma.priorityConfig.findMany({
        where: { isActive: true },
        orderBy: { order: "asc" },
      });
    },
    ["priority-configs"],
    { revalidate: CACHE_TTL }
  )();
}

/**
 * Get priority thresholds, cached for 5 minutes
 */
export async function getPriorityThresholds() {
  return unstable_cache(
    async () => {
      return await prisma.priorityThreshold.findMany({
        orderBy: { minScore: "asc" },
      });
    },
    ["priority-thresholds"],
    { revalidate: CACHE_TTL }
  )();
}

/**
 * Map a calculated score to a priority level
 */
/**
 * Apply tie-breaker logic based on requester type
 * CUSTOMER: bump up one priority level (max URGENT)
 * INTERNAL: no change
 */
export function applyTieBreaker(priority: Priority, requesterType: RequesterType): Priority {
  if (requesterType === "CUSTOMER") {
    switch (priority) {
      case Priority.LOW:
        return Priority.MEDIUM;
      case Priority.MEDIUM:
        return Priority.HIGH;
      case Priority.HIGH:
        return Priority.URGENT;
      case Priority.URGENT:
        return Priority.URGENT; // Already at max
      default:
        return priority;
    }
  }
  
  // INTERNAL requester: no change
  return priority;
}

export async function mapScoreToPriority(
  score: number,
  requesterType: RequesterType
): Promise<Priority> {
  const thresholds = await getPriorityThresholds();
  
  // Find matching threshold where minScore <= score < maxScore
  const matchingThresholds = thresholds.filter(
    (threshold) => score >= threshold.minScore && score < threshold.maxScore
  );

  if (matchingThresholds.length === 0) {
    throw new Error(`No priority threshold found for score: ${score}`);
  }

  // If multiple thresholds match (tie), prefer CUSTOMER over INTERNAL
  if (matchingThresholds.length > 1) {
    // Sort by priority level (URGENT > HIGH > MEDIUM > LOW)
    const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    matchingThresholds.sort((a, b) => 
      priorityOrder[b.priority] - priorityOrder[a.priority]
    );
    
    // If requester is CUSTOMER, prefer higher priority
    if (requesterType === "CUSTOMER") {
      return matchingThresholds[0].priority;
    } else {
      // For INTERNAL, prefer lower priority (more conservative)
      return matchingThresholds[matchingThresholds.length - 1].priority;
    }
  }

  return matchingThresholds[0].priority;
}

/**
 * Calculate priority score based on input scores and requester type
 * Returns null if no scores are provided
 */
export async function calculatePriorityScore(
  scores: ScoreInput,
  requesterType: RequesterType
): Promise<CalculationResult | null> {
  // Check if any scores provided
  const hasScores = scores.urgency || scores.impact || scores.risk || 
    (scores.custom && Object.keys(scores.custom).length > 0);
  
  if (!hasScores) {
    // Return null if no scores - use manual priority
    return null;
  }

  // Validate scores
  const validateScore = (value: number | undefined, name: string) => {
    if (value !== undefined && (value < 1 || value > 5)) {
      throw new Error(`${name} score must be between 1 and 5, got: ${value}`);
    }
  };

  validateScore(scores.urgency, "Urgency");
  validateScore(scores.impact, "Impact");
  validateScore(scores.risk, "Risk");

  // Validate custom scores
  if (scores.custom) {
    for (const [key, value] of Object.entries(scores.custom)) {
      validateScore(value, `Custom score '${key}'`);
    }
  }

  // Get active configurations
  const configs = await getActivePriorityConfigs();
  
  if (configs.length === 0) {
    throw new Error("No active priority configurations found");
  }

  // Calculate total score
  let totalScore = 0;
  const scoreComponents: string[] = [];

  // Process each active configuration
  for (const config of configs) {
    let score: number | undefined;
    let scoreName: string = "";

    // Map configuration questions to input scores
    if (config.question.includes("khẩn cấp") || config.question.includes("urgency")) {
      score = scores.urgency;
      scoreName = "khẩn cấp";
    } else if (config.question.includes("tác động") || config.question.includes("impact")) {
      score = scores.impact;
      scoreName = "tác động";
    } else if (config.question.includes("rủi ro") || config.question.includes("risk")) {
      score = scores.risk;
      scoreName = "rủi ro";
    } else if (scores.custom) {
      // Try to match custom scores by question key
      const customKey = config.question.toLowerCase().replace(/[^a-z0-9]/g, "");
      const matchingCustom = Object.keys(scores.custom).find(key => 
        key.toLowerCase().replace(/[^a-z0-9]/g, "") === customKey
      );
      if (matchingCustom) {
        score = scores.custom[matchingCustom];
        scoreName = matchingCustom;
      }
    }

    // Skip if no matching score found
    if (score === undefined) {
      continue;
    }

    // Calculate weighted score
    const weightedScore = score * config.weight;
    totalScore += weightedScore;
    
    // Build component string for reason
    scoreComponents.push(`${scoreName}(${score})×${config.weight}`);
  }

  // Map score to priority
  const priority = await mapScoreToPriority(totalScore, requesterType);

  // Build reason string
  let reason = `Auto: ${scoreComponents.join(" + ")} = ${totalScore.toFixed(1)}`;
  
  // Add tie-breaker note if CUSTOMER (PROBJ, PRTIE)
  if (requesterType === "CUSTOMER") {
    reason += " (Khách hàng - ưu tiên khi điểm bằng nhau)";
  }

  return {
    totalScore,
    priority,
    reason,
  };
}

/**
 * Calculate priority for a request with all scoring fields
 * Returns null if no scores are provided
 */
export async function calculateRequestPriority(requestId: string): Promise<CalculationResult | null> {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    select: {
      urgencyScore: true,
      impactScore: true,
      riskScore: true,
      customScores: true,
      requesterType: true,
    },
  });

  if (!request) {
    throw new Error(`Request not found: ${requestId}`);
  }

  const scores: ScoreInput = {
    urgency: request.urgencyScore || undefined,
    impact: request.impactScore || undefined,
    risk: request.riskScore || undefined,
    custom: request.customScores as Record<string, number> || undefined,
  };

  return calculatePriorityScore(scores, request.requesterType);
}

/**
 * Update request with calculated priority
 * Returns null if no scores are provided
 */
export async function updateRequestPriority(requestId: string): Promise<CalculationResult | null> {
  const result = await calculateRequestPriority(requestId);
  
  if (result) {
    await prisma.request.update({
      where: { id: requestId },
      data: {
        calculatedScore: result.totalScore,
        priority: result.priority,
        priorityReason: result.reason,
      },
    });
  }

  return result;
}
