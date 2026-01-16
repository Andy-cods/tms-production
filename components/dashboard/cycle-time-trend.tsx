"use client";

import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { CycleTimeData } from "@/lib/services/performance-service";
import { TooltipCard, TooltipTitle } from "@/components/charts/tooltip-card";
import { PRIORITY_COLORS } from "@/lib/constants/dashboard";

interface Props {
  data: CycleTimeData[];
  showBreakdown?: boolean;
  loading?: boolean;
}

type CycleTimeTooltipItem = {
  dataKey: string;
  name: string;
  color: string;
  value: number;
  payload: { period: string };
};

function CycleTimeTooltip({
  active,
  payload,
  showBreakdown,
}: {
  active?: boolean;
  payload?: CycleTimeTooltipItem[];
  showBreakdown: boolean;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const period = payload[0]?.payload?.period;

  return (
    <TooltipCard>
      <TooltipTitle>{period}</TooltipTitle>
      {showBreakdown ? (
        <div className="space-y-1">
          {payload.map((item) => (
            <p key={item.dataKey} className="text-xs" style={{ color: item.color }}>
              <span className="font-medium">{item.name}:</span>{" "}
              {item.value.toFixed(1)} ngày
            </p>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-700">
          Trung bình:{" "}
          <span className="font-medium">{payload[0].value.toFixed(1)} ngày</span>
        </p>
      )}
    </TooltipCard>
  );
}

export function CycleTimeTrend({ data, showBreakdown: initialShowBreakdown = false, loading }: Props) {
  const [showBreakdown, setShowBreakdown] = useState(initialShowBreakdown);

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
        <p className="text-gray-600">Chưa có dữ liệu thời gian xử lý</p>
      </div>
    );
  }

  // Calculate trend
  const trend = data.length >= 2 ? 
    ((data[data.length - 1].avgDays - data[data.length - 2].avgDays) / data[data.length - 2].avgDays) * 100 :
    0;

  return (
    <div className="space-y-4">
      {/* Toggle breakdown */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Hiển thị: 
          <button
            onClick={() => setShowBreakdown(false)}
            className={`ml-2 px-2 py-1 rounded text-xs ${!showBreakdown ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
          >
            Trung bình
          </button>
          <button
            onClick={() => setShowBreakdown(true)}
            className={`ml-1 px-2 py-1 rounded text-xs ${showBreakdown ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
          >
            Theo độ ưu tiên
          </button>
        </div>
        
        {data.length >= 2 && (
          <div className="text-sm">
            {trend < -10 ? '📈' : trend > 10 ? '📉' : '➡️'}
            <span className={`ml-1 font-medium ${
              trend < -10 ? 'text-green-600' :
              trend > 10 ? 'text-red-600' :
              'text-gray-600'
            }`}>
              {trend > 0 ? '+' : ''}{trend.toFixed(0)}%
            </span>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="period" 
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            label={{ value: 'Ngày', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
          />
          <Tooltip content={<CycleTimeTooltip showBreakdown={showBreakdown} />} />
          <Legend 
            wrapperStyle={{ fontSize: 12 }}
            iconType="line"
          />
          
          {showBreakdown ? (
            <>
              <Line 
                type="monotone"
                dataKey="byPriority.URGENT" 
                stroke={PRIORITY_COLORS.URGENT}
                strokeWidth={2}
                name="🔴 URGENT"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone"
                dataKey="byPriority.HIGH" 
                stroke={PRIORITY_COLORS.HIGH}
                strokeWidth={2}
                name="🟠 HIGH"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone"
                dataKey="byPriority.MEDIUM" 
                stroke={PRIORITY_COLORS.MEDIUM}
                strokeWidth={2}
                name="🔵 MEDIUM"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone"
                dataKey="byPriority.LOW" 
                stroke={PRIORITY_COLORS.LOW}
                strokeWidth={2}
                name="⚪ LOW"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </>
          ) : (
            <Line 
              type="monotone"
              dataKey="avgDays" 
              stroke="#10b981"
              strokeWidth={3}
              name="Thời gian TB"
              dot={{ r: 5 }}
              activeDot={{ r: 7 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>

      {/* Summary */}
      {data.length > 0 && (
        <div className="pt-3 border-t text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-gray-600">
                <span className="font-medium">Kỳ gần nhất:</span>{' '}
                {data[data.length - 1].avgDays.toFixed(1)} ngày
              </p>
              {showBreakdown && (
                <div className="text-xs text-gray-500 space-y-0.5">
                  <p>🔴 URGENT: {data[data.length - 1].byPriority.URGENT.toFixed(1)} ngày</p>
                  <p>🟠 HIGH: {data[data.length - 1].byPriority.HIGH.toFixed(1)} ngày</p>
                  <p>🔵 MEDIUM: {data[data.length - 1].byPriority.MEDIUM.toFixed(1)} ngày</p>
                  <p>⚪ LOW: {data[data.length - 1].byPriority.LOW.toFixed(1)} ngày</p>
                </div>
              )}
            </div>
            <div className="text-right">
              {data.length >= 2 && (
                <p className={`text-sm font-medium ${
                  trend < 0 ? 'text-green-600' : trend > 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {trend < -10 ? '↓ Giảm ' : trend > 10 ? '↑ Tăng ' : '— '}
                  {Math.abs(trend).toFixed(0)}% so với kỳ trước
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

