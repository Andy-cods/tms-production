"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Edit, Trash2, Copy } from "lucide-react";
import { deleteTemplate as deleteTemplateAction } from "@/actions/admin/templates";
import { duplicateTemplate } from "@/actions/template";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TemplateDialog } from "@/components/admin/template-dialog";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

interface Template {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  defaultTitle: string;
  defaultDescription?: string | null;
  defaultPriority: string;
  defaultCategoryId?: string | null;
  estimatedDays: number;
  isPublic: boolean;
  usageCount: number;
  defaultCategory?: {
    id: string;
    name: string;
  } | null;
  createdBy?: {
    id: string;
    name: string | null;
  } | null;
  checklistItems?: Array<{
    id: string;
    title: string;
    description?: string | null;
    order: number;
  }>;
  _count?: {
    requests: number;
    checklistItems: number;
  };
}

interface TemplateLibraryClientProps {
  templates: Template[];
  categories: Array<{ id: string; name: string }>;
}

export function TemplateLibraryClient({ templates: initialTemplates, categories }: TemplateLibraryClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  const filteredTemplates = initialTemplates.filter((t) => {
    if (searchQuery && !t.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (categoryFilter !== "all" && t.defaultCategoryId !== categoryFilter) return false;
    return true;
  });

  function handleEdit(template: Template) {
    setEditingTemplate(template);
    setEditDialogOpen(true);
  }

  function handleAdd() {
    setEditingTemplate(null);
    setEditDialogOpen(true);
  }

  async function handleDuplicate(id: string) {
    try {
      const result = await duplicateTemplate(id);
      if (result.success) {
        toast.success("Đã duplicate template");
        router.refresh();
      } else {
        toast.error((result as any).error ?? "Có lỗi xảy ra");
      }
    } catch {
      toast.error("Có lỗi xảy ra");
    }
  }

  function handleDeleteClick(id: string) {
    setTemplateToDelete(id);
    setDeleteDialogOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!templateToDelete) return;
    try {
      const result = await deleteTemplateAction(templateToDelete);
      if (result.success) {
        toast.success("Đã xóa template");
        router.refresh();
      } else {
        toast.error((result as any).message ?? "Có lỗi xảy ra");
      }
    } catch (error: any) {
      toast.error(error?.message ?? "Có lỗi xảy ra");
    } finally {
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Templates</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filteredTemplates.length} template{filteredTemplates.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          className="bg-primary-500 hover:bg-primary-600 text-white font-semibold shadow-sm"
          onClick={handleAdd}
          size="lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          Tạo template
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[250px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm templates..."
              className="pl-10"
            />
          </div>
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Tất cả categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>Không tìm thấy template nào</p>
          <Button
            className="mt-4 bg-primary-500 hover:bg-primary-600 text-white font-semibold shadow-sm"
            onClick={handleAdd}
            size="lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Tạo template đầu tiên
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-lg bg-primary-50 flex items-center justify-center text-2xl flex-shrink-0">
                      {template.icon || "📝"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{template.name}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {template.defaultCategory && (
                          <Badge variant="outline" className="text-xs">
                            {template.defaultCategory.name}
                          </Badge>
                        )}
                        {template.isPublic && (
                          <Badge variant="default" className="text-xs">Công khai</Badge>
                        )}
                        {!template.isPublic && (
                          <Badge variant="secondary" className="text-xs">Riêng tư</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(template)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Chỉnh sửa
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(template.id)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(template.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Xóa
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {template.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>
                )}

                <div className="space-y-1 text-sm text-gray-500">
                  <p>Tiêu đề: {template.defaultTitle}</p>
                  <p>Độ ưu tiên: {template.defaultPriority}</p>
                  <p>Ước tính: {template.estimatedDays} ngày</p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{template._count?.checklistItems || template.checklistItems?.length || 0} items</span>
                    <span className="flex items-center gap-1">
                      {template.usageCount} lần sử dụng
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(template)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Sửa
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <TemplateDialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setEditingTemplate(null);
          router.refresh();
        }}
        template={editingTemplate ? {
          ...editingTemplate,
          defaultPriority: editingTemplate.defaultPriority as any,
        } : null}
        categories={categories}
        mode={editingTemplate ? "edit" : "create"}
        onSuccess={() => {
          router.refresh();
        }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa Template?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Template sẽ bị xóa vĩnh viễn.
              {initialTemplates.find((t) => t.id === templateToDelete)?._count?.requests ? (
                <span className="block mt-2 text-red-600">
                  ⚠️ Template này đã được sử dụng{" "}
                  {initialTemplates.find((t) => t.id === templateToDelete)?._count?.requests} lần.
                </span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


