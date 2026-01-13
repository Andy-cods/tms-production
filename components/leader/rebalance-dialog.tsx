"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowRight, Info, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { RebalanceSuggestion } from "@/lib/services/load-balancer";

interface RebalanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestions: RebalanceSuggestion[];
  onApply: (selectedTaskIds: string[]) => Promise<void>;
}

/**
 * Rebalance Dialog Component
 * 
 * Shows task rebalancing suggestions from LoadBalancerService
 * with checkboxes to approve and bulk apply functionality.
 * 
 * References: mindmap LB, WIP
 */
export function RebalanceDialog({
  open,
  onOpenChange,
  suggestions,
  onApply,
}: RebalanceDialogProps) {
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [isApplying, setIsApplying] = useState(false);
  const toast = useToast();

  // Toggle task selection
  const toggleTask = (taskId: string, checked?: boolean) => {
    const newSelected = new Set(selectedTasks);
    if (checked !== undefined) {
      // Set specific state
      if (checked) {
        newSelected.add(taskId);
      } else {
        newSelected.delete(taskId);
      }
    } else {
      // Toggle
      if (newSelected.has(taskId)) {
        newSelected.delete(taskId);
      } else {
        newSelected.add(taskId);
      }
    }
    setSelectedTasks(newSelected);
  };

  // Select all/none
  const toggleAll = (checked?: boolean) => {
    if (checked !== undefined) {
      // Set specific state
      if (checked) {
        setSelectedTasks(new Set(suggestions.map((s) => s.taskId)));
      } else {
        setSelectedTasks(new Set());
      }
    } else {
      // Toggle
      if (selectedTasks.size === suggestions.length) {
        setSelectedTasks(new Set());
      } else {
        setSelectedTasks(new Set(suggestions.map((s) => s.taskId)));
      }
    }
  };

  // Apply selected rebalancing
  const handleApply = async () => {
    if (selectedTasks.size === 0) {
      toast.error("Chưa chọn task", "Vui lòng chọn ít nhất 1 task để chuyển giao");
      return;
    }

    setIsApplying(true);

    try {
      await onApply(Array.from(selectedTasks));

      toast.success("Thành công", `Đã chuyển giao ${selectedTasks.size} task`);

      // Reset and close
      setSelectedTasks(new Set());
      onOpenChange(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Không thể chuyển giao tasks";
      toast.error("Lỗi", errorMessage);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-primary" />
            Đề xuất cân bằng tải
          </DialogTitle>
          <DialogDescription>
            Hệ thống phát hiện phân bổ công việc chưa đồng đều. Chọn các task cần chuyển giao.
          </DialogDescription>
        </DialogHeader>

        {suggestions.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Tuyệt vời! Công việc đã được phân bổ đồng đều
            </h3>
            <p className="text-gray-600">
              Không có đề xuất cân bằng tải nào lúc này.
            </p>
          </div>
        ) : (
          <>
            {/* Header with select all */}
            <div className="flex items-center justify-between py-2 border-b">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedTasks.size === suggestions.length}
                  onCheckedChange={(checked) => toggleAll(!!checked)}
                  aria-label="Select all"
                />
                <span className="text-sm font-medium">
                  Chọn tất cả ({suggestions.length} đề xuất)
                </span>
              </div>
              <span className="text-sm text-gray-600">
                Đã chọn: {selectedTasks.size}/{suggestions.length}
              </span>
            </div>

            {/* Suggestions List */}
            <div className="space-y-3 py-4">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.taskId}
                  className={`
                    border rounded-lg p-4 transition-all
                    ${
                      selectedTasks.has(suggestion.taskId)
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 hover:border-gray-300"
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <Checkbox
                      checked={selectedTasks.has(suggestion.taskId)}
                      onCheckedChange={(checked) => toggleTask(suggestion.taskId, !!checked)}
                      className="mt-1"
                      aria-label="Select row"
                    />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Task Title */}
                      <h4 className="font-medium text-gray-900 mb-2">
                        {suggestion.taskTitle}
                      </h4>

                      {/* Transfer Info */}
                      <div className="flex items-center gap-2 text-sm mb-2">
                        <Badge variant="destructive" className="gap-1">
                          {suggestion.fromUserName}
                        </Badge>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <Badge variant="default" className="bg-green-500 gap-1">
                          {suggestion.toUserName}
                        </Badge>
                      </div>

                      {/* Reason */}
                      <p className="text-xs text-gray-600">{suggestion.reason}</p>
                    </div>

                    {/* Info Icon with Tooltip */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Info className="w-4 h-4 text-gray-400" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-xs">
                          <div className="space-y-1 text-xs">
                            <p>
                              <strong>Độ ưu tiên:</strong>{" "}
                              {(suggestion.priorityScore * 100).toFixed(1)}%
                            </p>
                            <p>
                              <strong>Lý do:</strong> Cân bằng tải giữa thành viên quá tải
                              và thành viên còn khả năng xử lý
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isApplying}>
            Đóng
          </Button>
          {suggestions.length > 0 && (
            <Button onClick={handleApply} disabled={isApplying || selectedTasks.size === 0}>
              {isApplying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang chuyển giao...
                </>
              ) : (
                `Áp dụng (${selectedTasks.size})`
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

