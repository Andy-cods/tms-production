"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { permissionService } from "@/lib/services/permission-service";
import { revalidatePath } from "next/cache";
import { getUserId } from "@/lib/auth-helpers";
import { Role, Prisma } from "@prisma/client";

/**
 * Get all permissions grouped by category
 */
export async function getAllPermissions() {
  try {
    const session = await auth();

    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return { success: false, error: "Không có quyền" };
    }

    const db = prisma as any;
    const permissions = await db.permission.findMany({
      where: { isActive: true },
      orderBy: [{ category: "asc" }, { order: "asc" }],
    });

    // Group by category
    const grouped = permissions.reduce((acc: any, perm: any) => {
      const cat = perm.category || "Other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(perm);
      return acc;
    }, {} as Record<string, typeof permissions>);

    return { success: true, permissions, grouped };
  } catch (error) {
    console.error("[getAllPermissions]:", error);
    return { success: false, error: "Lỗi tải permissions" };
  }
}

/**
 * Get permission matrix for all roles
 */
export async function getPermissionMatrix() {
  try {
    const session = await auth();

    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return { success: false, error: "Không có quyền" };
    }

    const db = prisma as any;
    const [permissions, rolePermissions] = await Promise.all([
      db.permission.findMany({
        where: { isActive: true },
        orderBy: [{ category: "asc" }, { order: "asc" }],
      }),

      db.rolePermission.findMany({
        where: {
          isGranted: true,
        },
        include: {
          permission: true,
        },
      }),
    ]);

    // Build matrix
    const matrix: Record<string, Record<string, boolean>> = {};

    for (const role of Object.values(Role)) {
      matrix[role] = {};
      for (const perm of permissions) {
        if (role === "ADMIN") {
          matrix[role][perm.id] = true;
        } else {
          const has = rolePermissions.some(
            (rp: any) => rp.role === role && rp.permissionId === perm.id
          );
          matrix[role][perm.id] = has;
        }
      }
    }

    return { success: true, permissions, matrix };
  } catch (error) {
    console.error("[getPermissionMatrix]:", error);
    return { success: false, error: "Lỗi tải matrix" };
  }
}

/**
 * Update role permission
 */
export async function updateRolePermission(
  role: Role,
  permissionId: string,
  isGranted: boolean
) {
  try {
    const session = await auth();

    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return { success: false, error: "Không có quyền" };
    }

    // Cannot modify ADMIN role
    if (role === "ADMIN") {
      return { success: false, error: "Không thể sửa quyền của ADMIN" };
    }

    const db = prisma as any;
    await db.rolePermission.upsert({
      where: {
        role_permissionId: {
          role,
          permissionId,
        },
      },
      update: {
        isGranted,
      },
      create: {
        role,
        permissionId,
        isGranted,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: isGranted ? "GRANT" : "REVOKE",
        entity: "Permission",
        entityId: permissionId,
        userId: getUserId(session),
        newValue: ({ role, permissionId, isGranted } as unknown) as Prisma.InputJsonValue,
      },
    });

    revalidatePath("/admin/permissions");

    return { success: true };
  } catch (error) {
    console.error("[updateRolePermission]:", error);
    return { success: false, error: "Lỗi cập nhật permission" };
  }
}

/**
 * Bulk update permissions for role
 */
export async function bulkUpdateRolePermissions(
  role: Role,
  permissionIds: string[],
  isGranted: boolean
) {
  try {
    const session = await auth();

    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return { success: false, error: "Không có quyền" };
    }

    if (role === "ADMIN") {
      return { success: false, error: "Không thể sửa quyền của ADMIN" };
    }

    const db = prisma as any;
    for (const permissionId of permissionIds) {
      await db.rolePermission.upsert({
        where: {
          role_permissionId: {
            role,
            permissionId,
          },
        },
        update: {
          isGranted,
        },
        create: {
          role,
          permissionId,
          isGranted,
        },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: isGranted ? "BULK_GRANT" : "BULK_REVOKE",
        entity: "Permission",
        entityId: role,
        userId: getUserId(session),
        newValue: ({ role, permissionCount: permissionIds.length } as unknown) as Prisma.InputJsonValue,
      },
    });

    revalidatePath("/admin/permissions");

    return { success: true };
  } catch (error) {
    console.error("[bulkUpdateRolePermissions]:", error);
    return { success: false, error: "Lỗi bulk update" };
  }
}

/**
 * Apply permission preset
 */
export async function applyPermissionPreset(role: Role, preset: string) {
  try {
    const session = await auth();

    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return { success: false, error: "Không có quyền" };
    }

    if (role === "ADMIN") {
      return { success: false, error: "Không thể sửa quyền của ADMIN" };
    }

    // Define presets
    const presets: Record<string, string[]> = {
      minimal: ["view_own_requests", "view_assigned_tasks"],
      standard: [
        "view_own_requests",
        "create_request",
        "view_assigned_tasks",
        "update_task",
        "view_team_users",
      ],
      extended: [
        "view_all_requests",
        "create_request",
        "view_all_tasks",
        "view_team_tasks",
        "create_task",
        "assign_task",
        "view_all_users",
        "view_reports",
      ],
    };

    const permissionNames = presets[preset];
    if (!permissionNames) {
      return { success: false, error: "Preset không hợp lệ" };
    }

    // Get permissions by name
    const db = prisma as any;
    const permissions = await db.permission.findMany({
      where: {
        name: {
          in: permissionNames,
        },
      },
    });

    // Revoke all current
    await (prisma as any).rolePermission.updateMany({
      where: { role },
      data: { isGranted: false },
    });

    // Grant new
    const db2 = prisma as any;
    for (const perm of permissions) {
      await db2.rolePermission.upsert({
        where: {
          role_permissionId: {
            role,
            permissionId: perm.id,
          },
        },
        update: {
          isGranted: true,
        },
        create: {
          role,
          permissionId: perm.id,
          isGranted: true,
        },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: "APPLY_PRESET",
        entity: "Permission",
        entityId: role,
        userId: getUserId(session),
        newValue: ({ role, preset, count: permissions.length } as unknown) as Prisma.InputJsonValue,
      },
    });

    revalidatePath("/admin/permissions");

    return { success: true };
  } catch (error) {
    console.error("[applyPermissionPreset]:", error);
    return { success: false, error: "Lỗi apply preset" };
  }
}

