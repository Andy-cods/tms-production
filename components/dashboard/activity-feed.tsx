"use client";

import React, { useState, useEffect } from "react";
import { 
  FilePlus, 
  CheckCircle2, 
  UserPlus, 
  MessageCircle,
  RefreshCw,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Activity } from "@/lib/services/activity-service";
import { formatActivityText } from "@/lib/services/activity-service";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useRouter } from "next/navigation";

interface Props {
  activities: Activity[];
  autoRefresh?: boolean;
  limit?: number;
  onLoadMore?: () => void;
  loading?: boolean;
}

const ACTION_ICONS: Record<string, React.ElementType> = {
  REQUEST_CREATED: FilePlus,
  REQUEST_UPDATED: Edit,
  REQUEST_COMPLETED: CheckCircle2,
  TASK_ASSIGNED: UserPlus,
  TASK_COMPLETED: CheckCircle2,
  COMMENT_ADDED: MessageCircle,
  STATUS_CHANGED: RefreshCw,
};

const ACTION_COLORS: Record<string, string> = {
  REQUEST_CREATED: 'text-blue-500 bg-blue-50',
  REQUEST_UPDATED: 'text-gray-500 bg-gray-50',
  REQUEST_COMPLETED: 'text-green-500 bg-green-50',
  TASK_ASSIGNED: 'text-purple-500 bg-purple-50',
  TASK_COMPLETED: 'text-green-500 bg-green-50',
  COMMENT_ADDED: 'text-orange-500 bg-orange-50',
  STATUS_CHANGED: 'text-amber-500 bg-amber-50',
};

export function ActivityFeed({ 
  activities, 
  autoRefresh = false, 
  limit = 10,
  onLoadMore,
  loading 
}: Props) {
  const router = useRouter();
  const [displayCount, setDisplayCount] = useState(limit);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setLastUpdate(new Date());
      router.refresh();
    }, 30 * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, router]);

  const handleActivityClick = (activity: Activity) => {
    const { entity } = activity;
    if (!entity.id) return;

    if (entity.type === 'REQUEST') {
      router.push(`/requests/${entity.id}`);
    } else if (entity.type === 'TASK') {
      router.push(`/my-tasks?taskId=${entity.id}`);
    }
  };

  const displayedActivities = activities.slice(0, displayCount);
  const hasMore = activities.length > displayCount;

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
              <div className="h-3 bg-gray-100 rounded w-1/4 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Chưa có hoạt động nào</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Timeline */}
      <div className="relative space-y-3">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200"></div>

        {displayedActivities.map((activity, index) => {
          const Icon = ACTION_ICONS[activity.type] || FilePlus;
          const colorClasses = ACTION_COLORS[activity.type] || 'text-gray-500 bg-gray-50';
          const text = formatActivityText(activity);

          return (
            <div 
              key={`${activity.id}-${index}`}
              className="relative flex items-start gap-3 group animate-fadeIn"
            >
              {/* Icon */}
              <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${colorClasses}`}>
                <Icon className="h-4 w-4" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <button
                  onClick={() => handleActivityClick(activity)}
                  className="text-left hover:text-primary transition-colors"
                >
                  <p className="text-sm text-gray-900 group-hover:text-primary">
                    {text}
                  </p>
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDistanceToNow(activity.timestamp, { 
                    locale: vi, 
                    addSuffix: true 
                  })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Load more button */}
      {hasMore && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => {
            if (onLoadMore) {
              onLoadMore();
            } else {
              setDisplayCount(prev => prev + limit);
            }
          }}
        >
          Xem thêm
        </Button>
      )}

      {/* Auto-refresh indicator */}
      {autoRefresh && (
        <div className="text-center text-xs text-gray-500">
          Cập nhật {formatDistanceToNow(lastUpdate, { locale: vi, addSuffix: true })}
        </div>
      )}
    </div>
  );
}

