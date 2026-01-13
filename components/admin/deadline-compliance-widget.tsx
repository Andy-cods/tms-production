import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { RequestStatus } from "@prisma/client";

export async function DeadlineComplianceWidget() {
  const requests = await prisma.request.findMany({
    where: {
      deadline: { not: null },
      status: { in: [RequestStatus.DONE, RequestStatus.IN_REVIEW, RequestStatus.OPEN] },
    },
    select: {
      id: true,
      deadline: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const total = requests.length;
  const completed = requests.filter((r) => r.status === "DONE");
  const onTime = completed.filter((r) => r.deadline && r.updatedAt && r.updatedAt <= r.deadline);
  const late = completed.filter((r) => r.deadline && r.updatedAt && r.updatedAt > r.deadline);

  const onTimeRate = completed.length > 0 ? Math.round((onTime.length / completed.length) * 100) : 0;

  const violationsByCategory = late.reduce((acc, r) => {
    if (!r.category) return acc;
    const key = r.category.id;
    if (!acc[key]) {
      acc[key] = { category: r.category.name, count: 0 };
    }
    acc[key].count++;
    return acc;
  }, {} as Record<string, { category: string; count: number }>);

  const topViolations = Object.values(violationsByCategory)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary-600" />
            Deadline Compliance
          </CardTitle>
          <Badge variant={onTimeRate >= 90 ? "default" : "destructive"}>
            {onTimeRate >= 90 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {onTimeRate}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500">Tổng</p>
            <p className="text-2xl font-bold text-gray-900">{total}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Đúng hạn</p>
            <p className="text-2xl font-bold text-green-600">{onTime.length}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Trễ</p>
            <p className="text-2xl font-bold text-red-600">{late.length}</p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Tỷ lệ đúng hạn</span>
            <span className="font-semibold">{onTimeRate}%</span>
          </div>
          <Progress value={onTimeRate} className="h-2" />
        </div>

        {topViolations.length > 0 && (
          <div className="pt-3 border-t">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Categories vi phạm nhiều nhất
            </div>
            <div className="space-y-2">
              {topViolations.map((v, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{v.category}</span>
                  <Badge variant="destructive" className="text-xs">
                    {v.count} late
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
