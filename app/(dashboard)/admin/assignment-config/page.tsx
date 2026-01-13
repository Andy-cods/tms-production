import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AssignmentConfigClient } from "./_components/AssignmentConfigClient";
import { getAssignmentConfig } from "@/actions/assignment";
import { defaultAdvancedAssignmentSettings } from "@/lib/config/assignment-defaults";
import { Role, TaskStatus } from "@prisma/client";

/**
 * Admin Assignment Configuration Page
 * 
 * Allows admins to configure:
 * 1. Assignment weights (workload, skill, SLA, random)
 * 2. Team WIP limits
 * 3. User WIP limits
 * 4. Auto-assign toggle
 * 
 * References: mindmap CONF_W, CONF_WIP
 */
export default async function AssignmentConfigPage() {
  const session = await auth();
  const userRole = (session?.user as any)?.role;

  // Only ADMIN can access
  if (userRole !== "ADMIN") {
    redirect("/403");
  }

  // Get current assignment configuration
  const configResult = await getAssignmentConfig();
  const assignmentConfig =
    configResult.config || {
      weightWorkload: 0.4,
      weightSkill: 0.3,
      weightSLA: 0.2,
      weightRandom: 0.1,
      enableAutoAssign: true,
      advancedSettings: JSON.parse(JSON.stringify(defaultAdvancedAssignmentSettings)),
    };

  // Get teams with members and active tasks
  const teams = await prisma.team.findMany({
    select: {
      id: true,
      name: true,
      wipLimit: true,
      members: {
        select: {
          id: true,
          tasksAssigned: {
            where: {
              status: { in: ["TODO", "IN_PROGRESS", "IN_REVIEW"] },
            },
            select: { id: true },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  // Calculate team data
  const teamsData = teams.map((team) => {
    const totalMembers = team.members.length;
    const totalActiveTasks = team.members.reduce(
      (sum, member) => sum + member.tasksAssigned.length,
      0
    );
    const avgUtilization =
      totalMembers > 0
        ? (totalActiveTasks / (team.wipLimit || 20)) * 100
        : 0;

    return {
      id: team.id,
      name: team.name,
      totalMembers,
      wipLimit: team.wipLimit,
      totalActiveTasks,
      avgUtilization: Math.round(avgUtilization),
    };
  });

  // Get all users with their workload
  const users = await prisma.user.findMany({
    where: {
      role: { in: [Role.STAFF, Role.LEADER] },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      teamId: true,
      wipLimit: true,
      team: {
        select: {
          name: true,
        },
      },
      tasksAssigned: {
        where: {
          status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.IN_REVIEW] },
        },
        select: { id: true },
      },
    },
    orderBy: [{ teamId: "asc" }, { name: "asc" }],
  });

  // Calculate user data
  const usersData = users.map((user) => {
    const currentActiveTasks = user.tasksAssigned.length;
    const utilization =
      user.wipLimit > 0 ? (currentActiveTasks / user.wipLimit) * 100 : 0;

    return {
      id: user.id,
      name: user.name || "Unknown",
      email: user.email,
      role: user.role,
      teamId: user.teamId || null,
      teamName: user.team?.name || "No Team",
      wipLimit: user.wipLimit,
      currentActiveTasks,
      utilization: Math.round(utilization),
    };
  });

  // Get auto-assign stats (mock for now - you can implement this based on audit logs)
  const autoAssignStats = {
    lastAutoAssignTime: new Date().toISOString(),
    successRate: 95, // Percentage
    totalAutoAssignments: 150,
    lastWeekCount: 45,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Cấu hình Assignment & WIP
        </h1>
        <p className="text-gray-600 mt-2">
          Quản lý trọng số auto-assign và giới hạn WIP cho team/user
        </p>
      </div>

      {/* Client Component */}
      <AssignmentConfigClient
        initialConfig={assignmentConfig}
        teams={teamsData}
        users={usersData}
        autoAssignStats={autoAssignStats}
      />
    </div>
  );
}

