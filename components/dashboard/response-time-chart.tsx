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
  ReferenceLine,
} from "recharts";
import type { ResponseTimeData } from "@/lib/services/performance-service";

interface Props {
  data: ResponseTimeData[];
  slaTarget?: number; // in hours
  loading?: boolean;
}

function getSLAColor(range: string, slaTarget: number = 8): string {
  const rangeMap: Record<string, number> = {
    '<1h': 0.5,
    '1-4h': 2.5,
    '4-8h': 6,
    '8-24h': 16,
    '>24h': 25,
  };

  const avgHours = rangeMap[range] || 0;
  
  if (avgHours <= slaTarget * 0.5) return '#10b981'; // Green - excellent
  if (avgHours <= slaTarget) return '#3b82f6'; // Blue - good
  if (avgHours <= slaTarget * 1.2) return '#f59e0b'; // Amber - near target
  return '#ef4444'; // Red - over target
}

export function ResponseTimeChart({ data, slaTarget = 8, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-[300px] bg-gray-50 rounded animate-pulse"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded">
        <p className="text-gray-600">Chưa có dữ liệu thời gian phản hồi</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    
    const data = payload[0].payload;
    return (
      <div className="bg-white rounded-lg border shadow-lg p-3">
        <p className="text-sm font-medium text-gray-900 mb-1">
          Thời gian: {data.range}
        </p>
        <p className="text-sm text-gray-700">
          Số lượng: <span className="font-medium">{data.count}</span>
        </p>
        <p className="text-sm text-gray-600">
          Tỷ lệ: {data.percentage}%
        </p>
      </div>
    );
  };

  // Calculate summary stats
  const fastResponseCount = data
    .filter(d => d.range === '<1h' || d.range === '1-4h')
    .reduce((sum, d) => sum + d.count, 0);
  const totalCount = data.reduce((sum, d) => sum + d.count, 0);
  const fastPercentage = totalCount > 0 ? (fastResponseCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="range" 
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            label={{ value: 'Số lượng', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
          />
          <Tooltip content={<CustomTooltip />} />
          
          <Bar dataKey="count" radius={[8, 8, 0, 0]}>
            <LabelList 
              dataKey="percentage" 
              position="top" 
              formatter={(value: any) => `${Number(value).toFixed(0)}%`}
              style={{ fontSize: 11, fill: '#374151' }}
            />
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getSLAColor(entry.range, slaTarget)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Summary */}
      <div className="pt-3 border-t">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">
              <span className="font-medium">Mục tiêu SLA:</span> {slaTarget} giờ
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Tổng yêu cầu:</span> {totalCount}
            </p>
          </div>
          <div className="text-right">
            <p className={`font-medium ${fastPercentage >= 70 ? 'text-green-600' : 'text-amber-600'}`}>
              {fastPercentage.toFixed(0)}% trong vòng 4h
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {fastPercentage >= 70 ? '✅ Đạt mục tiêu' : '⚠️ Cần cải thiện'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

