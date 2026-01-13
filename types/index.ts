// types/index.ts
// User Role types and permissions

// New roles (migrated from 4 to 3 roles)
export type UserRole = "ADMIN" | "LEADER" | "STAFF";

// Deprecated roles (keep for backward compatibility during migration)
export type OldUserRole = "ADMIN" | "LEADER" | "STAFF" | "ASSIGNEE" | "REQUESTER";

// Role display labels (Vietnamese)
export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Quản trị viên",
  LEADER: "Trưởng nhóm",
  STAFF: "Nhân viên",
};

// Role descriptions
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  ADMIN: "Toàn quyền quản trị hệ thống",
  LEADER: "Quản lý team, phân công và duyệt công việc",
  STAFF: "Tạo yêu cầu và thực hiện công việc được giao",
};

// Permission helpers
export const canCreateRequest = (role: UserRole | OldUserRole): boolean => {
  // All roles can create requests
  return ["ADMIN", "LEADER", "STAFF", "ASSIGNEE", "REQUESTER"].includes(role);
};

export const canAssignTasks = (role: UserRole | OldUserRole): boolean => {
  return ["ADMIN", "LEADER"].includes(role);
};

export const canViewAllRequests = (role: UserRole | OldUserRole): boolean => {
  return ["ADMIN", "LEADER"].includes(role);
};

export const canManageUsers = (role: UserRole | OldUserRole): boolean => {
  return role === "ADMIN";
};

export const canManageTeams = (role: UserRole | OldUserRole): boolean => {
  return role === "ADMIN";
};

export const canAccessLeaderDashboard = (role: UserRole | OldUserRole): boolean => {
  return ["ADMIN", "LEADER"].includes(role);
};

export const canAccessAdminPanel = (role: UserRole | OldUserRole): boolean => {
  return role === "ADMIN";
};

// Helper to normalize old roles to new roles
export function normalizeRole(role: UserRole | OldUserRole): UserRole {
  if (role === "ASSIGNEE" || role === "REQUESTER") {
    return "STAFF";
  }
  return role as UserRole;
}

// Type guard to check if role is new format
export function isNewRole(role: string): role is UserRole {
  return ["ADMIN", "LEADER", "STAFF"].includes(role);
}

// User position type
export type UserPosition = string | null;

// Position examples (for documentation)
export const POSITION_EXAMPLES = [
  "Dev - Junior",
  "Dev - Mid",
  "Dev - Senior",
  "Dev - Staff",
  "Dev - Principal",
  "Marketing - Junior",
  "Marketing - Senior",
  "Marketing - Manager",
  "Sales - Executive",
  "Sales - Manager",
  "HR - Specialist",
  "HR - Manager",
  "Finance - Accountant",
  "Finance - Manager",
  "Design - Junior Designer",
  "Design - Senior Designer",
  "Design - Art Director",
];

// Helper function
export function formatPosition(position: string | null | undefined): string {
  return position || "Chưa xác định";
}

