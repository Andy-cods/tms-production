"use client";

import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { 
  MoreVertical, 
  Pencil, 
  Eye, 
  EyeOff, 
  Trash2, 
  FileText,
  Users,
} from "lucide-react";
import { toggleCategoryStatus, deleteCategory } from "@/actions/admin/categories";
import { useRouter } from "next/navigation";

interface Category {
  id: string;
  name: string;
  description: string | null;
  teamId: string | null;
  team?: { id: string; name: string } | null;
  isActive: boolean;
  _count: {
    requests: number;
  };
}

interface Props {
  category: Category;
  onEdit: (category: Category) => void;
}

export function CategoryCard({ category, onEdit }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (
      !category.isActive ||
      confirm(`${category.isActive ? "Vô hiệu hóa" : "Kích hoạt"} phân loại "${category.name}"?`)
    ) {
      try {
        setLoading(true);
        await toggleCategoryStatus(category.id);
        router.refresh();
      } catch (error) {
        alert(error instanceof Error ? error.message : "Có lỗi xảy ra");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDelete = async () => {
    if (!confirm(`XÓA phân loại "${category.name}"? Hành động này không thể hoàn tác!`)) {
      return;
    }

    try {
      setLoading(true);
      await deleteCategory(category.id);
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="relative hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-blue-500 border border-gray-200" />
            <CardTitle className="text-lg">{category.name}</CardTitle>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" disabled={loading}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(category)}>
                <Pencil className="mr-2 h-4 w-4" />
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggle}>
                {category.isActive ? (
                  <>
                    <EyeOff className="mr-2 h-4 w-4" />
                    Vô hiệu hóa
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Kích hoạt
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Xóa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-gray-600 mb-4 min-h-[40px]">
          {category.description || <span className="text-gray-400 italic">Không có mô tả</span>}
        </p>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <FileText className="h-4 w-4 text-gray-500" />
              <span>{category._count.requests} yêu cầu</span>
            </div>

            <Badge
              variant="outline"
              className={
                category.isActive
                  ? "bg-green-100 text-green-800 border-green-200"
                  : "bg-gray-100 text-gray-600 border-gray-200"
              }
            >
              {category.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>

          {category.team && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="h-4 w-4 text-gray-500" />
              <span>{category.team.name}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

