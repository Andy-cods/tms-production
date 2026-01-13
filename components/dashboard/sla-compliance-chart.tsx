"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  LabelList,
} from "recharts";
import type { SLAComplianceByPriority } from "@/lib/services/chart-service";

interface Props {
  data: SLAComplianceByPriority[];
  loading?: boolean;
}

const priorityEmojis: Record<string, string> = {
  LOW: '🔵',
  MEDIUM: '🟡',
  HIGH: '🟠',
  URGENT: '🔴',
};

function getBarColor(compliance: number): string {
  if (compliance >= 90) return '#52B26B'; // primary-500 (green)
  if (compliance >= 80) return '#F59E0B'; // amber-500
  if (compliance >= 70) return '#FF872E'; // accent-500 (orange)
  return '#EF4444'; // red-500
}

export function SLAComplianceChart({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="space-y-3">
          <div className="h-6 bg-gray-200 rounded w-56 animate-pulse"></div>
          <div className="h-[300px] bg-gray-50 rounded animate-pulse mt-4"></div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Tuân thủ SLA theo độ ưu tiên
        </h3>
        <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded">
          <div className="text-center">
            <p className="text-gray-600 mb-2">Chưa có yêu cầu với SLA</p>
            <p className="text-sm text-gray-500">Dữ liệu sẽ hiển thị khi có yêu cầu được tạo</p>
          </div>
        </div>
      </div>
    );
  }

  // Enhance data with emoji labels
  const chartData = data.map(item => ({
    ...item,
    priorityLabel: `${priorityEmojis[item.priority] || ''} ${item.priority}`,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    
    const data = payload[0].payload;
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-3">
        <p className="text-sm font-medium text-dark-900 mb-2">
          {priorityEmojis[data.priority]} {data.priority}
        </p>
        <p className="text-sm text-primary-600 font-semibold">
          <span className="font-medium">Tuân thủ:</span> {data.compliance.toFixed(1)}%
        </p>
        <p className="text-sm text-gray-600">
          Đúng hạn: {data.onTime} / {data.total}
        </p>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-dark-900">Tuân thủ SLA theo độ ưu tiên</h3>
        <p className="text-sm text-gray-600">Phần trăm yêu cầu hoàn thành đúng SLA</p>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
          <XAxis 
            dataKey="priorityLabel" 
            tick={{ fontSize: 12, fill: "#6B7280" }}
            stroke="#D1D5DB"
          />
          <YAxis 
            domain={[0, 100]}
            tick={{ fontSize: 12, fill: "#6B7280" }}
            label={{ value: 'Tuân thủ (%)', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: "#6B7280" } }}
            stroke="#D1D5DB"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ fontSize: 12 }}
          />
          
          {/* Target line (90%) */}
          <ReferenceLine 
            y={90} 
            stroke="#FF872E" 
            strokeDasharray="5 5"
            label={{ value: 'Mục tiêu 90%', position: 'right', fontSize: 11, fill: '#FF872E' }}
          />
          
          <Bar 
            dataKey="compliance" 
            radius={[8, 8, 0, 0]}
          >
            <LabelList 
              dataKey="compliance" 
              position="top" 
              formatter={(value: any) => `${Number(value).toFixed(1)}%`}
              style={{ fontSize: 11, fill: '#374151' }}
            />
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.compliance)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Footer Summary */}
      <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-sm">
        {data.map((item) => (
          <div key={item.priority} className="flex items-center justify-between">
            <span className="text-gray-600">
              {priorityEmojis[item.priority]} {item.priority}:
            </span>
            <span className={`font-medium ${
              item.compliance >= 90 ? 'text-green-600' :
              item.compliance >= 80 ? 'text-amber-600' :
              item.compliance >= 70 ? 'text-orange-600' :
              'text-red-600'
            }`}>
              {item.onTime}/{item.total}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

