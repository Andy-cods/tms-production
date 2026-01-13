import { prisma } from "@/lib/prisma";
import { RequestStatus, TaskStatus } from "@prisma/client";
import { addDays, startOfDay, endOfDay } from "date-fns";

export const timelineService = {
  /**
   * Get timeline data for leader dashboard
   */
  async getTeamTimeline(teamId?: string, days: number = 14) {
    const startDate = startOfDay(new Date());
    const endDate = endOfDay(addDays(startDate, days));

    const requests = await prisma.request.findMany({
      where: {
        ...(teamId && { teamId }),
        status: { in: [RequestStatus.OPEN, RequestStatus.IN_PROGRESS, RequestStatus.IN_REVIEW] },
        OR: [
          { createdAt: { gte: startDate, lte: endDate } },
          { deadline: { gte: startDate, lte: endDate } },
        ],
      },
      include: {
        category: {
          select: { id: true, name: true },
        },
        creator: {
          select: { id: true, name: true },
        },
        tasks: {
          where: { status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.IN_REVIEW] } },
          include: {
            assignee: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return requests.map((r) => {
      const start = r.createdAt;
      const end = r.deadline ?? addDays(r.createdAt, 3);
      return {
        id: r.id,
        title: r.title,
        status: r.status,
        priority: r.priority,
        estimatedStartDate: start.toISOString(),
        estimatedEndDate: end.toISOString(),
        deadline: r.deadline?.toISOString() || null,
        category: r.category,
        creator: r.creator,
        assignees: r.tasks.map((t) => t.assignee).filter(Boolean),
      };
    });
  },

  /**
   * Get timeline stats
   */
  async getTimelineStats(teamId?: string) {
    const now = new Date();

    const [total, onTrack, atRisk, overdue] = await Promise.all([
      prisma.request.count({
        where: { ...(teamId && { teamId }), status: { in: [RequestStatus.OPEN, RequestStatus.IN_PROGRESS, RequestStatus.IN_REVIEW] } },
      }),
      prisma.request.count({
        where: { ...(teamId && { teamId }), status: { in: [RequestStatus.OPEN, RequestStatus.IN_PROGRESS, RequestStatus.IN_REVIEW] }, deadline: { gte: now } },
      }),
      prisma.request.count({
        where: {
          ...(teamId && { teamId }),
          status: { in: [RequestStatus.OPEN, RequestStatus.IN_PROGRESS, RequestStatus.IN_REVIEW] },
          deadline: { gte: now, lte: addDays(now, 2) },
        },
      }),
      prisma.request.count({
        where: { ...(teamId && { teamId }), status: { in: [RequestStatus.OPEN, RequestStatus.IN_PROGRESS, RequestStatus.IN_REVIEW] }, deadline: { lt: now } },
      }),
    ]);

    return { total, onTrack, atRisk, overdue };
  },
};


