"use client";

import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { SLATrendData } from "@/lib/services/sla-analysis-service";
import { TooltipCard, TooltipTitle } from "@/components/charts/tooltip-card";

interface Props {
  data: SLATrendData[];
  showTeams?: string[];
  loading?: boolean;
}

const TEAM_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#14b8a6', // teal
  '#f97316', // orange
  '#6366f1', // indigo
  '#84cc16', // lime
];

type SLATrendTooltipItem = {
  dataKey: string;
  name: string;
  color: string;
  value?: number;
};

function SLATrendTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: SLATrendTooltipItem[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <TooltipCard>
      <TooltipTitle>{label}</TooltipTitle>
      <div className="space-y-1">
        {payload.map((item) => (
          <p key={item.dataKey} className="text-xs flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="font-medium">{item.name}:</span>
            <span className={item.value !== undefined && item.value < 90 ? "text-red-600 font-bold" : ""}>
              {item.value?.toFixed(1)}%
            </span>
          </p>
        ))}
      </div>
    </TooltipCard>
  );
}

type SLATrendDotProps = {
  cx?: number;
  cy?: number;
  payload?: Record<string, unknown>;
  dataKey?: string;
  stroke?: string;
};

function SLATrendDot({ cx, cy, payload, dataKey, stroke }: SLATrendDotProps) {
  if (!cx || !cy || !payload || !dataKey || !stroke) return null;

  const rawValue = payload[dataKey];
  const value = typeof rawValue === "number" ? rawValue : undefined;

  // Highlight dots below target (90%)
  if (value !== undefined && value < 90) {
    return (
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill="#ef4444"
        stroke="#dc2626"
        strokeWidth={2}
      />
    );
  }

  return (
    <circle cx={cx} cy={cy} r={3} fill={stroke} stroke={stroke} strokeWidth={1} />
  );
}

export function SLATrendChart({ data, showTeams, loading }: Props) {
  const [hiddenLines, setHiddenLines] = useState<Set<string>>(new Set());

  if (loading) {
    return (
      <div className="h-[400px] bg-gray-50 rounded animate-pulse"></div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-gray-50 rounded">
        <p className="text-gray-600">Chưa có dữ liệu xu hướng SLA</p>
      </div>
    );
  }

  // Extract team names from data
  const allTeams = Object.keys(data[0] || {}).filter(
    key => key !== 'week' && key !== 'average'
  );
  const teamsToShow = showTeams || allTeams;

  const toggleLine = (teamName: string) => {
    const newHidden = new Set(hiddenLines);
    if (newHidden.has(teamName)) {
      newHidden.delete(teamName);
    } else {
      newHidden.add(teamName);
    }
    setHiddenLines(newHidden);
  };

  return (
    <div className="space-y-4">
      {/* Legend toggles */}
      <div className="flex flex-wrap gap-2">
        {teamsToShow.map((team, index) => (
          <button
            key={team}
            onClick={() => toggleLine(team)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              hiddenLines.has(team)
                ? 'bg-gray-100 text-gray-400 line-through'
                : 'text-white'
            }`}
            style={{
              backgroundColor: hiddenLines.has(team) 
                ? undefined 
                : TEAM_COLORS[index % TEAM_COLORS.length],
            }}
          >
            {team}
          </button>
        ))}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="week" 
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            domain={[0, 100]}
            tick={{ fontSize: 12 }}
            label={{ 
              value: 'SLA Compliance (%)', 
              angle: -90, 
              position: 'insideLeft',
              style: { fontSize: 12 }
            }}
          />
          <Tooltip content={<SLATrendTooltip />} />
          
          {/* Target line at 90% */}
          <ReferenceLine 
            y={90} 
            stroke="#ef4444" 
            strokeDasharray="5 5"
            label={{ 
              value: 'Mục tiêu 90%', 
              position: 'right',
              fill: '#ef4444',
              fontSize: 11,
            }}
          />
          
          {/* Average line (dashed gray) */}
          {data.some(d => d.average !== undefined) && (
            <Line
              type="monotone"
              dataKey="average"
              stroke="#6b7280"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Trung bình"
            />
          )}
          
          {/* Team lines */}
          {teamsToShow.map((team, index) => (
            !hiddenLines.has(team) && (
              <Line
                key={team}
                type="monotone"
                dataKey={team}
                stroke={TEAM_COLORS[index % TEAM_COLORS.length]}
                strokeWidth={2}
                dot={<SLATrendDot />}
                name={team}
              />
            )
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Summary */}
      <div className="pt-3 border-t text-sm text-gray-600">
        <p>
          🎯 <span className="font-medium">Mục tiêu SLA:</span> 90% hoàn thành đúng hạn
        </p>
        <p className="text-xs mt-1">
          🔴 Điểm đỏ: Tuần không đạt mục tiêu
        </p>
      </div>
    </div>
  );
}

