import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export const StatsCard = React.forwardRef<HTMLDivElement, StatsCardProps>(
  ({ title, value, icon: Icon, trend, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-white rounded-xl border border-gray-200 p-4 transition-all duration-200 hover:shadow-md",
          className
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-dark-900">{value}</p>
            {trend && (
              <p
                className={cn(
                  "text-sm font-medium mt-1",
                  trend.isPositive ? "text-green-600" : "text-red-600"
                )}
              >
                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
              </p>
            )}
          </div>
          {Icon && (
            <div className="flex-shrink-0">
              <div className="p-3 rounded-xl bg-primary-50">
                <Icon className="h-6 w-6 text-primary-600" />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);
StatsCard.displayName = "StatsCard";

