"use client";

import React, { useState } from "react";
import type { HeatmapDataPoint } from "@/lib/services/workload-service";

interface Props {
  data: HeatmapDataPoint[];
  loading?: boolean;
  onCellClick?: (day: string, hour: number) => void;
}

const DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function getHeatColor(count: number): string {
  if (count === 0) return 'bg-gray-50';
  if (count <= 5) return 'bg-blue-100';
  if (count <= 10) return 'bg-blue-300';
  if (count <= 20) return 'bg-blue-500';
  return 'bg-purple-600';
}

function getTextColor(count: number): string {
  if (count <= 10) return 'text-gray-700';
  return 'text-white';
}

export function WorkloadHeatmap({ data, loading, onCellClick }: Props) {
  const [hoveredCell, setHoveredCell] = useState<{ day: string; hour: number } | null>(null);

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="h-6 bg-gray-200 rounded w-48 animate-pulse mb-4"></div>
        <div className="h-[400px] bg-gray-50 rounded animate-pulse"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-gray-50 rounded">
        <p className="text-gray-600">Không có dữ liệu hoạt động</p>
      </div>
    );
  }

  // Create lookup map for quick access
  const dataMap = new Map<string, number>();
  data.forEach((point) => {
    dataMap.set(`${point.day}-${point.hour}`, point.count);
  });

  // Find max count for highlighting peak hours
  const maxCount = Math.max(...data.map(d => d.count));

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-600">
        <span className="font-medium">Mức độ:</span>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-gray-50 border rounded"></div>
            <span>0</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-blue-100 border rounded"></div>
            <span>1-5</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-blue-300 border rounded"></div>
            <span>6-10</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-blue-500 border rounded"></div>
            <span>11-20</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-purple-600 border rounded"></div>
            <span>20+</span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="flex">
            {/* Y-axis labels (Days) */}
            <div className="flex flex-col">
              <div className="h-8"></div> {/* Spacer for X-axis labels */}
              {DAY_LABELS.map((day) => (
                <div 
                  key={day} 
                  className="h-8 w-12 flex items-center justify-center text-xs font-medium text-gray-600"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Heatmap cells */}
            <div className="flex-1">
              {/* X-axis labels (Hours) */}
              <div className="flex">
                {HOURS.filter(h => h % 3 === 0).map((hour) => (
                  <div 
                    key={hour}
                    className="flex-1 h-8 flex items-center justify-center text-xs text-gray-600"
                    style={{ minWidth: '60px' }}
                  >
                    {hour}h
                  </div>
                ))}
              </div>

              {/* Grid rows */}
              {DAY_LABELS.map((day) => (
                <div key={day} className="flex">
                  {HOURS.map((hour) => {
                    const count = dataMap.get(`${day}-${hour}`) || 0;
                    const isHovered = hoveredCell?.day === day && hoveredCell?.hour === hour;
                    const isPeak = count === maxCount && count > 0;

                    return (
                      <div
                        key={`${day}-${hour}`}
                        className={`
                          h-8 flex items-center justify-center text-xs font-medium
                          border border-gray-200 cursor-pointer transition-all
                          ${getHeatColor(count)} ${getTextColor(count)}
                          ${isHovered ? 'ring-2 ring-blue-500 z-10 scale-110' : ''}
                          ${isPeak ? 'ring-2 ring-red-500' : ''}
                        `}
                        style={{ minWidth: '20px', flex: '0 0 calc(100% / 24)' }}
                        onMouseEnter={() => setHoveredCell({ day, hour })}
                        onMouseLeave={() => setHoveredCell(null)}
                        onClick={() => onCellClick?.(day, hour)}
                        title={`${day} ${hour}:00 - ${count} yêu cầu`}
                      >
                        {count > 0 && <span className="text-[10px]">{count}</span>}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Tooltip */}
          {hoveredCell && (
            <div className="mt-2 text-sm text-gray-700 bg-gray-100 p-2 rounded">
              <strong>{hoveredCell.day}</strong> {hoveredCell.hour}:00 - {dataMap.get(`${hoveredCell.day}-${hoveredCell.hour}`) || 0} yêu cầu
            </div>
          )}
        </div>
      </div>

      {/* Peak hours info */}
      {maxCount > 0 && (
        <div className="text-xs text-gray-600">
          <span className="font-medium">Giờ cao điểm:</span> {maxCount} yêu cầu (ô có viền đỏ)
        </div>
      )}
    </div>
  );
}

