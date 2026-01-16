"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";
import type { Bottleneck } from "@/lib/services/workload-service";
import { TASK_STATUS_LABELS } from "@/lib/constants/dashboard";

interface Props {
  bottlenecks: Bottleneck[];
  loading?: boolean;
}

const SEVERITY_CONFIG = {
  high: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    icon: 'text-red-500',
  },
  medium: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-700',
    icon: 'text-yellow-500',
  },
  low: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    icon: 'text-blue-500',
  },
};

function getSeverityLabel(severity: Bottleneck["severity"]) {
  switch (severity) {
    case "high":
      return "Cao";
    case "medium":
      return "Trung bình";
    default:
      return "Thấp";
  }
}

export function BottleneckAlerts({ bottlenecks, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-100 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (bottlenecks.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
        <p className="text-green-700 font-medium mb-1">Không phát hiện tắc nghẽn</p>
        <p className="text-sm text-green-600">Tất cả công việc đang diễn ra suôn sẻ</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bottlenecks.map((bottleneck) => {
        const config = SEVERITY_CONFIG[bottleneck.severity];
        
        return (
          <div
            key={bottleneck.assigneeId}
            className={`${config.bg} ${config.border} border rounded-lg p-4 transition-all hover:shadow-md`}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className={`h-5 w-5 ${config.icon} mt-0.5 flex-shrink-0`} />
              
              <div className="flex-1 min-w-0">
                <h4 className={`text-sm font-medium ${config.text} mb-1`}>
                  {bottleneck.assigneeName} có {bottleneck.blockedCount} task bị tắc
                </h4>
                
                <div className="space-y-1 text-xs text-gray-600">
                  <p>
                    <span className="font-medium">Trạng thái:</span>{' '}
                    {TASK_STATUS_LABELS[bottleneck.status] || bottleneck.status}
                  </p>
                  <p>
                    <span className="font-medium">Trung bình:</span>{' '}
                    {bottleneck.avgStuckDays} ngày chưa cập nhật
                  </p>
                </div>

                <Link
                  href={`/my-tasks?assigneeId=${bottleneck.assigneeId}&status=${bottleneck.status}`}
                  className={`inline-flex items-center gap-1 mt-2 text-xs ${config.text} hover:underline`}
                >
                  Xem chi tiết
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>

              {/* Severity badge */}
              <div className={`px-2 py-1 rounded text-xs font-medium ${config.text} ${config.bg} border ${config.border}`}>
                {getSeverityLabel(bottleneck.severity)}
              </div>
            </div>
          </div>
        );
      })}

      {/* Summary */}
      {bottlenecks.length > 0 && (
        <div className="text-xs text-gray-600 text-center pt-2">
          Phát hiện {bottlenecks.length} điểm tắc nghẽn cần xử lý
        </div>
      )}
    </div>
  );
}

