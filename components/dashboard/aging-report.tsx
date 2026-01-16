"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import type { AgingData } from "@/lib/services/time-analysis-service";
import { TooltipCard } from "@/components/charts/tooltip-card";
import { formatPercent } from "@/components/charts/recharts-formatters";

interface Props {
  data: AgingData[];
  loading?: boolean;
  onRangeClick?: (range: string) => void;
}

type AgingTooltipItem = { payload: AgingData };

function AgingTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: AgingTooltipItem[];
}) {
  if (!active || !payload || payload.length === 0) return null;

  const item = payload[0]?.payload;
  if (!item) return null;

  return (
    <TooltipCard>
      <p className="text-sm font-medium text-gray-900 mb-1">{item.range}</p>
      <p className="text-sm text-gray-700">
        Số lượng: <span className="font-medium">{item.count}</span>
      </p>
      <p className="text-xs text-gray-600">Tỷ lệ: {item.percentage}%</p>
    </TooltipCard>
  );
}

function getAgeColor(range: string): string {
  if (range.includes('>14') || range.includes('>30')) return '#ef4444'; // red - critical
  if (range.includes('7-14')) return '#f59e0b'; // amber - warning
  return '#10b981'; // green - ok
}

export function AgingReport({ data, loading, onRangeClick }: Props) {
  if (loading) {
    return (
      <div className="h-[400px] bg-gray-50 rounded animate-pulse"></div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-gray-50 rounded">
        <div className="text-center">
          <p className="text-green-600 font-medium mb-1">✅ Không có yêu cầu đang chờ</p>
          <p className="text-sm text-gray-500">Tất cả yêu cầu đã được xử lý</p>
        </div>
      </div>
    );
  }

  const totalActive = data.reduce((sum, item) => sum + item.count, 0);
  const criticalCount = data.find(d => d.range.includes('>14'))?.count || 0;

  return (
    <div className="space-y-4">
      {/* Summary header */}
      <div className="flex items-center justify-between text-sm">
        <div>
          <p className="text-gray-700">
            <span className="font-medium">Tổng đang chờ:</span> {totalActive} yêu cầu
          </p>
        </div>
        {criticalCount > 0 && (
          <div className="text-red-600 font-medium">
            ⚠️ {criticalCount} yêu cầu {'>'}14 ngày
          </div>
        )}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={350}>
        <BarChart 
          data={data} 
          layout="vertical"
          margin={{ top: 10, right: 30, left: 80, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis 
            type="category" 
            dataKey="range" 
            tick={{ fontSize: 12 }}
            width={75}
          />
          <Tooltip content={<AgingTooltip />} />
          
          <Bar 
            dataKey="count" 
            radius={[0, 4, 4, 0]}
            onClick={(data: any) => onRangeClick?.(data.range)}
            cursor="pointer"
          >
            <LabelList 
              dataKey="percentage" 
              position="right" 
              formatter={(value: unknown) => formatPercent(value, 0)}
              style={{ fontSize: 11, fill: '#6b7280' }}
            />
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getAgeColor(entry.range)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Footer note */}
      {criticalCount > 0 && (
        <div className="pt-3 border-t text-xs text-gray-600">
          💡 Các yêu cầu {'>'}14 ngày cần được xem xét và xử lý ưu tiên
        </div>
      )}
    </div>
  );
}

