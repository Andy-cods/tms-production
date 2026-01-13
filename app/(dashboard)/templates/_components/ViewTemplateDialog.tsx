"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Calendar, Users, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

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
  createdBy: {
    id: string;
    name: string | null;
  };
  defaultCategory: {
    id: string;
    name: string;
  } | null;
  checklistItems: Array<{
    id: string;
    title: string;
    description: string | null;
    order: number;
  }>;
  createdAt: string;
}

interface ViewTemplateDialogProps {
  template: Template;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewTemplateDialog({
  template,
  open,
  onOpenChange,
}: ViewTemplateDialogProps) {
  const priorityLabels: Record<string, string> = {
    LOW: "Thấp",
    MEDIUM: "Trung bình",
    HIGH: "Cao",
    URGENT: "Khẩn cấp",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{template.icon}</span>
            <div className="flex-1">
              <DialogTitle>{template.name}</DialogTitle>
              <p className="text-sm text-gray-600 mt-1">{template.description}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <CheckSquare className="h-5 w-5 text-blue-500 mx-auto mb-1" />
              <p className="text-lg font-bold">{template.checklistItems.length}</p>
              <p className="text-xs text-gray-600">Steps</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <Calendar className="h-5 w-5 text-green-500 mx-auto mb-1" />
              <p className="text-lg font-bold">{template.estimatedDays}</p>
              <p className="text-xs text-gray-600">Ngày</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <Users className="h-5 w-5 text-orange-500 mx-auto mb-1" />
              <p className="text-lg font-bold">{template.usageCount}</p>
              <p className="text-xs text-gray-600">Lần dùng</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <FileText className="h-5 w-5 text-purple-500 mx-auto mb-1" />
              <p className="text-lg font-bold">{template.isPublic ? "Public" : "Private"}</p>
              <p className="text-xs text-gray-600">Trạng thái</p>
            </div>
          </div>

          {/* Default Values */}
          <div className="space-y-3 border-t pt-4">
            <h3 className="font-semibold text-sm">Task sẽ được tạo với:</h3>

            <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-xs text-gray-600 mb-1">Tiêu đề:</p>
                <p className="font-medium">{template.defaultTitle}</p>
              </div>

              {template.defaultDescription && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Mô tả:</p>
                  <p className="text-sm text-gray-700">{template.defaultDescription}</p>
                </div>
              )}

              <div className="flex gap-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Độ ưu tiên:</p>
                  <Badge>{priorityLabels[template.defaultPriority]}</Badge>
                </div>
                {template.defaultCategory && (
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Danh mục:</p>
                    <Badge variant="secondary">{template.defaultCategory.name}</Badge>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Checklist Items */}
          <div className="space-y-3 border-t pt-4">
            <h3 className="font-semibold text-sm">
              Checklist ({template.checklistItems.length} steps):
            </h3>
            <div className="space-y-2">
              {template.checklistItems.map((item, index) => (
                <div key={item.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.title}</p>
                    {item.description && (
                      <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Metadata */}
          <div className="text-xs text-gray-500 border-t pt-4">
            <p>
              Tạo bởi: <span className="font-medium">{template.createdBy.name}</span>
            </p>
            <p>
              Tạo lúc:{" "}
              {formatDistanceToNow(new Date(template.createdAt), {
                addSuffix: true,
                locale: vi,
              })}
            </p>
            {template.lastUsedAt && (
              <p>
                Dùng lần cuối:{" "}
                {formatDistanceToNow(new Date(template.lastUsedAt), {
                  addSuffix: true,
                  locale: vi,
                })}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
