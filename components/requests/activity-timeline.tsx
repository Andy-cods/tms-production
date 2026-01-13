"use client";

import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { 
  Plus, 
  UserPlus, 
  RefreshCw, 
  MessageSquare, 
  CheckCircle, 
  Activity,
  FileText,
  Edit,
  Trash2,
  Archive,
  Clock
} from "lucide-react";

interface ActivityItem {
  id: string;
  type: "created" | "assigned" | "status_changed" | "commented" | "completed" | "edited" | "deleted" | "archived" | "deadline_changed";
  description: string;
  createdAt: string;
  user?: {
    name: string;
    avatar?: string;
  };
  metadata?: {
    oldValue?: string;
    newValue?: string;
    target?: string;
  };
}

interface ActivityTimelineProps {
  requestId: string;
  activities?: ActivityItem[];
  isLoading?: boolean;
}

export function ActivityTimeline({ 
  requestId, 
  activities = [], 
  isLoading = false 
}: ActivityTimelineProps) {
  if (isLoading) {
    return <ActivitySkeleton />;
  }

  if (!activities.length) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-sm font-semibold text-gray-600 uppercase mb-4">
          Lịch sử
        </h2>
        <div className="text-center py-8 text-gray-500">
          <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Chưa có hoạt động nào</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
      <h2 className="text-sm font-semibold text-gray-600 uppercase mb-4">
        Lịch sử
      </h2>

      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div key={activity.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center
                ${getActivityColor(activity.type)}
              `}>
                {getActivityIcon(activity.type)}
              </div>
              {index < activities.length - 1 && (
                <div className="w-0.5 flex-1 bg-gray-200 my-1" />
              )}
            </div>

            <div className="flex-1 pb-4">
              <p className="text-sm text-gray-900 font-medium leading-relaxed">
                {activity.description}
              </p>
              {activity.metadata && (
                <div className="mt-1 text-xs text-gray-500">
                  {activity.metadata.oldValue && activity.metadata.newValue && (
                    <span>
                      {activity.metadata.oldValue} → {activity.metadata.newValue}
                    </span>
                  )}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {format(new Date(activity.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getActivityIcon(type: string) {
  const icons = {
    created: <Plus className="w-4 h-4 text-green-600" />,
    assigned: <UserPlus className="w-4 h-4 text-blue-600" />,
    status_changed: <RefreshCw className="w-4 h-4 text-orange-600" />,
    commented: <MessageSquare className="w-4 h-4 text-purple-600" />,
    completed: <CheckCircle className="w-4 h-4 text-green-600" />,
    edited: <Edit className="w-4 h-4 text-blue-600" />,
    deleted: <Trash2 className="w-4 h-4 text-red-600" />,
    archived: <Archive className="w-4 h-4 text-gray-600" />,
    deadline_changed: <Clock className="w-4 h-4 text-yellow-600" />,
  };
  return icons[type as keyof typeof icons] || <Activity className="w-4 h-4 text-gray-600" />;
}

function getActivityColor(type: string) {
  const colors = {
    created: 'bg-green-100',
    assigned: 'bg-blue-100',
    status_changed: 'bg-orange-100',
    commented: 'bg-purple-100',
    completed: 'bg-green-100',
    edited: 'bg-blue-100',
    deleted: 'bg-red-100',
    archived: 'bg-gray-100',
    deadline_changed: 'bg-yellow-100',
  };
  return colors[type as keyof typeof colors] || 'bg-gray-100';
}

function ActivitySkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
      <div className="h-5 w-16 bg-gray-200 rounded mb-4"></div>
      
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            <div className="flex-1 pb-4">
              <div className="h-4 w-full bg-gray-200 rounded mb-1"></div>
              <div className="h-3 w-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}