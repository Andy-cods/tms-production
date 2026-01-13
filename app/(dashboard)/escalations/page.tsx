import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { EscalationDashboardClient } from "./_components/EscalationDashboardClient";
import { escalationService } from "@/lib/services/escalation-service";

/**
 * Escalation Management Page
 * 
 * Dashboard for leaders and admins to manage escalations.
 * Leaders see team escalations, Admins see all.
 * 
 * References: mindmap L1, L1C
 */
export default async function EscalationsPage() {
  const session = await auth();
  const userRole = (session?.user as any)?.role;

  // Only LEADER and ADMIN can access
  if (userRole !== "LEADER" && userRole !== "ADMIN") {
    redirect("/403");
  }

  const userId = session?.user?.id as string;

  // Get current user
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, teamId: true },
  });

  if (!currentUser) {
    redirect("/");
  }

  // Build where clause based on RBAC
  const where: any = {};

  if (currentUser.role === "LEADER") {
    // Get team members
    const teamMembers = await prisma.user.findMany({
      where: { teamId: currentUser.teamId },
      select: { id: true },
    });

    const teamMemberIds = teamMembers.map((m) => m.id);
    where.escalatedTo = { in: [...teamMemberIds, userId] }; // Include self
  }
  // Admins see all (no filter)

  // Get escalations
  const escalations = await prisma.escalationLog.findMany({
    where,
    include: {
      rule: {
        select: {
          name: true,
          triggerType: true,
        },
      },
      recipient: {
        select: {
          name: true,
          email: true,
          role: true,
        },
      },
      request: {
        select: {
          id: true,
          title: true,
          priority: true,
          status: true,
        },
      },
      task: {
        select: {
          id: true,
          title: true,
          status: true,
          assignee: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100, // Limit for performance
  });

  // Calculate stats
  const totalEscalations = escalations.length;
  const pending = escalations.filter((e) => e.status === "PENDING").length;
  const acknowledged = escalations.filter(
    (e) => e.status === "ACKNOWLEDGED"
  ).length;

  // Calculate avg resolution time (for resolved escalations)
  const resolvedEscalations = escalations.filter(
    (e) => e.status === "RESOLVED" && e.resolvedAt
  );

  const avgResolutionMinutes =
    resolvedEscalations.length > 0
      ? Math.round(
          resolvedEscalations.reduce((sum, e) => {
            const duration =
              e.resolvedAt!.getTime() - e.createdAt.getTime();
            return sum + duration / (1000 * 60);
          }, 0) / resolvedEscalations.length
        )
      : 0;

  // Most common trigger type
  const triggerCounts = escalations.reduce((acc, e) => {
    acc[e.rule.triggerType] = (acc[e.rule.triggerType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostCommonTrigger = Object.entries(triggerCounts).sort(
    ([, a], [, b]) => b - a
  )[0]?.[0] || "N/A";

  // Get all team members for filter (if leader)
  const teamMembers =
    currentUser.role === "LEADER"
      ? await prisma.user.findMany({
          where: { teamId: currentUser.teamId },
          select: { id: true, name: true, role: true },
        })
      : [];

  // Get all users for admin filter
  const allUsers =
    currentUser.role === "ADMIN"
      ? await prisma.user.findMany({
          where: { role: { in: ["LEADER", "ADMIN"] } },
          select: { id: true, name: true, role: true },
          orderBy: { name: "asc" },
        })
      : [];

  // Prepare data for client
  const escalationsData = escalations.map((esc) => ({
    id: esc.id,
    reason: esc.reason,
    status: esc.status as "PENDING" | "ACKNOWLEDGED" | "RESOLVED",
    createdAt: esc.createdAt.toISOString(),
    resolvedAt: esc.resolvedAt?.toISOString() || null,
    rule: {
      name: esc.rule.name,
      triggerType: esc.rule.triggerType,
    },
    recipient: {
      name: esc.recipient.name || "Unknown",
      email: esc.recipient.email,
      role: esc.recipient.role,
    },
    entity: esc.requestId
      ? {
          type: "REQUEST" as const,
          id: esc.request!.id,
          title: esc.request!.title,
          priority: esc.request!.priority as any,
          status: esc.request!.status as any,
        }
      : {
          type: "TASK" as const,
          id: esc.task!.id,
          title: esc.task!.title,
          status: esc.task!.status as any,
          assigneeName: esc.task!.assignee?.name || "Unassigned",
        },
  }));

  const stats = {
    total: totalEscalations,
    pending,
    acknowledged,
    avgResolutionMinutes,
    mostCommonTrigger,
  };

  const filterUsers = currentUser.role === "LEADER" ? teamMembers : allUsers;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Quản lý Escalations
        </h1>
        <p className="text-gray-600 mt-2">
          {currentUser.role === "LEADER"
            ? "Escalations của team bạn"
            : "Tất cả escalations trong hệ thống"}
        </p>
      </div>

      {/* Client Component */}
      <EscalationDashboardClient
        escalations={escalationsData}
        stats={stats}
        filterUsers={filterUsers}
        currentUserId={userId}
        userRole={currentUser.role}
      />
    </div>
  );
}

