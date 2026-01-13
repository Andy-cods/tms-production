"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { updateTemplate } from "@/actions/admin/templates";
import { createTemplate } from "@/actions/template";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Priority } from "@prisma/client";

interface Category {
  id: string;
  name: string;
}

interface ChecklistItem {
  id?: string;
  title: string;
  description?: string | null;
  order: number;
  estimatedHours?: number | null;
  assignToRole?: string | null;
}

interface Template {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  defaultTitle: string;
  defaultDescription?: string | null;
  defaultPriority: Priority;
  defaultCategoryId?: string | null;
  estimatedDays: number;
  isPublic: boolean;
  checklistItems?: ChecklistItem[];
}

interface TemplateDialogProps {
  open: boolean;
  onClose: () => void;
  template?: Template | null;
  categories: Category[];
  mode?: "create" | "edit";
  onSuccess?: () => void;
}

const priorityOptions = [
  { value: "LOW", label: "Thấp", color: "bg-gray-100 text-gray-700" },
  { value: "MEDIUM", label: "Trung bình", color: "bg-blue-100 text-blue-700" },
  { value: "HIGH", label: "Cao", color: "bg-orange-100 text-orange-700" },
  { value: "URGENT", label: "Khẩn cấp", color: "bg-red-100 text-red-700" },
];

