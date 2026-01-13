"use client";

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CategoryBreadcrumb } from "./category-breadcrumb";

interface CategoryBadgeProps {
  category: {
    id: string;
    name: string;
    icon?: string | null;
    parent?: {
      name: string;
      icon?: string | null;
    } | null;
  };
  showBreadcrumb?: boolean;
  variant?: "default" | "outline" | "secondary";
  className?: string;
}

export function CategoryBadge({
  category,
  showBreadcrumb = false,
  variant = "outline",
  className = "",
}: CategoryBadgeProps) {
  if (showBreadcrumb) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant={variant} className={`gap-1 ${className}`}>
              {category.icon && <span>{category.icon}</span>}
              <span>{category.name}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <CategoryBreadcrumb categoryId={category.id} />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Badge variant={variant} className={`gap-1 ${className}`}>
      {category.icon && <span>{category.icon}</span>}
      {category.parent && (
        <span className="text-gray-500">
          {category.parent.icon} {category.parent.name} /
        </span>
      )}
      <span>{category.name}</span>
    </Badge>
  );
}

