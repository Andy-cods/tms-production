"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, Clock, TrendingUp, Filter } from "lucide-react";
import { EscalationCard } from "@/components/escalations/escalation-card";
import { useToast } from "@/hooks/use-toast";
import {
  acknowledgeEscalationAction,
  resolveEscalationAction,
  reassignEscalationAction,
} from "@/actions/escalation";

/**
 * Escalation Dashboard Client Component
 * 
 * Interactive dashboard for managing escalations.
 * Features real-time polling, filters, and quick actions.
 * 
 * References: mindmap L1, L1C
 */

interface EscalationData {
  id: string;
  reason: string;
  status: "PENDING" | "ACKNOWLEDGED" | "RESOLVED";
  createdAt: string;
  resolvedAt: string | null;
  rule: {
    name: string;
    triggerType: string;
  };
  recipient: {
    name: string;
    email: string;
    role: string;
  };
  entity: {
    type: "REQUEST" | "TASK";
    id: string;
    title: string;
    status: string;
    priority?: string;
    assigneeName?: string;
  };
}

interface Stats {
  total: number;
  pending: number;
  acknowledged: number;
  avgResolutionMinutes: number;
  mostCommonTrigger: string;
}

interface FilterUser {
  id: string;
  name: string | null;
  role: string;
}

interface EscalationDashboardClientProps {
  escalations: EscalationData[];
  stats: Stats;
  filterUsers: FilterUser[];
  currentUserId: string;
  userRole: string;
}

export function EscalationDashboardClient({
  escalations: initialEscalations,
  stats: initialStats,
  filterUsers,
  currentUserId,
  userRole,
}: EscalationDashboardClientProps) {
  const router = useRouter();
  const toast = useToast();

  const [filters, setFilters] = useState({
    status: "all",
    triggerType: "all",
    assignedTo: "all",
  });

  // Real-time polling (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [router]);

  // Filter escalations
  const filteredEscalations = initialEscalations.filter((esc) => {
    if (filters.status !== "all" && esc.status !== filters.status) {
      return false;
    }
    if (
      filters.triggerType !== "all" &&
      esc.rule.triggerType !== filters.triggerType
    ) {
      return false;
    }
    if (
      filters.assignedTo !== "all" &&
      esc.recipient.name !== filters.assignedTo
    ) {
      return false;
    }
    return true;
  });

  // Get age color
  const getAgeColor = (createdAt: string): string => {
    const now = new Date();
    const created = new Date(createdAt);
    const hours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);

    if (hours < 1) return "text-blue-600 bg-blue-50";
    if (hours < 4) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  // Format avg resolution time
  const formatResolutionTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Get trigger type label
  const getTriggerLabel = (type: string): string => {
    const labels: Record<string, string> = {
      NO_CONFIRMATION: "Chưa xác nhận",
      CLARIFICATION_TIMEOUT: "Timeout làm rõ",
      SLA_OVERDUE: "Quá hạn SLA",
      STUCK_TASK: "Task bị stuck",
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Escalations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold text-gray-900">
                {initialStats.total}
              </div>
              <AlertTriangle className="w-5 h-5 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending Acknowledgment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold text-red-600">
                {initialStats.pending}
              </div>
              <Clock className="w-5 h-5 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Avg Resolution Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold text-gray-900">
                {formatResolutionTime(initialStats.avgResolutionMinutes)}
              </div>
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Most Common Trigger
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-lg font-bold text-gray-900">
                {getTriggerLabel(initialStats.mostCommonTrigger)}
              </div>
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Lọc Escalations
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setFilters({ status: "all", triggerType: "all", assignedTo: "all" })
              }
            >
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select
                value={filters.status}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="ACKNOWLEDGED">Acknowledged</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Trigger Type Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Trigger Type
              </label>
              <Select
                value={filters.triggerType}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, triggerType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="NO_CONFIRMATION">Chưa xác nhận</SelectItem>
                  <SelectItem value="CLARIFICATION_TIMEOUT">
                    Timeout làm rõ
                  </SelectItem>
                  <SelectItem value="SLA_OVERDUE">Quá hạn SLA</SelectItem>
                  <SelectItem value="STUCK_TASK">Task bị stuck</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Assigned To Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Assigned To
              </label>
              <Select
                value={filters.assignedTo}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, assignedTo: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {filterUsers.map((user) => (
                    <SelectItem key={user.id} value={user.name || user.id}>
                      {user.name || user.id} ({user.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Escalations List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Escalations ({filteredEscalations.length})
            </CardTitle>
            <div className="text-sm text-gray-600">
              Tự động cập nhật mỗi 30 giây
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredEscalations.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
              <h3 className="text-lg font-semibold mb-2">
                Tuyệt vời! Không có escalation nào
              </h3>
              <p className="text-gray-600">
                Tất cả tasks và requests đang được xử lý tốt.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEscalations.map((escalation) => (
                <EscalationCard
                  key={escalation.id}
                  escalation={escalation}
                  getAgeColor={getAgeColor}
                  getTriggerLabel={getTriggerLabel}
                  currentUserId={currentUserId}
                  userRole={userRole}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

