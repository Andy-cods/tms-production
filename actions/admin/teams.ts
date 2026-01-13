"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Logger } from "@/lib/utils/logger";
import { revalidatePath } from "next/cache";

// Zod schemas
const teamSchema = z.object({
  name: z.string().min(2, "Tên phải có ít nhất 2 ký tự").max(50, "Tên không quá 50 ký tự"),
  description: z.string().max(500, "Mô tả không quá 500 ký tự").optional(),
  leaderId: z.string().nullable(),
});

type TeamInput = z.infer<typeof teamSchema>;

/**
 * Check if user is ADMIN
 */
async function assertAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  
  const user = session.user as any;
  if (user.role !== "ADMIN") {
    throw new Error("Forbidden: Only ADMIN can manage teams");
  }
  
  return user.id;
}

/**
 * Create a new team
 */
export async function createTeam(data: TeamInput) {
  try {
    const adminId = await assertAdmin();

    // Validate input
    const validated = teamSchema.parse(data);

    // Check if name already exists (case-insensitive)
    const existing = await prisma.team.findFirst({
      where: {
        name: {
          equals: validated.name,
          mode: "insensitive",
        },
      },
    });

    if (existing) {
      throw new Error("Tên team đã tồn tại");
    }

    // Validate leader if provided
    if (validated.leaderId) {
      const leader = await prisma.user.findUnique({
        where: { id: validated.leaderId },
        select: { id: true, role: true, teamId: true },
      });

      if (!leader) {
        throw new Error("Leader not found");
      }

      if (leader.role !== "LEADER" && leader.role !== "ADMIN") {
        throw new Error("User phải có vai trò LEADER hoặc ADMIN");
      }
    }

    // Create team
    const team = await prisma.team.create({
      data: {
        name: validated.name,
        description: validated.description,
      },
    });

    // Add leader to team if provided
    if (validated.leaderId) {
      await prisma.user.update({
        where: { id: validated.leaderId },
        data: { teamId: team.id },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: "TEAM_CREATED",
        entity: "Team",
        entityId: team.id,
        newValue: {
          name: team.name,
          leaderId: validated.leaderId,
        },
      },
    });

    Logger.info("Team created", {
      action: "createTeam",
      teamId: team.id,
      adminId,
    });

    revalidatePath("/admin/teams");

    return { success: true, teamId: team.id };
  } catch (error) {
    Logger.captureException(error as Error, { action: "createTeam" });
    throw error;
  }
}

/**
 * Update existing team
 */
export async function updateTeam(teamId: string, data: Partial<TeamInput>) {
  try {
    const adminId = await assertAdmin();

    const existing = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!existing) {
      throw new Error("Team not found");
    }

    // Check name uniqueness if changing name
    if (data.name && data.name !== existing.name) {
      const nameExists = await prisma.team.findFirst({
        where: {
          name: {
            equals: data.name,
            mode: "insensitive",
          },
          id: { not: teamId },
        },
      });

      if (nameExists) {
        throw new Error("Tên team đã tồn tại");
      }
    }

    // Update team
    const updated = await prisma.team.update({
      where: { id: teamId },
      data: {
        name: data.name,
        description: data.description,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: "TEAM_UPDATED",
        entity: "Team",
        entityId: teamId,
        oldValue: {
          name: existing.name,
          description: existing.description,
        },
        newValue: {
          name: updated.name,
          description: updated.description,
        },
      },
    });

    Logger.info("Team updated", {
      action: "updateTeam",
      teamId,
      adminId,
    });

    revalidatePath("/admin/teams");

    return { success: true };
  } catch (error) {
    Logger.captureException(error as Error, { action: "updateTeam", teamId });
    throw error;
  }
}

/**
 * Delete team
 */
export async function deleteTeam(teamId: string) {
  try {
    const adminId = await assertAdmin();

    // Get team with members and requests
    const membersCount = await prisma.user.count({
      where: { teamId },
    });

    const requestsCount = await prisma.request.count({
      where: { teamId },
    });

    if (membersCount > 0) {
      throw new Error(
        `Team có ${membersCount} thành viên. Vui lòng chuyển thành viên sang team khác trước khi xóa.`
      );
    }

    if (requestsCount > 0) {
      throw new Error(
        `Team có ${requestsCount} yêu cầu. Vui lòng xử lý các yêu cầu trước khi xóa.`
      );
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { name: true },
    });

    // Delete team
    await prisma.team.delete({
      where: { id: teamId },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: "TEAM_DELETED",
        entity: "Team",
        entityId: teamId,
        oldValue: {
          name: team?.name,
        },
      },
    });

    Logger.info("Team deleted", {
      action: "deleteTeam",
      teamId,
      adminId,
    });

    revalidatePath("/admin/teams");

    return { success: true };
  } catch (error) {
    Logger.captureException(error as Error, { action: "deleteTeam", teamId });
    throw error;
  }
}

/**
 * Add members to team
 */
export async function addMembersToTeam(teamId: string, userIds: string[]) {
  try {
    const adminId = await assertAdmin();

    // Validate team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { name: true },
    });

    if (!team) {
      throw new Error("Team not found");
    }

    // Update all users
    await prisma.user.updateMany({
      where: {
        id: { in: userIds },
      },
      data: {
        teamId,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: "MEMBERS_ADDED_TO_TEAM",
        entity: "Team",
        entityId: teamId,
        newValue: {
          userIds,
          count: userIds.length,
        },
      },
    });

    Logger.info("Members added to team", {
      action: "addMembersToTeam",
      teamId,
      memberCount: userIds.length,
      adminId,
    });

    revalidatePath("/admin/teams");
    revalidatePath("/admin/users");

    return { success: true };
  } catch (error) {
    Logger.captureException(error as Error, { action: "addMembersToTeam", teamId });
    throw error;
  }
}

