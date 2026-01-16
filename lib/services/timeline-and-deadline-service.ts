import { prisma } from "@/lib/prisma";
import { addHours, differenceInHours } from "date-fns";

// =============================================================================
// Configuration Constants
// =============================================================================

const DEADLINE_CONFIG = {
  minHours: 4,
  maxHours: 72,
  suggestedHours: 24,
  estimatedHours: 24,
  startDelayHours: 2, // Hours before estimated start
} as const;

// =============================================================================
// Types
// =============================================================================

export interface DeadlineRange {
  min: Date;
  max: Date;
  suggested: Date;
  category: {
    minHours: number | null;
    maxHours: number | null;
    defaultHours: number | null;
  };
}

export interface DeadlineValidation {
  isValid: boolean;
  isTooShort: boolean;
  isTooLong: boolean;
  warnings: string[];
  suggestions: string[];
}

export interface TimelineValidation {
  isValid: boolean;
  errors: string[];
}

export interface EstimatedTimeline {
  estimatedStartDate: Date;
  estimatedEndDate: Date;
  estimatedDuration: number;
}

export interface TimelineDeviation {
  estimatedDuration: number | null;
  actualDuration: number | null;
  deviation: number | null;
  status: "early" | "on-time" | "late" | "unknown";
}

export interface CategoryStats {
  avgHours: number;
  medianHours: number;
}

// =============================================================================
// Unified Timeline and Deadline Service
// =============================================================================

