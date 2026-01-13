"use client";

import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { getTimelineDeviation } from "@/actions/requests";

interface DeviationBadgeProps {
  requestId: string;
}

export function DeviationBadge({ requestId }: DeviationBadgeProps) {
  const [deviation, setDeviation] = useState<{
    deviation: number | null;
    status: "early" | "on-time" | "late" | "unknown";
  } | null>(null);

  useEffect(() => {
    async function loadDeviation() {
      try {
        const result = await getTimelineDeviation(requestId);
        if (result.success && result.deviation) {
          setDeviation({
            deviation: result.deviation.deviation,
            status: result.deviation.status,
          });
        }
      } catch (error) {
        console.error("Error loading deviation:", error);
      }
    }

    loadDeviation();
  }, [requestId]);

  if (!deviation || deviation.status === "unknown") return null;

  const { deviation: percent, status } = deviation;

  if (status === "on-time") {
    return (
      <Badge variant="default" className="gap-1">
        <Check className="h-3 w-3" />
        Đúng kế hoạch
      </Badge>
    );
  }

  if (status === "early") {
    return (
      <Badge variant="default" className="gap-1 bg-green-600">
        <TrendingDown className="h-3 w-3" />
        Sớm {percent !== null ? Math.abs(percent) : 0}%
      </Badge>
    );
  }

  return (
    <Badge variant="destructive" className="gap-1">
      <TrendingUp className="h-3 w-3" />
      Trễ {percent !== null ? percent : 0}%
    </Badge>
  );
}

