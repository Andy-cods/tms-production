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
import type { PieLabelRenderProps } from "recharts";
import type { WorkloadDistribution } from "@/lib/services/chart-service";
import { TooltipCard } from "@/components/charts/tooltip-card";
import { TASK_STATUS_COLORS, TASK_STATUS_LABELS } from "@/lib/constants/dashboard";

interface Props {
  data: WorkloadDistribution[];
  loading?: boolean;
}

type WorkloadTooltipPayloadItem = {
  name: string;
  payload: { count: number; percentage: number };
};

function WorkloadDistributionTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: WorkloadTooltipPayloadItem[];
}) {
  if (!active || !payload || payload.length === 0) return null;

  const item = payload[0];

  return (
    <TooltipCard className="rounded-xl border-gray-200">
      <p className="text-sm font-medium text-dark-900 mb-1">{item?.name}</p>
      <p className="text-sm text-gray-700">
        <span className="font-medium">Số lượng:</span> {item?.payload?.count}
      </p>
      <p className="text-sm text-primary-600 font-semibold">
        <span className="font-medium">Tỷ lệ:</span> {item?.payload?.percentage}%
      </p>
    </TooltipCard>
  );
}

function renderPieLabel(props: PieLabelRenderProps) {
  const percentage = (props.payload as any)?.percentage;
  return `${percentage ?? 0}%`;
}

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
    name: TASK_STATUS_LABELS[item.status] || item.status,
    fill: TASK_STATUS_COLORS[item.status] || '#6b7280',
  }));

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
            label={renderPieLabel}
            outerRadius={90}
            innerRadius={50}
            dataKey="count"
            paddingAngle={2}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip content={<WorkloadDistributionTooltip />} />
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

