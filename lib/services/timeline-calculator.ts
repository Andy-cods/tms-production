import { prisma } from "@/lib/prisma";
import { addHours, differenceInHours } from "date-fns";

export const timelineCalculator = {
  async calculateEstimatedTimeline(
    categoryId: string,
    requestDate: Date = new Date()
  ): Promise<{
    estimatedStartDate: Date;
    estimatedEndDate: Date;
    estimatedDuration: number;
  } | null> {
    const exists = await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } });
    if (!exists) return null;
    const estimatedHours = 24;

    const estimatedStartDate = addHours(requestDate, 2);
    const estimatedEndDate = addHours(estimatedStartDate, estimatedHours);

    return {
      estimatedStartDate,
      estimatedEndDate,
      estimatedDuration: estimatedHours,
    };
  },

  validateTimeline(data: {
    estimatedStartDate?: Date | null;
    estimatedEndDate?: Date | null;
    deadline?: Date | null;
  }): { isValid: boolean; errors: string[] } {
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

  async updateActualDuration(_requestId: string) {
    // Not supported by current schema
    return { actualEndDate: null, actualDuration: null };
  },

  async getTimelineDeviation(requestId: string): Promise<{
    estimatedDuration: number | null;
    actualDuration: number | null;
    deviation: number | null;
    status: "early" | "on-time" | "late" | "unknown";
  }> {
    const req = await prisma.request.findUnique({ where: { id: requestId }, select: { id: true } });
    if (!req) {
      return {
        estimatedDuration: null,
        actualDuration: null,
        deviation: null,
        status: "unknown",
      };
    }
    return { estimatedDuration: null, actualDuration: null, deviation: null, status: "unknown" };
  },
};

