"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FieldEditor } from "@/components/templates/field-editor";
import { Plus, Save, Eye } from "lucide-react";
import { FIELD_TYPE_META, type FieldType } from "@/types/custom-fields";
import { createTemplate } from "@/actions/template";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface CustomFieldData {
  id?: string;
  name: string;
  label: string;
  description?: string;
  type: FieldType;
  isRequired: boolean;
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  pattern?: string;
  options?: string[];
  defaultValue?: string;
  placeholder?: string;
  order: number;
}

interface TemplateBuilderProps {
  template?: {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    categoryId?: string;
    isActive: boolean;
    isDefault: boolean;
    fields: any[];
  };
  categories: Array<{ id: string; name: string; icon?: string }>;
}

export function TemplateBuilder({ template, categories }: TemplateBuilderProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: template?.name || "",
    description: template?.description || "",
    icon: template?.icon || "📝",
    categoryId: template?.categoryId || undefined,
    isActive: template?.isActive ?? true,
    isDefault: template?.isDefault ?? false,
  });

  const [fields, setFields] = useState<CustomFieldData[]>(
    template?.fields.map((f, i) => ({
      id: f.id,
      name: f.name,
      label: f.label,
      description: f.description || undefined,
      type: f.type as FieldType,
      isRequired: f.isRequired,
      minLength: f.minLength || undefined,
      maxLength: f.maxLength || undefined,
      minValue: f.minValue || undefined,
      maxValue: f.maxValue || undefined,
      pattern: f.pattern || undefined,
      options: f.options ? JSON.parse(JSON.stringify(f.options)) : undefined,
      defaultValue: f.defaultValue || undefined,
      placeholder: f.placeholder || undefined,
      order: i,
    })) || []
  );

  function addField(type: FieldType = "TEXT") {
    const newField: CustomFieldData = {
      name: `field_${fields.length + 1}`,
      label: `New ${FIELD_TYPE_META[type].label}`,
      type,
      isRequired: false,
      order: fields.length,
    };
    setFields([...fields, newField]);
  }

  function updateField(index: number, updates: CustomFieldData) {
    const next = [...fields];
    next[index] = updates;
    setFields(next);
  }

  function deleteField(index: number) {
    const next = fields.filter((_, i) => i !== index);
    next.forEach((f, i) => (f.order = i));
    setFields(next);
  }

  function duplicateField(index: number) {
    const f = fields[index];
    const newField = { ...f, id: undefined, name: `${f.name}_copy`, label: `${f.label} (Copy)`, order: fields.length };
    setFields([...fields, newField]);
  }

  function moveFieldUp(index: number) {
    if (index === 0) return;
    const next = [...fields];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    next.forEach((f, i) => (f.order = i));
    setFields(next);
  }

  function moveFieldDown(index: number) {
    if (index === fields.length - 1) return;
    const next = [...fields];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    next.forEach((f, i) => (f.order = i));
    setFields(next);
  }

  async function handleSubmit() {
    if (!formData.name) return toast.error("Template name là bắt buộc");
    if (fields.length === 0) return toast.error("Thêm ít nhất 1 field");

    const names = fields.map((f) => f.name);
    const dup = names.filter((n, i) => names.indexOf(n) !== i);
    if (dup.length) return toast.error(`Field name trùng: ${dup.join(", ")}`);

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("name", formData.name);
      fd.append("description", formData.description || "");
      fd.append("icon", formData.icon || "");
      fd.append("defaultTitle", formData.name);
      fd.append("defaultDescription", formData.description || "");
      fd.append("defaultPriority", "MEDIUM");
      fd.append("defaultCategoryId", formData.categoryId || "");
      fd.append("estimatedDays", "3");
      fd.append("isPublic", "false");
      fd.append(
        "checklistItems",
        JSON.stringify(
          fields.map((f, index) => ({
            title: f.label,
            description: f.description || "",
            order: index,
          }))
        )
      );

      const result = await createTemplate(fd);

      if (result.success) {
        toast.success(template ? "Đã cập nhật template" : "Đã tạo template");
        router.push("/admin/templates");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Template Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Template Name *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Bug Report" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} placeholder="Template description..." />
            </div>
            <div>
              <Label>Icon (Emoji)</Label>
              <Input value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} placeholder="🐛" maxLength={2} />
            </div>
            <div>
              <Label>Category (Optional)</Label>
              <Select value={formData.categoryId || undefined} onValueChange={(v) => setFormData({ ...formData, categoryId: v === "all" ? undefined : v })}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between p-3 border rounded">
              <div>
                <Label>Active</Label>
                <p className="text-xs text-gray-500 mt-1">Show in template list</p>
              </div>
              <Switch checked={formData.isActive} onCheckedChange={(c) => setFormData({ ...formData, isActive: c })} />
            </div>
            <div className="flex items-center justify-between p-3 border rounded">
              <div>
                <Label>Default Template</Label>
                <p className="text-xs text-gray-500 mt-1">Pre-select for category</p>
              </div>
              <Switch checked={formData.isDefault} onCheckedChange={(c) => setFormData({ ...formData, isDefault: c })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add Fields</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(FIELD_TYPE_META).map(([key, meta]) => (
              <Button key={key} variant="outline" className="w-full justify-start" onClick={() => addField(key as FieldType)}>
                <Plus className="h-4 w-4 mr-2" />{meta.label}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Fields ({fields.length})</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm"><Eye className="h-4 w-4 mr-2" />Preview</Button>
                <Button onClick={handleSubmit} disabled={loading} size="sm"><Save className="h-4 w-4 mr-2" />{loading ? "Saving..." : "Save Template"}</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {fields.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No fields yet</p>
                <p className="text-sm mt-1">Click "Add Fields" to start building</p>
              </div>
            ) : (
              fields.map((field, index) => (
                <FieldEditor
                  key={index}
                  field={field}
                  index={index}
                  onUpdate={(f) => updateField(index, f)}
                  onDelete={() => deleteField(index)}
                  onDuplicate={() => duplicateField(index)}
                  onMoveUp={() => moveFieldUp(index)}
                  onMoveDown={() => moveFieldDown(index)}
                  isFirst={index === 0}
                  isLast={index === fields.length - 1}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


