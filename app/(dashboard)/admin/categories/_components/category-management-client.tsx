"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CategoryCard } from "@/components/admin/category-card";
import { CategoryDialog } from "@/components/admin/category-dialog";
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

interface Team {
  id: string;
  name: string;
}

interface Props {
  categories: Category[];
  teams: Team[];
}

export function CategoryManagementClient({ categories, teams }: Props) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>();

  const handleCreateCategory = () => {
    setDialogMode("create");
    setSelectedCategory(undefined);
    setDialogOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setDialogMode("edit");
    setSelectedCategory(category);
    setDialogOpen(true);
  };

  const activeCategories = categories.filter((c) => c.isActive);
  const inactiveCategories = categories.filter((c) => !c.isActive);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Category Management</h1>
          <p className="text-gray-600 mt-1">Quản lý phân loại yêu cầu</p>
        </div>
        <Button onClick={handleCreateCategory}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm phân loại
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-600">Tổng phân loại</p>
          <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700">Đang hoạt động</p>
          <p className="text-2xl font-bold text-green-900">{activeCategories.length}</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">Đã vô hiệu hóa</p>
          <p className="text-2xl font-bold text-gray-900">{inactiveCategories.length}</p>
        </div>
      </div>

      {/* Active Categories Grid */}
      {activeCategories.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Phân loại đang hoạt động</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeCategories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onEdit={handleEditCategory}
              />
            ))}
          </div>
        </div>
      )}

      {/* Inactive Categories (if any) */}
      {inactiveCategories.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-500 mb-4">Đã vô hiệu hóa</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 opacity-60">
            {inactiveCategories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onEdit={handleEditCategory}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {categories.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border">
          <p className="text-gray-600 mb-4">Chưa có phân loại nào</p>
          <Button onClick={handleCreateCategory}>
            <Plus className="mr-2 h-4 w-4" />
            Tạo phân loại đầu tiên
          </Button>
        </div>
      )}

      {/* Category form dialog */}
      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        category={selectedCategory}
        teams={teams}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}

