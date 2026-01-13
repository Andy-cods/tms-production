import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Lock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AchievementCardProps {
  achievement: {
    name: string;
    description: string;
    icon: string;
    xpReward: number;
  };
  progress?: number;
  isCompleted?: boolean;
  completedAt?: Date | null;
  className?: string;
}

export function AchievementCard({
  achievement,
  progress = 0,
  isCompleted = false,
  completedAt,
  className,
}: AchievementCardProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all shadow-md rounded-xl border-gray-200",
        isCompleted 
          ? "border-green-200 bg-gradient-to-br from-green-50 to-emerald-50" 
          : "bg-white",
        className
      )}
    >
      <div className="p-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            className={cn(
              "w-16 h-16 rounded-xl flex items-center justify-center text-3xl flex-shrink-0 transition-all",
              isCompleted
                ? "bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg"
                : "bg-gray-200"
            )}
          >
            {isCompleted ? achievement.icon : <Lock className="h-8 w-8 text-gray-400" />}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3
                  className={cn(
                    "font-semibold text-lg mb-1",
                    isCompleted ? "text-gray-900" : "text-gray-500"
                  )}
                >
                  {achievement.name}
                </h3>
                <p className={cn(
                  "text-sm mt-1",
                  isCompleted ? "text-gray-600" : "text-gray-400"
                )}>
                  {achievement.description}
                </p>
              </div>

              {/* Status */}
              {isCompleted && (
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-1" />
              )}
            </div>

            {/* Reward */}
            <div className="flex items-center gap-3 mt-4">
              <Badge 
                variant={isCompleted ? "default" : "secondary"}
                className={cn(
                  isCompleted && "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                )}
              >
                +{achievement.xpReward} XP
              </Badge>

              {completedAt && (
                <span className="text-xs text-gray-500">
                  {new Date(completedAt).toLocaleDateString()}
                </span>
              )}
            </div>

            {/* Progress (if not completed) */}
            {!isCompleted && progress > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                  <span className="font-medium">Progress</span>
                  <span className="font-semibold">{progress}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Shimmer effect for completed */}
      {isCompleted && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer pointer-events-none" />
      )}
    </Card>
  );
}

