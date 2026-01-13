"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Archive, 
  Trash2, 
  Download, 
  RefreshCw,
  Users,
  AlertTriangle,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
  selectedCount: number;
  entityType: "requests" | "tasks" | "users";
  onAction: (action: string, value?: any) => Promise<void>;
  onClearSelection: () => void;
  loading?: boolean;
}

export function BulkActionBar({
  selectedCount,
  entityType,
  onAction,
  onClearSelection,
  loading = false,
}: Props) {
  const [actionLoading, setActionLoading] = useState(false);

  if (selectedCount === 0) return null;

  const handleAction = async (action: string, value?: any) => {
    try {
      setActionLoading(true);
      await onAction(action, value);
    } finally {
      setActionLoading(false);
    }
  };

  const isLoading = loading || actionLoading;

  return (
    <div className="sticky top-0 z-10 bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-md">
      <div className="flex items-center justify-between gap-4">
        {/* Selection Info */}
        <div className="flex items-center gap-2">
          <Badge variant="default" className="bg-blue-600">
            {selectedCount} đã chọn
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            disabled={isLoading}
          >
            <X className="h-4 w-4 mr-1" />
            Bỏ chọn
          </Button>
        </div>

        {/* Actions for Requests */}
        {entityType === "requests" && (
          <div className="flex items-center gap-2">
            {/* Change Status */}
            <Select
              onValueChange={(value) => handleAction("updateStatus", value)}
              disabled={isLoading}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Đổi trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OPEN">OPEN</SelectItem>
                <SelectItem value="IN_PROGRESS">IN_PROGRESS</SelectItem>
                <SelectItem value="IN_REVIEW">IN_REVIEW</SelectItem>
                <SelectItem value="DONE">DONE</SelectItem>
                <SelectItem value="REJECTED">REJECTED</SelectItem>
              </SelectContent>
            </Select>

            {/* Change Priority */}
            <Select
              onValueChange={(value) => handleAction("updatePriority", value)}
              disabled={isLoading}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Đổi độ ưu tiên" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">LOW</SelectItem>
                <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                <SelectItem value="HIGH">HIGH</SelectItem>
                <SelectItem value="URGENT">URGENT</SelectItem>
              </SelectContent>
            </Select>

            {/* Archive */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction("archive")}
              disabled={isLoading}
            >
              <Archive className="h-4 w-4 mr-1" />
              Lưu trữ
            </Button>

            {/* Export */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction("export")}
              disabled={isLoading}
            >
              <Download className="h-4 w-4 mr-1" />
              Xuất CSV
            </Button>

            {/* Delete */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm(`XÓA ${selectedCount} requests? Hành động này không thể hoàn tác!`)) {
                  handleAction("delete");
                }
              }}
              disabled={isLoading}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Xóa
            </Button>
          </div>
        )}

        {/* Actions for Tasks */}
        {entityType === "tasks" && (
          <div className="flex items-center gap-2">
            {/* Change Status */}
            <Select
              onValueChange={(value) => handleAction("updateStatus", value)}
              disabled={isLoading}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Đổi trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODO">TODO</SelectItem>
                <SelectItem value="IN_PROGRESS">IN_PROGRESS</SelectItem>
                <SelectItem value="IN_REVIEW">IN_REVIEW</SelectItem>
                <SelectItem value="BLOCKED">BLOCKED</SelectItem>
                <SelectItem value="REWORK">REWORK</SelectItem>
                <SelectItem value="DONE">DONE</SelectItem>
              </SelectContent>
            </Select>

            {/* Assign to User (placeholder - would need user selector) */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction("assign")}
              disabled={isLoading}
            >
              <Users className="h-4 w-4 mr-1" />
              Phân công
            </Button>

            {/* Export */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction("export")}
              disabled={isLoading}
            >
              <Download className="h-4 w-4 mr-1" />
              Xuất CSV
            </Button>
          </div>
        )}

        {/* Actions for Users */}
        {entityType === "users" && (
          <div className="flex items-center gap-2">
            {/* Activate/Deactivate */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction("activate")}
              disabled={isLoading}
            >
              Kích hoạt
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction("deactivate")}
              disabled={isLoading}
            >
              Vô hiệu hóa
            </Button>

            {/* Export */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction("export")}
              disabled={isLoading}
            >
              <Download className="h-4 w-4 mr-1" />
              Xuất CSV
            </Button>
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center gap-2 text-blue-700">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm">Đang xử lý...</span>
          </div>
        )}
      </div>

      {/* Warning for large selections */}
      {selectedCount > 50 && (
        <div className="flex items-start gap-2 mt-3 text-amber-800 bg-amber-50 border border-amber-200 rounded p-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p className="text-xs">
            Bạn đang thao tác trên {selectedCount} mục. Thao tác có thể mất vài giây.
          </p>
        </div>
      )}
    </div>
  );
}

