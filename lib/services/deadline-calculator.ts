import { prisma } from "@/lib/prisma";
import { addHours, differenceInHours } from "date-fns";

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

export const deadlineCalculator = {
  async getDeadlineRange(
    categoryId: string,
    startDate: Date = new Date()
  ): Promise<DeadlineRange | null> {
    const exists = await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } });
    if (!exists) return null;

    const suggestedHours = 24;
    const minHours = 4;
    const maxHours = 72;

    return {
      min: addHours(startDate, minHours),
      max: addHours(startDate, maxHours),
      suggested: addHours(startDate, suggestedHours),
      category: { minHours: null, maxHours: null, defaultHours: null },
    };
  },

  async validateDeadline(
    categoryId: string,
    deadline: Date,
    startDate: Date = new Date()
  ): Promise<DeadlineValidation> {
    const exists = await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } });

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

    // No additional category config in schema; basic validation only
    const isTooShort = hoursUntilDeadline < 4;
    const isTooLong = hoursUntilDeadline > 72;
    const isValid = !isTooShort && !isTooLong;

    return {
      isValid,
      isTooShort,
      isTooLong,
      warnings,
      suggestions,
    };
  },

  async updateCategoryStats(categoryId: string) {
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

    if (recentRequests.length === 0) return;

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

    // No schema fields to store; return computed values only
    return { avgHours, medianHours };
  },

  async updateAllCategoryStats() {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });

    const results: Array<{ categoryId: string; categoryName: string; stats: any }> = [];

    for (const cat of categories) {
      try {
        const stats = await this.updateCategoryStats(cat.id);
        results.push({ categoryId: cat.id, categoryName: cat.name, stats });
      } catch (error) {
        console.error(`Error updating stats for ${cat.name}:`, error);
      }
    }

    return results;
  },
};
