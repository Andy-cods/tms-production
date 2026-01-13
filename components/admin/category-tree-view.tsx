"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ChevronDown,
  ChevronRight,
  Edit,
  Trash2,
  Plus,
  GripVertical,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Category {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  parentId: string | null;
  order: number;
  isActive: boolean;
  preferredPositions?: string[];
  requireExactMatch?: boolean;
  children?: Category[];
  team?: {
    id: string;
    name: string;
  } | null;
}

interface CategoryTreeViewProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (categoryId: string) => void;
  onAddChild: (parentId: string) => void;
}

export function CategoryTreeView({
  categories,
  onEdit,
  onDelete,
  onAddChild,
}: CategoryTreeViewProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const renderCategory = (category: Category, level: number = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedIds.has(category.id);

    return (
      <div key={category.id} className="select-none">
        {/* Category row */}
        <div
          className={`
            flex items-center gap-2 p-3 hover:bg-gray-50 rounded-lg
            border border-transparent hover:border-gray-200
            transition-all
          `}
          style={{ marginLeft: `${level * 24}px` }}
        >
          {/* Expand/Collapse button */}
          <button
            onClick={() => toggleExpand(category.id)}
            className="p-1 hover:bg-gray-100 rounded"
            disabled={!hasChildren}
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-600" />
              )
            ) : (
              <div className="w-4 h-4" />
            )}
          </button>

          {/* Drag handle */}
          <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />

          {/* Icon */}
          {category.icon && (
            <span className="text-xl">{category.icon}</span>
          )}

          {/* Name & description */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-gray-900">
                {category.name}
              </span>
              {!category.isActive && (
                <Badge variant="secondary">Inactive</Badge>
              )}
              {category.team && (
                <Badge variant="outline" className="text-xs">
                  {category.team.name}
                </Badge>
              )}
              
              {/* Preferred positions badges */}
              {category.preferredPositions && category.preferredPositions.length > 0 && (
                <div className="flex items-center gap-1">
                  {category.preferredPositions.slice(0, 2).map((pos: string) => (
                    <Badge
                      key={pos}
                      variant="outline"
                      className="text-xs bg-blue-50 text-blue-700 border-blue-300"
                    >
                      {pos}
                    </Badge>
                  ))}
                  {category.preferredPositions.length > 2 && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-blue-50 text-blue-700"
                    >
                      +{category.preferredPositions.length - 2}
                    </Badge>
                  )}
                </div>
              )}
              
              {/* Exact match indicator */}
              {category.requireExactMatch && (
                <Badge variant="destructive" className="text-xs">
                  Exact Match
                </Badge>
              )}
            </div>
            {category.description && (
              <p className="text-sm text-gray-500 truncate">
                {category.description}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAddChild(category.id)}
              title="Thêm danh mục con"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(category)}
              title="Sửa"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(category.id)}
              title="Xóa"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Children (recursive) */}
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {category.children!.map((child) =>
              renderCategory(child, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  if (categories.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500">Chưa có category nào</p>
        <p className="text-sm text-gray-400 mt-1">
          Click "Thêm category" để bắt đầu
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="space-y-1">
        {categories.map((category) => renderCategory(category))}
      </div>
    </Card>
  );
}

