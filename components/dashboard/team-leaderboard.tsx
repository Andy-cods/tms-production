"use client";

import React, { useState } from "react";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import type { TeamLeaderboardData } from "@/lib/services/team-performance-service";

interface Props {
  teams: TeamLeaderboardData[];
  loading?: boolean;
  onTeamClick?: (teamId: string) => void;
}

const medals = ['🥇', '🥈', '🥉'];

export function TeamLeaderboard({ teams, loading, onTeamClick }: Props) {
  const [sortKey, setSortKey] = useState<keyof TeamLeaderboardData>('rank');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="py-12 text-center bg-gray-50 rounded">
        <p className="text-gray-600">Không có dữ liệu đội ngũ</p>
      </div>
    );
  }

  const handleSort = (key: keyof TeamLeaderboardData) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedTeams = [...teams].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    const mult = sortDir === 'asc' ? 1 : -1;
    return (aVal > bVal ? 1 : -1) * mult;
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">#</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase cursor-pointer hover:bg-gray-100" onClick={() => handleSort('teamName')}>
              Đội ngũ
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase cursor-pointer hover:bg-gray-100" onClick={() => handleSort('score')}>
              Điểm
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase cursor-pointer hover:bg-gray-100" onClick={() => handleSort('completionRate')}>
              Hoàn thành %
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase cursor-pointer hover:bg-gray-100" onClick={() => handleSort('slaCompliance')}>
              SLA %
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase cursor-pointer hover:bg-gray-100" onClick={() => handleSort('avgLeadTime')}>
              Lead Time
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase cursor-pointer hover:bg-gray-100" onClick={() => handleSort('throughput')}>
              Năng suất
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Xu hướng</th>
          </tr>
        </thead>
        <tbody>
          {sortedTeams.map((team) => {
            const bgClass = team.rank === 1 ? 'bg-yellow-50' :
                           team.rank === 2 ? 'bg-gray-50' :
                           team.rank === 3 ? 'bg-orange-50' :
                           '';

            return (
              <tr 
                key={team.teamId}
                className={`border-b hover:bg-blue-50 cursor-pointer transition-colors ${bgClass}`}
                onClick={() => onTeamClick?.(team.teamId)}
              >
                <td className="px-4 py-3">
                  <span className="text-lg font-bold">
                    {team.rank <= 3 ? medals[team.rank - 1] : team.rank}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-900">{team.teamName}</p>
                    <p className="text-xs text-gray-500">{team.members} thành viên</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <p className="font-bold text-lg text-blue-600">{team.score.toFixed(0)}</p>
                    <div className="w-20 bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-blue-500 h-1.5 rounded-full"
                        style={{ width: `${team.score}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`font-medium ${
                    team.completionRate >= 80 ? 'text-green-600' :
                    team.completionRate >= 60 ? 'text-amber-600' :
                    'text-red-600'
                  }`}>
                    {team.completionRate.toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`font-medium ${
                    team.slaCompliance >= 90 ? 'text-green-600' :
                    team.slaCompliance >= 80 ? 'text-amber-600' :
                    'text-red-600'
                  }`}>
                    {team.slaCompliance.toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {team.avgLeadTime.toFixed(1)} ngày
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {team.throughput.toFixed(1)}/ngày
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {team.trend === 'up' && <ArrowUp className="h-4 w-4 text-green-600" />}
                    {team.trend === 'down' && <ArrowDown className="h-4 w-4 text-red-600" />}
                    {team.trend === 'stable' && <Minus className="h-4 w-4 text-gray-400" />}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