/**
 * Remove member from team
 */
export async function removeMemberFromTeam(
  teamId: string,
  userId: string,
  reassignTasks: boolean = false
) {
  try {
    const adminId = await assertAdmin();

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, teamId: true },
    });

    if (!user || user.teamId !== teamId) {
      throw new Error("User not in this team");
    }

    // If reassignTasks, find team leader
    if (reassignTasks) {
      const activeTasksCount = await prisma.task.count({
        where: {
          assigneeId: userId,
          status: { in: ["TODO", "IN_PROGRESS", "IN_REVIEW"] },
        },
      });

      if (activeTasksCount > 0) {
        // Unassign tasks (leader will reassign)
        await prisma.task.updateMany({
          where: {
            assigneeId: userId,
            status: { in: ["TODO", "IN_PROGRESS", "IN_REVIEW"] },
          },
          data: {
            assigneeId: null,
          },
        });
      }
    }

    // Remove from team
    await prisma.user.update({
      where: { id: userId },
      data: { teamId: null },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: "MEMBER_REMOVED_FROM_TEAM",
        entity: "Team",
        entityId: teamId,
        oldValue: {
          userId,
          userName: user.name,
        },
      },
    });

    Logger.info("Member removed from team", {
      action: "removeMemberFromTeam",
      teamId,
      userId,
      reassignedTasks: reassignTasks,
      adminId,
    });

    revalidatePath("/admin/teams");
    revalidatePath("/admin/users");

    return { success: true };
  } catch (error) {
    Logger.captureException(error as Error, { action: "removeMemberFromTeam", teamId, userId });
    throw error;
  }
}

/**
 * Transfer members between teams
 */
export async function transferMembers(
  fromTeamId: string,
  toTeamId: string,
  userIds: string[],
  moveTasks: boolean = false
) {
  try {
    const adminId = await assertAdmin();

    // Validate both teams exist
    const [fromTeam, toTeam] = await Promise.all([
      prisma.team.findUnique({ where: { id: fromTeamId } }),
      prisma.team.findUnique({ where: { id: toTeamId } }),
    ]);

    if (!fromTeam || !toTeam) {
      throw new Error("Team not found");
    }

    // Transfer users
    await prisma.user.updateMany({
      where: {
        id: { in: userIds },
        teamId: fromTeamId,
      },
      data: {
        teamId: toTeamId,
      },
    });

    // If moveTasks, update request teamId for their tasks
    if (moveTasks) {
      // Get all requests created by or assigned to these users
      await prisma.request.updateMany({
        where: {
          teamId: fromTeamId,
          OR: [
            { creatorId: { in: userIds } },
            {
              tasks: {
                some: {
                  assigneeId: { in: userIds },
                },
              },
            },
          ],
        },
        data: {
          teamId: toTeamId,
        },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: "MEMBERS_TRANSFERRED",
        entity: "Team",
        entityId: fromTeamId,
        newValue: {
          fromTeam: fromTeam.name,
          toTeam: toTeam.name,
          userIds,
          count: userIds.length,
          movedTasks: moveTasks,
        },
      },
    });

    Logger.info("Members transferred between teams", {
      action: "transferMembers",
      fromTeamId,
      toTeamId,
      memberCount: userIds.length,
      movedTasks: moveTasks,
      adminId,
    });

    revalidatePath("/admin/teams");
    revalidatePath("/admin/users");

    return { success: true };
  } catch (error) {
    Logger.captureException(error as Error, { 
      action: "transferMembers", 
      fromTeamId, 
      toTeamId 
    });
    throw error;
  }
}

/**
 * Change team leader
 */
export async function changeTeamLeader(teamId: string, newLeaderId: string | null) {
  try {
    const adminId = await assertAdmin();

    // Validate team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, name: true },
    });

    if (!team) {
      throw new Error("Team not found");
    }

    // Validate new leader if provided
    if (newLeaderId) {
      const leader = await prisma.user.findUnique({
        where: { id: newLeaderId },
        select: { id: true, name: true, role: true, teamId: true },
      });

      if (!leader) {
        throw new Error("Leader not found");
      }

      if (leader.role !== "LEADER" && leader.role !== "ADMIN") {
        throw new Error("User phải có vai trò LEADER hoặc ADMIN");
      }

      // Add leader to team if not already a member
      if (leader.teamId !== teamId) {
        await prisma.user.update({
          where: { id: newLeaderId },
          data: { teamId },
        });
      }
    }

    // Note: leaderId would need to be added to Team schema
    // For now, we just ensure the leader is in the team

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: "TEAM_LEADER_CHANGED",
        entity: "Team",
        entityId: teamId,
        newValue: {
          leaderId: newLeaderId,
        },
      },
    });

    Logger.info("Team leader changed", {
      action: "changeTeamLeader",
      teamId,
      newLeaderId,
      adminId,
    });

    revalidatePath("/admin/teams");

    return { success: true };
  } catch (error) {
    Logger.captureException(error as Error, { action: "changeTeamLeader", teamId });
    throw error;
  }
}

/**
 * Get all teams
 */
export async function getTeams() {
  try {
    const teams = await prisma.team.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return teams;
  } catch (error) {
    Logger.captureException(error as Error, { action: "getTeams" });
    throw error;
  }
}

