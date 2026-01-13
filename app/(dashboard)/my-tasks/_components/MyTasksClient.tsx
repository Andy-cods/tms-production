"use client";

import { useState } from "react";
import { LayoutList, LayoutGrid, Filter } from "lucide-react";
import { TaskKanban } from "@/components/tasks/task-kanban";
import { TaskListView } from "@/components/tasks/task-list-view";
import { TaskFilters } from "@/components/tasks/task-filters";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { updateTaskStatusAction } from "@/actions/task";

interface Task {
  id: string;
  title: string;
  status: string;
  deadline: Date | null;
  slaDeadline: Date | null;
  slaPausedAt: Date | null;
  slaPausedReason: string | null;
  slaTotalPaused: number;
  request?: {
    id: string;
    title: string;
    priority?: string;
  } | null;
  slaPauseLogs: Array<{
    id: string;
    reason: string;
    pausedAt: Date;
    resumedAt: Date | null;
    pausedBy: string;
    user: {
      name: string | null;
    };
    notes: string | null;
  }>;
  _count: {
    slaPauseLogs: number;
  };
}

interface MyTasksClientProps {
  tasks: Task[];
  currentUserId?: string;
  currentUserRole?: string;
}

export function MyTasksClient({ tasks, currentUserId, currentUserRole }: MyTasksClientProps) {
  const [view, setView] = useState<"list" | "kanban">("kanban");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    paused: 'all', // all | paused | active
    search: '',
  });

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    const formData = new FormData();
    formData.append("taskId", taskId);
    formData.append("status", newStatus);
    
    try {
      await updateTaskStatusAction(formData);
      alert("Đã cập nhật trạng thái");
    } catch (e) {
      alert("Lỗi: Không thể cập nhật trạng thái");
    }
  };

  // Filter tasks based on current filters
  const filteredTasks = tasks.filter((task) => {
    if (filters.status !== 'all' && task.status !== filters.status) {
      return false;
    }
    if (filters.priority !== 'all' && task.request?.priority !== filters.priority) {
      return false;
    }
    if (filters.paused === 'paused' && !task.slaPausedAt) {
      return false; // Show only paused tasks
    }
    if (filters.paused === 'active' && task.slaPausedAt) {
      return false; // Show only non-paused tasks
    }
    if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        {/* View Toggle */}
        <div className="inline-flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setView("list")}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2",
              view === "list"
                ? "bg-white shadow-sm text-primary-600"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            <LayoutList className="h-4 w-4" />
            Danh sách
          </button>
          <button
            onClick={() => setView("kanban")}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2",
              view === "kanban"
                ? "bg-white shadow-sm text-primary-600"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            <LayoutGrid className="h-4 w-4" />
            Kanban
          </button>
        </div>
        
        {/* Filter Button */}
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="w-4 h-4 mr-2" />
          Lọc
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <TaskFilters filters={filters} onChange={setFilters} />
      )}

      {/* Content */}
      {view === "kanban" ? (
        <TaskKanban 
          tasks={filteredTasks} 
          onStatusChange={handleStatusChange}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
        />
      ) : (
        <TaskListView 
          tasks={filteredTasks}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}

