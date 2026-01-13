"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, Filter, X, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface RequestFiltersProps {
  currentStatus?: string;
  currentPriority?: string;
  currentSearch?: string;
  currentOrder: string;
  currentDir: string;
}

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'DONE', label: 'Done' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'ARCHIVED', label: 'Archived' },
];

const PRIORITY_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
];

const ORDER_OPTIONS = [
  { value: 'createdAt', label: 'Created Date' },
  { value: 'deadline', label: 'Deadline' },
];

export function RequestFilters({ 
  currentStatus, 
  currentPriority, 
  currentSearch, 
  currentOrder, 
  currentDir 
}: RequestFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(currentSearch || '');

  function updateUrl(params: Record<string, string | undefined>) {
    const newParams = new URLSearchParams(searchParams);
    
    // Reset page when changing filters
    if (params.status !== undefined || params.priority !== undefined || params.q !== undefined || params.order !== undefined) {
      newParams.delete('page');
    }
    
    // Update params
    Object.entries(params).forEach(([key, value]) => {
      if (value && value !== '') {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });

    const newUrl = `${pathname}?${newParams.toString()}`;
    router.push(newUrl);
  }

  function handleStatusChange(status: string) {
    startTransition(() => {
      updateUrl({ status: status || undefined });
    });
  }

  function handlePriorityChange(priority: string) {
    startTransition(() => {
      updateUrl({ priority: priority || undefined });
    });
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(() => {
      updateUrl({ q: search.trim() || undefined });
    });
  }

  function handleOrderChange(order: string) {
    startTransition(() => {
      updateUrl({ order });
    });
  }

  function handleDirToggle() {
    startTransition(() => {
      updateUrl({ dir: currentDir === 'asc' ? 'desc' : 'asc' });
    });
  }

  function handleClear() {
    startTransition(() => {
      setSearch('');
      router.push(pathname);
    });
  }

  const hasActiveFilters = currentStatus || currentPriority || currentSearch;

  return (
    <div className="space-y-6">
      {/* Search Bar - Top Section */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm yêu cầu..."
              className="pl-10 h-10 rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500"
              disabled={isPending}
            />
          </div>
          <Button
            type="submit"
            disabled={isPending}
            className="h-10 px-6 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-sm"
          >
            <Search className="h-4 w-4 mr-2" />
            Tìm kiếm
          </Button>
        </form>

        <div className="flex items-center gap-2">
          <Select value={currentOrder} onValueChange={handleOrderChange} disabled={isPending}>
            <SelectTrigger className="w-[180px] h-10 rounded-lg border-gray-300">
              <SelectValue placeholder="Sắp xếp theo" />
            </SelectTrigger>
            <SelectContent>
              {ORDER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="icon"
            onClick={handleDirToggle}
            disabled={isPending}
            className="h-10 w-10 rounded-lg border-gray-300"
          >
            {currentDir === 'asc' ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )}
          </Button>

          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={isPending}
              className="h-10 px-4 rounded-lg border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <X className="h-4 w-4 mr-2" />
              Xóa bộ lọc
            </Button>
          )}
        </div>
      </div>

      {/* Filter Chips Section */}
      <div className="space-y-4">
        {/* Status Filter */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-700">Trạng thái:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((option) => {
              const isActive = currentStatus === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => handleStatusChange(option.value)}
                  disabled={isPending}
                  className={`
                    px-4 py-2 text-sm font-medium rounded-lg border transition-all
                    ${isActive
                      ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                    }
                    ${isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Priority Filter */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-700">Độ ưu tiên:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {PRIORITY_OPTIONS.map((option) => {
              const isActive = currentPriority === option.value;
              const priorityColors = {
                '': { active: 'bg-gray-600', inactive: 'bg-white' },
                'LOW': { active: 'bg-green-600', inactive: 'bg-white' },
                'MEDIUM': { active: 'bg-yellow-600', inactive: 'bg-white' },
                'HIGH': { active: 'bg-orange-600', inactive: 'bg-white' },
                'URGENT': { active: 'bg-red-600', inactive: 'bg-white' },
              };
              const colors = priorityColors[option.value as keyof typeof priorityColors] || priorityColors[''];
              
              return (
                <button
                  key={option.value}
                  onClick={() => handlePriorityChange(option.value)}
                  disabled={isPending}
                  className={`
                    px-4 py-2 text-sm font-medium rounded-lg border transition-all
                    ${isActive
                      ? `${colors.active} text-white border-transparent shadow-sm`
                      : `${colors.inactive} text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400`
                    }
                    ${isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active Filters Badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-gray-200">
          <span className="text-xs font-medium text-gray-500">Bộ lọc đang áp dụng:</span>
          {currentStatus && (
            <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
              <span>Trạng thái: {STATUS_OPTIONS.find(o => o.value === currentStatus)?.label}</span>
              <button
                onClick={() => handleStatusChange('')}
                className="ml-1 hover:text-red-600 transition-colors"
                disabled={isPending}
                type="button"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {currentPriority && (
            <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
              <span>Ưu tiên: {PRIORITY_OPTIONS.find(o => o.value === currentPriority)?.label}</span>
              <button
                onClick={() => handlePriorityChange('')}
                className="ml-1 hover:text-red-600 transition-colors"
                disabled={isPending}
                type="button"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {currentSearch && (
            <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
              <span>Tìm kiếm: "{currentSearch}"</span>
              <button
                onClick={() => {
                  setSearch('');
                  updateUrl({ q: undefined });
                }}
                className="ml-1 hover:text-red-600 transition-colors"
                disabled={isPending}
                type="button"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
