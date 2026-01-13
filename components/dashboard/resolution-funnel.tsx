"use client";

import React from "react";
import type { FunnelData } from "@/lib/services/time-analysis-service";

interface Props {
  data: FunnelData[];
  loading?: boolean;
}

export function ResolutionFunnel({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="h-[400px] bg-gray-50 rounded animate-pulse"></div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-gray-50 rounded">
        <p className="text-gray-600">Chưa có dữ liệu phễu</p>
      </div>
    );
  }

  const maxCount = Math.max(...data.map(d => d.count));

  return (
    <div className="space-y-4">
      {/* Funnel visualization */}
      <div className="space-y-3">
        {data.map((stage, index) => {
          const widthPercent = (stage.count / maxCount) * 100;
          const dropFromPrevious = index > 0 ? data[index - 1].count - stage.count : 0;
          const dropRate = index > 0 ? ((dropFromPrevious / data[index - 1].count) * 100) : 0;

          return (
            <div key={stage.stage}>
              <div className="flex items-center justify-between mb-1 text-sm">
                <span className="font-medium text-gray-900">{stage.stage}</span>
                <span className="text-gray-600">
                  {stage.count} ({stage.rate.toFixed(0)}%)
                </span>
              </div>
              
              <div className="mx-auto" style={{ width: `${widthPercent}%` }}>
                <div 
                  className="h-12 flex items-center justify-center text-white font-medium text-sm rounded transition-all hover:opacity-90"
                  style={{
                    background: `linear-gradient(135deg, #3b82f6 ${index * 25}%, #10b981 100%)`,
                  }}
                >
                  {stage.count}
                </div>
              </div>

              {/* Drop indicator */}
              {dropFromPrevious > 0 && (
                <div className="text-center text-xs text-red-600 mt-1">
                  ❌ -{dropFromPrevious} ({dropRate.toFixed(0)}% drop)
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="pt-3 border-t text-sm">
        <p className="text-gray-700">
          <span className="font-medium">Tỷ lệ chuyển đổi tổng:</span>{' '}
          <span className={`font-bold ${
            data[data.length - 1].rate >= 70 ? 'text-green-600' :
            data[data.length - 1].rate >= 50 ? 'text-amber-600' :
            'text-red-600'
          }`}>
            {data[data.length - 1].rate.toFixed(0)}%
          </span>
        </p>
        <p className="text-xs text-gray-600 mt-1">
          {data[data.length - 1].rate >= 70 ? '✅ Hiệu quả cao' :
           data[data.length - 1].rate >= 50 ? '⚠️ Trung bình' :
           '🔴 Cần cải thiện'}
        </p>
      </div>
    </div>
  );
}

