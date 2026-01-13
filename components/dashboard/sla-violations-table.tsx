"use client";

import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Download, ArrowUpDown } from "lucide-react";
import type { SLAViolation, SLASeverity } from "@/lib/services/sla-analysis-service";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface Props {
  violations: SLAViolation[];
  onViewDetails?: (id: string, type: 'REQUEST' | 'TASK') => void;
  loading?: boolean;
}

type SortField = 'severity' | 'delay' | 'deadline' | 'title';
type SortOrder = 'asc' | 'desc';

const SEVERITY_CONFIG = {
  critical: { label: 'Nghiêm trọng', emoji: '🔴', color: 'bg-red-100 text-red-800 border-red-200' },
  high: { label: 'Cao', emoji: '🟠', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  medium: { label: 'Trung bình', emoji: '🟡', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
};

export function SLAViolationsTable({ violations, onViewDetails, loading }: Props) {
  const [sortField, setSortField] = useState<SortField>('severity');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Sorting
  const sortedViolations = useMemo(() => {
    const sorted = [...violations];
    
    sorted.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'severity':
          const severityOrder = { critical: 0, high: 1, medium: 2 };
          comparison = severityOrder[a.severity] - severityOrder[b.severity];
          break;
        case 'delay':
          comparison = a.delayHours - b.delayHours;
          break;
        case 'deadline':
          comparison = a.slaDeadline.getTime() - b.slaDeadline.getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title, 'vi');
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  }, [violations, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(sortedViolations.length / itemsPerPage);
  const paginatedViolations = sortedViolations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const exportToCSV = () => {
    const headers = ['Độ nghiêm trọng', 'Tiêu đề', 'Loại', 'Độ ưu tiên', 'Deadline', 'Trễ (giờ)', 'Người xử lý', 'Trạng thái'];
    const rows = violations.map(v => [
      SEVERITY_CONFIG[v.severity].label,
      v.title,
      v.type,
      v.priority,
      format(v.slaDeadline, 'dd/MM/yyyy HH:mm', { locale: vi }),
      v.delayHours.toString(),
      v.assignee || 'N/A',
      v.status,
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sla-violations-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (violations.length === 0) {
    return (
      <div className="text-center py-12 bg-green-50 rounded-lg border border-green-200">
        <p className="text-green-700 font-medium mb-1">✅ Không có vi phạm SLA</p>
        <p className="text-sm text-green-600">Tất cả yêu cầu đều đúng hạn</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          <span className="font-medium">{violations.length}</span> vi phạm
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={exportToCSV}
        >
          <Download className="h-4 w-4 mr-2" />
          Xuất CSV
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-[140px]">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('severity')}
                  className="h-8 px-2"
                >
                  Độ nghiêm trọng
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('title')}
                  className="h-8 px-2"
                >
                  Tiêu đề
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="w-[100px]">Loại</TableHead>
              <TableHead className="w-[100px]">Độ ưu tiên</TableHead>
              <TableHead className="w-[150px]">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('deadline')}
                  className="h-8 px-2"
                >
                  Deadline
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="w-[100px]">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('delay')}
                  className="h-8 px-2"
                >
                  Trễ
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="w-[150px]">Người xử lý</TableHead>
              <TableHead className="w-[100px]">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedViolations.map((violation) => {
              const severityConfig = SEVERITY_CONFIG[violation.severity];
              
              return (
                <TableRow key={`${violation.type}-${violation.id}`}>
                  <TableCell>
                    <Badge variant="outline" className={severityConfig.color}>
                      {severityConfig.emoji} {severityConfig.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {violation.title}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {violation.type === 'REQUEST' ? '📝 Request' : '✅ Task'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        violation.priority === 'URGENT' ? 'border-red-500 text-red-700' :
                        violation.priority === 'HIGH' ? 'border-orange-500 text-orange-700' :
                        'border-gray-300 text-gray-700'
                      }
                    >
                      {violation.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {format(violation.slaDeadline, 'dd/MM/yyyy HH:mm', { locale: vi })}
                  </TableCell>
                  <TableCell className="font-bold text-red-600">
                    +{violation.delayHours}h
                  </TableCell>
                  <TableCell className="text-sm">
                    {violation.assignee || <span className="text-gray-400">Chưa gán</span>}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails?.(violation.id, violation.type)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <div className="text-sm text-gray-600">
            Trang {currentPage} / {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Sau
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

