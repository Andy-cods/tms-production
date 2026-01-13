"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Calendar, Info } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DeviationBadge } from "./deviation-badge";

interface TimelineCardProps {
  request: {
    id: string;
    estimatedStartDate?: string | Date | null;
    estimatedEndDate?: string | Date | null;
    estimatedDuration?: number | null;
    actualStartDate?: string | Date | null;
    actualEndDate?: string | Date | null;
    actualDuration?: number | null;
    status?: string;
  };
}

export function TimelineCard({ request }: TimelineCardProps) {
  if (!request.estimatedStartDate || !request.estimatedEndDate) {
    return null;
  }

  const estimatedStart = request.estimatedStartDate
    ? new Date(request.estimatedStartDate)
    : null;
  const estimatedEnd = request.estimatedEndDate ? new Date(request.estimatedEndDate) : null;
  const actualStart = request.actualStartDate ? new Date(request.actualStartDate) : null;
  const actualEnd = request.actualEndDate ? new Date(request.actualEndDate) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estimated Timeline */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-gray-500">Dự kiến bắt đầu</Label>
            <p className="text-sm font-medium">
              {estimatedStart
                ? format(estimatedStart, "dd/MM/yyyy HH:mm", { locale: vi })
                : "—"}
            </p>
          </div>
          <div>
            <Label className="text-xs text-gray-500">Dự kiến hoàn thành</Label>
            <p className="text-sm font-medium">
              {estimatedEnd
                ? format(estimatedEnd, "dd/MM/yyyy HH:mm", { locale: vi })
                : "—"}
            </p>
          </div>
        </div>

        {/* Duration */}
        {request.estimatedDuration && (
          <div>
            <Label className="text-xs text-gray-500">Thời lượng dự kiến</Label>
            <p className="text-sm font-medium">
              {request.estimatedDuration < 24
                ? `${request.estimatedDuration}h`
                : `${Math.round(request.estimatedDuration / 24)}d ${
                    request.estimatedDuration % 24
                  }h`}
            </p>
          </div>
        )}

        {/* Actual Timeline (if completed) */}
        {request.status === "DONE" && request.actualDuration && (
          <div className="pt-3 border-t">
            <div className="flex items-center justify-between mb-2">
              <div>
                <Label className="text-xs text-gray-500">Thời gian thực tế</Label>
                <p className="text-sm font-medium">
                  {request.actualDuration < 24
                    ? `${request.actualDuration}h`
                    : `${Math.round(request.actualDuration / 24)}d`}
                </p>
              </div>
              <DeviationBadge requestId={request.id} />
            </div>
            {actualStart && (
              <div className="text-xs text-gray-500">
                Bắt đầu: {format(actualStart, "dd/MM/yyyy HH:mm", { locale: vi })}
              </div>
            )}
            {actualEnd && (
              <div className="text-xs text-gray-500">
                Hoàn thành: {format(actualEnd, "dd/MM/yyyy HH:mm", { locale: vi })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

