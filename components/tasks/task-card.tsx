import Link from "next/link";
import { Calendar, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { PriorityBadge } from "@/components/ui/status-badge";
// TODO: Uncomment TaskTimer after running time tracking migration
// import { TaskTimer } from "@/components/time-tracking/task-timer";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { QuickActionsMenu } from "./quick-actions-menu";

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    status: string;
    deadline: Date | null;
    assigneeId?: string | null;
    request?: {
      id: string;
      title: string;
      priority?: string;
    } | null;
  };
  isDragging?: boolean;
  currentUserId?: string;
  currentUserRole?: string;
}

const statusColors = {
  TODO: "border-gray-300",
  IN_PROGRESS: "border-orange-400 bg-orange-50/30",
  BLOCKED: "border-red-400 bg-red-50/30",
  IN_REVIEW: "border-blue-400 bg-blue-50/30",
  DONE: "border-green-400 bg-green-50/30",
  REWORK: "border-yellow-400 bg-yellow-50/30",
};

const priorityDots = {
  LOW: "bg-green-500",
  MEDIUM: "bg-yellow-500",
  HIGH: "bg-red-500",
  URGENT: "bg-orange-500",
};

export function TaskCard({ task, isDragging, currentUserId, currentUserRole }: TaskCardProps) {
  const isOverdue = task.deadline && new Date(task.deadline) < new Date();

  return (
    <div
      className={cn(
        "bg-white rounded-xl p-4 shadow-sm border-2 transition-all duration-200",
        "hover:shadow-md cursor-grab active:cursor-grabbing group relative",
        statusColors[task.status as keyof typeof statusColors] || "border-gray-300",
        isDragging && "opacity-50 rotate-2 scale-105"
      )}
    >
      {/* Quick Actions - Top right corner */}
      {currentUserId && currentUserRole && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <QuickActionsMenu
            task={{
              id: task.id,
              title: task.title,
              status: task.status,
              priority: task.request?.priority || "MEDIUM",
              deadline: task.deadline?.toISOString() || null,
              assigneeId: task.assigneeId || null,
              requestId: task.request?.id,
            }}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
          />
        </div>
      )}
      {/* Priority Dot */}
      {task.request?.priority && (
        <div className="flex items-start justify-between mb-2">
          <div
            className={cn(
              "w-3 h-3 rounded-full",
              priorityDots[task.request.priority as keyof typeof priorityDots]
            )}
          />
          <PriorityBadge priority={task.request.priority as any} />
        </div>
      )}

      {/* Title */}
      <Link href={`/my-tasks/${task.id}`}>
        <h3 className="font-medium text-dark-900 mb-2 line-clamp-2 hover:text-primary-600 transition-colors">
          {task.title}
        </h3>
      </Link>

      {/* Request Link */}
      {task.request && (
        <Link
          href={`/requests/${task.request.id}`}
          className="text-sm text-gray-600 hover:text-primary-600 block mb-2 truncate"
        >
          📋 {task.request.title}
        </Link>
      )}

      {/* Deadline */}
      {task.deadline && (
        <div
          className={cn(
            "flex items-center gap-1.5 text-sm",
            isOverdue ? "text-red-600 font-medium" : "text-gray-600"
          )}
        >
          {isOverdue ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <Calendar className="h-4 w-4" />
          )}
          <span>
            {isOverdue ? "Quá hạn " : ""}
            {formatDistanceToNow(new Date(task.deadline), {
              addSuffix: !isOverdue,
              locale: vi,
            })}
          </span>
        </div>
      )}

      {/* Timer Section - TODO: Uncomment after running time tracking migration */}
      {/* <div className="mt-3 pt-3 border-t">
        <TaskTimer
          taskId={task.id}
          activeTimer={null}
          onTimerChange={() => {}}
        />
      </div> */}
    </div>
  );
}

