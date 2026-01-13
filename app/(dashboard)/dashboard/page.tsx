import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PersonalDashboardClient } from "./_components/PersonalDashboardClient";
import { TaskStatus, RequestStatus } from "@prisma/client";

export default async function PersonalDashboardPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  const userId = (session.user as any).id;

  // Get user with all relations
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      team: true,
      achievements: {
        include: { achievement: true },
        take: 5,
      },
      stats: true,
    },
  });

  // CRITICAL: Handle user not found
  if (!user) {
    redirect("/login");
  }

  // Get user's active tasks (MY TASKS - merged from old page)
  const myTasks = await prisma.task.findMany({
    where: {
      assigneeId: userId,
      status: { not: TaskStatus.DONE }, // Active tasks only
    },
    include: {
      request: {
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              icon: true,
            },
          },
        },
      },
    },
    orderBy: [
      { deadline: "asc" },
      { createdAt: "desc" },
    ],
    take: 20,
  });

  // Get user's requests (created by user)
  const myRequests = await prisma.request.findMany({
    where: {
      creatorId: userId,
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          icon: true,
        },
      },
      tasks: {
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });

  // Calculate stats
  const stats = {
    totalTasks: myTasks.length,
    todoTasks: myTasks.filter((t) => t.status === TaskStatus.TODO).length,
    inProgressTasks: myTasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length,
    inReviewTasks: myTasks.filter((t) => t.status === TaskStatus.IN_REVIEW).length,
    overdueTasks: myTasks.filter(
      (t) => t.deadline && new Date(t.deadline) < new Date()
    ).length,
    totalRequests: myRequests.length,
    openRequests: myRequests.filter((r) => r.status === RequestStatus.OPEN).length,
    inProgressRequests: myRequests.filter((r) => 
      r.tasks.some(t => t.status === TaskStatus.IN_PROGRESS)
    ).length,
    doneRequests: myRequests.filter((r) => r.status === RequestStatus.DONE).length,
  };

  return (
    <PersonalDashboardClient
      user={user}
      myTasks={myTasks}
      myRequests={myRequests}
      stats={stats}
    />
  );
}
