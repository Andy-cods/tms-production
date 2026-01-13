"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Inbox } from "lucide-react";
import { TaskCard } from "./task-card";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface Task {
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
}

interface TaskKanbanProps {
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: string) => Promise<void>;
  currentUserId?: string;
  currentUserRole?: string;
}

const columns = [
  { id: "TODO", title: "Cần làm", color: "bg-gray-100" },
  { id: "IN_PROGRESS", title: "Đang làm", color: "bg-orange-100" },
  { id: "BLOCKED", title: "Bị chặn", color: "bg-red-100" },
  { id: "IN_REVIEW", title: "Đang xem xét", color: "bg-blue-100" },
];

function SortableTaskCard({ 
  task, 
  currentUserId,
  currentUserRole,
}: { 
  task: Task;
  currentUserId?: string;
  currentUserRole?: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard 
        task={task} 
        isDragging={isDragging}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
      />
    </div>
  );
}

function DroppableColumn({
  column,
  tasks,
  children,
}: {
  column: typeof columns[0];
  tasks: Task[];
  children: React.ReactNode;
}) {
  const taskIds = tasks.map((t) => t.id);

  return (
    <div className="flex flex-col h-full">
      {/* Column Header */}
      <div className={cn("rounded-t-xl px-4 py-3 border-b border-gray-200", column.color)}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-dark-900">{column.title}</h3>
          <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium text-dark-700 bg-white rounded-full">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Column Body */}
      <div className="flex-1 bg-gray-50 rounded-b-xl p-4 min-h-[600px]">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <Inbox className="h-12 w-12 mb-2" />
                <p className="text-sm">Chưa có nhiệm vụ</p>
              </div>
            ) : (
              children
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

export function TaskKanban({ tasks, onStatusChange, currentUserId, currentUserRole }: TaskKanbanProps) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [items, setItems] = useState(tasks);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const activeTask = items.find((t) => t.id === active.id);
    const overColumn = columns.find((c) =>
      items.filter((t) => t.status === c.id).some((t) => t.id === over.id)
    );

    if (!activeTask) {
      setActiveId(null);
      return;
    }

    // Check if dropped on a different column
    let newStatus = activeTask.status;
    
    // If dropped on another task, get that task's status
    const overTask = items.find((t) => t.id === over.id);
    if (overTask) {
      newStatus = overTask.status;
    }

    if (newStatus !== activeTask.status) {
      // Optimistic update
      setItems((items) =>
        items.map((item) =>
          item.id === activeTask.id ? { ...item, status: newStatus } : item
        )
      );

      // Server update
      try {
        await onStatusChange(activeTask.id, newStatus);
        router.refresh();
      } catch (error) {
        // Revert on error
        setItems((items) =>
          items.map((item) =>
            item.id === activeTask.id
              ? { ...item, status: activeTask.status }
              : item
          )
        );
        console.error("Failed to update task status:", error);
      }
    }

    setActiveId(null);
  };

  const activeTask = activeId ? items.find((t) => t.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((column) => {
          const columnTasks = items.filter((task) => task.status === column.id);
          
          return (
            <DroppableColumn key={column.id} column={column} tasks={columnTasks}>
              {columnTasks.map((task) => (
                <SortableTaskCard 
                  key={task.id} 
                  task={task}
                  currentUserId={currentUserId}
                  currentUserRole={currentUserRole}
                />
              ))}
            </DroppableColumn>
          );
        })}
      </div>

      <DragOverlay>
        {activeTask ? (
          <TaskCard 
            task={activeTask} 
            isDragging
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

