"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  CheckSquare,
  LayoutDashboard,
  TrendingUp,
  Users,
  LineChart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReportType, ReportFormat } from "@/types/report";

interface ReportTypeOption {
  type: ReportType;
  icon: React.ElementType;
  title: string;
  description: string;
  formats: ReportFormat[];
}

const REPORT_TYPES: ReportTypeOption[] = [
  {
    type: "REQUESTS_LIST",
    icon: FileText,
    title: "Danh sách Yêu cầu",
    description: "Export tất cả yêu cầu với bộ lọc",
    formats: ["CSV", "EXCEL"],
  },
  {
    type: "TASKS_LIST",
    icon: CheckSquare,
    title: "Danh sách Công việc",
    description: "Export tasks và tiến độ",
    formats: ["CSV", "EXCEL"],
  },
  {
    type: "DASHBOARD_SNAPSHOT",
    icon: LayoutDashboard,
    title: "Dashboard Snapshot",
    description: "Ảnh chụp dashboard với charts",
    formats: ["PDF"],
  },
  {
    type: "KPI_SUMMARY",
    icon: TrendingUp,
    title: "KPI Summary",
    description: "Tổng hợp các chỉ số quan trọng",
    formats: ["PDF", "EXCEL"],
  },
  {
    type: "TEAM_PERFORMANCE",
    icon: Users,
    title: "Team Performance",
    description: "Hiệu suất chi tiết từng đội",
    formats: ["PDF", "EXCEL"],
  },
  {
    type: "HISTORICAL_TREND",
    icon: LineChart,
    title: "Historical Trends",
    description: "So sánh xu hướng nhiều kỳ",
    formats: ["PDF", "EXCEL"],
  },
];

interface Props {
  value?: ReportType;
  onChange: (type: ReportType) => void;
}

export function ReportTypeSelector({ value, onChange }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2 mt-3">
      {REPORT_TYPES.map(({ type, icon: Icon, title, description, formats }) => (
        <Card
          key={type}
          className={cn(
            "cursor-pointer transition-all hover:shadow-md hover:border-primary/50",
            value === type && "ring-2 ring-primary border-primary shadow-md"
          )}
          onClick={() => onChange(type)}
        >
          <CardHeader className="pb-4">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  value === type ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription className="text-sm mt-1">{description}</CardDescription>
                <div className="flex gap-1 mt-2">
                  {formats.map((format) => (
                    <Badge key={format} variant="outline" className="text-xs">
                      {format}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

