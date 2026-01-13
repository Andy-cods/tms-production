import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
const db: any = prisma as any;

export const permissionService = {
  /**
   * Check if role has permission
   */
  async hasPermission(
    role: Role,
    resource: string,
    action: string
  ): Promise<boolean> {
    // ADMIN has all permissions
    if (role === "ADMIN") {
      return true;
    }

    // Check if permission exists and is granted
    const rolePermission = await db.rolePermission.findFirst({
      where: {
        role,
        permission: {
          resource,
          action,
          isActive: true,
        },
        isGranted: true,
      },
    });

    return !!rolePermission;
  },

  /**
   * Check multiple permissions at once
   */
  async hasAnyPermission(
    role: Role,
    checks: Array<{ resource: string; action: string }>
  ): Promise<boolean> {
    if (role === "ADMIN") return true;

    for (const check of checks) {
      const has = await this.hasPermission(role, check.resource, check.action);
      if (has) return true;
    }

    return false;
  },

  /**
   * Check all permissions
   */
  async hasAllPermissions(
    role: Role,
    checks: Array<{ resource: string; action: string }>
  ): Promise<boolean> {
    if (role === "ADMIN") return true;

    for (const check of checks) {
      const has = await this.hasPermission(role, check.resource, check.action);
      if (!has) return false;
    }

    return true;
  },

  /**
   * Get all permissions for role
   */
  async getRolePermissions(role: Role) {
    if (role === "ADMIN") {
      // Admin has all permissions
      return await db.permission.findMany({
        where: { isActive: true },
        orderBy: [{ category: "asc" }, { order: "asc" }],
      });
    }

    const rolePermissions = await db.rolePermission.findMany({
      where: {
        role,
        isGranted: true,
        permission: {
          isActive: true,
        },
      },
      include: {
        permission: true,
      },
      orderBy: {
        permission: {
          order: "asc",
        },
      },
    });

    return rolePermissions.map((rp: any) => rp.permission);
  },

  /**
   * Grant permission to role
   */
  async grantPermission(
    role: Role,
    resource: string,
    action: string
  ) {
    const permission = await db.permission.findUnique({
      where: {
        resource_action: {
          resource,
          action,
        },
      },
    });

    if (!permission) {
      throw new Error("Permission not found");
    }

    await db.rolePermission.upsert({
      where: {
        role_permissionId: {
          role,
          permissionId: permission.id,
        },
      },
      update: {
        isGranted: true,
      },
      create: {
        role,
        permissionId: permission.id,
        isGranted: true,
      },
    });
  },

  /**
   * Revoke permission from role
   */
  async revokePermission(
    role: Role,
    resource: string,
    action: string
  ) {
    const permission = await db.permission.findUnique({
      where: {
        resource_action: {
          resource,
          action,
        },
      },
    });

    if (!permission) return;

    await db.rolePermission.upsert({
      where: {
        role_permissionId: {
          role,
          permissionId: permission.id,
        },
      },
      update: {
        isGranted: false,
      },
      create: {
        role,
        permissionId: permission.id,
        isGranted: false,
      },
    });
  },

  /**
   * Apply permission group to role
   */
  async applyPermissionGroup(groupId: string, role: Role) {
    const group = await db.permissionGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new Error("Permission group not found");
    }

    const permissionIds = group.permissions as string[];

    // Revoke all current permissions
    await db.rolePermission.updateMany({
      where: { role },
      data: { isGranted: false },
    });

    // Grant new permissions
    for (const permissionId of permissionIds) {
      await db.rolePermission.upsert({
        where: {
          role_permissionId: {
            role,
            permissionId,
          },
        },
        update: {
          isGranted: true,
        },
        create: {
          role,
          permissionId,
          isGranted: true,
        },
      });
    }
  },

  /**
   * Check ownership (for resource-specific permissions)
   */
  async checkOwnership(
    userId: string,
    resource: "request" | "task",
    resourceId: string
  ): Promise<boolean> {
    if (resource === "request") {
      const request = await prisma.request.findUnique({
        where: { id: resourceId },
        select: { creatorId: true },
      });
      return request?.creatorId === userId;
    }

    if (resource === "task") {
      const task = await prisma.task.findUnique({
        where: { id: resourceId },
        select: { assigneeId: true },
      });
      return task?.assigneeId === userId;
    }

    return false;
  },

  /**
   * Check team membership
   */
  async checkTeamMembership(
    userId: string,
    teamId: string
  ): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { teamId: true },
    });

    return user?.teamId === teamId;
  },
};

