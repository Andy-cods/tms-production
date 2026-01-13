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
import { getAllCategories } from "@/actions/category";
import { Loader2 } from "lucide-react";

interface CategoryFilterProps {
  value?: string;
  onChange: (value: string) => void;
  teamId?: string;
  label?: string;
  placeholder?: string;
  showAllOption?: boolean;
}

export function CategoryFilter({
  value,
  onChange,
  teamId,
  label = "Danh mục",
  placeholder = "Tất cả danh mục",
  showAllOption = true,
}: CategoryFilterProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  async function loadCategories() {
    setLoading(true);
    const result = await getAllCategories(teamId);
    if (result.success && result.categories) {
      setCategories(result.categories);
    }
    setLoading(false);
  }

  // Group by parent
  const grouped = categories.reduce(
    (acc, cat) => {
      if (!cat.parentId) {
        acc.parents.push(cat);
      } else {
        acc.children.push(cat);
      }
      return acc;
    },
    { parents: [] as any[], children: [] as any[] }
  );

  // Sort parents
  grouped.parents.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
  
  // Sort children within each parent
  grouped.children.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

  if (loading) {
    return (
      <div className="space-y-2">
        {label && <Label className="text-sm">{label}</Label>}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang tải...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && <Label className="text-sm">{label}</Label>}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {showAllOption && (
            <SelectItem value="all" className="font-medium">
              {placeholder}
            </SelectItem>
          )}

          {grouped.parents.map((parent: any) => {
            const children = grouped.children.filter(
              (c: any) => c.parentId === parent.id
            );

            return (
              <div key={parent.id}>
                {/* Parent */}
                <SelectItem
                  value={parent.id}
                  className="font-semibold bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    {parent.icon && <span>{parent.icon}</span>}
                    <span>{parent.name}</span>
                  </div>
                </SelectItem>

                {/* Children */}
                {children.map((child: any) => (
                  <SelectItem
                    key={child.id}
                    value={child.id}
                    className="pl-8"
                  >
                    <div className="flex items-center gap-2">
                      {child.icon && <span className="text-sm">{child.icon}</span>}
                      <span>{child.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </div>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}

