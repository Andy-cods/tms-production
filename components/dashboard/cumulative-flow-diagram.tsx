"use client";

import React, { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AlertCircle } from "lucide-react";
import type { CFDData } from "@/lib/services/time-analysis-service";
import { TooltipCard, TooltipTitle } from "@/components/charts/tooltip-card";
import { CFD_STATUS_COLORS, CFD_STATUS_LABELS } from "@/lib/constants/dashboard";

interface Props {
  data: CFDData[];
  loading?: boolean;
}

type CFDTooltipItem = {
  dataKey: string;
  color: string;
  value: number;
};

function CFDTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: CFDTooltipItem[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  // Recharts payload ordering can be bottom-to-top; show top-to-bottom in tooltip
  const items = [...payload].reverse();

  return (
    <TooltipCard>
      <TooltipTitle>{label}</TooltipTitle>
      <div className="space-y-1">
        {items.map((item) => (
          <p key={item.dataKey} className="text-xs flex items-center gap-2">
            <span className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
            <span className="font-medium">
              {CFD_STATUS_LABELS[item.dataKey]}:
            </span>
            <span>{item.value}</span>
          </p>
        ))}
      </div>
    </TooltipCard>
  );
}

export function CumulativeFlowDiagram({ data, loading }: Props) {
  const [hiddenStatuses, setHiddenStatuses] = useState<Set<string>>(new Set());

  // Auto-detect bottlenecks
  const insights = useMemo(() => {
    if (data.length < 3) return [];
    
    const results: string[] = [];
    const recent = data[data.length - 1];
    const previous = data[data.length - 3];

    // Check if IN_REVIEW is growing
    if (recent.IN_REVIEW > previous.IN_REVIEW * 1.5) {
      results.push('⚠️ Số lượng chờ duyệt đang tăng, có thể tắc nghẽn review');
    }

    // Check if BLOCKED is growing
    if (recent.BLOCKED > 2 && recent.BLOCKED > previous.BLOCKED) {
      results.push('🔴 Công việc bị chặn đang tăng, cần xử lý gấp');
    }

    // Check if TODO is accumulating
    if (recent.TODO > previous.TODO * 1.3) {
      results.push('📋 Công việc chưa bắt đầu đang tích tụ');
    }

    return results;
  }, [data]);

  if (loading) {
    return (
      <div className="h-[400px] bg-gray-50 rounded animate-pulse"></div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-gray-50 rounded">
        <p className="text-gray-600">Chưa có dữ liệu flow</p>
      </div>
    );
  }

  const toggleStatus = (status: string) => {
    const newHidden = new Set(hiddenStatuses);
    if (newHidden.has(status)) {
      newHidden.delete(status);
    } else {
      newHidden.add(status);
    }
    setHiddenStatuses(newHidden);
  };

  return (
    <div className="space-y-4">
      {/* Insights */}
      {insights.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800 space-y-1">
              {insights.map((insight, index) => (
                <p key={index}>{insight}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Legend toggles */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(CFD_STATUS_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => toggleStatus(key)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              hiddenStatuses.has(key)
                ? 'bg-gray-100 text-gray-400 line-through'
                : 'text-white'
            }`}
            style={{
              backgroundColor: hiddenStatuses.has(key) 
                ? undefined
                : CFD_STATUS_COLORS[key],
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            label={{ value: 'Số lượng', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
          />
          <Tooltip content={<CFDTooltip />} />
          
          {!hiddenStatuses.has('DONE') && (
            <Area 
              type="monotone"
              dataKey="DONE" 
              stackId="1"
              stroke={CFD_STATUS_COLORS.DONE}
              fill={CFD_STATUS_COLORS.DONE}
              fillOpacity={0.8}
            />
          )}
          {!hiddenStatuses.has('IN_REVIEW') && (
            <Area 
              type="monotone"
              dataKey="IN_REVIEW" 
              stackId="1"
              stroke={CFD_STATUS_COLORS.IN_REVIEW}
              fill={CFD_STATUS_COLORS.IN_REVIEW}
              fillOpacity={0.8}
            />
          )}
          {!hiddenStatuses.has('IN_PROGRESS') && (
            <Area 
              type="monotone"
              dataKey="IN_PROGRESS" 
              stackId="1"
              stroke={CFD_STATUS_COLORS.IN_PROGRESS}
              fill={CFD_STATUS_COLORS.IN_PROGRESS}
              fillOpacity={0.8}
            />
          )}
          {!hiddenStatuses.has('TODO') && (
            <Area 
              type="monotone"
              dataKey="TODO" 
              stackId="1"
              stroke={CFD_STATUS_COLORS.TODO}
              fill={CFD_STATUS_COLORS.TODO}
              fillOpacity={0.8}
            />
          )}
          {!hiddenStatuses.has('BLOCKED') && (
            <Area 
              type="monotone"
              dataKey="BLOCKED" 
              stackId="1"
              stroke={CFD_STATUS_COLORS.BLOCKED}
              fill={CFD_STATUS_COLORS.BLOCKED}
              fillOpacity={0.8}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>

      {/* Summary */}
      {data.length > 0 && (
        <div className="pt-3 border-t text-sm text-gray-600">
          <p>
            Tính đến {data[data.length - 1].date}:{' '}
            <span className="font-medium text-green-600">{data[data.length - 1].DONE} hoàn thành</span>,{' '}
            <span className="font-medium text-blue-600">{data[data.length - 1].IN_PROGRESS} đang làm</span>,{' '}
            <span className="font-medium text-purple-600">{data[data.length - 1].IN_REVIEW} chờ duyệt</span>
            {data[data.length - 1].BLOCKED > 0 && (
              <>, <span className="font-medium text-red-600">{data[data.length - 1].BLOCKED} bị chặn</span></>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

