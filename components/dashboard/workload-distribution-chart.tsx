"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import type { WorkloadDistribution } from "@/lib/services/chart-service";

interface Props {
  data: WorkloadDistribution[];
  loading?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  TODO: '#9CA3AF',        // gray-400
  IN_PROGRESS: '#FF872E', // accent-500 (orange)
  IN_REVIEW: '#3B82F6',   // blue-500
  BLOCKED: '#EF4444',     // red-500
  DONE: '#52B26B',        // primary-500 (green)
  REWORK: '#F59E0B',      // amber-500
};

const STATUS_LABELS: Record<string, string> = {
  TODO: 'Chưa bắt đầu',
  IN_PROGRESS: 'Đang làm',
  IN_REVIEW: 'Chờ duyệt',
  BLOCKED: 'Bị chặn',
  DONE: 'Hoàn thành',
};

export function WorkloadDistributionChart({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="space-y-3">
          <div className="h-6 bg-gray-200 rounded w-64 animate-pulse"></div>
          <div className="h-[300px] bg-gray-50 rounded animate-pulse mt-4"></div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Phân bố khối lượng công việc
        </h3>
        <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded">
          <div className="text-center">
            <p className="text-gray-600 mb-2">Không có công việc đang thực hiện</p>
            <p className="text-sm text-gray-500">Dữ liệu sẽ hiển thị khi có công việc được tạo</p>
          </div>
        </div>
      </div>
    );
  }

  const totalTasks = data.reduce((sum, item) => sum + item.count, 0);

  // Enhance data with labels
  const chartData = data.map(item => ({
    ...item,
    name: STATUS_LABELS[item.status] || item.status,
    fill: STATUS_COLORS[item.status] || '#6b7280',
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    
    const data = payload[0];
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-3">
        <p className="text-sm font-medium text-dark-900 mb-1">
          {data.name}
        </p>
        <p className="text-sm text-gray-700">
          <span className="font-medium">Số lượng:</span> {data.payload.count}
        </p>
        <p className="text-sm text-primary-600 font-semibold">
          <span className="font-medium">Tỷ lệ:</span> {data.payload.percentage}%
        </p>
      </div>
    );
  };

  const renderLabel = (entry: any) => {
    return `${entry.percentage}%`;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-dark-900">Phân bố khối lượng công việc</h3>
        <p className="text-sm text-gray-600">Tổng: {totalTasks} công việc đang thực hiện</p>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={90}
            innerRadius={50}
            dataKey="count"
            paddingAngle={2}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{ fontSize: 12, paddingTop: 20 }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Center label (total) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
        {/* This would need CSS positioning, skipping for simplicity */}
      </div>

      {/* Footer Summary */}
      <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-3 text-sm">
        {chartData.map((item) => (
          <div key={item.status} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: item.fill }}
            />
            <span className="text-gray-700">
              {item.name}: <span className="font-medium">{item.count}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

