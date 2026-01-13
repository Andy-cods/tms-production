// @ts-nocheck
import { PrismaClient, PermissionResource, PermissionAction, Role } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedPermissions() {
  console.log("🌱 Seeding permissions...");

  // Define all permissions
  const permissions = [
    // ========================================
    // REQUESTS
    // ========================================
    {
      name: "view_all_requests",
      description: "Xem tất cả requests trong hệ thống",
      resource: PermissionResource.REQUEST,
      action: PermissionAction.VIEW,
      category: "Requests",
      order: 0,
    },
    {
      name: "view_own_requests",
      description: "Xem requests do mình tạo",
      resource: PermissionResource.REQUEST_OWN,
      action: PermissionAction.VIEW,
      category: "Requests",
      order: 1,
    },
    {
      name: "create_request",
      description: "Tạo request mới",
      resource: PermissionResource.REQUEST,
      action: PermissionAction.CREATE,
      category: "Requests",
      order: 2,
    },
    {
      name: "update_request",
      description: "Cập nhật request",
      resource: PermissionResource.REQUEST,
      action: PermissionAction.UPDATE,
      category: "Requests",
      order: 3,
    },
    {
      name: "delete_request",
      description: "Xóa request",
      resource: PermissionResource.REQUEST,
      action: PermissionAction.DELETE,
      category: "Requests",
      order: 4,
    },

    // ========================================
    // TASKS
    // ========================================
    {
      name: "view_all_tasks",
      description: "Xem tất cả tasks",
      resource: PermissionResource.TASK,
      action: PermissionAction.VIEW,
      category: "Tasks",
      order: 10,
    },
    {
      name: "view_assigned_tasks",
      description: "Xem tasks được giao cho mình",
      resource: PermissionResource.TASK_ASSIGNED,
      action: PermissionAction.VIEW,
      category: "Tasks",
      order: 11,
    },
    {
      name: "view_team_tasks",
      description: "Xem tasks của team",
      resource: PermissionResource.TASK_TEAM,
      action: PermissionAction.VIEW,
      category: "Tasks",
      order: 12,
    },
    {
      name: "create_task",
      description: "Tạo task mới",
      resource: PermissionResource.TASK,
      action: PermissionAction.CREATE,
      category: "Tasks",
      order: 13,
    },
    {
      name: "update_task",
      description: "Cập nhật task",
      resource: PermissionResource.TASK,
      action: PermissionAction.UPDATE,
      category: "Tasks",
      order: 14,
    },
    {
      name: "delete_task",
      description: "Xóa task",
      resource: PermissionResource.TASK,
      action: PermissionAction.DELETE,
      category: "Tasks",
      order: 15,
    },
    {
      name: "assign_task",
      description: "Phân công task cho người khác",
      resource: PermissionResource.TASK,
      action: PermissionAction.ASSIGN,
      category: "Tasks",
      order: 16,
    },
    {
      name: "approve_task",
      description: "Duyệt/từ chối task",
      resource: PermissionResource.TASK,
      action: PermissionAction.APPROVE,
      category: "Tasks",
      order: 17,
    },

    // ========================================
    // USERS
    // ========================================
    {
      name: "view_all_users",
      description: "Xem danh sách tất cả users",
      resource: PermissionResource.USER,
      action: PermissionAction.VIEW,
      category: "Users",
      order: 20,
    },
    {
      name: "view_team_users",
      description: "Xem users trong team",
      resource: PermissionResource.USER_TEAM,
      action: PermissionAction.VIEW,
      category: "Users",
      order: 21,
    },
    {
      name: "manage_users",
      description: "Quản lý users (CRUD)",
      resource: PermissionResource.USER,
      action: PermissionAction.MANAGE,
      category: "Users",
      order: 22,
    },

    // ========================================
    // ADMIN
    // ========================================
    {
      name: "manage_categories",
      description: "Quản lý categories",
      resource: PermissionResource.CATEGORY,
      action: PermissionAction.MANAGE,
      category: "Admin",
      order: 30,
    },
    {
      name: "manage_teams",
      description: "Quản lý teams",
      resource: PermissionResource.TEAM,
      action: PermissionAction.MANAGE,
      category: "Admin",
      order: 31,
    },
    {
      name: "manage_templates",
      description: "Quản lý request templates",
      resource: PermissionResource.TEMPLATE,
      action: PermissionAction.MANAGE,
      category: "Admin",
      order: 32,
    },
    {
      name: "manage_configuration",
      description: "Quản lý cấu hình hệ thống",
      resource: PermissionResource.CONFIGURATION,
      action: PermissionAction.MANAGE,
      category: "Admin",
      order: 33,
    },
    {
      name: "view_reports",
      description: "Xem reports",
      resource: PermissionResource.REPORTS,
      action: PermissionAction.VIEW,
      category: "Admin",
      order: 34,
    },
    {
      name: "export_reports",
      description: "Export reports (Excel/PDF)",
      resource: PermissionResource.REPORTS,
      action: PermissionAction.EXPORT,
      category: "Admin",
      order: 35,
    },
    {
      name: "view_audit_logs",
      description: "Xem audit logs",
      resource: PermissionResource.AUDIT_LOGS,
      action: PermissionAction.VIEW,
      category: "Admin",
      order: 36,
    },

    // ========================================
    // GAMIFICATION
    // ========================================
    {
      name: "view_achievements",
      description: "Xem achievements",
      resource: PermissionResource.ACHIEVEMENTS,
      action: PermissionAction.VIEW,
      category: "Gamification",
      order: 40,
    },
    {
      name: "manage_achievements",
      description: "Quản lý achievements & badges",
      resource: PermissionResource.ACHIEVEMENTS,
      action: PermissionAction.MANAGE,
      category: "Gamification",
      order: 41,
    },
    {
      name: "view_leaderboard",
      description: "Xem leaderboard",
      resource: PermissionResource.LEADERBOARD,
      action: PermissionAction.VIEW,
      category: "Gamification",
      order: 42,
    },
  ];

  // Create permissions
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: {
        resource_action: {
          resource: permission.resource,
          action: permission.action,
        },
      },
      update: {},
      create: permission,
    });
  }

  console.log(`✅ ${permissions.length} permissions created`);

  // ========================================
  // ASSIGN PERMISSIONS TO ROLES
  // ========================================

  // Get all permissions
  const allPermissions = await prisma.permission.findMany();
  const permissionMap = new Map(
    allPermissions.map((p) => [`${p.resource}_${p.action}`, p])
  );

  // STAFF permissions
  const staffPermissions: Array<[PermissionResource, PermissionAction]> = [
    [PermissionResource.REQUEST_OWN, PermissionAction.VIEW],
    [PermissionResource.REQUEST, PermissionAction.CREATE],
    [PermissionResource.TASK_ASSIGNED, PermissionAction.VIEW],
    [PermissionResource.TASK, PermissionAction.UPDATE],
    [PermissionResource.USER_TEAM, PermissionAction.VIEW],
    [PermissionResource.ACHIEVEMENTS, PermissionAction.VIEW],
    [PermissionResource.LEADERBOARD, PermissionAction.VIEW],
  ];

  for (const [resource, action] of staffPermissions) {
    const permission = permissionMap.get(`${resource}_${action}`);
    if (permission) {
      await prisma.rolePermission.upsert({
        where: {
          role_permissionId: {
            role: Role.STAFF,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          role: Role.STAFF,
          permissionId: permission.id,
          isGranted: true,
        },
      });
    }
  }

  console.log("✅ STAFF permissions assigned");

  // LEADER permissions (all of STAFF + more)
  const leaderPermissions: Array<[PermissionResource, PermissionAction]> = [
    ...staffPermissions,
    [PermissionResource.REQUEST, PermissionAction.VIEW],
    [PermissionResource.REQUEST, PermissionAction.UPDATE],
    [PermissionResource.REQUEST, PermissionAction.DELETE],
    [PermissionResource.TASK, PermissionAction.VIEW],
    [PermissionResource.TASK_TEAM, PermissionAction.VIEW],
    [PermissionResource.TASK, PermissionAction.CREATE],
    [PermissionResource.TASK, PermissionAction.DELETE],
    [PermissionResource.TASK, PermissionAction.ASSIGN],
    [PermissionResource.TASK, PermissionAction.APPROVE],
    [PermissionResource.USER, PermissionAction.VIEW],
    [PermissionResource.USER_TEAM, PermissionAction.VIEW],
    [PermissionResource.REPORTS, PermissionAction.VIEW],
    [PermissionResource.REPORTS, PermissionAction.EXPORT],
  ];

  for (const [resource, action] of leaderPermissions) {
    const permission = permissionMap.get(`${resource}_${action}`);
    if (permission) {
      await prisma.rolePermission.upsert({
        where: {
          role_permissionId: {
            role: Role.LEADER,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          role: Role.LEADER,
          permissionId: permission.id,
          isGranted: true,
        },
      });
    }
  }

  console.log("✅ LEADER permissions assigned");

  // ADMIN has all permissions (handled in service)

  console.log("✅ All permissions seeded successfully");
}

