"use client";

import { useState, useEffect } from "react";
import { differenceInMinutes, add, format } from "date-fns";
import { Clock, AlertCircle, CheckCircle, Pause } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface SlaCountdownProps {
  deadline: Date;
  pausedDuration?: number;
  showIcon?: boolean;
  variant?: 'badge' | 'text' | 'full';
  className?: string;
  isPaused?: boolean;
}

export function SlaCountdown({ 
  deadline, 
  pausedDuration = 0, 
  showIcon = true,
  variant = 'badge',
  className = "",
  isPaused = false
}: SlaCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [percentageRemaining, setPercentageRemaining] = useState<number>(100);
  const [currentStatus, setCurrentStatus] = useState<string>('ON_TIME');

  useEffect(() => {
    const calculateStatus = () => {
      const now = new Date();
      
      // Adjust deadline by adding paused duration
      const adjustedDeadline = add(deadline, { minutes: -pausedDuration });
      
      // Calculate time remaining
      const remaining = differenceInMinutes(adjustedDeadline, now);
      setTimeRemaining(remaining);
      
      // Calculate percentage remaining
      const totalDuration = differenceInMinutes(deadline, add(now, { minutes: -remaining }));
      const percentage = totalDuration > 0 ? Math.max(0, (remaining / totalDuration) * 100) : 0;
      setPercentageRemaining(percentage);
      
      // Determine status
      let newStatus: string;
      if (remaining <= 0) {
        newStatus = 'OVERDUE';
      } else if (percentage < 25) {
        newStatus = 'AT_RISK';
      } else {
        newStatus = 'ON_TIME';
      }
      
      setCurrentStatus(newStatus);
    };

    // Calculate initial status
    calculateStatus();

    // Update every minute
    const interval = setInterval(calculateStatus, 60000);

    return () => clearInterval(interval);
  }, [deadline, pausedDuration]);

  const formatTimeRemaining = (minutes: number): string => {
    if (minutes <= 0) {
      const overdueMinutes = Math.abs(minutes);
      if (overdueMinutes < 60) {
        return `Quá hạn ${overdueMinutes}p`;
      } else {
        const hours = Math.floor(overdueMinutes / 60);
        const mins = overdueMinutes % 60;
        return `Quá hạn ${hours}h ${mins > 0 ? mins + 'p' : ''}`.trim();
      }
    } else {
      if (minutes < 60) {
        return `Còn ${minutes}p`;
      } else {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `Còn ${hours}h ${mins > 0 ? mins + 'p' : ''}`.trim();
      }
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'OVERDUE':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: AlertCircle,
          iconColor: 'text-red-600',
          progressColor: 'bg-red-500',
        };
      case 'AT_RISK':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: Clock,
          iconColor: 'text-yellow-600',
          progressColor: 'bg-yellow-500',
        };
      case 'ON_TIME':
      default:
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: CheckCircle,
          iconColor: 'text-green-600',
          progressColor: 'bg-green-500',
        };
    }
  };

  const statusConfig = getStatusConfig(currentStatus);
  const Icon = statusConfig.icon;

  const tooltipText = `Deadline: ${format(deadline, 'dd/MM/yyyy HH:mm')}${
    pausedDuration > 0 ? ` (Đã tạm dừng: ${Math.floor(pausedDuration / 60)}h ${pausedDuration % 60}p)` : ''
  }`;

  if (variant === 'text') {
    return (
      <span 
        className={`text-sm ${statusConfig.color} px-2 py-1 rounded ${className}`}
        title={tooltipText}
      >
        {showIcon && <Icon className={`w-4 h-4 inline mr-1 ${statusConfig.iconColor}`} />}
        {isPaused && <Pause className="w-4 h-4 inline mr-1 text-gray-500" />}
        {formatTimeRemaining(timeRemaining)}
      </span>
    );
  }

  if (variant === 'full') {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {showIcon && <Icon className={`w-4 h-4 ${statusConfig.iconColor}`} />}
            {isPaused && <Pause className="w-4 h-4 text-gray-500" />}
            <span className="text-sm font-medium">{formatTimeRemaining(timeRemaining)}</span>
          </div>
          <span className="text-xs text-gray-500">
            {format(deadline, 'dd/MM HH:mm')}
          </span>
        </div>
        <Progress 
          value={Math.max(0, Math.min(100, percentageRemaining))} 
          className="h-2"
        />
        <div className="text-xs text-gray-500">
          {pausedDuration > 0 && `Đã tạm dừng: ${Math.floor(pausedDuration / 60)}h ${pausedDuration % 60}p`}
        </div>
      </div>
    );
  }

  // Default badge variant
  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <Badge 
        variant="outline"
        className={`${statusConfig.color} border text-xs font-medium`}
        title={tooltipText}
      >
        {showIcon && <Icon className={`w-3 h-3 ${statusConfig.iconColor}`} />}
        {isPaused && <Pause className="w-3 h-3 text-gray-500" />}
        <span>{formatTimeRemaining(timeRemaining)}</span>
      </Badge>
    </div>
  );
}
