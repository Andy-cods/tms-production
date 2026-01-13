"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Trend {
  period: string;
  metrics: {
    totalRequests: number;
    completionRate: number;
    slaCompliance: number;
    avgLeadTime: number;
    throughput: number;
  };
}

interface Comparison {
  completionRate: { value: number; trend: "up" | "down" | "stable" } | null;
  slaCompliance: { value: number; trend: "up" | "down" | "stable" } | null;
  avgLeadTime: { value: number; trend: "up" | "down" | "stable" } | null;
  throughput: { value: number; trend: "up" | "down" | "stable" } | null;
}

interface Props {
  trends: Trend[];
  comparison: Comparison;
}

export function PeriodComparisonTable({ trends, comparison }: Props) {
  const renderTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const renderChange = (change: { value: number; trend: "up" | "down" | "stable" } | null) => {
    if (!change) return "-";

    const color =
      change.trend === "up" ? "text-green-600" : change.trend === "down" ? "text-red-600" : "text-gray-600";

    return (
      <span className={`flex items-center gap-1 ${color} text-xs`}>
        {renderTrendIcon(change.trend)}
        {Math.abs(change.value).toFixed(1)}%
      </span>
    );
  };

  if (trends.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Chưa có dữ liệu so sánh</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead>Kỳ</TableHead>
            <TableHead className="text-right">Tổng yêu cầu</TableHead>
            <TableHead className="text-right">Tỷ lệ hoàn thành</TableHead>
            <TableHead className="text-right">SLA Compliance</TableHead>
            <TableHead className="text-right">Thời gian TB</TableHead>
            <TableHead className="text-right">Throughput</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trends.map((trend, index) => (
            <TableRow key={index} className={index === 0 ? "bg-blue-50" : ""}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {trend.period}
                  {index === 0 && (
                    <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                      Hiện tại
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">{trend.metrics.totalRequests}</TableCell>
              <TableCell className="text-right">
                <div>
                  <p className="font-medium">{trend.metrics.completionRate}%</p>
                  {index === 0 && comparison?.completionRate && (
                    <div className="mt-1">{renderChange(comparison.completionRate)}</div>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div>
                  <p className="font-medium">{trend.metrics.slaCompliance}%</p>
                  {index === 0 && comparison?.slaCompliance && (
                    <div className="mt-1">{renderChange(comparison.slaCompliance)}</div>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div>
                  <p className="font-medium">{trend.metrics.avgLeadTime}d</p>
                  {index === 0 && comparison?.avgLeadTime && (
                    <div className="mt-1">{renderChange(comparison.avgLeadTime)}</div>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div>
                  <p className="font-medium">{trend.metrics.throughput}/day</p>
                  {index === 0 && comparison?.throughput && (
                    <div className="mt-1">{renderChange(comparison.throughput)}</div>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

