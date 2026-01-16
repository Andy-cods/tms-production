"use client";

import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { ChartDataPoint } from "@/types/dashboard";
import { TooltipCard } from "@/components/charts/tooltip-card";

interface Props {
  data: ChartDataPoint[];
  period: 'week' | 'month' | 'quarter' | 'year';
  loading?: boolean;
  title?: string;
  subtitle?: string;
}

type CompletionRateDotPayload = { value: number };

function CompletionRateDot({
  cx,
  cy,
  payload,
  min,
  max,
}: {
  cx?: number;
  cy?: number;
  payload?: CompletionRateDotPayload;
  min: number;
  max: number;
}) {
  if (!cx || !cy || !payload) return null;

  const isMin = payload.value === min;
  const isMax = payload.value === max;

  if (isMin || isMax) {
    return (
      <circle
        cx={cx}
        cy={cy}
        r={5}
        fill={isMax ? "#52B26B" : "#EF4444"}
        stroke="white"
        strokeWidth={2}
      />
    );
  }

  return (
    <circle cx={cx} cy={cy} r={4} fill="#52B26B" stroke="white" strokeWidth={2} />
  );
}

type CompletionRateTooltipItem = {
  value: number;
  payload: { label: string };
};

function CompletionRateTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: CompletionRateTooltipItem[];
}) {
  if (!active || !payload || payload.length === 0) return null;

  const item = payload[0];
  return (
    <TooltipCard className="rounded-xl border-gray-200">
      <p className="text-sm font-medium text-dark-900">{item.payload.label}</p>
      <p className="text-sm text-primary-600 font-semibold mt-1">
        {item.value.toFixed(1)}% hoàn thành
      </p>
    </TooltipCard>
  );
}

export function CompletionRateChart({ 
  data, 
  period, 
  loading, 
  title = "Xu hướng hoàn thành",
  subtitle 
}: Props) {
  // Calculate statistics
  const stats = useMemo(() => {
    if (data.length === 0) return { average: 0, min: 0, max: 0, trend: 'stable' as const };
    
    const values = data.map(d => d.value);
    const average = values.reduce((sum, v) => sum + v, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Determine trend (compare first half with second half)
    const mid = Math.floor(values.length / 2);
    const firstHalf = values.slice(0, mid);
    const secondHalf = values.slice(mid);
    const avgFirst = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;
    const trend = avgSecond > avgFirst + 2 ? 'up' : avgSecond < avgFirst - 2 ? 'down' : 'stable';
    
    return { average, min, max, trend };
  }, [data]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="space-y-3">
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-4 bg-gray-100 rounded w-32 animate-pulse"></div>
          <div className="h-[300px] bg-gray-50 rounded animate-pulse mt-4"></div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        {subtitle && <p className="text-sm text-gray-600 mb-4">{subtitle}</p>}
        <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded">
          <div className="text-center">
            <p className="text-gray-600 mb-2">Chưa có dữ liệu trong kỳ này</p>
            <p className="text-sm text-gray-500">Tạo yêu cầu để thấy thống kê</p>
          </div>
        </div>
      </div>
    );
  }

  const periodLabel = {
    week: '7 ngày qua',
    month: '30 ngày qua',
    quarter: '90 ngày qua',
    year: '365 ngày qua',
  }[period];

  const trendLabel = {
    up: '📈 Xu hướng tăng',
    down: '📉 Xu hướng giảm',
    stable: '➡️ Ổn định',
  }[stats.trend];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-dark-900">{title}</h3>
        <p className="text-sm text-gray-600">{subtitle || periodLabel}</p>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis 
            dataKey="label" 
            tick={{ fontSize: 12, fill: "#6B7280" }}
            angle={-45}
            textAnchor="end"
            height={60}
            stroke="#D1D5DB"
          />
          <YAxis 
            domain={[0, 100]}
            tick={{ fontSize: 12, fill: "#6B7280" }}
            label={{ value: 'Tỷ lệ (%)', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: "#6B7280" } }}
            stroke="#D1D5DB"
          />
          <Tooltip content={<CompletionRateTooltip />} />
          <Legend 
            wrapperStyle={{ fontSize: 12 }}
            iconType="line"
          />
          
          {/* Average line */}
          <ReferenceLine 
            y={stats.average} 
            stroke="#9CA3AF" 
            strokeDasharray="5 5"
            label={{ value: `TB: ${stats.average.toFixed(1)}%`, position: 'right', fontSize: 11, fill: '#6B7280' }}
          />
          
          {/* Target line (90%) */}
          <ReferenceLine 
            y={90} 
            stroke="#FF872E" 
            strokeDasharray="5 5"
            label={{ value: 'Mục tiêu 90%', position: 'right', fontSize: 11, fill: '#FF872E' }}
          />
          
          <Line 
            type="monotone"
            dataKey="value" 
            stroke="#52B26B" 
            strokeWidth={3}
            name="Tỷ lệ hoàn thành"
            dot={<CompletionRateDot min={stats.min} max={stats.max} />}
            activeDot={{ r: 6, fill: "#52B26B", stroke: "#fff", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Footer Summary */}
      <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm">
        <div className="space-y-1">
          <p className="text-gray-600">
            <span className="font-medium">Trung bình:</span> {stats.average.toFixed(1)}%
          </p>
          <p className="text-gray-600">
            <span className="font-medium">Cao nhất:</span> <span className="text-green-600">{stats.max.toFixed(1)}%</span>
            {' · '}
            <span className="font-medium">Thấp nhất:</span> <span className="text-red-600">{stats.min.toFixed(1)}%</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-gray-700 font-medium">{trendLabel}</p>
        </div>
      </div>
    </div>
  );
}

