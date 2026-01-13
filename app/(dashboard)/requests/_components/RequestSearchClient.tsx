"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import AdvancedSearchForm, { type Option, type SearchParams } from "@/components/search/advanced-search-form";
import FilterChips from "@/components/search/filter-chips";
import { type RequestSearchParams } from "@/lib/validators/search";
import { executeRequestSearch } from "@/lib/services/search-service";

type Request = {
  id: string;
  title: string;
  status: string;
  priority: string;
  createdAt: Date;
  deadline: Date | null;
  creator: { id: string; name: string | null; email: string };
  category: { id: string; name: string } | null;
  team: { id: string; name: string } | null;
};

type SearchResult = {
  data: Request[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type Props = {
  initialParams: Record<string, string | undefined>;
  categories: Option[];
  users: Option[];
  teams: Option[];
};

export function RequestSearchClient({ initialParams, categories, users, teams }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [results, setResults] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Parse initial params from URL
  const [searchParams, setSearchParams] = useState<Partial<RequestSearchParams>>(() => {
    const parsed: Partial<RequestSearchParams> = {};
    if (initialParams.q) parsed.query = initialParams.q;
    if (initialParams.status) parsed.status = initialParams.status.split(',') as any;
    if (initialParams.priority) parsed.priority = initialParams.priority.split(',') as any;
    if (initialParams.categoryId) parsed.categoryId = initialParams.categoryId.split(',');
    if (initialParams.creatorId) parsed.creatorId = initialParams.creatorId.split(',');
    if (initialParams.teamId) parsed.teamId = initialParams.teamId.split(',');
    if (initialParams.tags) parsed.tags = initialParams.tags.split(',');
    if (initialParams.createdAtFrom) parsed.createdAt = { from: new Date(initialParams.createdAtFrom) };
    if (initialParams.createdAtTo) parsed.createdAt = { ...parsed.createdAt, to: new Date(initialParams.createdAtTo) };
    if (initialParams.deadlineFrom) parsed.deadline = { from: new Date(initialParams.deadlineFrom) };
    if (initialParams.deadlineTo) parsed.deadline = { ...parsed.deadline, to: new Date(initialParams.deadlineTo) };
    if (initialParams.hasOverdue) parsed.hasOverdue = initialParams.hasOverdue === 'true';
    parsed.sortBy = (initialParams.order as any) || 'createdAt';
    parsed.sortOrder = (initialParams.dir as any) || 'desc';
    parsed.page = parseInt(initialParams.page || '1');
    parsed.limit = 10;
    return parsed;
  });

  // Execute search on mount and when params change
  useEffect(() => {
    async function search() {
      setError(null);
      try {
        const result = await executeRequestSearch(searchParams as RequestSearchParams);
        setResults(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
      }
    }
    search();
  }, [searchParams]);

  function handleSearch(params: SearchParams) {
    const newParams = params as RequestSearchParams;
    setSearchParams(newParams);
    
    // Update URL
    startTransition(() => {
      const urlParams = new URLSearchParams();
      if (newParams.query) urlParams.set('q', newParams.query);
      if (newParams.status?.length) urlParams.set('status', newParams.status.join(','));
      if (newParams.priority?.length) urlParams.set('priority', newParams.priority.join(','));
      if (newParams.categoryId?.length) urlParams.set('categoryId', newParams.categoryId.join(','));
      if (newParams.creatorId?.length) urlParams.set('creatorId', newParams.creatorId.join(','));
      if (newParams.teamId?.length) urlParams.set('teamId', newParams.teamId.join(','));
      if (newParams.tags?.length) urlParams.set('tags', newParams.tags.join(','));
      if (newParams.createdAt?.from) urlParams.set('createdAtFrom', newParams.createdAt.from.toISOString());
      if (newParams.createdAt?.to) urlParams.set('createdAtTo', newParams.createdAt.to.toISOString());
      if (newParams.deadline?.from) urlParams.set('deadlineFrom', newParams.deadline.from.toISOString());
      if (newParams.deadline?.to) urlParams.set('deadlineTo', newParams.deadline.to.toISOString());
      if (newParams.hasOverdue) urlParams.set('hasOverdue', 'true');
      if (newParams.sortBy) urlParams.set('order', newParams.sortBy);
      if (newParams.sortOrder) urlParams.set('dir', newParams.sortOrder);
      if (newParams.page && newParams.page > 1) urlParams.set('page', String(newParams.page));
      
      router.push(`${pathname}?${urlParams.toString()}`);
    });
  }

  function handleRemoveFilter(key: string) {
    const updated = { ...searchParams };
    if (key === 'query') delete updated.query;
    else if (key === 'status') delete updated.status;
    else if (key === 'priority') delete updated.priority;
    else if (key === 'categoryId') delete updated.categoryId;
    else if (key === 'creatorId') delete updated.creatorId;
    else if (key === 'teamId') delete updated.teamId;
    else if (key === 'tags') delete updated.tags;
    else if (key === 'createdAt') delete updated.createdAt;
    else if (key === 'deadline') delete updated.deadline;
    else if (key === 'hasOverdue') delete updated.hasOverdue;
    
    setSearchParams(updated);
    handleSearch(updated as SearchParams);
  }

  function handleClearAll() {
    const cleared: Partial<RequestSearchParams> = {
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };
    setSearchParams(cleared);
    handleSearch(cleared as SearchParams);
  }

  async function handleExport() {
    setIsExporting(true);
    try {
      // Fetch all results (no pagination)
      const allResults = await executeRequestSearch({ ...searchParams as RequestSearchParams, page: 1, limit: 1000 });
      
      // Generate CSV
      const headers = ['ID', 'Title', 'Status', 'Priority', 'Creator', 'Category', 'Team', 'Created Date', 'Deadline'];
      const rows = allResults.data.map(r => [
        r.id,
        r.title,
        r.status,
        r.priority,
        r.creator.name || 'N/A',
        r.category?.name || 'N/A',
        r.team?.name || 'N/A',
        new Date(r.createdAt).toLocaleDateString('vi-VN'),
        r.deadline ? new Date(r.deadline).toLocaleDateString('vi-VN') : 'N/A',
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `requests_export_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (err) {
      alert('Export failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsExporting(false);
    }
  }

  function highlightText(text: string, query?: string) {
    if (!query) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? 
            <mark key={i} className="bg-yellow-200">{part}</mark> : 
            <span key={i}>{part}</span>
        )}
      </span>
    );
  }

  return (
    <div className="space-y-4">
      <AdvancedSearchForm 
        entity="request"
        onSearch={handleSearch}
        initialValues={searchParams}
        categories={categories}
        users={users}
        teams={teams}
      />

      <FilterChips 
        filters={searchParams}
        onRemove={handleRemoveFilter}
        onClearAll={handleClearAll}
      />

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-700">
          {results ? (
            <span>Tìm thấy <strong>{results.total}</strong> kết quả</span>
          ) : (
            <span>Đang tìm kiếm...</span>
          )}
        </div>
        <button
          onClick={handleExport}
          disabled={isExporting || !results}
          className="px-3 py-2 border rounded text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          {isExporting ? 'Đang xuất...' : '📥 Xuất kết quả'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          Lỗi: {error}
        </div>
      )}

      {results && results.data.length === 0 && (
        <div className="p-8 text-center bg-gray-50 rounded">
          <p className="text-gray-600">Không tìm thấy kết quả phù hợp</p>
          <p className="text-sm text-gray-500 mt-2">Thử giảm bớt bộ lọc hoặc thay đổi từ khóa</p>
        </div>
      )}

      {results && results.data.length > 0 && (
        <>
          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Title</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Priority</th>
                  <th className="px-4 py-3 text-left font-medium">Creator</th>
                  <th className="px-4 py-3 text-left font-medium">Created</th>
                  <th className="px-4 py-3 text-left font-medium">Deadline</th>
                </tr>
              </thead>
              <tbody>
                {results.data.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <a href={`/requests/${item.id}`} className="text-blue-600 hover:underline">
                        {highlightText(item.title, searchParams.query)}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded text-xs bg-gray-100">{item.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        item.priority === 'URGENT' ? 'bg-red-100 text-red-700' :
                        item.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                        item.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {item.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{item.creator.name || 'N/A'}</td>
                    <td className="px-4 py-3 text-gray-600">{new Date(item.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td className="px-4 py-3 text-gray-600">{item.deadline ? new Date(item.deadline).toLocaleDateString('vi-VN') : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {results.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => handleSearch({ ...searchParams, page: Math.max(1, results.page - 1) } as SearchParams)}
                disabled={results.page === 1 || isPending}
                className="px-3 py-2 border rounded text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                ← Trước
              </button>
              <span className="text-sm text-gray-700">
                Trang {results.page} / {results.totalPages}
              </span>
              <button
                onClick={() => handleSearch({ ...searchParams, page: Math.min(results.totalPages, results.page + 1) } as SearchParams)}
                disabled={results.page === results.totalPages || isPending}
                className="px-3 py-2 border rounded text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Sau →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

