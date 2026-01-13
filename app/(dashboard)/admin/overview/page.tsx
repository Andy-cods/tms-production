import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminOverviewClient } from "./_components/AdminOverviewClient";
import { redirect } from "next/navigation";
import { Role, RequestStatus, TaskStatus } from "@prisma/client";
import { subDays } from "date-fns";

type RequestStatusTotals = Partial<Record<RequestStatus, number>>;

const BACKLOG_STATUSES: RequestStatus[] = [
  RequestStatus.DRAFT,
  RequestStatus.OPEN,
  RequestStatus.IN_TRIAGE,
  RequestStatus.CLARIFICATION,
];

const IN_PROGRESS_STATUSES: RequestStatus[] = [
  RequestStatus.ASSIGNED,
  RequestStatus.IN_PROGRESS,
  RequestStatus.IN_REVIEW,
];

const ACTIVE_TASK_STATUSES: TaskStatus[] = [
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.IN_REVIEW,
  TaskStatus.REWORK,
  TaskStatus.WAITING_SUBTASKS,
];

const ACTIVE_TASK_STATUS_SET = new Set(ACTIVE_TASK_STATUSES);

const UNASSIGNED_TEAM_KEY = "unassigned";

export default async function AdminOverviewPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as any)?.role;
  if (role !== Role.ADMIN) {
    redirect("/dashboard");
  }

  const now = new Date();
  const sevenDaysAgo = subDays(now, 7);

  const [
    totalRequests,
    backlogCount,
    inProgressCount,
    completedCount,
    overdueCount,
    unassignedCount,
    taskStatusGroups,
    teams,
    requestStatusByTeam,
    overdueByTeam,
    teamMembers,
    activeTaskGroup,
    topCompletersRaw,
    recentRequests,
  ] = await Promise.all([
    prisma.request.count(),
    prisma.request.count({
      where: {
        status: {
          in: BACKLOG_STATUSES,
        },
      },
    }),
    prisma.request.count({
      where: {
        status: {
          in: IN_PROGRESS_STATUSES,
        },
      },
    }),
    prisma.request.count({
      where: {
        status: RequestStatus.DONE,
      },
    }),
    prisma.request.count({
      where: {
        deadline: { lt: now },
        NOT: { status: RequestStatus.DONE },
      },
    }),
    prisma.request.count({
      where: {
        teamId: null,
      },
    }),
    prisma.task.groupBy({
      by: ["status"],
      _count: {
        _all: true,
      },
    }),
    prisma.team.findMany({
      select: {
        id: true,
        name: true,
        wipLimit: true,
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.request.groupBy({
      by: ["teamId", "status"],
      _count: { _all: true },
    }),
    prisma.request.groupBy({
      by: ["teamId"],
      where: {
        deadline: { lt: now },
        NOT: { status: RequestStatus.DONE },
      },
      _count: { _all: true },
    }),
    prisma.user.findMany({
      where: { teamId: { not: null } },
      select: {
        id: true,
        teamId: true,
        wipLimit: true,
      },
    }),
    prisma.task.groupBy({
      by: ["assigneeId"],
      where: {
        assigneeId: { not: null },
        status: {
          in: Array.from(ACTIVE_TASK_STATUS_SET),
        },
      },
      _count: { _all: true },
    }),
    prisma.task.groupBy({
      by: ["assigneeId"],
      where: {
        assigneeId: { not: null },
        status: TaskStatus.DONE,
        completedAt: {
          gte: sevenDaysAgo,
        },
      },
      _count: { _all: true },
    }),
    prisma.request.findMany({
      take: 10,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        createdAt: true,
        deadline: true,
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
  ]);

  const assigneeIds = new Set<string>();
  activeTaskGroup.forEach((item) => {
    if (item.assigneeId) {
      assigneeIds.add(item.assigneeId);
    }
  });
  topCompletersRaw.forEach((item) => {
    if (item.assigneeId) {
      assigneeIds.add(item.assigneeId);
    }
  });

  const assigneeDetails = assigneeIds.size
    ? await prisma.user.findMany({
        where: {
          id: {
            in: Array.from(assigneeIds),
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          teamId: true,
          team: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })
    : [];

  const assigneeMap = new Map(
    assigneeDetails.map((user) => [
      user.id,
      {
        id: user.id,
        name: user.name ?? user.email ?? "Không rõ",
        email: user.email,
        role: user.role,
        teamId: user.teamId ?? null,
        teamName: user.team?.name ?? null,
      },
    ])
  );

  type TeamAccumulator = {
    id: string;
    name: string;
    memberCount: number;
    teamWipLimit: number;
    capacity: number;
    activeTasks: number;
    requestCounts: {
      total: number;
      backlog: number;
      inProgress: number;
      done: number;
      rejected: number;
      archived: number;
      overdue: number;
    };
  };

  const teamSummaryMap = new Map<string, TeamAccumulator>();

  teams.forEach((team) => {
    teamSummaryMap.set(team.id, {
      id: team.id,
      name: team.name,
      memberCount: team._count.members,
      teamWipLimit: team.wipLimit,
      capacity: 0,
      activeTasks: 0,
      requestCounts: {
        total: 0,
        backlog: 0,
        inProgress: 0,
        done: 0,
        rejected: 0,
        archived: 0,
        overdue: 0,
      },
    });
  });

  teamSummaryMap.set(UNASSIGNED_TEAM_KEY, {
    id: UNASSIGNED_TEAM_KEY,
    name: "Chưa gán team",
    memberCount: 0,
    teamWipLimit: 0,
    capacity: 0,
    activeTasks: 0,
    requestCounts: {
      total: 0,
      backlog: 0,
      inProgress: 0,
      done: 0,
      rejected: 0,
      archived: 0,
      overdue: 0,
    },
  });

  teamMembers.forEach((member) => {
    if (!member.teamId) {
      return;
    }
    const summary = teamSummaryMap.get(member.teamId);
    if (summary) {
      summary.capacity += member.wipLimit ?? 0;
    }
  });

  const statusTotals: RequestStatusTotals = {};

  const categorizeRequestStatus = (status: RequestStatus) => {
    if (BACKLOG_STATUSES.includes(status)) {
      return "backlog" as const;
    }
    if (IN_PROGRESS_STATUSES.includes(status)) {
      return "inProgress" as const;
    }
    if (status === RequestStatus.DONE) {
      return "done" as const;
    }
    if (status === RequestStatus.REJECTED) {
      return "rejected" as const;
    }
    if (status === RequestStatus.ARCHIVED) {
      return "archived" as const;
    }
    return "backlog" as const;
  };

  requestStatusByTeam.forEach((item) => {
    const key = item.teamId ?? UNASSIGNED_TEAM_KEY;
    let summary = teamSummaryMap.get(key);

    if (!summary) {
      summary = {
        id: key,
        name: "Không xác định",
        memberCount: 0,
        teamWipLimit: 0,
        capacity: 0,
        activeTasks: 0,
        requestCounts: {
          total: 0,
          backlog: 0,
          inProgress: 0,
          done: 0,
          rejected: 0,
          archived: 0,
          overdue: 0,
        },
      };
      teamSummaryMap.set(key, summary);
    }

    summary.requestCounts.total += item._count._all;
    statusTotals[item.status] = (statusTotals[item.status] ?? 0) + item._count._all;

    const category = categorizeRequestStatus(item.status);
    summary.requestCounts[category] += item._count._all;
  });

  overdueByTeam.forEach((item) => {
    const key = item.teamId ?? UNASSIGNED_TEAM_KEY;
    const summary = teamSummaryMap.get(key);
    if (summary) {
      summary.requestCounts.overdue += item._count._all;
    }
  });

  activeTaskGroup.forEach((item) => {
    if (!item.assigneeId) {
      return;
    }

    const assignee = assigneeMap.get(item.assigneeId);
    const key = assignee?.teamId ?? UNASSIGNED_TEAM_KEY;
    const summary = teamSummaryMap.get(key);

    if (summary) {
      summary.activeTasks += item._count._all;
    }
  });

  const teamSummaries = Array.from(teamSummaryMap.values())
    .map((summary) => {
      const fallbackCapacity =
        summary.capacity > 0
          ? summary.capacity
          : summary.teamWipLimit || Math.max(summary.memberCount * 5, 1);
      const utilization =
        fallbackCapacity > 0 ? Math.min(999, Math.round((summary.activeTasks / fallbackCapacity) * 100)) : 0;

      return {
        id: summary.id,
        name: summary.name,
        memberCount: summary.memberCount,
        capacity: fallbackCapacity,
        activeTasks: summary.activeTasks,
        utilization,
        totalRequests: summary.requestCounts.total,
        backlogRequests: summary.requestCounts.backlog,
        inProgressRequests: summary.requestCounts.inProgress,
        doneRequests: summary.requestCounts.done,
        overdueRequests: summary.requestCounts.overdue,
      };
    })
    .sort((a, b) => b.totalRequests - a.totalRequests);

  const requestStats = {
    total: totalRequests,
    backlog: backlogCount,
    inProgress: inProgressCount,
    completed: completedCount,
    overdue: overdueCount,
    unassigned: unassignedCount,
    rejected: statusTotals[RequestStatus.REJECTED] ?? 0,
    archived: statusTotals[RequestStatus.ARCHIVED] ?? 0,
    draft: statusTotals[RequestStatus.DRAFT] ?? 0,
  };

  const taskStatusMap = new Map<TaskStatus, number>();
  taskStatusGroups.forEach((item) => {
    taskStatusMap.set(item.status, item._count._all);
  });

  const getTaskCount = (status: TaskStatus) => taskStatusMap.get(status) ?? 0;
  const totalTasks = taskStatusGroups.reduce((acc, item) => acc + item._count._all, 0);
  const activeTasksCount = ACTIVE_TASK_STATUSES.reduce((acc, status) => acc + getTaskCount(status), 0);

  const taskStats = {
    total: totalTasks,
    active: activeTasksCount,
    todo: getTaskCount(TaskStatus.TODO),
    inProgress: getTaskCount(TaskStatus.IN_PROGRESS),
    inReview: getTaskCount(TaskStatus.IN_REVIEW),
    rework: getTaskCount(TaskStatus.REWORK),
    waiting: getTaskCount(TaskStatus.WAITING_SUBTASKS),
    blocked: getTaskCount(TaskStatus.BLOCKED),
    done: getTaskCount(TaskStatus.DONE),
  };

  const topActiveAssignees = activeTaskGroup
    .filter((item) => item.assigneeId)
    .sort((a, b) => b._count._all - a._count._all)
    .slice(0, 5)
    .map((item) => {
      const user = item.assigneeId ? assigneeMap.get(item.assigneeId) : undefined;
      return {
        id: item.assigneeId as string,
        name: user?.name ?? "Không rõ",
        email: user?.email ?? null,
        role: user?.role ?? "UNKNOWN",
        teamName: user?.teamName ?? "Chưa gán team",
        count: item._count._all,
      };
    });

  const topCompleters = topCompletersRaw
    .filter((item) => item.assigneeId)
    .sort((a, b) => b._count._all - a._count._all)
    .slice(0, 5)
    .map((item) => {
      const user = item.assigneeId ? assigneeMap.get(item.assigneeId) : undefined;
      return {
        id: item.assigneeId as string,
        name: user?.name ?? "Không rõ",
        email: user?.email ?? null,
        role: user?.role ?? "UNKNOWN",
        teamName: user?.teamName ?? "Chưa gán team",
        count: item._count._all,
      };
    });

  const recentRequestsTransformed = recentRequests.map((req) => ({
    id: req.id,
    title: req.title,
    status: req.status,
    priority: req.priority,
    teamName: req.team?.name ?? "Chưa gán team",
    categoryName: req.category?.name ?? "Chưa phân loại",
    createdAt: req.createdAt.toISOString(),
    deadline: req.deadline ? req.deadline.toISOString() : null,
  }));

  return (
    <AdminOverviewClient
      requestStats={requestStats}
      taskStats={taskStats}
      teamSummaries={teamSummaries}
      topActiveAssignees={topActiveAssignees}
      topCompleters={topCompleters}
      recentRequests={recentRequestsTransformed}
    />
  );
}


