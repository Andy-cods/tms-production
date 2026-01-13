"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Clock } from "lucide-react";
import { updateChecklistItem } from "@/actions/template";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface ChecklistItem {
  id: string;
  title: string;
  description: string | null;
  isCompleted: boolean;
  completedAt: string | null;
  completedBy: string | null;
  order: number;
}

interface TaskChecklistProps {
  taskId: string;
  items: ChecklistItem[];
  canEdit: boolean;
}

export function TaskChecklist({ taskId, items, canEdit }: TaskChecklistProps) {
  const [checklistItems, setChecklistItems] = useState(items);
  const [updating, setUpdating] = useState<string | null>(null);

  const completedCount = checklistItems.filter((item) => item.isCompleted).length;
  const totalCount = checklistItems.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleToggle = async (itemId: string, currentStatus: boolean) => {
    if (!canEdit) return;

    setUpdating(itemId);

    const result = await updateChecklistItem(itemId, !currentStatus);

    if (result.success) {
      setChecklistItems(
        checklistItems.map((item) =>
          item.id === itemId
            ? {
                ...item,
                isCompleted: !currentStatus,
                completedAt: !currentStatus ? new Date().toISOString() : null,
              }
            : item
        )
      );
    } else {
      alert(result.error);
    }

    setUpdating(null);
  };

  if (checklistItems.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-blue-500" />
            Checklist
          </CardTitle>
          <Badge variant="secondary">
            {completedCount}/{totalCount}
          </Badge>
        </div>
        {totalCount > 0 && (
          <div className="mt-3">
            <Progress value={progressPercent} className="h-2" />
            <p className="text-xs text-gray-500 mt-1">
              {Math.round(progressPercent)}% hoàn thành
            </p>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {checklistItems.map((item) => (
            <div
              key={item.id}
              className={`flex gap-3 p-3 rounded-lg border transition-colors ${
                item.isCompleted
                  ? "bg-green-50 border-green-200"
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}
            >
              <Checkbox
                id={item.id}
                checked={item.isCompleted}
                onCheckedChange={() => handleToggle(item.id, item.isCompleted)}
                disabled={!canEdit || updating === item.id}
                className="mt-1"
              />

              <div className="flex-1">
                <label
                  htmlFor={item.id}
                  className={`font-medium text-sm cursor-pointer ${
                    item.isCompleted
                      ? "line-through text-gray-500"
                      : "text-gray-900"
                  }`}
                >
                  {item.title}
                </label>

                {item.description && (
                  <p
                    className={`text-xs mt-1 ${
                      item.isCompleted ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {item.description}
                  </p>
                )}

                {item.isCompleted && item.completedAt && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                    <Clock className="h-3 w-3" />
                    <span>
                      Hoàn thành{" "}
                      {formatDistanceToNow(new Date(item.completedAt), {
                        addSuffix: true,
                        locale: vi,
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

