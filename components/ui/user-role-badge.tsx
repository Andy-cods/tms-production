// components/ui/user-role-badge.tsx
import { Badge } from "@/components/ui/badge";
import { UserRole, ROLE_LABELS, normalizeRole } from "@/types";

interface UserRoleBadgeProps {
  role: UserRole | string;
  className?: string;
}

export function UserRoleBadge({ role, className }: UserRoleBadgeProps) {
  // Normalize role (handle old ASSIGNEE/REQUESTER roles)
  const normalizedRole = normalizeRole(role as any);
  
  const variants: Record<UserRole, "default" | "secondary" | "outline"> = {
    ADMIN: "default",
    LEADER: "secondary",
    STAFF: "outline",
  };

  const colors: Record<UserRole, string> = {
    ADMIN: "bg-red-100 text-red-700 border-red-300",
    LEADER: "bg-blue-100 text-blue-700 border-blue-300",
    STAFF: "bg-green-100 text-green-700 border-green-300",
  };

  return (
    <Badge 
      variant={variants[normalizedRole]} 
      className={`${colors[normalizedRole]} ${className || ""}`}
    >
      {ROLE_LABELS[normalizedRole]}
    </Badge>
  );
}

