"use client";

import { useCallback, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  FileText,
  CheckSquare,
  Users,
  Calendar,
  Trash2,
  Eye,
  Folder,
  ArrowLeft,
} from "lucide-react";
import { CreateTemplateDialog } from "./CreateTemplateDialog";
import { ViewTemplateDialog } from "./ViewTemplateDialog";
import { deleteTemplate } from "@/actions/template";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { createTeam } from "@/actions/admin/teams";
import { toast } from "sonner";

interface Template {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  defaultTitle: string;
  defaultDescription: string | null;
  defaultPriority: string;
  estimatedDays: number;
  isPublic: boolean;
  usageCount: number;
  lastUsedAt: string | null;
  createdById: string;
  createdBy: {
    id: string;
    name: string | null;
  };
  defaultCategory: {
    id: string;
    name: string;
  } | null;
  _count: {
    checklistItems: number;
  };
  checklistItems: any[];
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  teamId?: string | null;
}

interface Team {
  id: string;
  name: string;
}

interface TemplatesClientProps {
  templates: Template[];
  categories: Category[];
  teams: Team[];
  currentUserId: string;
}

export function TemplatesClient({
  templates,
  categories,
  teams,
  currentUserId,
}: TemplatesClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showCreateTemplateDialog, setShowCreateTemplateDialog] = useState(false);
  const [viewingTemplate, setViewingTemplate] = useState<Template | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);

  const teamMap = useMemo(
    () => new Map<string, string>(teams.map((team) => [team.id, team.name])),
    [teams]
  );
  const categoryMap = useMemo(
    () => new Map<string, Category>(categories.map((cat) => [cat.id, cat])),
    [categories]
  );

  const getFolderId = useCallback(
    (template: Template) => {
      const category = template.defaultCategory
        ? categoryMap.get(template.defaultCategory.id)
        : undefined;

      return category?.teamId && teamMap.has(category.teamId)
        ? category.teamId
        : "__uncategorized";
    },
    [categoryMap, teamMap]
  );

  const matchesSearchAndCategory = useCallback(
    (template: Template) => {
      const matchesSearch =
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" ||
        template.defaultCategory?.id === selectedCategory;

      return matchesSearch && matchesCategory;
    },
    [searchQuery, selectedCategory]
  );

  const templatesFilteredBySearch = useMemo(
    () => templates.filter(matchesSearchAndCategory),
    [templates, matchesSearchAndCategory]
  );

  const templatesVisible = useMemo(() => {
    if (!selectedFolder) {
      // When no folder selected, only show templates that have a team assigned
      return templatesFilteredBySearch.filter(
        (template) => getFolderId(template) !== "__uncategorized"
      );
    }
    return templatesFilteredBySearch.filter(
      (template) => getFolderId(template) === selectedFolder
    );
  }, [getFolderId, selectedFolder, templatesFilteredBySearch]);

  const myTemplates = templatesVisible.filter(
    (t) => t.createdById === currentUserId
  );
  const publicTemplates = templatesVisible.filter(
    (t) => t.isPublic && t.createdById !== currentUserId
  );

  const handleDelete = async (templateId: string) => {
    if (!confirm("Xóa template này? Hành động không thể hoàn tác.")) {
      return;
    }

    const result = await deleteTemplate(templateId);

    if (result.success) {
      router.refresh();
    } else {
      alert(result.error);
    }
  };

  const folders = useMemo(() => {
    const map = new Map<string, { id: string; name: string; total: number; filtered: number }>();

    teams.forEach((team) => {
      map.set(team.id, { id: team.id, name: team.name, total: 0, filtered: 0 });
    });
    // Removed __uncategorized folder - only show templates with assigned teams

    templates.forEach((template) => {
      const id = getFolderId(template);
      // Skip templates without a team (__uncategorized)
      if (id === "__uncategorized") return;
      if (!map.has(id)) {
        const name = teamMap.get(id) || "Không xác định";
        map.set(id, { id, name, total: 0, filtered: 0 });
      }
      map.get(id)!.total += 1;
    });

    templatesFilteredBySearch.forEach((template) => {
      const id = getFolderId(template);
      // Skip templates without a team (__uncategorized)
      if (id === "__uncategorized") return;
      if (!map.has(id)) {
        const name = teamMap.get(id) || "Không xác định";
        map.set(id, { id, name, total: 0, filtered: 0 });
      }
      map.get(id)!.filtered += 1;
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [teams, templates, templatesFilteredBySearch, getFolderId, teamMap]);

  const activeFolderName =
    selectedFolder
      ? teamMap.get(selectedFolder) || "Không xác định"
      : null;

  const filteredCategories = useMemo(() => {
    if (!selectedFolder) {
      return categories;
    }
    return categories.filter((cat) => cat.teamId === selectedFolder);
  }, [categories, selectedFolder]);

  const handleOpenCreateTemplate = () => {
    if (filteredCategories.length === 0 && selectedFolder) {
      toast.error("Thư mục hiện chưa có danh mục nào. Vui lòng tạo danh mục trước.");
      return;
    }
    setShowCreateTemplateDialog(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Tìm template..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Danh mục" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả danh mục</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {!selectedFolder && (
          <Button
            onClick={() => setShowCreateFolderDialog(true)}
            className="bg-muted text-muted-foreground hover:bg-muted/80"
            type="button"
          >
            <Folder className="h-4 w-4 mr-2" />
            Tạo thư mục
          </Button>
        )}

        <Button
          onClick={handleOpenCreateTemplate}
          className="bg-primary-600 hover:bg-primary-700 text-white"
          type="button"
        >
          <Plus className="h-4 w-4 mr-2" />
          Tạo template
        </Button>
      </div>

      {!selectedFolder ? (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Thư mục phòng ban ({folders.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {folders.map((folder) => (
              <Card
                key={folder.id}
                className="hover:shadow-lg transition cursor-pointer border-primary-100"
                onClick={() => setSelectedFolder(folder.id)}
              >
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center">
                      <Folder className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{folder.name}</CardTitle>
                      <p className="text-xs text-gray-500">
                        {folder.filtered}/{folder.total} template phù hợp
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 text-gray-600 mb-2 px-0"
                onClick={() => setSelectedFolder(null)}
              >
                <ArrowLeft className="h-4 w-4" />
                Quay lại danh sách thư mục
              </Button>
              <h2 className="text-lg font-semibold text-gray-900">
                Thư mục: {activeFolderName}
              </h2>
            </div>
            <div className="text-sm text-gray-500">
              {templatesVisible.length} template phù hợp
            </div>
          </div>

          {myTemplates.length > 0 && (
            <div>
              <h3 className="text-md font-semibold text-gray-900 mb-4">
                Templates của tôi ({myTemplates.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onView={() => setViewingTemplate(template)}
                    onDelete={() => handleDelete(template.id)}
                    canDelete={true}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-md font-semibold text-gray-900">
              Templates công khai ({publicTemplates.length})
            </h3>
            {publicTemplates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {publicTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onView={() => setViewingTemplate(template)}
                    canDelete={false}
                  />
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-gray-300 rounded-xl p-10 text-center text-sm text-gray-500">
                Không có template công khai nào khớp với bộ lọc hiện tại trong thư mục này.
              </div>
            )}
          </div>
        </div>
      )}

      {templatesVisible.length === 0 && !selectedFolder && (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Không tìm thấy template
          </h3>
          <p className="text-gray-600 mb-4">
            Thử tìm với từ khóa khác hoặc tạo template mới
          </p>
          <Button onClick={handleOpenCreateTemplate} className="bg-primary-600 hover:bg-primary-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Tạo template đầu tiên
          </Button>
        </div>
      )}

      <CreateTemplateDialog
        open={showCreateTemplateDialog}
        onOpenChange={setShowCreateTemplateDialog}
        categories={filteredCategories}
        defaultCategoryId={filteredCategories[0]?.id}
      />

      {viewingTemplate && (
        <ViewTemplateDialog
          template={viewingTemplate}
          open={!!viewingTemplate}
          onOpenChange={(open) => !open && setViewingTemplate(null)}
        />
      )}

      <CreateFolderDialog
        open={showCreateFolderDialog}
        onOpenChange={setShowCreateFolderDialog}
        refresh={() => router.refresh()}
      />
    </div>
  );
}

function TemplateCard({
  template,
  onView,
  onDelete,
  canDelete,
}: {
  template: Template;
  onView: () => void;
  onDelete?: () => void;
  canDelete: boolean;
}) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-3xl">{template.icon}</span>
            <div>
              <CardTitle className="text-base">{template.name}</CardTitle>
              {template.defaultCategory && (
                <Badge variant="secondary" className="mt-1 text-xs">
                  {template.defaultCategory.name}
                </Badge>
              )}
            </div>
          </div>
          {template.isPublic && (
            <Badge variant="outline" className="text-xs">
              Public
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-sm text-gray-600 line-clamp-2">
          {template.description || "Không có mô tả"}
        </p>

        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <CheckSquare className="h-3 w-3" />
            <span>{template._count.checklistItems} steps</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{template.estimatedDays} ngày</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{template.usageCount} lần</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onView}
          >
            <Eye className="h-4 w-4 mr-1" />
            Xem
          </Button>
          {canDelete && onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CreateFolderDialog({
  open,
  onOpenChange,
  refresh,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  refresh: () => void;
}) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setName("");
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      reset();
    }
    onOpenChange(open);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên thư mục");
      return;
    }

    setLoading(true);
    try {
      const result = await createTeam({ name, leaderId: null });
      if (result?.success) {
        toast.success("Đã tạo thư mục phòng ban mới");
        refresh();
        handleClose(false);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tạo thư mục");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tạo thư mục phòng ban</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="folder-name">Tên thư mục *</Label>
            <Input
              id="folder-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Phòng Sáng tạo"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Sau khi tạo, bạn có thể thêm danh mục và templates vào thư mục này.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary-600 hover:bg-primary-700 text-white">
              {loading ? "Đang tạo..." : "Tạo thư mục"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
