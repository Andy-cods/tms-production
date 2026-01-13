"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, RefreshCw } from "lucide-react";
import { CategoryTreeView } from "@/components/admin/category-tree-view";
import { CategoryFormDialog } from "@/components/admin/category-form-dialog";
import { deleteCategory } from "@/actions/category";
import { updateCategoryStats } from "@/actions/deadline";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface AdminCategoriesClientProps {
  categories: any[];
  teams: any[];
  allCategories: any[];
}

export function AdminCategoriesClient({
  categories,
  teams,
  allCategories,
}: AdminCategoriesClientProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [defaultParentId, setDefaultParentId] = useState<string | undefined>();
  const [updatingStats, setUpdatingStats] = useState(false);

  function handleAdd() {
    setEditingCategory(null);
    setDefaultParentId(undefined);
    setDialogOpen(true);
  }

  function handleEdit(category: any) {
    setEditingCategory(category);
    setDialogOpen(true);
  }

  function handleAddChild(parentId: string) {
    setEditingCategory(null);
    setDefaultParentId(parentId);
    setDialogOpen(true);
  }

  async function handleDelete(categoryId: string) {
    if (!confirm("Xác nhận xóa category này?")) return;

    const result = await deleteCategory(categoryId);
    
    if (result.success) {
      toast.success("Đã xóa category");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  async function handleUpdateStats() {
    if (!confirm("Cập nhật completion stats cho tất cả categories?")) return;
    setUpdatingStats(true);
    try {
      const result = await updateCategoryStats();
      if (result.success) {
        toast.success(`Đã cập nhật stats cho ${result.results?.length || 0} categories`);
        router.refresh();
      } else {
        toast.error(result.error || "Lỗi cập nhật stats");
      }
    } catch (e) {
      toast.error("Có lỗi xảy ra");
    } finally {
      setUpdatingStats(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Quản lý Categories
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Cấu trúc phân cấp: Team → Parent → Child
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleUpdateStats} disabled={updatingStats}>
            {updatingStats ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang cập nhật...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Update Stats
              </>
            )}
          </Button>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm Category
          </Button>
        </div>
      </div>

      {/* Category Tree */}
      <CategoryTreeView
        categories={categories}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAddChild={handleAddChild}
      />

      {/* Form Dialog */}
      <CategoryFormDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingCategory(null);
          setDefaultParentId(undefined);
          router.refresh();
        }}
        category={editingCategory}
        teams={teams}
        categories={allCategories}
        defaultParentId={defaultParentId}
      />
    </div>
  );
}

