"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { createTemplate } from "@/actions/template";
import { useRouter } from "next/navigation";

interface Category {
  id: string;
  name: string;
}

interface CreateTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  defaultCategoryId?: string | null;
}

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  order: number;
}

export function CreateTemplateDialog({
  open,
  onOpenChange,
  categories,
  defaultCategoryId,
}: CreateTemplateDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("📝");
  const [defaultTitle, setDefaultTitle] = useState("");
  const [defaultDescription, setDefaultDescription] = useState("");
  const [defaultPriority, setDefaultPriority] = useState("MEDIUM");
  const [defaultCategoryIdState, setDefaultCategoryIdState] = useState("");
  const [estimatedDays, setEstimatedDays] = useState(3);
  const [isPublic, setIsPublic] = useState(false);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([
    { id: "1", title: "", description: "", order: 0 },
  ]);

  useEffect(() => {
    if (open) {
      setDefaultCategoryIdState(
        defaultCategoryId && categories.some((c) => c.id === defaultCategoryId)
          ? defaultCategoryId
          : categories[0]?.id ?? ""
      );
    }
  }, [open, defaultCategoryId, categories]);

  const addChecklistItem = () => {
    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      title: "",
      description: "",
      order: checklistItems.length,
    };
    setChecklistItems([...checklistItems, newItem]);
  };

  const removeChecklistItem = (id: string) => {
    setChecklistItems(checklistItems.filter((item) => item.id !== id));
  };

  const updateChecklistItem = (
    id: string,
    field: keyof ChecklistItem,
    value: string
  ) => {
    setChecklistItems(
      checklistItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("icon", icon);
    formData.append("defaultTitle", defaultTitle);
    formData.append("defaultDescription", defaultDescription);
    formData.append("defaultPriority", defaultPriority);
    formData.append("defaultCategoryId", defaultCategoryIdState);
    formData.append("estimatedDays", estimatedDays.toString());
    formData.append("isPublic", isPublic.toString());
    formData.append(
      "checklistItems",
      JSON.stringify(
        checklistItems
          .filter((item) => item.title.trim())
          .map((item, index) => ({
            title: item.title,
            description: item.description,
            order: index,
          }))
      )
    );

    const result = await createTemplate(formData);

    setLoading(false);

    if (result.success) {
      onOpenChange(false);
      router.refresh();
      setName("");
      setDescription("");
      setIcon("📝");
      setDefaultTitle("");
      setDefaultDescription("");
      setChecklistItems([{ id: "1", title: "", description: "", order: 0 }]);
    } else {
      alert(result.error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo Template Mới</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Tên template *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Onboarding nhân viên"
                  required
                />
              </div>

              <div>
                <Label htmlFor="icon">Icon</Label>
                <Input
                  id="icon"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="📝"
                  maxLength={2}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả ngắn gọn về template này..."
                rows={2}
              />
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold text-sm">Giá trị mặc định cho task</h3>

            <div>
              <Label htmlFor="defaultTitle">Tiêu đề task *</Label>
              <Input
                id="defaultTitle"
                value={defaultTitle}
                onChange={(e) => setDefaultTitle(e.target.value)}
                placeholder="Ví dụ: Onboarding cho {{name}}"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Dùng {"{{variable}}"} cho biến động (ví dụ: {"{{name}}"}, {"{{date}}"})
              </p>
            </div>

            <div>
              <Label htmlFor="defaultDescription">Mô tả task mặc định</Label>
              <Textarea
                id="defaultDescription"
                value={defaultDescription}
                onChange={(e) => setDefaultDescription(e.target.value)}
                placeholder="Mô tả chi tiết cho task..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Độ ưu tiên mặc định</Label>
                <Select value={defaultPriority} onValueChange={setDefaultPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">🟢 Thấp</SelectItem>
                    <SelectItem value="MEDIUM">🟡 Trung bình</SelectItem>
                    <SelectItem value="HIGH">🟠 Cao</SelectItem>
                    <SelectItem value="URGENT">🔴 Khẩn cấp</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Danh mục *</Label>
                <Select
                  value={defaultCategoryIdState}
                  onValueChange={setDefaultCategoryIdState}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Thời gian ước tính (ngày)</Label>
                <Input
                  type="number"
                  min={1}
                  value={estimatedDays}
                  onChange={(e) => setEstimatedDays(parseInt(e.target.value || "1", 10))}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
              <Label className="text-sm text-gray-700 cursor-pointer" onClick={() => setIsPublic(!isPublic)}>
                Công khai template này cho mọi người
              </Label>
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Checklist (tuỳ chọn)</h3>
              <Button type="button" variant="outline" size="sm" onClick={addChecklistItem}>
                <Plus className="h-4 w-4 mr-2" /> Thêm bước
              </Button>
            </div>

            {checklistItems.map((item, index) => (
              <div key={item.id} className="space-y-2 border rounded-lg p-3">
                <div className="flex items-start gap-3">
                  <GripVertical className="h-4 w-4 text-gray-400 mt-2" />
                  <div className="flex-1 space-y-2">
                    <Input
                      value={item.title}
                      placeholder={`Bước ${index + 1}`}
                      onChange={(e) => updateChecklistItem(item.id, "title", e.target.value)}
                    />
                    <Textarea
                      value={item.description}
                      placeholder="Mô tả chi tiết (tuỳ chọn)"
                      rows={2}
                      onChange={(e) =>
                        updateChecklistItem(item.id, "description", e.target.value)
                      }
                    />
                  </div>
                  {checklistItems.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-red-500"
                      onClick={() => removeChecklistItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Huỷ
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary-600 hover:bg-primary-700 text-white">
              {loading ? "Đang tạo..." : "Tạo template"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
