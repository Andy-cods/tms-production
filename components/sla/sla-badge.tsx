"use client";

import { useState, useEffect } from "react";
import { differenceInMinutes, add, format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertCircle, CheckCircle } from "lucide-react";

interface SlaBadgeProps {
  deadline: Date;
  pausedDuration?: number;
  status?: string;
  className?: string;
  showIcon?: boolean;
  variant?: 'default' | 'outline' | 'secondary';
}

export function SlaBadge({ 
  deadline, 
  pausedDuration = 0, 
  status, 
  className = "",
  showIcon = true,
  variant = 'default'
}: SlaBadgeProps) {
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
      
      // Calculate percentage remaining (assuming original deadline was calculated from start time)
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
        };
      case 'AT_RISK':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: Clock,
          iconColor: 'text-yellow-600',
        };
      case 'ON_TIME':
      default:
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: CheckCircle,
          iconColor: 'text-green-600',
        };
    }
  };

  const statusConfig = getStatusConfig(currentStatus);
  const Icon = statusConfig.icon;

  const tooltipText = `Deadline: ${format(deadline, 'dd/MM/yyyy HH:mm')}${
    pausedDuration > 0 ? ` (Đã tạm dừng: ${Math.floor(pausedDuration / 60)}h ${pausedDuration % 60}p)` : ''
  }`;

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <Badge 
        variant={variant}
        className={`${statusConfig.color} border text-xs font-medium`}
        title={tooltipText}
      >
        {showIcon && <Icon className={`w-3 h-3 ${statusConfig.iconColor}`} />}
        <span>{formatTimeRemaining(timeRemaining)}</span>
      </Badge>
    </div>
  );
}
