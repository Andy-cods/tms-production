"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Trash2, Clock, FileText, FileSpreadsheet, FileType } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import type { ReportMetadata } from "@/types/report";

interface ReportCardProps {
  report: ReportMetadata;
  onDelete?: (id: string) => void;
}

export function ReportCard({ report, onDelete }: ReportCardProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case "CSV":
        return <FileText className="h-8 w-8 text-green-600" />;
      case "EXCEL":
        return <FileSpreadsheet className="h-8 w-8 text-blue-600" />;
      case "PDF":
        return <FileType className="h-8 w-8 text-red-600" />;
      default:
        return <FileText className="h-8 w-8 text-gray-600" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      REQUESTS_LIST: "Danh sách yêu cầu",
      TASKS_LIST: "Danh sách công việc",
      DASHBOARD_SNAPSHOT: "Dashboard Snapshot",
      KPI_SUMMARY: "Tổng hợp KPI",
      TEAM_PERFORMANCE: "Hiệu suất team",
      HISTORICAL_TREND: "Xu hướng lịch sử",
    };
    return labels[type] || type;
  };

  const handleDownload = () => {
    window.open(report.downloadUrl, "_blank");
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(report.id);
    }
  };

  const timeUntilExpiry = formatDistanceToNow(new Date(report.expiresAt), {
    addSuffix: true,
    locale: vi,
  });

  const isExpiring = new Date(report.expiresAt).getTime() - Date.now() < 24 * 60 * 60 * 1000; // < 24h

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="mt-1">{getFormatIcon(report.format)}</div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h4 className="font-medium truncate">{getTypeLabel(report.type)}</h4>
                <Badge variant="outline" className="text-xs">
                  {report.format}
                </Badge>
              </div>

              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  Tạo bởi <span className="font-medium">{report.generatedBy.name}</span>
                </p>
                <p>
                  {formatDistanceToNow(new Date(report.generatedAt), {
                    addSuffix: true,
                    locale: vi,
                  })}
                </p>
                <p className="flex items-center gap-1">
                  <Clock className={`h-3 w-3 ${isExpiring ? "text-orange-500" : ""}`} />
                  <span className={isExpiring ? "text-orange-600 font-medium" : ""}>
                    Hết hạn {timeUntilExpiry}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span className="text-xs text-muted-foreground font-mono">
              {formatFileSize(report.fileSize)}
            </span>

            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={handleDownload} title="Tải xuống">
                <Download className="h-4 w-4" />
              </Button>

              {onDelete && (
                <Button size="sm" variant="ghost" onClick={handleDelete} title="Xoá">
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

