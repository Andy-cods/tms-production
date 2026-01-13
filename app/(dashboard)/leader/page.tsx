import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, TaskStatus, RequestStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { LeaderDashboardClient } from "./_components/LeaderDashboardClient";

export default async function LeaderDashboardPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  const userRole = (session.user as any).role;
  if (userRole !== Role.LEADER && userRole !== Role.ADMIN) {
    redirect("/dashboard");
  }

  const userId = (session.user as any).id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      teamId: true,
    },
  });

  const isAdmin = userRole === Role.ADMIN;
  const accessibleTeamId = isAdmin ? undefined : user?.teamId ?? undefined;

  // Fetch requests scoped by team (leaders see only their team)
  const requestWhere: any = {};
  if (accessibleTeamId) {
    requestWhere.teamId = accessibleTeamId;
  }

  const requests = await prisma.request.findMany({
    where: requestWhere,
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
          team: {
            select: { id: true, name: true },
          },
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          icon: true,
        },
      },
      tasks: {
        select: {
          id: true,
          status: true,
          assigneeId: true,
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
              team: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
    orderBy: [
      { priority: "desc" },
      { createdAt: "desc" },
    ],
  });

  // Staff available for assignment
  const assigneeWhere: any = { role: Role.STAFF };
  if (!isAdmin && accessibleTeamId) {
    assigneeWhere.teamId = accessibleTeamId;
  }

  const teamMembers = await prisma.user.findMany({
    where: assigneeWhere,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      team: { select: { id: true, name: true } },
      stats: {
        select: {
          experiencePoints: true,
        },
      },
      tasksAssigned: {
        where: {
          status: {
            in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.IN_REVIEW],
          },
        },
        select: {
          id: true,
          status: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  const now = new Date();
  const statusWhereBase = { ...(accessibleTeamId ? { teamId: accessibleTeamId } : {}) };

  const [pendingCount, inProgressCount, completedCount, overdueCount, assignedCount] = await Promise.all([
    prisma.request.count({
      where: {
        ...statusWhereBase,
        status: {
          in: [RequestStatus.OPEN, RequestStatus.IN_TRIAGE, RequestStatus.CLARIFICATION],
        },
      },
    }),
    prisma.request.count({
      where: {
        ...statusWhereBase,
        status: {
          in: [RequestStatus.ASSIGNED, RequestStatus.IN_PROGRESS, RequestStatus.IN_REVIEW],
        },
      },
    }),
    prisma.request.count({
      where: {
        ...statusWhereBase,
        status: RequestStatus.DONE,
      },
    }),
    prisma.request.count({
      where: {
        ...statusWhereBase,
        deadline: { lt: now },
        NOT: {
          status: RequestStatus.DONE,
        },
      },
    }),
    prisma.request.count({
      where: {
        ...statusWhereBase,
        status: RequestStatus.ASSIGNED,
      },
    }),
  ]);

  const stats = {
    pending: pendingCount,
    inProgress: inProgressCount,
    completed: completedCount,
    overdue: overdueCount,
    assigned: assignedCount,
  };

  const teamMembersUI = teamMembers.map((member) => ({
    ...member,
    teamName: member.team?.name ?? null,
    assignedTasks: member.tasksAssigned ?? [],
    stats: member.stats ?? null,
  }));

  return (
    <LeaderDashboardClient
      requests={requests}
      teamMembers={teamMembersUI}
      stats={stats}
      isAdmin={isAdmin}
    />
  );
}

