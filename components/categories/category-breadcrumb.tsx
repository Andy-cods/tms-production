"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { getCategoryBreadcrumb } from "@/actions/category";

interface CategoryBreadcrumbProps {
  categoryId: string;
  className?: string;
}

export function CategoryBreadcrumb({
  categoryId,
  className = "",
}: CategoryBreadcrumbProps) {
  const [breadcrumb, setBreadcrumb] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [loading, setLoading] = useState(true);

  const loadBreadcrumb = useCallback(async () => {
    setLoading(true);
    const result = await getCategoryBreadcrumb(categoryId);
    if (result.success && result.breadcrumb) {
      setBreadcrumb(result.breadcrumb);
    }
    setLoading(false);
  }, [categoryId]);

  useEffect(() => {
    if (categoryId) {
      void loadBreadcrumb();
      return;
    }

    setBreadcrumb([]);
    setLoading(false);
  }, [categoryId, loadBreadcrumb]);

  if (loading) {
    return (
      <div className={`flex items-center gap-1 text-sm text-gray-500 ${className}`}>
        <span className="animate-pulse">Đang tải...</span>
      </div>
    );
  }

  if (breadcrumb.length === 0) {
    return null;
  }

  return (
    <div className={`flex items-center gap-1 text-sm ${className}`}>
      {breadcrumb.map((item, index) => (
        <div key={item.id} className="flex items-center gap-1">
          <span
            className={
              index === breadcrumb.length - 1
                ? "font-medium text-gray-900"
                : "text-gray-500"
            }
          >
            {item.name}
          </span>
          {index < breadcrumb.length - 1 && (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
        </div>
      ))}
    </div>
  );
}

