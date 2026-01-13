import { auth } from "@/lib/auth";
import { permissionService } from "@/lib/services/permission-service";
import { Role } from "@prisma/client";

/**
 * Check permission decorator for server actions
 */
export async function requirePermission(
  resource: string,
  action: string
): Promise<{ authorized: boolean; role?: Role; error?: string }> {
  const session = await auth();

  if (!session?.user) {
    return {
      authorized: false,
      error: "Chưa đăng nhập",
    };
  }

  const role = (session.user as any).role as Role;

  const hasPermission = await permissionService.hasPermission(
    role,
    resource,
    action
  );

  if (!hasPermission) {
    return {
      authorized: false,
      role,
      error: "Bạn không có quyền thực hiện hành động này",
    };
  }

  return {
    authorized: true,
    role,
  };
}

/**
 * Check multiple permissions (OR logic)
 */
export async function requireAnyPermission(
  checks: Array<{ resource: string; action: string }>
): Promise<{ authorized: boolean; role?: Role; error?: string }> {
  const session = await auth();

  if (!session?.user) {
    return {
      authorized: false,
      error: "Chưa đăng nhập",
    };
  }

  const role = (session.user as any).role as Role;

  const hasPermission = await permissionService.hasAnyPermission(role, checks);

  if (!hasPermission) {
    return {
      authorized: false,
      role,
      error: "Bạn không có quyền thực hiện hành động này",
    };
  }

  return {
    authorized: true,
    role,
  };
}

/**
 * Check all permissions (AND logic)
 */
export async function requireAllPermissions(
  checks: Array<{ resource: string; action: string }>
): Promise<{ authorized: boolean; role?: Role; error?: string }> {
  const session = await auth();

  if (!session?.user) {
    return {
      authorized: false,
      error: "Chưa đăng nhập",
    };
  }

  const role = (session.user as any).role as Role;

  const hasPermission = await permissionService.hasAllPermissions(role, checks);

  if (!hasPermission) {
    return {
      authorized: false,
      role,
      error: "Bạn không có quyền thực hiện hành động này",
    };
  }

  return {
    authorized: true,
    role,
  };
}

