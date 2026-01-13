import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";

interface CategoryStatsCardProps {
  category: {
    id: string;
    name: string;
    icon?: string | null;
  };
  stats: {
    totalRequests: number;
    completedRequests: number;
    activeRequests: number;
    avgCompletionTime?: number; // in hours
    trend?: number; // percentage change
  };
}

export function CategoryStatsCard({
  category,
  stats,
}: CategoryStatsCardProps) {
  const completionRate = stats.totalRequests > 0
    ? Math.round((stats.completedRequests / stats.totalRequests) * 100)
    : 0;

  const trendPositive = (stats.trend || 0) >= 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {category.icon && (
              <span className="text-2xl">{category.icon}</span>
            )}
            <CardTitle className="text-base font-semibold">
              {category.name}
            </CardTitle>
          </div>
          {stats.trend !== undefined && (
            <Badge
              variant={trendPositive ? "default" : "destructive"}
              className="gap-1"
            >
              {trendPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {Math.abs(stats.trend)}%
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Total & Active */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">Tổng requests</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.totalRequests}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Đang xử lý</p>
            <p className="text-2xl font-bold text-orange-600">
              {stats.activeRequests}
            </p>
          </div>
        </div>

        {/* Completion rate */}
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">Tỷ lệ hoàn thành</span>
            <span className="font-semibold text-gray-900">
              {completionRate}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* Avg completion time */}
        {stats.avgCompletionTime !== undefined && (
          <div className="pt-2 border-t">
            <p className="text-xs text-gray-500">Thời gian TB</p>
            <p className="text-sm font-semibold text-gray-900">
              {stats.avgCompletionTime < 24
                ? `${Math.round(stats.avgCompletionTime)}h`
                : `${Math.round(stats.avgCompletionTime / 24)}d`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

