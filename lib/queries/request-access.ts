// lib/queries/request-access.ts
import { prisma } from "@/lib/prisma";
import { UserRole, normalizeRole } from "@/types";

type RoleOptions = {
  teamId?: string | null;
};

/**
 * Check if user can view a request
 * 
 * Rules:
 * - ADMIN/LEADER: Can view all requests
 * - STAFF: Can view only requests they created OR tasks they're assigned to
 */
export async function canViewRequest(
  requestId: string,
  userId: string,
  userRole: UserRole | string,
  opts: RoleOptions = {}
): Promise<boolean> {
  // Normalize role (handle old ASSIGNEE/REQUESTER roles)
  const role = normalizeRole(userRole as any);
  
  // Admin and Leader can view all
  if (role === "ADMIN") {
    return true;
  }

  if (role === "LEADER") {
    const leaderTeamId = opts.teamId
      ? opts.teamId
      : (await prisma.user.findUnique({ where: { id: userId }, select: { teamId: true } }))?.teamId;

    if (!leaderTeamId) {
      return false;
    }

    const request = await prisma.request.findFirst({
      where: {
        id: requestId,
        OR: [
          { teamId: leaderTeamId },
          {
            creator: {
              teamId: leaderTeamId,
            },
          },
        ],
      },
    });

    return !!request;
  }

  // Staff: Check if they created it OR have assigned tasks
  const request = await prisma.request.findFirst({
    where: {
      id: requestId,
      creatorId: userId,
    },
  });

  return !!request;
}

/**
 * Get accessible requests for user
 */
export async function getAccessibleRequests(
  userId: string,
  userRole: UserRole | string,
  opts: RoleOptions = {}
) {
  // Normalize role
  const role = normalizeRole(userRole as any);
  
  // Admin/Leader: All requests
  if (role === "ADMIN") {
    return prisma.request.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  if (role === "LEADER") {
    const leaderTeamId = opts.teamId
      ? opts.teamId
      : (await prisma.user.findUnique({ where: { id: userId }, select: { teamId: true } }))?.teamId;

    return prisma.request.findMany({
      where: leaderTeamId
        ? {
            OR: [
              { teamId: leaderTeamId },
              {
                creator: {
                  teamId: leaderTeamId,
                },
              },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
    });
  }

  // Staff: Only their requests + requests with assigned tasks
  return prisma.request.findMany({
    where: {
      creatorId: userId,
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Build where clause for requests based on user role
 * Useful for filtering in queries
 */
export function buildRequestWhereClause(
  userId: string,
  userRole: UserRole | string,
  additionalWhere: any = {},
  opts: RoleOptions = {}
): any {
  const role = normalizeRole(userRole as any);
  const result: any = { ...additionalWhere };

  const appendAnd = (condition: any) => {
    if (!condition) return;
    if (result.AND) {
      result.AND = Array.isArray(result.AND) ? [...result.AND, condition] : [result.AND, condition];
    } else {
      result.AND = [condition];
    }
  };

  // Admin: no additional filter
  if (role === "ADMIN") {
    return result;
  }
  
  // Leader: filter by team
  if (role === "LEADER") {
    const leaderTeamId = opts.teamId;
    if (leaderTeamId) {
      appendAnd({
        OR: [
          { teamId: leaderTeamId },
          {
            creator: {
              teamId: leaderTeamId,
            },
          },
        ],
      });
    }
    return result;
  }
  
  // Staff: only their requests or requests with assigned tasks
  appendAnd({ creatorId: userId });
  return result;
}

