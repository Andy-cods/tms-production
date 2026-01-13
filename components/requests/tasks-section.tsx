"use client";

import { useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { 
  CheckSquare, 
  Plus, 
  User, 
  Calendar, 
  ChevronDown, 
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Inbox,
  ListTree,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { SubtaskManager } from "@/components/tasks/subtask-manager";
import { UseTemplateDialog } from "@/app/(dashboard)/requests/[id]/_components/UseTemplateDialog";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | "BLOCKED" | "WAITING_SUBTASKS" | "REWORK";
  deadline: string;
  assignee: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
  parentTaskId?: string | null;
}

interface TasksSectionProps {
  requestId: string;
  tasks?: Task[];
  isLoading?: boolean;
  canAddTask?: boolean;
  currentUserId?: string;
  userRole?: string;
  templates?: any[];
  onAddTask?: () => void;
  onViewTask?: (taskId: string) => void;
  onEditTask?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
}

export function TasksSection({ 
  requestId, 
  tasks = [], 
  isLoading = false,
  canAddTask = false,
  currentUserId,
  userRole,
  templates,
  onAddTask,
  onViewTask,
  onEditTask,
  onDeleteTask
}: TasksSectionProps) {
  const [showUseTemplate, setShowUseTemplate] = useState(false);
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "DONE":
        return "default";
      case "IN_PROGRESS":
        return "secondary";
      case "IN_REVIEW":
        return "outline";
      case "BLOCKED":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DONE":
        return "bg-green-100 text-green-700 border-green-200";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "IN_REVIEW":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "BLOCKED":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  if (isLoading) {
    return <TasksSkeleton />;
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-primary" />
          Nhiệm vụ ({tasks.length})
        </h2>
        {canAddTask && (
          <div className="flex gap-2">
            {templates && templates.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUseTemplate(true)}
                type="button"
                className="relative z-[60] hover:bg-yellow-50 hover:border-yellow-300 cursor-pointer transition-all"
                style={{ pointerEvents: 'auto' }}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Dùng template
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Thêm nhiệm vụ clicked!');
                if (onAddTask) {
                  onAddTask();
                } else {
                  console.error('onAddTask handler missing!');
                }
              }}
              type="button"
              className="relative z-[60] hover:bg-primary-50 hover:border-primary-300 cursor-pointer transition-all"
              style={{ pointerEvents: 'auto' }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Thêm nhiệm vụ
            </Button>
          </div>
        )}
      </div>

      {!tasks.length ? (
        <div className="text-center py-8 text-gray-500">
          <Inbox className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Chưa có nhiệm vụ nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task}
              requestId={requestId}
              currentUserId={currentUserId}
              userRole={userRole}
              onView={onViewTask}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              getStatusVariant={getStatusVariant}
              getStatusColor={getStatusColor}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TaskCard({ 
  task, 
  requestId,
  currentUserId,
  userRole,
  onView, 
  onEdit, 
  onDelete,
  getStatusVariant,
  getStatusColor
}: { 
  task: Task;
  requestId: string;
  currentUserId?: string;
  userRole?: string;
  onView?: (taskId: string) => void;
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  getStatusVariant: (status: string) => any;
  getStatusColor: (status: string) => string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSubtasks, setShowSubtasks] = useState(false);
  
  // Only show subtasks for parent tasks (not for subtasks themselves)
  const canHaveSubtasks = !task.parentTaskId;
  
  // Determine if user can edit subtasks
  const canEditSubtasks = 
    userRole === "ADMIN" || 
    userRole === "LEADER" ||
    currentUserId === task.assignee?.id;
  

  return (
    <div className="border border-gray-200 rounded-xl hover:border-primary/50 hover:shadow-md transition-all duration-200 group">
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                {task.title}
              </h3>
              <TaskStatusBadge status={task.status} />
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {task.assignee.name}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {format(new Date(task.deadline), "dd/MM/yyyy HH:mm", { locale: vi })}
              </span>
            </div>

            {task.description && isExpanded && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {task.description}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {task.description && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="hover:bg-primary-50 hover:text-primary-600 transition-all"
              >
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
                  isExpanded ? 'rotate-180' : ''
                }`} />
              </Button>
            )}
            
            {canHaveSubtasks && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSubtasks(!showSubtasks)}
                className="relative z-50 hover:bg-primary-50 hover:text-primary-600 transition-all"
              >
                <ListTree className="w-4 h-4" />
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="hover:bg-primary-50 hover:text-primary-600 transition-all"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView?.(task.id)}>
                  <Eye className="w-4 h-4 mr-2" />
                  Xem chi tiết
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit?.(task.id)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Chỉnh sửa
                </DropdownMenuItem>
                {onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(task.id)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Xóa
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Subtask Manager Section */}
        {canHaveSubtasks && showSubtasks && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <ListTree className="w-4 h-4 text-gray-600" />
              <h4 className="text-sm font-semibold text-gray-700">Công việc con</h4>
            </div>
            <SubtaskManager
              taskId={task.id}
              requestId={requestId}
              canManage={canEditSubtasks && task.status !== "DONE"}
            />
          </div>
        )}
      </div>

      {/* Use Template Dialog removed in this build */}
    </div>
  );
}

function TasksSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gray-200 rounded"></div>
          <div className="h-6 w-32 bg-gray-200 rounded"></div>
        </div>
        <div className="h-8 w-24 bg-gray-200 rounded"></div>
      </div>
      
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-5 w-48 bg-gray-200 rounded"></div>
                  <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                </div>
                <div className="flex gap-3">
                  <div className="h-4 w-24 bg-gray-200 rounded"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="h-8 w-8 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
