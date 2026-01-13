"use client";

import React, { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { RefreshCw } from "lucide-react";
import type { DashboardFilters } from "@/types/dashboard";

const PERIOD_OPTIONS = [
  { value: 'week', label: 'Tuần này' },
  { value: 'month', label: 'Tháng này' },
  { value: 'quarter', label: 'Quý này' },
  { value: 'year', label: 'Năm này' },
] as const;

interface Props {
  onFilterChange?: (filters: DashboardFilters) => void;
  initialFilters?: Partial<DashboardFilters>;
  teams?: Array<{ id: string; name: string }>;
  currentUserRole?: string;
}

export function DashboardFiltersComponent({ 
  onFilterChange, 
  initialFilters, 
  teams = [],
  currentUserRole 
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  const [filters, setFilters] = useState<DashboardFilters>({
    period: (initialFilters?.period as any) || 'month',
    teamId: initialFilters?.teamId,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  function handlePeriodChange(period: 'week' | 'month' | 'quarter' | 'year') {
    const newFilters = { ...filters, period };
    setFilters(newFilters);
    updateURL(newFilters);
    onFilterChange?.(newFilters);
  }

  function handleTeamChange(teamId: string) {
    const newFilters = { ...filters, teamId: teamId || undefined };
    setFilters(newFilters);
    updateURL(newFilters);
    onFilterChange?.(newFilters);
  }

  function updateURL(newFilters: DashboardFilters) {
    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      params.set('period', newFilters.period);
      if (newFilters.teamId) {
        params.set('teamId', newFilters.teamId);
      } else {
        params.delete('teamId');
      }
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      // Force refresh by updating URL with cache buster
      const params = new URLSearchParams(searchParams);
      params.set('_refresh', Date.now().toString());
      router.refresh();
      await new Promise(resolve => setTimeout(resolve, 500)); // Visual feedback
    } finally {
      setIsRefreshing(false);
    }
  }

  const showTeamFilter = currentUserRole === 'ADMIN' || currentUserRole === 'LEADER';

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Period Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Khoảng thời gian:</span>
          <div className="flex gap-1">
            {PERIOD_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handlePeriodChange(option.value)}
                disabled={isPending}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  filters.period === option.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } disabled:opacity-50`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Team Selector */}
        {showTeamFilter && teams.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Nhóm:</span>
            <select
              value={filters.teamId || ''}
              onChange={(e) => handleTeamChange(e.target.value)}
              disabled={isPending}
              className="px-3 py-1.5 text-sm border rounded-md bg-white disabled:opacity-50"
            >
              <option value="">Tất cả nhóm</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="ml-auto p-2 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50"
          title="Làm mới dữ liệu"
          aria-label="Làm mới dữ liệu"
        >
          <RefreshCw className={`h-5 w-5 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  );
}