export function TemplateDialog({
  open,
  onClose,
  template,
  categories,
  mode = "edit",
  onSuccess,
}: TemplateDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "📝",
    defaultTitle: "",
    defaultDescription: "",
    defaultPriority: "MEDIUM" as Priority,
    defaultCategoryId: "",
    estimatedDays: 3,
    isPublic: false,
  });
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);

  // Load template data for edit mode
  useEffect(() => {
    if (open) {
      if (mode === "edit" && template) {
        setFormData({
          name: template.name,
          description: template.description || "",
          icon: template.icon || "📝",
          defaultTitle: template.defaultTitle,
          defaultDescription: template.defaultDescription || "",
          defaultPriority: template.defaultPriority,
          defaultCategoryId: template.defaultCategoryId || "",
          estimatedDays: template.estimatedDays,
          isPublic: template.isPublic,
        });
        setChecklistItems(
          template.checklistItems?.map((item, index) => ({
            ...item,
            order: index,
          })) || []
        );
      } else {
        // Reset for create mode
        setFormData({
          name: "",
          description: "",
          icon: "📝",
          defaultTitle: "",
          defaultDescription: "",
          defaultPriority: "MEDIUM",
          defaultCategoryId: "",
          estimatedDays: 3,
          isPublic: false,
        });
        setChecklistItems([]);
      }
      setError(null);
    }
  }, [open, mode, template]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === "edit" && template) {
        const result = await updateTemplate(template.id, {
          ...formData,
          defaultCategoryId: formData.defaultCategoryId || null,
          description: formData.description || null,
          defaultDescription: formData.defaultDescription || null,
          checklistItems: checklistItems.map((item, index) => ({
            title: item.title,
            description: item.description || null,
            order: index,
            estimatedHours: item.estimatedHours || null,
            assignToRole: item.assignToRole || null,
          })),
        });

        if (result.success) {
          toast.success("Đã cập nhật template");
          onClose();
          onSuccess?.();
          router.refresh();
        } else {
          setError("Có lỗi xảy ra khi cập nhật template");
        }
      } else {
        // Create mode - use existing createTemplate action
        const formDataObj = new FormData();
        formDataObj.append("name", formData.name);
        formDataObj.append("description", formData.description);
        formDataObj.append("icon", formData.icon);
        formDataObj.append("defaultTitle", formData.defaultTitle);
        formDataObj.append("defaultDescription", formData.defaultDescription);
        formDataObj.append("defaultPriority", formData.defaultPriority);
        formDataObj.append("defaultCategoryId", formData.defaultCategoryId);
        formDataObj.append("estimatedDays", formData.estimatedDays.toString());
        formDataObj.append("isPublic", formData.isPublic.toString());
        formDataObj.append(
          "checklistItems",
          JSON.stringify(
            checklistItems.map((item, index) => ({
              title: item.title,
              description: item.description || null,
              order: index,
              estimatedHours: item.estimatedHours || null,
            }))
          )
        );

        const result = await createTemplate(formDataObj);

        if (result.success) {
          toast.success("Đã tạo template");
          onClose();
          onSuccess?.();
          router.refresh();
        } else {
          setError((result as any).error || "Có lỗi xảy ra khi tạo template");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
      toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const addChecklistItem = () => {
    setChecklistItems([
      ...checklistItems,
      {
        title: "",
        description: "",
        order: checklistItems.length,
        estimatedHours: null,
        assignToRole: null,
      },
    ]);
  };

  const removeChecklistItem = (index: number) => {
    setChecklistItems(checklistItems.filter((_, i) => i !== index).map((item, i) => ({ ...item, order: i })));
  };

  const updateChecklistItem = (index: number, field: keyof ChecklistItem, value: any) => {
    const updated = [...checklistItems];
    updated[index] = { ...updated[index], [field]: value };
    setChecklistItems(updated);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Chỉnh sửa Template" : "Tạo Template mới"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">
                Tên template <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Marketing - Video Snack - Cơ bản"
                required
              />
            </div>

            <div>
              <Label htmlFor="icon">Icon (emoji)</Label>
              <Input
                id="icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="📝"
                maxLength={10}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Mô tả template..."
              rows={2}
            />
          </div>

          {/* Default Values */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="defaultTitle">
                Tiêu đề mặc định <span className="text-red-500">*</span>
              </Label>
              <Input
                id="defaultTitle"
                value={formData.defaultTitle}
                onChange={(e) => setFormData({ ...formData, defaultTitle: e.target.value })}
                placeholder="{{campaign_name}} - Video Snack - Cơ bản"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Sử dụng {"{{variable_name}}"} để tạo biến
              </p>
            </div>

            <div>
              <Label htmlFor="defaultPriority">Độ ưu tiên mặc định</Label>
              <Select
                value={formData.defaultPriority}
                onValueChange={(value) =>
                  setFormData({ ...formData, defaultPriority: value as Priority })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="defaultDescription">Mô tả mặc định</Label>
            <Textarea
              id="defaultDescription"
              value={formData.defaultDescription}
              onChange={(e) => setFormData({ ...formData, defaultDescription: e.target.value })}
              placeholder="Mô tả mặc định cho request..."
              rows={3}
            />
          </div>

          {/* Category & Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="defaultCategoryId">Category mặc định</Label>
              <Select
                value={formData.defaultCategoryId}
                onValueChange={(value) =>
                  setFormData({ ...formData, defaultCategoryId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn category..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Không có</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="estimatedDays">Số ngày ước tính</Label>
              <Input
                id="estimatedDays"
                type="number"
                min="1"
                max="365"
                value={formData.estimatedDays}
                onChange={(e) =>
                  setFormData({ ...formData, estimatedDays: parseInt(e.target.value) || 3 })
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Label>Template công khai</Label>
              <p className="text-xs text-gray-500 mt-1">
                Cho phép tất cả người dùng sử dụng template này
              </p>
            </div>
            <Switch
              checked={formData.isPublic}
              onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
            />
          </div>

          {/* Checklist Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Checklist Items</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addChecklistItem}
              >
                <Plus className="h-4 w-4 mr-2" />
                Thêm item
              </Button>
            </div>

            {checklistItems.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Chưa có checklist items. Nhấn "Thêm item" để thêm.
              </p>
            ) : (
              <div className="space-y-3">
                {checklistItems.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-lg space-y-3 bg-gray-50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <GripVertical className="h-4 w-4 text-gray-400 mt-1" />
                        <Badge variant="outline">{index + 1}</Badge>
                        <div className="flex-1">
                          <Input
                            placeholder="Tiêu đề checklist item..."
                            value={item.title}
                            onChange={(e) =>
                              updateChecklistItem(index, "title", e.target.value)
                            }
                            required
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeChecklistItem(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>

                    <Textarea
                      placeholder="Mô tả (tùy chọn)..."
                      value={item.description || ""}
                      onChange={(e) =>
                        updateChecklistItem(index, "description", e.target.value)
                      }
                      rows={2}
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Số giờ ước tính</Label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={item.estimatedHours || ""}
                          onChange={(e) =>
                            updateChecklistItem(
                              index,
                              "estimatedHours",
                              e.target.value ? parseInt(e.target.value) : null
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Gán cho role</Label>
                        <Input
                          placeholder="LEADER, STAFF, ..."
                          value={item.assignToRole || ""}
                          onChange={(e) =>
                            updateChecklistItem(index, "assignToRole", e.target.value || null)
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Đang xử lý..." : mode === "edit" ? "Cập nhật" : "Tạo"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

