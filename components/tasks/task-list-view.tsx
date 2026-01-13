'use client';

import { useState } from 'react';
import { ChevronDown, Calendar, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { StatusBadge, PriorityBadge } from '@/components/ui/status-badge';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Task {
  id: string;
  title: string;
  status: string;
  deadline: Date | null;
  request?: {
    id: string;
    title: string;
    priority?: string;
  } | null;
}

interface TaskListViewProps {
  tasks: Task[];
  onStatusChange?: (taskId: string, newStatus: string) => Promise<void>;
}

export function TaskListView({ tasks, onStatusChange }: TaskListViewProps) {
  const router = useRouter();
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  
  // Group tasks by status
  const groupedTasks = {
    TODO: tasks.filter((t) => t.status === 'TODO'),
    IN_PROGRESS: tasks.filter((t) => t.status === 'IN_PROGRESS'),
    BLOCKED: tasks.filter((t) => t.status === 'BLOCKED'),
    IN_REVIEW: tasks.filter((t) => t.status === 'IN_REVIEW'),
    DONE: tasks.filter((t) => t.status === 'DONE'),
  };
  
  const statusLabels = {
    TODO: 'Cần làm',
    IN_PROGRESS: 'Đang làm',
    BLOCKED: 'Bị chặn',
    IN_REVIEW: 'Đang duyệt',
    DONE: 'Hoàn thành',
  };
  
  const toggleGroup = (status: string) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(status)) {
      newCollapsed.delete(status);
    } else {
      newCollapsed.add(status);
    }
    setCollapsedGroups(newCollapsed);
  };
  
  return (
    <div className="space-y-4">
      {Object.entries(groupedTasks).map(([status, statusTasks]) => (
        <div
          key={status}
          className="bg-white rounded-xl border border-gray-200 overflow-hidden"
        >
          {/* Group Header */}
          <button
            onClick={() => toggleGroup(status)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <ChevronDown
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  collapsedGroups.has(status) ? '-rotate-90' : ''
                }`}
              />
              <h3 className="font-semibold text-gray-900">{statusLabels[status as keyof typeof statusLabels]}</h3>
              <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
                {statusTasks.length}
              </span>
            </div>
          </button>
          
          {/* Task List */}
          {!collapsedGroups.has(status) && (
            <div className="divide-y divide-gray-100">
              {statusTasks.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Không có nhiệm vụ
                </div>
              ) : (
                statusTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => router.push(`/my-tasks/${task.id}`)}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {task.request?.priority && (
                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.request.priority)}`} />
                          )}
                          <h4 className="font-medium text-gray-900">{task.title}</h4>
                          <StatusBadge status={(task.status || 'TODO') as any} />
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          {task.request && (
                            <span className="flex items-center gap-1.5">
                              <FileText className="w-4 h-4" />
                              {task.request.title}
                            </span>
                          )}
                          {task.deadline && (
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(task.deadline), 'dd/MM/yyyy HH:mm', { locale: vi })}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {onStatusChange && (
                        <div onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={task.status}
                            onValueChange={(value) => onStatusChange(task.id, value)}
                          >
                            <SelectTrigger className="w-[160px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="TODO">Cần làm</SelectItem>
                              <SelectItem value="IN_PROGRESS">Đang làm</SelectItem>
                              <SelectItem value="BLOCKED">Bị chặn</SelectItem>
                              <SelectItem value="IN_REVIEW">Đang duyệt</SelectItem>
                              <SelectItem value="DONE">Hoàn thành</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function getPriorityColor(priority: string) {
  const colors = {
    LOW: 'bg-green-500',
    MEDIUM: 'bg-yellow-500',
    HIGH: 'bg-red-500',
    URGENT: 'bg-orange-500',
  };
  return colors[priority as keyof typeof colors] || 'bg-gray-400';
}