export const timelineAndDeadlineService = {
  // ---------------------------------------------------------------------------
  // Timeline Functions
  // ---------------------------------------------------------------------------

  /**
   * Calculate estimated timeline based on category
   */
  async calculateEstimatedTimeline(
    categoryId: string,
    requestDate: Date = new Date()
  ): Promise<EstimatedTimeline | null> {
    const exists = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });
    if (!exists) return null;

    const estimatedStartDate = addHours(requestDate, DEADLINE_CONFIG.startDelayHours);
    const estimatedEndDate = addHours(estimatedStartDate, DEADLINE_CONFIG.estimatedHours);

    return {
      estimatedStartDate,
      estimatedEndDate,
      estimatedDuration: DEADLINE_CONFIG.estimatedHours,
    };
  },

  /**
   * Validate timeline dates
   */
  validateTimeline(data: {
    estimatedStartDate?: Date | null;
    estimatedEndDate?: Date | null;
    deadline?: Date | null;
  }): TimelineValidation {
    const errors: string[] = [];

    if (
      data.estimatedStartDate &&
      data.estimatedEndDate &&
      data.estimatedStartDate >= data.estimatedEndDate
    ) {
      errors.push("Ngày kết thúc phải sau ngày bắt đầu");
    }

    if (
      data.estimatedEndDate &&
      data.deadline &&
      data.estimatedEndDate > data.deadline
    ) {
      errors.push("Ngày kết thúc dự kiến phải trước deadline");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  /**
   * Update actual duration when request is completed
   */
  async updateActualDuration(requestId: string): Promise<{
    actualEndDate: Date | null;
    actualDuration: number | null;
  }> {
    const request = await prisma.request.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        createdAt: true,
        status: true,
      },
    });

    if (!request || request.status !== "DONE") {
      return { actualEndDate: null, actualDuration: null };
    }

    const actualEndDate = new Date();
    const actualDuration = differenceInHours(actualEndDate, request.createdAt);

    // Update request with actual data (if schema supports it)
    try {
      await prisma.request.update({
        where: { id: requestId },
        data: {
          actualEndDate,
          actualDuration,
        } as any,
      });
    } catch {
      // Schema may not support these fields yet
    }

    return { actualEndDate, actualDuration };
  },

  /**
   * Get timeline deviation analysis
   */
  async getTimelineDeviation(requestId: string): Promise<TimelineDeviation> {
    const req = await prisma.request.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        createdAt: true,
        completedAt: true,
      },
    });

    if (!req) {
      return {
        estimatedDuration: null,
        actualDuration: null,
        deviation: null,
        status: "unknown",
      };
    }

    const estimatedDuration = (req as any).estimatedDuration as number | null;
    const actualDuration = req.completedAt
      ? differenceInHours(req.completedAt, req.createdAt)
      : null;

    if (estimatedDuration === null || actualDuration === null) {
      return {
        estimatedDuration,
        actualDuration,
        deviation: null,
        status: "unknown",
      };
    }

    const deviation = actualDuration - estimatedDuration;
    let status: TimelineDeviation["status"] = "on-time";

    if (deviation < -1) {
      status = "early";
    } else if (deviation > 1) {
      status = "late";
    }

    return {
      estimatedDuration,
      actualDuration,
      deviation,
      status,
    };
  },

  // ---------------------------------------------------------------------------
  // Deadline Functions
  // ---------------------------------------------------------------------------

  /**
   * Get deadline range based on category
   */
  async getDeadlineRange(
    categoryId: string,
    startDate: Date = new Date()
  ): Promise<DeadlineRange | null> {
    const exists = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });
    if (!exists) return null;

    return {
      min: addHours(startDate, DEADLINE_CONFIG.minHours),
      max: addHours(startDate, DEADLINE_CONFIG.maxHours),
      suggested: addHours(startDate, DEADLINE_CONFIG.suggestedHours),
      category: { minHours: null, maxHours: null, defaultHours: null },
    };
  },

  /**
   * Validate deadline against constraints
   */
  async validateDeadline(
    categoryId: string,
    deadline: Date,
    startDate: Date = new Date()
  ): Promise<DeadlineValidation> {
    const exists = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });

    if (!exists) {
      return {
        isValid: true,
        isTooShort: false,
        isTooLong: false,
        warnings: [],
        suggestions: [],
      };
    }

    const hoursUntilDeadline = differenceInHours(deadline, startDate);
    const warnings: string[] = [];
    const suggestions: string[] = [];

    const isTooShort = hoursUntilDeadline < DEADLINE_CONFIG.minHours;
    const isTooLong = hoursUntilDeadline > DEADLINE_CONFIG.maxHours;
    const isValid = !isTooShort && !isTooLong;

    if (isTooShort) {
      warnings.push(`Deadline quá ngắn (tối thiểu ${DEADLINE_CONFIG.minHours} giờ)`);
      suggestions.push(`Nên đặt deadline ít nhất ${DEADLINE_CONFIG.minHours} giờ từ bây giờ`);
    }

    if (isTooLong) {
      warnings.push(`Deadline quá dài (tối đa ${DEADLINE_CONFIG.maxHours} giờ)`);
    }

    return {
      isValid,
      isTooShort,
      isTooLong,
      warnings,
      suggestions,
    };
  },

  /**
   * Combined validation for both timeline and deadline
   */
  async validateTimelineAndDeadline(data: {
    categoryId?: string;
    estimatedStartDate?: Date | null;
    estimatedEndDate?: Date | null;
    deadline?: Date | null;
  }): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate timeline
    const timelineValidation = this.validateTimeline({
      estimatedStartDate: data.estimatedStartDate,
      estimatedEndDate: data.estimatedEndDate,
      deadline: data.deadline,
    });
    errors.push(...timelineValidation.errors);

    // Validate deadline if category provided
    if (data.categoryId && data.deadline) {
      const deadlineValidation = await this.validateDeadline(
        data.categoryId,
        data.deadline
      );
      if (!deadlineValidation.isValid) {
        errors.push(...deadlineValidation.warnings);
      }
      warnings.push(...deadlineValidation.suggestions);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  },

  // ---------------------------------------------------------------------------
  // Category Statistics
  // ---------------------------------------------------------------------------

  /**
   * Update statistics for a category based on completed requests
   */
  async updateCategoryStats(categoryId: string): Promise<CategoryStats | null> {
    const recentRequests = await prisma.request.findMany({
      where: {
        categoryId,
        status: "DONE",
      },
      select: {
        createdAt: true,
        updatedAt: true,
      },
      take: 20,
      orderBy: {
        updatedAt: "desc",
      },
    });

    if (recentRequests.length === 0) return null;

    const completionHours = recentRequests.map((r) =>
      differenceInHours(r.updatedAt, r.createdAt)
    );

    const avgHours =
      completionHours.reduce((sum, h) => sum + h, 0) / completionHours.length;

    const sorted = [...completionHours].sort((a, b) => a - b);
    const medianHours =
      sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];

    return { avgHours, medianHours };
  },

  /**
   * Update statistics for all active categories
   */
  async updateAllCategoryStats(): Promise<
    Array<{ categoryId: string; categoryName: string; stats: CategoryStats | null }>
  > {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });

    const results: Array<{
      categoryId: string;
      categoryName: string;
      stats: CategoryStats | null;
    }> = [];

    for (const cat of categories) {
      try {
        const stats = await this.updateCategoryStats(cat.id);
        results.push({ categoryId: cat.id, categoryName: cat.name, stats });
      } catch (error) {
        console.error(`Error updating stats for ${cat.name}:`, error);
        results.push({ categoryId: cat.id, categoryName: cat.name, stats: null });
      }
    }

    return results;
  },

  // ---------------------------------------------------------------------------
  // Configuration Accessor
  // ---------------------------------------------------------------------------

  /**
   * Get deadline configuration constants
   */
  getConfig() {
    return { ...DEADLINE_CONFIG };
  },
};

// =============================================================================
// Legacy Exports (for backward compatibility)
// =============================================================================

/** @deprecated Use timelineAndDeadlineService instead */
export const timelineCalculator = {
  calculateEstimatedTimeline: timelineAndDeadlineService.calculateEstimatedTimeline.bind(
    timelineAndDeadlineService
  ),
  validateTimeline: timelineAndDeadlineService.validateTimeline.bind(
    timelineAndDeadlineService
  ),
  updateActualDuration: timelineAndDeadlineService.updateActualDuration.bind(
    timelineAndDeadlineService
  ),
  getTimelineDeviation: timelineAndDeadlineService.getTimelineDeviation.bind(
    timelineAndDeadlineService
  ),
};

/** @deprecated Use timelineAndDeadlineService instead */
export const deadlineCalculator = {
  getDeadlineRange: timelineAndDeadlineService.getDeadlineRange.bind(
    timelineAndDeadlineService
  ),
  validateDeadline: timelineAndDeadlineService.validateDeadline.bind(
    timelineAndDeadlineService
  ),
  updateCategoryStats: timelineAndDeadlineService.updateCategoryStats.bind(
    timelineAndDeadlineService
  ),
  updateAllCategoryStats: timelineAndDeadlineService.updateAllCategoryStats.bind(
    timelineAndDeadlineService
  ),
};
