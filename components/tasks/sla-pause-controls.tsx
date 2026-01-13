"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Pause, 
  Play, 
  Clock, 
  User,
  History,
  ChevronDown,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { PauseTimelineDialog } from "./pause-timeline-dialog";
import { pauseSLAAction, resumeSLAAction } from "@/actions/sla-pause";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

/**
 * SLA Pause Controls Component
 * 
 * Provides UI for pausing/resuming task SLA with reason tracking.
 * Integrates with SLA Pause Service.
 * 
 * References: mindmap IM (Idle Monitoring), WC (Workload Context), ACL
 */

// Types
interface PauseInfo {
  reason: string;
  pausedAt: string; // ISO string
  pausedBy: string;
  pausedByName: string;
  notes?: string;
}

interface SLAPauseControlsProps {
  taskId: string;
  currentStatus: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | "BLOCKED" | "REWORK" | "WAITING_SUBTASKS";
  isPaused: boolean;
  pauseInfo?: PauseInfo;
  totalPaused: number; // minutes
  pauseCount?: number;
  userIsAssignee: boolean; // Current user is the assignee
}

// Quick reason mapping
const QUICK_REASONS = [
  { 
    value: "MEETING", 
    label: "Đang họp", 
    icon: "💼",
    ref: "IM" 
  },
  { 
    value: "CUSTOMER_VISIT", 
    label: "Đang gặp khách hàng", 
    icon: "👥",
    ref: "WC" 
  },
  { 
    value: "CLARIFICATION", 
    label: "Đang chờ làm rõ", 
    icon: "❓",
    ref: "ACL" 
  },
  { 
    value: "MANUAL", 
    label: "Khác", 
    icon: "✏️",
    ref: "" 
  },
];

