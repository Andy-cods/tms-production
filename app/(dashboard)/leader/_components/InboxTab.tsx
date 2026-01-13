"use client";

import Link from "next/link";
import { Clock, User, Tag, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PriorityBadge } from "@/components/ui/status-badge";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface InboxRequest {
  id: string;
  title: string;
  priority: string;
  createdAt: Date;
  description?: string;
  creator: { name: string | null } | null;
  category?: { name: string } | null;
}

interface InboxTabProps {
  requests: InboxRequest[];
}

export function InboxTab({ requests }: InboxTabProps) {
  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
        <div className="flex flex-col items-center">
          <div className="p-4 rounded-full bg-gray-100 mb-4">
            <Clock className="h-16 w-16 text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold text-dark-900 mb-2">
            Inbox trống
          </h3>
          <p className="text-gray-600">
            Không có yêu cầu nào cần xử lý
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <div
          key={request.id}
          className="bg-white rounded-xl p-6 border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all"
        >
          <div className="flex items-start justify-between gap-4">
            {/* Left: Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <Link
                  href={`/requests/${request.id}`}
                  className="text-lg font-semibold text-gray-900 hover:text-primary-600 transition-colors"
                >
                  {request.title}
                </Link>
                <PriorityBadge priority={request.priority as any} />
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {request.creator?.name || "Không rõ"}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatDistanceToNow(new Date(request.createdAt), {
                    addSuffix: true,
                    locale: vi,
                  })}
                </span>
                {request.category && (
                  <span className="flex items-center gap-1">
                    <Tag className="w-4 h-4" />
                    {request.category.name}
                  </span>
                )}
              </div>

              {request.description && (
                <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                  {request.description}
                </p>
              )}
            </div>

            {/* Right: Actions */}
            <div className="flex flex-col gap-2 flex-shrink-0">
              <Button size="sm" className="relative z-50">
                <UserPlus className="w-4 h-4 mr-1" />
                Phân công
              </Button>
              <Link href={`/requests/${request.id}`}>
                <Button variant="outline" size="sm" className="relative z-50 w-full">
                  Chi tiết
                </Button>
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

