"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Download, Eye, Loader2, FileText, FileSpreadsheet } from "lucide-react";
import { ReportTypeSelector } from "./report-type-selector";
import type { ReportType, ReportFormat, ReportConfig } from "@/types/report";
import { Badge } from "@/components/ui/badge";
import { subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

export function ReportBuilder() {
  const [config, setConfig] = useState<Partial<ReportConfig>>({
    format: "EXCEL",
    filters: {
      dateRange: {
        from: subDays(new Date(), 30),
        to: new Date(),
      },
      includeCompleted: true,
      includeArchived: false,
    },
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [preview, setPreview] = useState<{ recordCount: number; estimatedSize: string } | null>(null);

  const handleFormatChange = (format: ReportFormat) => {
    setConfig({ ...config, format });
  };

  const handlePreview = async () => {
    // Simulate preview calculation
    setPreview({
      recordCount: Math.floor(Math.random() * 1000) + 100,
      estimatedSize: "~2.5 MB",
    });
  };

  const handleGenerate = async () => {
    if (!config.type) {
      alert("Vui lòng chọn loại báo cáo");
      return;
    }

    try {
      setIsGenerating(true);
      
      console.log(`Exporting ${config.type} as ${config.format}`);
      
      const response = await fetch("/api/reports/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportType: config.type,
          format: config.format?.toLowerCase(),
          dateFrom: config.filters?.dateRange?.from?.toISOString(),
          dateTo: config.filters?.dateRange?.to?.toISOString(),
          filters: {
            status: undefined,
            priority: undefined
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Export failed");
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || `report_${Date.now()}.${config.format?.toLowerCase()}`;

      // Convert response to blob
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log(`✅ File downloaded: ${filename}`);
      
    } catch (error) {
      console.error("Export failed:", error);
      alert(`Lỗi: ${error instanceof Error ? error.message : "Không thể xuất báo cáo"}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const setQuickDateRange = (range: "today" | "week" | "month" | "quarter") => {
    const now = new Date();
    let from: Date;
    let to: Date = now;

    switch (range) {
      case "today":
        from = now;
        break;
      case "week":
        from = startOfWeek(now);
        to = endOfWeek(now);
        break;
      case "month":
        from = startOfMonth(now);
        to = endOfMonth(now);
        break;
      case "quarter":
        from = subDays(now, 90);
        break;
      default:
        from = subDays(now, 30);
    }

    setConfig({
      ...config,
      filters: {
        ...config.filters,
        dateRange: { from, to },
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Step 1: Report Type */}
      <div>
        <Label className="text-base font-semibold">1. Chọn loại báo cáo</Label>
        <ReportTypeSelector value={config.type} onChange={(type) => setConfig({ ...config, type })} />
      </div>

      {/* Step 2: Format */}
      <div>
        <Label className="text-base font-semibold">2. Chọn định dạng</Label>
        <div className="flex gap-4 mt-3">
          {["CSV", "EXCEL", "PDF"].map((format) => (
            <button
              key={format}
              type="button"
              onClick={() => handleFormatChange(format as ReportFormat)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all",
                config.format === format
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              {format === "CSV" && <FileText className="h-4 w-4" />}
              {format === "EXCEL" && <FileSpreadsheet className="h-4 w-4" />}
              {format === "PDF" && <FileText className="h-4 w-4" />}
              {format}
            </button>
          ))}
        </div>
      </div>

      {/* Step 3: Quick Date Range */}
      <div>
        <Label className="text-base font-semibold">3. Khoảng thời gian</Label>
        <div className="flex gap-2 flex-wrap mt-3">
          <Button variant="outline" size="sm" onClick={() => setQuickDateRange("today")}>
            Hôm nay
          </Button>
          <Button variant="outline" size="sm" onClick={() => setQuickDateRange("week")}>
            Tuần này
          </Button>
          <Button variant="outline" size="sm" onClick={() => setQuickDateRange("month")}>
            Tháng này
          </Button>
          <Button variant="outline" size="sm" onClick={() => setQuickDateRange("quarter")}>
            Quý này
          </Button>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Từ {config.filters?.dateRange?.from.toLocaleDateString("vi-VN")} đến{" "}
          {config.filters?.dateRange?.to.toLocaleDateString("vi-VN")}
        </p>
      </div>

      {/* Step 4: Toggles */}
      <div>
        <Label className="text-base font-semibold">4. Tùy chọn</Label>
        <div className="space-y-2 mt-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="completed"
              checked={config.filters?.includeCompleted}
              onChange={(e) =>
                setConfig({
                  ...config,
                  filters: {
                    ...config.filters!,
                    includeCompleted: e.target.checked,
                  },
                })
              }
              className="rounded"
            />
            <Label htmlFor="completed" className="font-normal cursor-pointer">
              Bao gồm đã hoàn thành
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="archived"
              checked={config.filters?.includeArchived}
              onChange={(e) =>
                setConfig({
                  ...config,
                  filters: {
                    ...config.filters!,
                    includeArchived: e.target.checked,
                  },
                })
              }
              className="rounded"
            />
            <Label htmlFor="archived" className="font-normal cursor-pointer">
              Bao gồm đã lưu trữ
            </Label>
          </div>
        </div>
      </div>

      {/* Step 5: Preview & Generate */}
      <div className="space-y-4 pt-4 border-t">
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePreview} disabled={!config.type}>
            <Eye className="mr-2 h-4 w-4" />
            Xem trước
          </Button>

          <Button onClick={handleGenerate} disabled={!config.type || isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang tạo...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Tạo báo cáo
              </>
            )}
          </Button>
        </div>

        {preview && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-900">
              📊 Báo cáo sẽ chứa <strong>{preview.recordCount}</strong> records (
              {preview.estimatedSize})
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}

