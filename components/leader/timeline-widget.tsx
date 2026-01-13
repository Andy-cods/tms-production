import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight, Clock, AlertTriangle } from "lucide-react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface TimelineItem {
  id: string;
  title: string;
  status: string;
  priority: string;
  estimatedStartDate: string | null;
  estimatedEndDate: string | null;
  deadline: string | null;
  category: { icon: string | null; name: string };
  assignees: Array<{ name: string; position: string | null } | null>;
}

interface TimelineWidgetProps {
  items: TimelineItem[];
  stats: { total: number; onTrack: number; atRisk: number; overdue: number };
}

export function TimelineWidget({ items, stats }: TimelineWidgetProps) {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const days = Array.from({ length: 14 }, (_, i) => addDays(weekStart, i));

  const itemsByDate = new Map<string, TimelineItem[]>();
  items.forEach((item) => {
    const startDate = item.estimatedStartDate ? new Date(item.estimatedStartDate) : null;
    if (startDate) {
      const dateKey = format(startDate, "yyyy-MM-dd");
      if (!itemsByDate.has(dateKey)) {
        itemsByDate.set(dateKey, []);
      }
      itemsByDate.get(dateKey)!.push(item);
    }
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Timeline - 2 tuần tới
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mt-4">
          <div className="text-center p-2 bg-gray-50 rounded">
            <p className="text-xs text-gray-500">Tổng</p>
            <p className="text-lg font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="text-center p-2 bg-green-50 rounded">
            <p className="text-xs text-green-600">Đúng tiến độ</p>
            <p className="text-lg font-bold text-green-700">{stats.onTrack}</p>
          </div>
          <div className="text-center p-2 bg-yellow-50 rounded">
            <p className="text-xs text-yellow-600">Cần chú ý</p>
            <p className="text-lg font-bold text-yellow-700">{stats.atRisk}</p>
          </div>
          <div className="text-center p-2 bg-red-50 rounded">
            <p className="text-xs text-red-600">Quá hạn</p>
            <p className="text-lg font-bold text-red-700">{stats.overdue}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {days.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const dayItems = itemsByDate.get(dateKey) || [];
            const isToday = isSameDay(day, today);

            return (
              <div
                key={dateKey}
                className={cn(
                  "border-l-4 pl-4 py-2",
                  isToday ? "border-primary bg-primary/5" : "border-gray-200"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-sm font-semibold", isToday ? "text-primary-700" : "text-gray-700")}
                    >
                      {format(day, "EEE, dd/MM", { locale: vi })}
                    </span>
                    {isToday && (
                      <Badge variant="default" className="text-xs">Hôm nay</Badge>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">{dayItems.length} tasks</span>
                </div>

                {dayItems.length > 0 ? (
                  <div className="space-y-2">
                    {dayItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 p-2 bg-white rounded border hover:shadow-sm transition-shadow cursor-pointer"
                      >
                        {item.category.icon && <span className="text-lg">{item.category.icon}</span>}

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {item.estimatedStartDate && (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(item.estimatedStartDate), "HH:mm")}
                              </span>
                            )}
                            {item.assignees.filter(Boolean).length > 0 && (
                              <span className="text-xs text-gray-500">
                                {item.assignees.filter(Boolean)[0]?.name}
                                {item.assignees.filter(Boolean).length > 1 && ` +${item.assignees.filter(Boolean).length - 1}`}
                              </span>
                            )}
                          </div>
                        </div>

                        <Badge
                          variant={item.priority === "HIGH" || item.priority === "URGENT" ? "destructive" : "outline"}
                          className="text-xs"
                        >
                          {item.priority}
                        </Badge>

                        {item.deadline && new Date(item.deadline) <= addDays(new Date(), 2) && (
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">Không có task</p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}


