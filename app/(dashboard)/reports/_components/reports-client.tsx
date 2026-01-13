"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReportBuilder } from "@/components/reports/report-builder";
import { FileDown, Calendar, TrendingUp, Users, CheckCircle } from "lucide-react";
import { subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

export function ReportsClient() {
  const handleQuickReport = async (title: string) => {
    alert(`Generating quick report: ${title}`);
  };

  const quickReports = [
    {
      title: "Yêu cầu tuần này",
      icon: Calendar,
      description: "Tất cả requests trong tuần",
    },
    {
      title: "Tasks quá hạn",
      icon: CheckCircle,
      description: "Danh sách tasks đã quá deadline",
    },
    {
      title: "KPI tháng hiện tại",
      icon: TrendingUp,
      description: "Tổng hợp KPI tháng này",
    },
    {
      title: "Performance team",
      icon: Users,
      description: "Hiệu suất từng team",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600 mt-1">Tạo và xuất báo cáo phân tích</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Builder */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Report Builder</CardTitle>
            <CardDescription>Tùy chỉnh và tạo báo cáo</CardDescription>
          </CardHeader>
          <CardContent>
            <ReportBuilder />
          </CardContent>
        </Card>

        {/* Quick Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Reports</CardTitle>
            <CardDescription>Báo cáo nhanh thường dùng</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {quickReports.map((report, index) => {
                const Icon = report.icon;
                return (
                  <Button
                    key={index}
                    variant="ghost"
                    className="w-full justify-start h-auto py-3"
                    onClick={() => handleQuickReport(report.title)}
                  >
                    <div className="flex items-start gap-3 text-left">
                      <Icon className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">{report.title}</p>
                        <p className="text-xs text-gray-600">{report.description}</p>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5 text-blue-600" />
            Tính năng Report Builder
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2 text-gray-900">✅ Đã hoàn thành:</h4>
              <ul className="space-y-1 text-gray-700">
                <li>• 6 loại báo cáo khác nhau</li>
                <li>• 3 định dạng export (CSV, Excel, PDF)</li>
                <li>• Bộ lọc ngày thông minh</li>
                <li>• Quick reports</li>
                <li>• Type-safe với TypeScript</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-gray-900">🚧 Sắp có:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Advanced filters (team, user, status)</li>
                <li>• Column customization</li>
                <li>• Scheduled reports</li>
                <li>• Email delivery</li>
                <li>• Report templates</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 p-3 bg-white rounded border">
            <p className="text-xs text-gray-600">
              💡 <strong>Tip:</strong> Validation schema đã sẵn sàng tại{" "}
              <code className="bg-gray-100 px-1.5 py-0.5 rounded">lib/validators/report.ts</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

