"use client";

import React, { useState } from "react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { TeamRadarData } from "@/lib/services/team-performance-service";
import { TooltipCard, TooltipTitle } from "@/components/charts/tooltip-card";

interface Props {
  teams: TeamRadarData[];
  selectedTeamIds?: string[];
  loading?: boolean;
}

type RadarDatum = { metric: string } & Record<string, number | string>;

type RechartsTooltipItem = {
  name: string;
  value: number;
  stroke: string;
  payload: { metric: string };
};

function TeamRadarTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: RechartsTooltipItem[];
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <TooltipCard>
      <TooltipTitle>{payload[0]?.payload?.metric}</TooltipTitle>
      <div className="space-y-1">
        {payload.map((item, index) => (
          <p key={index} className="text-xs" style={{ color: item.stroke }}>
            <span className="font-medium">{item.name}:</span>{" "}
            {Number.isFinite(item.value) ? item.value.toFixed(1) : item.value}
          </p>
        ))}
      </div>
    </TooltipCard>
  );
}

function getMetricDescription(metric: string) {
  switch (metric) {
    case "speed":
      return "Nhanh hơn = Tốt hơn";
    case "quality":
      return "Duyệt lần đầu";
    case "capacity":
      return "Tasks/ngày";
    case "sla":
      return "% đúng hạn";
    default:
      return "Số lượng hoàn thành";
  }
}

const TEAM_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f97316', // orange
  '#8b5cf6', // purple
  '#ec4899', // pink
];

const METRIC_LABELS: Record<string, string> = {
  speed: 'Tốc độ',
  quality: 'Chất lượng',
  capacity: 'Năng lực',
  sla: 'SLA',
  volume: 'Khối lượng',
};

export function TeamRadarChart({ teams, loading }: Props) {
  const [visibleTeams, setVisibleTeams] = useState<Set<string>>(
    new Set(teams.slice(0, 5).map(t => t.teamId))
  );

  if (loading) {
    return (
      <div className="h-[400px] bg-gray-50 rounded animate-pulse"></div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-gray-50 rounded">
        <p className="text-gray-600">Chưa có dữ liệu đội ngũ</p>
      </div>
    );
  }

  // Limit to 5 teams for readability
  const displayTeams = teams.slice(0, 5);

  // Transform data for radar chart
  const metrics = ['speed', 'quality', 'capacity', 'sla', 'volume'];
  const radarData: RadarDatum[] = metrics.map((metric) => {
    const dataPoint: RadarDatum = { metric: METRIC_LABELS[metric] ?? metric };

    displayTeams.forEach((team) => {
      if (visibleTeams.has(team.teamId)) {
        dataPoint[team.teamName] = Number(team[metric as keyof TeamRadarData]);
      }
    });

    return dataPoint;
  });

  const toggleTeam = (teamId: string) => {
    const newVisible = new Set(visibleTeams);
    if (newVisible.has(teamId)) {
      newVisible.delete(teamId);
    } else {
      newVisible.add(teamId);
    }
    setVisibleTeams(newVisible);
  };

  return (
    <div className="space-y-4">
      {/* Team toggles */}
      <div className="flex flex-wrap gap-2">
        {displayTeams.map((team, index) => (
          <button
            key={team.teamId}
            onClick={() => toggleTeam(team.teamId)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              visibleTeams.has(team.teamId)
                ? 'text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            style={{
              backgroundColor: visibleTeams.has(team.teamId) ? TEAM_COLORS[index] : undefined,
            }}
          >
            {team.teamName}
          </button>
        ))}
      </div>

      {/* Radar Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <RadarChart data={radarData}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis 
            dataKey="metric" 
            tick={{ fontSize: 12, fill: '#374151' }}
          />
          <PolarRadiusAxis 
            domain={[0, 100]}
            tick={{ fontSize: 11 }}
            tickCount={6}
          />
          <Tooltip content={<TeamRadarTooltip />} />
          
          {displayTeams.map((team, index) => (
            visibleTeams.has(team.teamId) && (
              <Radar
                key={team.teamId}
                name={team.teamName}
                dataKey={team.teamName}
                stroke={TEAM_COLORS[index]}
                fill={TEAM_COLORS[index]}
                fillOpacity={0.2}
                strokeWidth={2}
                dot={{ r: 4, fill: TEAM_COLORS[index] }}
              />
            )
          ))}
        </RadarChart>
      </ResponsiveContainer>

      {/* Metric Legend */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs text-gray-600">
        {metrics.map(metric => (
          <div key={metric} className="flex items-start gap-2">
            <div className="mt-0.5 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900">{METRIC_LABELS[metric]}</p>
              <p className="text-xs text-gray-500">{getMetricDescription(metric)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