export function SLAPauseControls({
  taskId,
  currentStatus,
  isPaused,
  pauseInfo,
  totalPaused,
  pauseCount = 0,
  userIsAssignee,
}: SLAPauseControlsProps) {
  const router = useRouter();
  const toast = useToast();

  // State for custom reason dialog
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [customNotes, setCustomNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // State for timeline dialog
  const [showTimelineDialog, setShowTimelineDialog] = useState(false);

  /**
   * Handle pause with quick reason
   */
  const handleQuickPause = async (reason: string) => {
    if (reason === "MANUAL") {
      // Show custom notes dialog
      setShowCustomDialog(true);
      return;
    }

    await pauseTask(reason);
  };

  /**
   * Handle pause with custom notes
   */
  const handleCustomPause = async () => {
    if (!customNotes.trim()) {
      toast.error("Lỗi", "Vui lòng nhập ghi chú");
      return;
    }

    await pauseTask("MANUAL", customNotes);
    setShowCustomDialog(false);
    setCustomNotes("");
  };

  /**
   * Pause task with reason
   */
  const pauseTask = async (reason: string, notes?: string) => {
    setIsProcessing(true);

    try {
      const result = await pauseSLAAction(taskId, reason, notes);

      if (result.success) {
        toast.success("Đã tạm dừng SLA", `Task đã được pause với lý do: ${getReasonLabel(reason)}`);

        router.refresh();
      } else {
        toast.error("Lỗi", (result as any).error || "Không thể pause SLA");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Đã xảy ra lỗi";
      toast.error("Lỗi", errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle resume
   */
  const handleResume = async () => {
    setIsProcessing(true);

    try {
      const result = await resumeSLAAction(taskId);

      if (result.success) {
        toast.success("Đã tiếp tục SLA", `Thời gian pause: ${result.formattedDuration}`);

        router.refresh();
      } else {
        toast.error("Lỗi", (result as any).error || "Không thể resume SLA");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Đã xảy ra lỗi";
      toast.error("Lỗi", errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Get Vietnamese label for reason
   */
  const getReasonLabel = (reason: string): string => {
    const reasonMap: Record<string, string> = {
      MEETING: "Đang họp",
      CUSTOMER_VISIT: "Đang gặp khách hàng",
      CLARIFICATION: "Đang chờ làm rõ",
      MANUAL: "Khác",
    };
    return reasonMap[reason] || reason;
  };

  /**
   * Format total paused time
   */
  const formatTotalPaused = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} phút`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours} giờ`;
    }

    return `${hours}g ${remainingMinutes}p`;
  };

  /**
   * Calculate current pause duration
   */
  const getCurrentPauseDuration = (): string => {
    if (!isPaused || !pauseInfo) return "";

    const pausedAt = new Date(pauseInfo.pausedAt);
    const now = new Date();
    const durationMs = now.getTime() - pausedAt.getTime();
    const minutes = Math.floor(durationMs / (1000 * 60));

    return formatTotalPaused(minutes);
  };

  // Don't show controls if not IN_PROGRESS or user is not assignee
  const canControl = currentStatus === "IN_PROGRESS" && userIsAssignee;

  if (!canControl && !isPaused) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Pause/Resume Button */}
      <div className="flex items-center gap-3">
        {!isPaused && canControl ? (
          // Pause Button with Dropdown
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="gap-2"
                disabled={isProcessing}
              >
                <Pause className="w-4 h-4" />
                Tạm dừng SLA
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">
                Chọn lý do tạm dừng
              </div>
              {QUICK_REASONS.map((reason) => (
                <DropdownMenuItem
                  key={reason.value}
                  onClick={() => handleQuickPause(reason.value)}
                  className="gap-2"
                >
                  <span className="text-lg">{reason.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium">{reason.label}</div>
                    {reason.ref && (
                      <div className="text-xs text-gray-500">
                        Ref: {reason.ref}
                      </div>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : isPaused ? (
          // Resume Button with Info
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <div className="text-sm">
                <div className="font-medium text-yellow-900">
                  SLA đang tạm dừng
                </div>
                <div className="text-xs text-yellow-700">
                  {pauseInfo && (
                    <>
                      <span className="font-semibold">
                        {getReasonLabel(pauseInfo.reason)}
                      </span>
                      {" • "}
                      <span>bởi {pauseInfo.pausedByName}</span>
                      {" • "}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help underline decoration-dotted">
                              {formatDistanceToNow(
                                new Date(pauseInfo.pausedAt),
                                { addSuffix: true, locale: vi }
                              )}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Đã pause: {getCurrentPauseDuration()}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </>
                  )}
                </div>
              </div>
            </div>

            {canControl && (
              <Button
                onClick={handleResume}
                disabled={isProcessing}
                className="gap-2"
              >
                <Play className="w-4 h-4" />
                Tiếp tục
              </Button>
            )}
          </div>
        ) : null}

        {/* Pause History Badge */}
        {pauseCount > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="secondary"
                  className="gap-2 cursor-pointer hover:bg-gray-200"
                  onClick={() => setShowTimelineDialog(true)}
                >
                  <History className="w-3 h-3" />
                  Đã tạm dừng {pauseCount} lần (
                  {formatTotalPaused(totalPaused)})
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Click để xem lịch sử pause</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Custom Notes Dialog */}
      <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạm dừng SLA - Ghi chú</DialogTitle>
            <DialogDescription>
              Nhập lý do hoặc ghi chú cho việc tạm dừng SLA
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="custom-notes">Ghi chú</Label>
              <Input
                id="custom-notes"
                placeholder="VD: Đang chờ phản hồi từ bộ phận IT..."
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCustomDialog(false);
                  setCustomNotes("");
                }}
              >
                Hủy
              </Button>
              <Button
                onClick={handleCustomPause}
                disabled={isProcessing || !customNotes.trim()}
              >
                Xác nhận
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pause Timeline Dialog */}
      <PauseTimelineDialog
        open={showTimelineDialog}
        onOpenChange={setShowTimelineDialog}
        taskId={taskId}
      />
    </div>
  );
}

