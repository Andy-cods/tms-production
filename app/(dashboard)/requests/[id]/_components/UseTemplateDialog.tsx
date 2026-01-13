"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckSquare, Sparkles } from "lucide-react";
import { createTaskFromTemplate } from "@/actions/template";
import { useRouter } from "next/navigation";

interface Template {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  defaultTitle: string;
  defaultDescription: string | null;
  checklistItems: any[];
}

interface UseTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string;
  templates: Template[];
}

export function UseTemplateDialog({
  open,
  onOpenChange,
  requestId,
  templates,
}: UseTemplateDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [variables, setVariables] = useState<Record<string, string>>({});

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  // Extract variables from template title & description
  const extractVariables = (template: Template) => {
    const text = `${template.defaultTitle} ${template.defaultDescription || ""}`;
    const matches = text.match(/\{\{(\w+)\}\}/g);
    if (!matches) return [];
    return Array.from(new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, ""))));
  };

  const templateVariables = selectedTemplate
    ? extractVariables(selectedTemplate)
    : [];

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    // Reset variables
    setVariables({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("templateId", selectedTemplateId);
    formData.append("requestId", requestId);
    formData.append("variables", JSON.stringify(variables));

    const result = await createTaskFromTemplate(formData);

    setLoading(false);

    if (result.success) {
      onOpenChange(false);
      router.refresh();
    } else {
      alert(result.error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Tạo Task từ Template
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Template Selector */}
          <div>
            <Label htmlFor="template">Chọn template *</Label>
            <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
              <SelectTrigger id="template">
                <SelectValue placeholder="Chọn template..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <span className="flex items-center gap-2">
                      <span>{template.icon}</span>
                      <span>{template.name}</span>
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {template.checklistItems.length} steps
                      </Badge>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Template Preview */}
          {selectedTemplate && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div>
                <p className="text-xs text-gray-600 mb-1">Task sẽ được tạo với:</p>
                <p className="font-medium">{selectedTemplate.defaultTitle}</p>
                {selectedTemplate.defaultDescription && (
                  <p className="text-sm text-gray-700 mt-1">
                    {selectedTemplate.defaultDescription}
                  </p>
                )}
              </div>

              {selectedTemplate.checklistItems.length > 0 && (
                <div>
                  <p className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                    <CheckSquare className="h-3 w-3" />
                    Checklist ({selectedTemplate.checklistItems.length} steps)
                  </p>
                  <div className="space-y-1">
                    {selectedTemplate.checklistItems.slice(0, 3).map((item: any, idx: number) => (
                      <div key={idx} className="text-xs text-gray-600 flex items-center gap-2">
                        <span className="w-4 h-4 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        <span>{item.title}</span>
                      </div>
                    ))}
                    {selectedTemplate.checklistItems.length > 3 && (
                      <p className="text-xs text-gray-500 pl-6">
                        +{selectedTemplate.checklistItems.length - 3} steps nữa...
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Variables Input */}
          {templateVariables.length > 0 && (
            <div className="space-y-3 border-t pt-4">
              <div>
                <p className="text-sm font-medium mb-2">Điền thông tin:</p>
                <p className="text-xs text-gray-600 mb-3">
                  Template này cần một số thông tin để tạo task cụ thể
                </p>
              </div>

              {templateVariables.map((varName) => (
                <div key={varName}>
                  <Label htmlFor={varName}>
                    {varName.charAt(0).toUpperCase() + varName.slice(1)} *
                  </Label>
                  <Input
                    id={varName}
                    value={variables[varName] || ""}
                    onChange={(e) =>
                      setVariables({ ...variables, [varName]: e.target.value })
                    }
                    placeholder={`Nhập ${varName}...`}
                    required
                  />
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={loading || !selectedTemplateId}>
              {loading ? "Đang tạo..." : "Tạo task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
