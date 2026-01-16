import React from "react";
import { cn } from "@/lib/utils";

type TooltipCardProps = {
  children: React.ReactNode;
  className?: string;
};

export function TooltipCard({ children, className }: TooltipCardProps) {
  return (
    <div className={cn("bg-white border shadow-lg p-3 rounded-lg", className)}>
      {children}
    </div>
  );
}

type TooltipTitleProps = {
  children: React.ReactNode;
  className?: string;
};

export function TooltipTitle({ children, className }: TooltipTitleProps) {
  return (
    <p className={cn("text-sm font-medium text-gray-900 mb-2", className)}>
      {children}
    </p>
  );
}


