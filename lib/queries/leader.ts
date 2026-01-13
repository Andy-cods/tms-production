import { prisma } from "@/lib/prisma";

export type LeaderUnassignedTask = {
  id: string;
  title: string;
  deadline: Date | null;
  createdAt: Date;
  confirmationDeadline: Date | null;
  slaDeadline: Date | null;
  slaStatus: string | null;
  slaPausedAt: Date | null;
  slaTotalPaused: number | null;
  request: {
    id: string;
    title: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    category: { id: string; name: string } | null;
    creator: { id: string; name: string | null; email: string };
  } | null;
};

export async function getUnassignedTasks(
  teamId: string,
  filters?: { search?: string | null }
): Promise<LeaderUnassignedTask[]> {
  const where: any = {
    assigneeId: null,
    request: { teamId },
  };

  if (filters?.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { request: { title: { contains: filters.search, mode: "insensitive" } } },
    ];
  }

  const items = await prisma.task.findMany({
    where,
    select: {
      id: true,
      title: true,
      deadline: true,
      createdAt: true,
      confirmationDeadline: true,
      slaDeadline: true,
      slaStatus: true,
      slaPausedAt: true,
      slaTotalPaused: true,
      request: {
        select: {
          id: true,
          title: true,
          priority: true,
          category: { select: { id: true, name: true } },
          creator: { select: { id: true, name: true, email: true } },
        },
      },
    },
    orderBy: [
      { request: { priority: "desc" } as any },
      { createdAt: "desc" },
    ],
  });

  return items as unknown as LeaderUnassignedTask[];
}

export type LeaderTeamMember = {
  id: string;
  name: string | null;
  email: string;
  _count: { tasksAssigned: number };
};

export async function getTeamMembers(teamId: string): Promise<LeaderTeamMember[]> {
  const members = await prisma.user.findMany({
    where: {
      teamId,
      isActive: true,
      role: { in: ["ASSIGNEE", "LEADER"] as any },
    },
    select: {
      id: true,
      name: true,
      email: true,
      _count: {
        select: {
          tasksAssigned: {
            where: { status: { not: "DONE" as any } },
          } as any,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return members as unknown as LeaderTeamMember[];
}


export type TeamWorkloadItem = {
  member: { id: string; name: string | null; email: string };
  counts: {
    totalActive: number;
    todo: number;
    inProgress: number;
    inReview: number;
    blocked: number;
    rework: number;
    done: number;
    totalAll: number;
  };
  lastActivityAt: Date | null;
};

export async function getTeamWorkload(teamId: string): Promise<TeamWorkloadItem[]> {
  const members = await prisma.user.findMany({
    where: { teamId, isActive: true, role: { in: ["ASSIGNEE", "LEADER"] as any } },
    select: { id: true, name: true, email: true, role: true, wipLimit: true },
    orderBy: { name: "asc" },
  });

  if (members.length === 0) return [];
  const memberIds = members.map((m) => m.id);

  const grouped = await prisma.task.groupBy({
    by: ["assigneeId", "status"],
    where: {
      assigneeId: { in: memberIds },
      request: { teamId },
    },
    _count: { _all: true },
  });

  const lastActivitiesRaw = await prisma.task.findMany({
    where: { assigneeId: { in: memberIds }, request: { teamId } },
    select: { assigneeId: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });
  const lastActivityMap = new Map<string, Date>();
  for (const t of lastActivitiesRaw) {
    if (t.assigneeId && !lastActivityMap.has(t.assigneeId)) {
      lastActivityMap.set(t.assigneeId, t.updatedAt);
    }
  }

  return members.map((m) => {
    const statsForUser = grouped.filter((g) => g.assigneeId === m.id);
    const countByStatus: Record<string, number> = {};
    for (const g of statsForUser) countByStatus[g.status as string] = g._count._all;

    const done = countByStatus["DONE"] ?? 0;
    const todo = countByStatus["TODO"] ?? 0;
    const inProgress = countByStatus["IN_PROGRESS"] ?? 0;
    const inReview = countByStatus["IN_REVIEW"] ?? 0;
    const blocked = countByStatus["BLOCKED"] ?? 0;
    const rework = countByStatus["REWORK"] ?? 0;
    const totalAll = done + todo + inProgress + inReview + blocked + rework;
    const totalActive = totalAll - done;

    return {
      member: m,
      counts: { totalActive, todo, inProgress, inReview, blocked, rework, done, totalAll },
      lastActivityAt: lastActivityMap.get(m.id) ?? null,
    };
  });
}

export type TeamRequestItem = {
  id: string;
  title: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: string;
  createdAt: Date;
  creator: { id: string; name: string | null; email: string };
  _count: { tasks: number };
};

export async function getTeamRequests(
  teamId: string,
  filters?: { status?: string | null; priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | null }
): Promise<TeamRequestItem[]> {
  const where: any = { teamId };
  if (filters?.status) where.status = filters.status as any;
  if (filters?.priority) where.priority = filters.priority as any;

  const items = await prisma.request.findMany({
    where,
    select: {
      id: true,
      title: true,
      priority: true,
      status: true,
      createdAt: true,
      creator: { select: { id: true, name: true, email: true } },
      _count: { select: { tasks: true } },
    },
    orderBy: [
      { priority: "desc" },
      { createdAt: "desc" },
    ],
  });

  return items as unknown as TeamRequestItem[];
}


