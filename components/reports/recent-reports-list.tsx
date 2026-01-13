"use client";

import React, { useEffect, useState } from "react";
import { ReportCard } from "./report-card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileQuestion } from "lucide-react";
import type { ReportMetadata } from "@/types/report";

interface Props {
  onReportGenerated?: (report: ReportMetadata) => void;
}

export function RecentReportsList({ onReportGenerated }: Props) {
  const [reports, setReports] = useState<ReportMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentReports();
    
    // Cleanup expired reports on mount
    const cleanup = () => cleanupExpiredReports();
    cleanup();
    
    // Cleanup every 5 minutes
    const interval = setInterval(cleanup, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  async function loadRecentReports() {
    try {
      // Load from localStorage (client-side only)
      const stored = localStorage.getItem("recent_reports");
      if (stored) {
        const parsed = JSON.parse(stored);
        // Filter out expired reports
        const valid = parsed.filter((r: ReportMetadata) => new Date(r.expiresAt) > new Date());
        setReports(valid);

        // Clean up expired
        if (valid.length !== parsed.length) {
          localStorage.setItem("recent_reports", JSON.stringify(valid));
        }
      }
    } catch (error) {
      console.error("Failed to load reports:", error);
    } finally {
      setLoading(false);
    }
  }

  function cleanupExpiredReports() {
    const stored = localStorage.getItem("recent_reports");
    if (!stored) return;

    try {
      const reports = JSON.parse(stored);
      const valid = reports.filter((r: ReportMetadata) => new Date(r.expiresAt) > new Date());

      if (valid.length !== reports.length) {
        localStorage.setItem("recent_reports", JSON.stringify(valid));
        setReports(valid);
      }
    } catch (error) {
      console.error("Failed to cleanup reports:", error);
    }
  }

  function handleReportGenerated(metadata: ReportMetadata) {
    // Add to recent list
    const updated = [metadata, ...reports].slice(0, 10);
    setReports(updated);
    localStorage.setItem("recent_reports", JSON.stringify(updated));

    if (onReportGenerated) {
      onReportGenerated(metadata);
    }
  }

  function handleDelete(id: string) {
    const updated = reports.filter((r) => r.id !== id);
    setReports(updated);
    localStorage.setItem("recent_reports", JSON.stringify(updated));
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border rounded-lg bg-gray-50">
        <FileQuestion className="h-16 w-16 mx-auto mb-3 opacity-40" />
        <p className="text-lg font-medium mb-1">Chưa có báo cáo nào</p>
        <p className="text-sm">Tạo báo cáo đầu tiên của bạn bằng Report Builder bên trái</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Báo cáo gần đây</h3>
        <span className="text-sm text-muted-foreground">{reports.length} báo cáo</span>
      </div>
      {reports.map((report) => (
        <ReportCard key={report.id} report={report} onDelete={handleDelete} />
      ))}
    </div>
  );
}

// Export utility function for adding reports from outside
export function addReportToRecent(report: ReportMetadata) {
  try {
    const stored = localStorage.getItem("recent_reports");
    const reports = stored ? JSON.parse(stored) : [];
    const updated = [report, ...reports].slice(0, 10);
    localStorage.setItem("recent_reports", JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to add report:", error);
  }
}

