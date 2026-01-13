"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeadlineRangePicker } from "@/components/requests/deadline-range-picker";
import { DurationPicker } from "./duration-picker";
import { Calendar, Clock } from "lucide-react";
import { addHours } from "date-fns";

interface DeadlineDurationPickerProps {
  deadline: string;
  duration: number; // hours
  onDeadlineChange: (value: string) => void;
  onDurationChange: (hours: number) => void;
  categoryId?: string | null;
  mode?: "deadline" | "duration";
  onModeChange?: (mode: "deadline" | "duration") => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}

export function DeadlineDurationPicker({
  deadline,
  duration,
  onDeadlineChange,
  onDurationChange,
  categoryId,
  mode = "deadline",
  onModeChange,
  label = "Thời hạn",
  required = false,
  disabled = false,
}: DeadlineDurationPickerProps) {
  const [activeTab, setActiveTab] = useState(mode);

  function handleTabChange(value: string) {
    const newMode = value as "deadline" | "duration";
    setActiveTab(newMode);
    onModeChange?.(newMode);

    if (newMode === "deadline" && duration > 0) {
      const calculatedDeadline = addHours(new Date(), duration);
      onDeadlineChange(calculatedDeadline.toISOString());
    }
  }

  return (
    <div className="space-y-3">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="deadline" className="gap-2">
            <Calendar className="h-4 w-4" />
            Chọn deadline
          </TabsTrigger>
          <TabsTrigger value="duration" className="gap-2">
            <Clock className="h-4 w-4" />
            Nhập thời lượng
          </TabsTrigger>
        </TabsList>

        <TabsContent value="deadline" className="mt-4">
          <DeadlineRangePicker
            categoryId={categoryId ?? null}
            value={deadline}
            onChange={onDeadlineChange}
            required={required}
            disabled={disabled}
          />
        </TabsContent>

        <TabsContent value="duration" className="mt-4">
          <DurationPicker
            value={duration}
            onChange={onDurationChange}
            label="Thời lượng dự kiến"
            showQuickSelect
            required={required}
            disabled={disabled}
          />
          {duration > 0 && (
            <p className="text-sm text-gray-500 mt-2">
              Deadline sẽ được tính tự động: {" "}
              <strong>
                {new Date(addHours(new Date(), duration)).toLocaleString("vi-VN")}
              </strong>
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}


