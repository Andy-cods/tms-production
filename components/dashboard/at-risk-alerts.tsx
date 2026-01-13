"use client";

import React, { useState, useEffect } from "react";
import { Clock, Eye, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { AtRiskRequest } from "@/lib/services/sla-analysis-service";
import { format, formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface Props {
  atRiskItems: AtRiskRequest[];
  autoRefresh?: boolean;
  onViewDetails?: (id: string, type: 'REQUEST' | 'TASK') => void;
  onRemind?: (id: string, type: 'REQUEST' | 'TASK') => void;
  loading?: boolean;
}

export function AtRiskAlerts({ 
  atRiskItems, 
  autoRefresh = false, 
  onViewDetails,
  onRemind,
  loading 
}: Props) {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [, setTick] = useState(0);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 2 * 60 * 1000); // 2 minutes

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Update countdown every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 60 * 1000); // 1 minute

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (atRiskItems.length === 0) {
    return (
      <div className="text-center py-12 bg-green-50 rounded-lg border border-green-200">
        <p className="text-green-700 font-medium mb-1">✅ Không có yêu cầu at-risk</p>
        <p className="text-sm text-green-600">Tất cả đang trong tầm kiểm soát</p>
      </div>
    );
  }

  const getColorByPercent = (percent: number) => {
    if (percent < 10) return {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      icon: 'text-red-500',
      progress: 'bg-red-500',
    };
    if (percent < 20) return {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-700',
      icon: 'text-orange-500',
      progress: 'bg-orange-500',
    };
    return {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-700',
      icon: 'text-yellow-500',
      progress: 'bg-yellow-500',
    };
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between text-xs text-gray-600">
        <span className="font-medium">
          {atRiskItems.length} yêu cầu cần chú ý
        </span>
        {autoRefresh && (
          <span>
            Cập nhật {formatDistanceToNow(lastUpdate, { locale: vi, addSuffix: true })}
          </span>
        )}
      </div>

      {/* Alert cards */}
      <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
        {atRiskItems.map((item) => {
          const colors = getColorByPercent(item.percentRemaining);
          
          return (
            <div
              key={`${item.type}-${item.id}`}
              className={`border ${colors.border} ${colors.bg} rounded-lg p-3 space-y-2`}
            >
              {/* Header */}
              <div className="flex items-start gap-2">
                <Clock className={`h-5 w-5 ${colors.icon} flex-shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm font-medium ${colors.text} truncate`}>
                    {item.title}
                  </h4>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {item.type === 'REQUEST' ? '📝 Request' : '✅ Task'} • {item.priority}
                  </p>
                </div>
              </div>

              {/* Time remaining */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-medium ${colors.text}`}>
                    ⏰ Còn {item.hoursRemaining.toFixed(1)}h ({item.percentRemaining.toFixed(0)}%)
                  </span>
                  <span className="text-gray-600">
                    {format(item.deadline, 'dd/MM HH:mm', { locale: vi })}
                  </span>
                </div>
                <Progress 
                  value={item.percentRemaining} 
                  className="h-2"
                  indicatorClassName={colors.progress}
                />
              </div>

              {/* Assignee */}
              {item.assignee && (
                <div className="text-xs text-gray-600">
                  👤 {item.assignee}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs h-7"
                  onClick={() => onViewDetails?.(item.id, item.type)}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Xem
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs h-7"
                  onClick={() => onRemind?.(item.id, item.type)}
                >
                  <Bell className="h-3 w-3 mr-1" />
                  Nhắc nhở
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

