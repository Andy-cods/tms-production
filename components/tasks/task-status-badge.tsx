import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Circle,
  Clock,
  Play,
  XCircle,
  AlertTriangle,
  FileCheck,
  Repeat,
  Hourglass,
} from "lucide-react";
import type { TaskStatus } from "@prisma/client";

interface TaskStatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

/**
 * Task Status Badge Component
 * Visual indicator for task status with icons and colors
 */
export function TaskStatusBadge({ status, className }: TaskStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "TODO":
        return {
          variant: "secondary" as const,
          icon: Circle,
          label: "Chưa làm",
          className: "bg-gray-100 text-gray-700 border-gray-300",
        };

      case "IN_PROGRESS":
        return {
          variant: "default" as const,
          icon: Play,
          label: "Đang làm",
          className: "bg-blue-100 text-blue-700 border-blue-300",
        };

      case "BLOCKED":
        return {
          variant: "destructive" as const,
          icon: XCircle,
          label: "Bị chặn",
          className: "bg-red-100 text-red-700 border-red-300",
        };

      case "IN_REVIEW":
        return {
          variant: "default" as const,
          icon: FileCheck,
          label: "Review",
          className: "bg-purple-100 text-purple-700 border-purple-300",
        };

      case "REWORK":
        return {
          variant: "default" as const,
          icon: Repeat,
          label: "Làm lại",
          className: "bg-orange-100 text-orange-700 border-orange-300",
        };

      case "WAITING_SUBTASKS":
        return {
          variant: "default" as const,
          icon: Hourglass,
          label: "Chờ subtasks",
          className: "bg-yellow-100 text-yellow-700 border-yellow-300",
        };

      case "DONE":
        return {
          variant: "default" as const,
          icon: CheckCircle2,
          label: "Hoàn thành",
          className: "bg-green-100 text-green-700 border-green-300",
        };

      default:
        return {
          variant: "secondary" as const,
          icon: AlertTriangle,
          label: status,
          className: "bg-gray-100 text-gray-600 border-gray-300",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`${config.className} ${className || ""}`}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
}

