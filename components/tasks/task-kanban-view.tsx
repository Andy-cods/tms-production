'use client';

import { useState } from 'react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
// React Query removed - using Server Actions instead
import { Calendar, User, Inbox, GripVertical } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { updateTaskStatus } from '@/actions/task';
import { toast } from 'sonner';
import { Avatar } from '@/components/ui/avatar';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  deadline: string;
  request: {
    id: string;
    title: string;
    priority: string;
  };
  assignee: {
    id: string;
    name: string;
  };
}

interface TaskKanbanViewProps {
  tasks: Task[];
}

export function TaskKanbanView({ tasks }: TaskKanbanViewProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  
  const columns = [
    { id: 'TODO', title: 'Cần làm', color: 'bg-primary-500' },
    { id: 'IN_PROGRESS', title: 'Đang làm', color: 'bg-orange-500' },
    { id: 'BLOCKED', title: 'Bị chặn', color: 'bg-red-500' },
    { id: 'IN_REVIEW', title: 'Đang duyệt', color: 'bg-purple-500' },
    { id: 'DONE', title: 'Hoàn thành', color: 'bg-green-500' },
  ];
  
  const groupedTasks = columns.reduce((acc, col) => {
    acc[col.id] = tasks.filter((t) => t.status === col.id);
    return acc;
  }, {} as Record<string, Task[]>);
  
  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    setIsUpdating(true);
    try {
      const updatedTask = await updateTaskStatus(taskId, newStatus);
      toast.success('Đã cập nhật trạng thái');
      // Optionally refresh the page or trigger a parent component refresh
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || 'Không thể cập nhật trạng thái');
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    const taskId = active.id as string;
    const newStatus = over.id as string;
    
    handleUpdateStatus(taskId, newStatus);
  };
  
  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={groupedTasks[column.id] || []}
          />
        ))}
      </div>
    </DndContext>
  );
}

function KanbanColumn({ column, tasks }: { column: any; tasks: Task[] }) {
  return (
    <div className="flex flex-col">
      {/* Column Header */}
      <div className="bg-gray-50 rounded-t-xl p-4 border-b-2 border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900">{column.title}</h3>
          <span className="px-2.5 py-0.5 bg-white text-gray-700 text-sm font-medium rounded-full border border-gray-200">
            {tasks.length}
          </span>
        </div>
        <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
          <div className={`h-full ${column.color}`} style={{ width: `${Math.min((tasks.length / 10) * 100, 100)}%` }} />
        </div>
      </div>
      
      {/* Droppable Area */}
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 bg-gray-50 rounded-b-xl p-4 space-y-3 min-h-[600px]">
          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Chưa có nhiệm vụ</p>
            </div>
          ) : (
            tasks.map((task) => (
              <SortableTaskCard key={task.id} task={task} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

function SortableTaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`} />
        <div {...attributes} {...listeners}>
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>
      </div>
      
      <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
        {task.title}
      </h4>
      
      <p className="text-sm text-gray-600 mb-3 line-clamp-1">
        {task.request.title}
      </p>
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {format(new Date(task.deadline), 'dd/MM', { locale: vi })}
        </span>
        <Avatar size="sm" fallback={task.assignee.name[0]} />
      </div>
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
