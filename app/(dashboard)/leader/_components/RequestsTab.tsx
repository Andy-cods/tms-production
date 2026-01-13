"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

interface RequestsTabProps {
  teamId: string | null;
}

export function RequestsTab({ teamId }: RequestsTabProps) {
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {selectedRequests.length > 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 flex items-center justify-between">
          <p className="text-sm font-medium text-primary-900">
            Đã chọn {selectedRequests.length} yêu cầu
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm">
              <UserPlus className="h-4 w-4" />
              Phân công đã chọn
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedRequests([])}
            >
              Bỏ chọn
            </Button>
          </div>
        </div>
      )}

      {/* Placeholder for table */}
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
        <p className="text-gray-600">
          Bảng yêu cầu - Coming soon
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Sử dụng trang <Link href="/requests" className="text-primary-600 underline">Yêu cầu</Link> để xem tất cả yêu cầu
        </p>
      </div>
    </div>
  );
}

function Link({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

