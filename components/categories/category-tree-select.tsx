"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { getAllCategories } from "@/actions/category";

interface Category {
  id: string;
  name: string;
  icon: string | null;
  parentId: string | null;
  parent?: {
    id: string;
    name: string;
    icon: string | null;
  } | null;
  team?: {
    id: string;
    name: string;
  } | null;
}

interface CategoryTreeSelectProps {
  value?: string;
  onChange: (value: string) => void;
  teamId?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function CategoryTreeSelect({
  value,
  onChange,
  teamId,
  label = "Category",
  required = false,
  disabled = false,
  placeholder = "Chọn category...",
}: CategoryTreeSelectProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  async function loadCategories() {
    setLoading(true);
    const result = await getAllCategories(teamId);
    if (result.success && result.categories) {
      setCategories(result.categories as any);
    }
    setLoading(false);
  }

  // Group categories by hierarchy level
  const groupedCategories = categories.reduce((acc, cat) => {
    if (!cat.parentId) {
      // Parent category
      acc.parents.push(cat);
    } else {
      // Child category
      acc.children.push(cat);
    }
    return acc;
  }, { parents: [] as Category[], children: [] as Category[] });

  // Sort parents by order (assuming order field exists)
  const sortedParents = [...groupedCategories.parents].sort((a, b) => {
    // Try to maintain original order if available
    return a.name.localeCompare(b.name);
  });

  // Group children by parentId
  const childrenByParent = groupedCategories.children.reduce((acc, child) => {
    const parentId = child.parentId || "orphan";
    if (!acc[parentId]) {
      acc[parentId] = [];
    }
    acc[parentId].push(child);
    return acc;
  }, {} as Record<string, Category[]>);

  // Sort children within each parent
  Object.keys(childrenByParent).forEach(parentId => {
    childrenByParent[parentId].sort((a, b) => a.name.localeCompare(b.name));
  });

  if (loading) {
    return (
      <div className="space-y-2">
        {label && <Label>{label}</Label>}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang tải categories...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && (
        <Label>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled || categories.length === 0}
        required={required}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-[400px]">
          {categories.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              Không có category nào
            </div>
          ) : (
            <>
              {/* Parent categories */}
              {sortedParents.map((parent) => {
                const children = childrenByParent[parent.id] || [];

                return (
                  <div key={parent.id}>
                    {/* Parent item */}
                    <SelectItem
                      value={parent.id}
                      className="font-semibold bg-gray-50"
                    >
                      <div className="flex items-center gap-2">
                        {parent.icon && <span>{parent.icon}</span>}
                        <span>{parent.name}</span>
                        {parent.team && (
                          <span className="text-xs text-gray-500">
                            ({parent.team.name})
                          </span>
                        )}
                      </div>
                    </SelectItem>

                    {/* Children items (indented) */}
                    {children.map((child) => (
                      <SelectItem
                        key={child.id}
                        value={child.id}
                        className="pl-8"
                      >
                        <div className="flex items-center gap-2">
                          {child.icon && <span>{child.icon}</span>}
                          <span>{child.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </div>
                );
              })}

              {/* Orphan children (no parent found) */}
              {childrenByParent["orphan"]?.map((orphan) => (
                <SelectItem key={orphan.id} value={orphan.id}>
                  <div className="flex items-center gap-2">
                    {orphan.icon && <span>{orphan.icon}</span>}
                    <span>{orphan.name}</span>
                    {orphan.parent && (
                      <span className="text-xs text-gray-400">
                        → {orphan.parent.name}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </>
          )}
        </SelectContent>
      </Select>

      {/* Helper text */}
      {categories.length > 0 && (
        <p className="text-xs text-gray-500">
          {groupedCategories.parents.length} nhóm chính,{" "}
          {groupedCategories.children.length} danh mục con
        </p>
      )}
    </div>
  );
}

