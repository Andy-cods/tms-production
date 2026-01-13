"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createCategory, updateCategory } from "@/actions/category";
import { toast } from "sonner";
import { PositionSelector } from "@/components/categories/position-selector";
import { Switch } from "@/components/ui/switch";

interface Team {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  teamId: string | null;
  parentId: string | null;
  order: number;
  preferredPositions?: string[];
  requireExactMatch?: boolean;
  minDeadlineHours?: number | null;
  maxDeadlineHours?: number | null;
  defaultDeadlineHours?: number | null;
  warnIfTooShort?: boolean;
  warnIfTooLong?: boolean;
  allowCustomDeadline?: boolean;
  avgCompletionHours?: number | null;
  medianCompletionHours?: number | null;
}

interface CategoryFormDialogProps {
  open: boolean;
  onClose: () => void;
  category?: Category | null;
  teams: Team[];
  categories: Category[];
  defaultParentId?: string;
}

export function CategoryFormDialog({
  open,
  onClose,
  category,
  teams,
  categories,
  defaultParentId,
}: CategoryFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "",
    teamId: undefined as string | undefined,
    parentId: undefined as string | undefined,
    preferredPositions: [] as string[],
    requireExactMatch: false,
    minDeadlineHours: null as number | null,
    maxDeadlineHours: null as number | null,
    defaultDeadlineHours: null as number | null,
    warnIfTooShort: true,
    warnIfTooLong: false,
    allowCustomDeadline: true,
  });

  const isEdit = !!category;

  // Initialize form data when dialog opens or category changes
  useEffect(() => {
    if (open) {
      setFormData({
        name: category?.name || "",
        description: category?.description || "",
        icon: category?.icon || "",
        teamId: category?.teamId || undefined,
        parentId: category?.parentId || defaultParentId || undefined,
        preferredPositions: category?.preferredPositions || [],
        requireExactMatch: category?.requireExactMatch || false,
        minDeadlineHours: category?.minDeadlineHours ?? null,
        maxDeadlineHours: category?.maxDeadlineHours ?? null,
        defaultDeadlineHours: category?.defaultDeadlineHours ?? null,
        warnIfTooShort: category?.warnIfTooShort ?? true,
        warnIfTooLong: category?.warnIfTooLong ?? false,
        allowCustomDeadline: category?.allowCustomDeadline ?? true,
      });
    }
  }, [open, category, defaultParentId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const result = isEdit
        ? await updateCategory(category.id, formData)
        : await createCategory(formData);

      if (result.success) {
        toast.success(isEdit ? "Đã cập nhật category" : "Đã tạo category");
        onClose();
      } else {
        toast.error(result.error || "Có lỗi xảy ra");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }

  // Filter parent options (không cho chọn chính nó hoặc children của nó)
  // Also prevent circular references by checking if any ancestor is the current category
  const parentOptions = categories.filter((c) => {
    if (!isEdit) return true; // Allow all in create mode
    if (c.id === category.id) return false; // Can't be its own parent
    
    // Check if this category (c) is a descendant of the category being edited
    // (which would create a circular reference if we set it as parent)
    let checkCategory: Category | undefined = c;
    const checkedIds = new Set<string>(); // Prevent infinite loops
    
    while (checkCategory?.parentId && !checkedIds.has(checkCategory.id)) {
      checkedIds.add(checkCategory.id);
      if (checkCategory.parentId === category.id) {
        return false; // This category is a descendant, can't be parent
      }
      checkCategory = categories.find(cat => cat.id === checkCategory!.parentId);
    }
    
    return true;
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Sửa Category" : "Thêm Category"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <Label htmlFor="name">
              Tên category <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Backend Development"
              required
            />
          </div>

          {/* Icon */}
          <div>
            <Label htmlFor="icon">Icon (emoji)</Label>
            <Input
              id="icon"
              value={formData.icon}
              onChange={(e) =>
                setFormData({ ...formData, icon: e.target.value })
              }
              placeholder="⚙️"
              maxLength={5}
            />
            <p className="text-xs text-gray-500 mt-1">
              Copy emoji từ: https://emojipedia.org/
            </p>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Backend services & APIs"
              rows={3}
            />
          </div>

          {/* Preferred Positions */}
          <div>
            <PositionSelector
              value={formData.preferredPositions}
              onChange={(positions) =>
                setFormData({ ...formData, preferredPositions: positions })
              }
              label="Preferred Positions"
            />
          </div>

          {/* Deadline Range Settings */}
          <div className="border-t pt-4 space-y-4">
            <h3 className="font-semibold text-sm text-gray-900">Deadline Range Settings</h3>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="minDeadlineHours">Min (giờ)</Label>
                <Input
                  id="minDeadlineHours"
                  type="number"
                  min="1"
                  value={formData.minDeadlineHours ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minDeadlineHours: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  placeholder="4"
                />
                <p className="text-xs text-gray-500 mt-1">Tối thiểu</p>
              </div>

              <div>
                <Label htmlFor="defaultDeadlineHours">Default (giờ)</Label>
                <Input
                  id="defaultDeadlineHours"
                  type="number"
                  min="1"
                  value={formData.defaultDeadlineHours ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      defaultDeadlineHours: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  placeholder="24"
                />
                <p className="text-xs text-gray-500 mt-1">Gợi ý</p>
              </div>

              <div>
                <Label htmlFor="maxDeadlineHours">Max (giờ)</Label>
                <Input
                  id="maxDeadlineHours"
                  type="number"
                  min="1"
                  value={formData.maxDeadlineHours ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxDeadlineHours: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  placeholder="72"
                />
                <p className="text-xs text-gray-500 mt-1">Tối đa</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label>Cảnh báo deadline quá ngắn</Label>
                  <p className="text-xs text-gray-500 mt-1">Hiển thị warning nếu deadline &lt; min</p>
                </div>
                <Switch
                  checked={formData.warnIfTooShort ?? true}
                  onCheckedChange={(checked) => setFormData({ ...formData, warnIfTooShort: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label>Cảnh báo deadline quá dài</Label>
                  <p className="text-xs text-gray-500 mt-1">Hiển thị warning nếu deadline &gt; max</p>
                </div>
                <Switch
                  checked={formData.warnIfTooLong ?? false}
                  onCheckedChange={(checked) => setFormData({ ...formData, warnIfTooLong: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label>Cho phép custom deadline</Label>
                  <p className="text-xs text-gray-500 mt-1">Người dùng có thể bỏ qua min/max</p>
                </div>
                <Switch
                  checked={formData.allowCustomDeadline ?? true}
                  onCheckedChange={(checked) => setFormData({ ...formData, allowCustomDeadline: checked })}
                />
              </div>
            </div>
          </div>
          {/* Require Exact Match */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Label>Yêu cầu exact match</Label>
              <p className="text-xs text-gray-500 mt-1">
                Chỉ assign cho users có position khớp chính xác
              </p>
            </div>
            <Switch
              checked={formData.requireExactMatch}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, requireExactMatch: checked })
              }
            />
          </div>

          {/* Team */}
          <div>
            <Label>Team</Label>
            <Select
              value={formData.teamId || undefined}
              onValueChange={(value) =>
                setFormData({ ...formData, teamId: value === "__none__" ? undefined : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn team..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Không team</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Parent Category */}
          <div>
            <Label>Category cha</Label>
            <Select
              value={formData.parentId || undefined}
              onValueChange={(value) =>
                setFormData({ ...formData, parentId: value === "__none__" ? undefined : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Không có (category gốc)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Không có (category gốc)</SelectItem>
                {parentOptions.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Đang xử lý..." : isEdit ? "Cập nhật" : "Tạo"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

