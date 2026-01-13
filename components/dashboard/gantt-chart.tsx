"use client";

import React, { useEffect, useRef, useState } from "react";
import Gantt from "frappe-gantt";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import type { GanttTask } from "@/lib/services/gantt-service";
import { Button } from "@/components/ui/button";

interface GanttChartProps {
  tasks: GanttTask[];
  viewMode?: "Quarter Day" | "Half Day" | "Day" | "Week" | "Month";
  onTaskClick?: (task: GanttTask) => void;
  onDateChange?: (task: GanttTask, start: Date, end: Date) => void;
  height?: number;
}

export function GanttChart({
  tasks,
  viewMode = "Day",
  onTaskClick,
  onDateChange,
  height = 500,
}: GanttChartProps) {
  const ganttRef = useRef<HTMLDivElement>(null);
  const ganttInstance = useRef<any>(null);

  useEffect(() => {
    if (!ganttRef.current || tasks.length === 0) return;

    // Destroy previous instance
    if (ganttInstance.current) {
      ganttInstance.current = null;
    }

    // Convert GanttTask to frappe-gantt format
    const frappeGanttTasks = tasks.map((task) => {
      const startDate = task.start instanceof Date ? task.start : new Date(task.start);
      const endDate = task.end instanceof Date ? task.end : new Date(task.end);
      
      return {
        id: task.id,
        name: task.name,
        start: format(startDate, "yyyy-MM-dd"),
        end: format(endDate, "yyyy-MM-dd"),
        progress: task.progress,
        dependencies: task.dependencies.join(", "),
        custom_class: task.custom_class || "",
        // Store original task data for callbacks
        _original: task,
      };
    });

    try {
      // Create new Gantt instance
      ganttInstance.current = new Gantt(ganttRef.current, frappeGanttTasks, {
        view_mode: viewMode,
        date_format: "DD/MM/YYYY",
        language: "vi",

        // Callbacks
        on_click: (task: any) => {
          if (onTaskClick && task._original) {
            onTaskClick(task._original);
          }
        },
        on_date_change: (task: any, start: Date, end: Date) => {
          if (onDateChange && task._original) {
            onDateChange(task._original, start, end);
          }
        },
        on_progress_change: (task: any, progress: number) => {
          // Optional: handle progress drag
          console.log(`Task ${task.name} progress: ${progress}%`);
        },

        // Styling
        bar_height: 30,
        bar_corner_radius: 3,
        arrow_curve: 5,
        padding: 18,

        // Custom tooltip (using type assertion for custom property)
        custom_popup_html: ((task: any) => {
          const originalTask = task._original as GanttTask;
          if (!originalTask) return "";

          return `
            <div class="gantt-tooltip">
              <h5>${originalTask.name}</h5>
              ${originalTask.assignee ? `<p><strong>Người xử lý:</strong> ${originalTask.assignee.name}</p>` : ""}
              <p><strong>Bắt đầu:</strong> ${format(originalTask.start, "dd/MM/yyyy", { locale: vi })}</p>
              <p><strong>Kết thúc:</strong> ${format(originalTask.end, "dd/MM/yyyy", { locale: vi })}</p>
              <p><strong>Tiến độ:</strong> ${originalTask.progress}%</p>
              <p><strong>Trạng thái:</strong> ${formatStatus(originalTask.status)}</p>
              <p><strong>Độ ưu tiên:</strong> ${formatPriority(originalTask.priority)}</p>
            </div>
          `;
        }) as any,
      } as any);
    } catch (error) {
      console.error("Error creating Gantt chart:", error);
    }

    // Cleanup
    return () => {
      if (ganttInstance.current) {
        ganttInstance.current = null;
      }
    };
  }, [tasks, viewMode, onTaskClick, onDateChange]);

  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center bg-gray-50 rounded-lg border" style={{ height }}>
        <p className="text-gray-600">Chưa có công việc nào để hiển thị</p>
      </div>
    );
  }

  return (
    <div className="gantt-container" style={{ height }}>
      <div ref={ganttRef}></div>
    </div>
  );
}

// Helper functions for Vietnamese labels
function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    TODO: "Chưa bắt đầu",
    IN_PROGRESS: "Đang làm",
    IN_REVIEW: "Đang duyệt",
    BLOCKED: "Bị chặn",
    REWORK: "Làm lại",
    DONE: "Hoàn thành",
  };
  return statusMap[status] || status;
}

function formatPriority(priority: string): string {
  const priorityMap: Record<string, string> = {
    LOW: "Thấp",
    MEDIUM: "Trung bình",
    HIGH: "Cao",
    URGENT: "Khẩn cấp",
  };
  return priorityMap[priority] || priority;
}

// Gantt Chart with view mode controls
interface GanttChartWithControlsProps extends Omit<GanttChartProps, "viewMode"> {
  defaultViewMode?: "Day" | "Week" | "Month";
}

export function GanttChartWithControls({
  tasks,
  onTaskClick,
  onDateChange,
  defaultViewMode = "Week",
  height = 500,
}: GanttChartWithControlsProps) {
  const [viewMode, setViewMode] = useState<"Quarter Day" | "Half Day" | "Day" | "Week" | "Month">(
    defaultViewMode
  );

  return (
    <div className="space-y-4">
      {/* View mode controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={viewMode === "Day" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("Day")}
          >
            Ngày
          </Button>
          <Button
            variant={viewMode === "Week" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("Week")}
          >
            Tuần
          </Button>
          <Button
            variant={viewMode === "Month" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("Month")}
          >
            Tháng
          </Button>
        </div>

        <div className="text-sm text-gray-600">
          {tasks.length} công việc
        </div>
      </div>

      {/* Gantt chart */}
      <GanttChart
        tasks={tasks}
        viewMode={viewMode}
        onTaskClick={onTaskClick}
        onDateChange={onDateChange}
        height={height}
      />
    </div>
  );
}

