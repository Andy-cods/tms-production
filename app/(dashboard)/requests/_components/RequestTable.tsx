"use client"

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition, useState } from "react";
import { MoreVertical, Eye, Edit, Trash2, Inbox } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge, PriorityBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteRequestModal } from "@/components/requests/delete-request-modal";
import { CategoryBadge } from "@/components/categories/category-badge";
import { CustomFieldSummary } from "@/components/requests/custom-field-summary";

interface RequestItem {
  id: string;
  title: string;
  priority: string;
  status: string;
  createdAt: Date;
  deadline: Date | null;
  category: {
    id: string;
    name: string;
    icon?: string | null;
    parent?: {
      name: string;
      icon?: string | null;
    } | null;
  } | null;
  creator?: { name: string | null } | null;
  customFieldValues?: Array<{
    field: {
      label: string;
      type: string;
    };
    value: any;
  }>;
}

interface RequestTableProps {
  items: RequestItem[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  searchQuery?: string;
}

export function RequestTable({ items, currentPage, totalPages, totalItems, searchQuery }: RequestTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string>('');
  const [selectedRequestTitle, setSelectedRequestTitle] = useState<string>('');

  function highlightText(text: string) {
    if (!searchQuery) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === searchQuery.toLowerCase() ? 
            <mark key={`highlight-${i}`} className="bg-yellow-200">{part}</mark> : 
            <span key={`text-${i}`}>{part}</span>
        )}
      </span>
    );
  }

  const handleDelete = (requestId: string, requestTitle: string) => {
    setSelectedRequestId(requestId);
    setSelectedRequestTitle(requestTitle);
    setIsDeleteModalOpen(true);
  };

  function handlePageChange(page: number) {
    startTransition(() => {
      const newParams = new URLSearchParams(searchParams);
      if (page === 1) {
        newParams.delete('page');
      } else {
        newParams.set('page', page.toString());
      }
      const newUrl = `${pathname}?${newParams.toString()}`;
      router.push(newUrl);
    });
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'OPEN': return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
      case 'IN_REVIEW': return 'bg-purple-100 text-purple-800';
      case 'DONE': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  function getPriorityColor(priority: string) {
    switch (priority) {
      case 'LOW': return 'bg-gray-100 text-gray-800';
      case 'MEDIUM': return 'bg-blue-100 text-blue-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'URGENT': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  function formatDate(date: Date) {
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  function isOverdue(deadline: Date | null) {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="p-4 rounded-full bg-gray-100 mb-4">
            <Inbox className="h-16 w-16 text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold text-dark-900 mb-2">
            Chưa có yêu cầu nào
          </h3>
          <p className="text-gray-600 mb-6 max-w-md">
            {searchQuery || totalItems > 0
              ? "Không tìm thấy yêu cầu phù hợp với bộ lọc hiện tại."
              : "Bắt đầu bằng cách tạo yêu cầu đầu tiên của bạn."}
          </p>
          <Link href="/requests/new">
            <Button>Tạo yêu cầu đầu tiên</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table with horizontal scroll for long titles */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">STT</TableHead>
              <TableHead className="min-w-[300px] max-w-[500px]">Tiêu đề</TableHead>
              <TableHead>Phân loại</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Độ ưu tiên</TableHead>
              <TableHead>Người tạo</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={item.id}>
                <TableCell>
                  <span className="font-mono text-sm text-gray-500">
                    {index + 1 + (currentPage - 1) * 10}
                  </span>
                </TableCell>
                <TableCell className="min-w-[300px] max-w-[500px]">
                  <div className="space-y-1">
                    <Link
                      href={`/requests/${item.id}`}
                      className="font-medium text-dark-900 hover:text-primary-600 transition-colors break-words"
                      title={item.title}
                    >
                      {highlightText(item.title)}
                    </Link>
                    {item.customFieldValues && item.customFieldValues.length > 0 && (
                      <CustomFieldSummary
                        fields={item.customFieldValues}
                        maxDisplay={2}
                      />
                    )}
                  </div>
                </TableCell>
              <TableCell>
                {item.category ? (
                  <CategoryBadge
                    category={{
                      id: item.category.id,
                      name: item.category.name,
                      icon: (item.category.icon ?? null),
                      parent: item.category.parent ? { name: item.category.parent.name, icon: (item.category.parent.icon ?? null) } : undefined,
                    }}
                    showBreadcrumb
                  />
                ) : (
                  <span className="text-sm text-gray-400 italic">Chưa phân loại</span>
                )}
              </TableCell>
              <TableCell>
                <StatusBadge status={item.status as any} />
              </TableCell>
              <TableCell>
                <PriorityBadge priority={item.priority as any} />
              </TableCell>
              <TableCell>
                <span className="text-gray-600">
                  {item.creator?.name || "-"}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-gray-600">{formatDate(item.createdAt)}</span>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="hover:bg-gray-100">
                      <MoreVertical className="h-4 w-4 text-gray-600" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/requests/${item.id}`} className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Xem chi tiết
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/requests/${item.id}/edit`} className="flex items-center gap-2">
                        <Edit className="h-4 w-4" />
                        Chỉnh sửa
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="flex items-center gap-2 text-red-600"
                      onClick={() => handleDelete(item.id, item.title)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Xóa
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-gray-600">
            Hiển thị <span className="font-medium">{((currentPage - 1) * 10) + 1}</span> - <span className="font-medium">{Math.min(currentPage * 10, totalItems)}</span> trong tổng số <span className="font-medium">{totalItems}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || isPending}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Trước
            </Button>
            
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                if (pageNum > totalPages) return null;
                
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    disabled={isPending}
                    className={
                      pageNum === currentPage 
                        ? "min-w-[2.5rem] bg-primary-500 hover:bg-primary-600 text-white" 
                        : "min-w-[2.5rem] border-gray-300 text-gray-700 hover:bg-gray-50"
                    }
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || isPending}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Sau
            </Button>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <DeleteRequestModal
        requestId={selectedRequestId}
        requestTitle={selectedRequestTitle}
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        redirectAfterDelete={false}
      />
    </div>
  );
}
