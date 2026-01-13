import * as React from "react";
import { cn } from "@/lib/utils";

export type RequestStatus = 
  | "OPEN" 
  | "IN_PROGRESS" 
  | "IN_REVIEW" 
  | "REWORK"
  | "DONE" 
  | "REJECTED" 
  | "ARCHIVED"
  | "CLARIFICATION";

export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface StatusBadgeProps {
  status: RequestStatus;
  className?: string;
}

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
}

const statusConfig: Record<RequestStatus, { bg: string; text: string; dot: string; label: string }> = {
  OPEN: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    dot: "bg-blue-500",
    label: "Mở",
  },
  IN_PROGRESS: {
    bg: "bg-orange-100",
    text: "text-orange-700",
    dot: "bg-orange-500",
    label: "Đang xử lý",
  },
  IN_REVIEW: {
    bg: "bg-purple-100",
    text: "text-purple-700",
    dot: "bg-purple-500",
    label: "Chờ xác nhận cuối",
  },
  REWORK: {
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    dot: "bg-yellow-500",
    label: "Làm lại",
  },
  DONE: {
    bg: "bg-green-100",
    text: "text-green-700",
    dot: "bg-green-500",
    label: "Hoàn thành",
  },
  REJECTED: {
    bg: "bg-red-100",
    text: "text-red-700",
    dot: "bg-red-500",
    label: "Từ chối",
  },
  ARCHIVED: {
    bg: "bg-gray-100",
    text: "text-gray-700",
    dot: "bg-gray-500",
    label: "Lưu trữ",
  },
  CLARIFICATION: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    dot: "bg-amber-500",
    label: "Làm rõ",
  },
};

const priorityConfig: Record<Priority, { bg: string; text: string; dot: string }> = {
  LOW: {
    bg: "bg-green-100",
    text: "text-green-700",
    dot: "bg-green-500",
  },
  MEDIUM: {
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    dot: "bg-yellow-500",
  },
  HIGH: {
    bg: "bg-red-100",
    text: "text-red-700",
    dot: "bg-red-500",
  },
  URGENT: {
    bg: "bg-orange-100",
    text: "text-orange-700",
    dot: "bg-orange-500",
  },
};

export const StatusBadge = React.forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ status, className }, ref) => {
    const config = status ? statusConfig[status] : undefined;
    const bg = config?.bg || "bg-gray-100";
    const text = config?.text || "text-gray-700";
    const dot = config?.dot || "bg-gray-400";
    const label = config?.label || (status || "-");

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium",
          bg,
          text,
          className
        )}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
        {label}
      </div>
    );
  }
);
StatusBadge.displayName = "StatusBadge";

export const PriorityBadge = React.forwardRef<HTMLDivElement, PriorityBadgeProps>(
  ({ priority, className }, ref) => {
    const config = priority ? priorityConfig[priority] : undefined;
    const bg = config?.bg || "bg-gray-100";
    const text = config?.text || "text-gray-700";
    const dot = config?.dot || "bg-gray-400";
    const labels: Record<Priority, string> = {
      LOW: "Thấp",
      MEDIUM: "Trung bình",
      HIGH: "Cao",
      URGENT: "Khẩn cấp",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium",
          bg,
          text,
          className
        )}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
        {priority ? labels[priority] : "-"}
      </div>
    );
  }
);
PriorityBadge.displayName = "PriorityBadge";

