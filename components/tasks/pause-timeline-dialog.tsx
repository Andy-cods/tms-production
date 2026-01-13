"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  User, 
  FileDown, 
  Loader2,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { getPauseHistoryAction } from "@/actions/sla-pause";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

/**
 * Pause Timeline Dialog Component
 * 
 * Shows complete SLA pause history for a task in timeline format.
 * Includes export to CSV functionality.
 * 
 * References: mindmap IM, WC, ACL
 */

interface PauseHistoryItem {
  id: string;
  reason: string;
  pausedAt: string; // ISO string
  resumedAt: string | null;
  duration: number | null; // minutes
  pausedBy: string;
  pausedByName: string;
  notes: string | null;
  formattedDuration: string;
}

interface PauseTimelineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
}

// Reason color mapping
const REASON_COLORS: Record<string, string> = {
  MEETING: "bg-blue-100 text-blue-700 border-blue-200",
  CUSTOMER_VISIT: "bg-purple-100 text-purple-700 border-purple-200",
  CLARIFICATION: "bg-yellow-100 text-yellow-700 border-yellow-200",
  MANUAL: "bg-gray-100 text-gray-700 border-gray-200",
};

// Reason labels
const REASON_LABELS: Record<string, string> = {
  MEETING: "Họp",
  CUSTOMER_VISIT: "Gặp khách hàng",
  CLARIFICATION: "Chờ làm rõ",
  MANUAL: "Khác",
};

export function PauseTimelineDialog({
  open,
  onOpenChange,
  taskId,
}: PauseTimelineDialogProps) {
  const [history, setHistory] = useState<PauseHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load history when dialog opens
  useEffect(() => {
    if (open) {
      loadHistory();
    }
  }, [open, taskId]);

  /**
   * Load pause history
   */
  const loadHistory = async () => {
    setIsLoading(true);

    try {
      const result = await getPauseHistoryAction(taskId);

      if (result.success && result.history) {
        setHistory(result.history);
      }
    } catch (error) {
      console.error("Failed to load pause history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Export history to CSV
   */
  const exportToCSV = () => {
    if (history.length === 0) return;

    // Create CSV content
    const headers = [
      "Lý do",
      "Bắt đầu",
      "Kết thúc",
      "Thời gian",
      "Người pause",
      "Ghi chú",
    ];

    const rows = history.map((item) => [
      REASON_LABELS[item.reason] || item.reason,
      format(new Date(item.pausedAt), "dd/MM/yyyy HH:mm", { locale: vi }),
      item.resumedAt
        ? format(new Date(item.resumedAt), "dd/MM/yyyy HH:mm", { locale: vi })
        : "Đang pause",
      item.formattedDuration,
      item.pausedByName,
      item.notes || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    // Create blob and download
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `pause_history_${taskId}_${Date.now()}.csv`
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Calculate total pause time
   */
  const totalPaused = history.reduce(
    (sum, item) => sum + (item.duration || 0),
    0
  );

  const formatTotalTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} phút`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours} giờ`;
    }

    return `${hours} giờ ${remainingMinutes} phút`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Lịch sử Pause SLA</DialogTitle>
              <DialogDescription>
                Tổng cộng: {history.length} lần pause ({formatTotalTime(totalPaused)})
              </DialogDescription>
            </div>
            {history.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                className="gap-2"
              >
                <FileDown className="w-4 h-4" />
                Export CSV
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && history.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Chưa có lịch sử pause</p>
          </div>
        )}

        {/* Timeline */}
        {!isLoading && history.length > 0 && (
          <div className="space-y-4">
            {history.map((item, index) => (
              <div
                key={item.id}
                className="relative pl-8 pb-8 border-l-2 border-gray-200 last:pb-0"
              >
                {/* Timeline dot */}
                <div
                  className={`absolute left-[-9px] top-0 w-4 h-4 rounded-full border-2 border-white ${
                    item.resumedAt
                      ? "bg-green-500"
                      : "bg-yellow-500 animate-pulse"
                  }`}
                />

                {/* Content */}
                <div className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={REASON_COLORS[item.reason] || REASON_COLORS.MANUAL}
                      >
                        {REASON_LABELS[item.reason] || item.reason}
                      </Badge>
                      {!item.resumedAt && (
                        <Badge variant="secondary" className="gap-1">
                          <Clock className="w-3 h-3" />
                          Đang pause
                        </Badge>
                      )}
                    </div>

                    <div className="text-sm font-semibold text-gray-900">
                      {item.formattedDuration}
                    </div>
                  </div>

                  {/* Timeline Info */}
                  <div className="space-y-2 text-sm">
                    {/* Start Time */}
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">Bắt đầu:</span>
                      <span>
                        {format(
                          new Date(item.pausedAt),
                          "dd/MM/yyyy HH:mm",
                          { locale: vi }
                        )}
                      </span>
                    </div>

                    {/* End Time */}
                    {item.resumedAt && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="font-medium">Kết thúc:</span>
                        <span>
                          {format(
                            new Date(item.resumedAt),
                            "dd/MM/yyyy HH:mm",
                            { locale: vi }
                          )}
                        </span>
                      </div>
                    )}

                    {/* Paused By */}
                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="w-4 h-4" />
                      <span className="font-medium">Bởi:</span>
                      <span>{item.pausedByName}</span>
                    </div>

                    {/* Notes */}
                    {item.notes && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-700">
                        <span className="font-medium">Ghi chú:</span> {item.notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {!isLoading && history.length > 0 && (
          <div className="border-t pt-4 mt-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {history.length}
                </div>
                <div className="text-xs text-gray-600">Tổng số lần</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatTotalTime(totalPaused)}
                </div>
                <div className="text-xs text-gray-600">Tổng thời gian</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {history.filter((h) => h.resumedAt).length}
                </div>
                <div className="text-xs text-gray-600">Đã hoàn thành</div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

