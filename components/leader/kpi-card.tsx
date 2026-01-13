"use client";

import React from "react";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: "orange" | "green" | "blue" | "yellow" | "red";
  trend?: string;
  suffix?: string;
  className?: string;
}

const colorClasses = {
  orange: {
    bg: "bg-orange-50",
    text: "text-[#ff922b]",
    border: "border-[#ff922b]",
    iconBg: "bg-orange-100",
  },
  green: {
    bg: "bg-green-50",
    text: "text-[#37b24d]",
    border: "border-[#37b24d]",
    iconBg: "bg-green-100",
  },
  blue: {
    bg: "bg-blue-50",
    text: "text-[#4dabf7]",
    border: "border-[#4dabf7]",
    iconBg: "bg-blue-100",
  },
  yellow: {
    bg: "bg-yellow-50",
    text: "text-[#ffd43b]",
    border: "border-[#ffd43b]",
    iconBg: "bg-yellow-100",
  },
  red: {
    bg: "bg-red-50",
    text: "text-[#fa5252]",
    border: "border-[#fa5252]",
    iconBg: "bg-red-100",
  },
};

export function KPICard({ 
  label, 
  value, 
  icon, 
  color, 
  trend, 
  suffix = "", 
  className 
}: KPICardProps) {
  const colors = colorClasses[color];

  return (
    <div 
      className={cn(
        "bg-white rounded-xl p-6 shadow-sm border-l-4 hover:shadow-md transition-all duration-200 group",
        colors.border,
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900 group-hover:text-[#37b24d] transition-colors">
            {value}{suffix}
          </p>
          {trend && (
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {trend}
            </p>
          )}
        </div>
        <div className={cn("p-3 rounded-lg transition-colors", colors.iconBg)}>
          <div className={cn("w-5 h-5", colors.text)}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}
