"use client";

import React from "react";
import { ArrowUp, ArrowDown, Minus, type LucideIcon } from "lucide-react";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";

export interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: "up" | "down" | "stable";
  icon: string;
  color: string;
  description?: string;
  loading?: boolean;
}

export function KPICard({ title, value, change, trend, icon, color, description, loading }: KPICardProps) {
  const IconComponent = (Icons as any)[icon] as LucideIcon;
  void color;

  if (loading) {
    return (
      <div className="relative bg-white rounded-2xl border border-gray-200 shadow-sm p-6 overflow-hidden">
        {/* Shimmer animation */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
        
        <div className="flex items-start justify-between mb-4">
          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
          <div className="h-12 w-12 bg-gray-200 rounded-full animate-pulse" />
        </div>
        <div className="h-10 bg-gray-200 rounded w-28 mb-2 animate-pulse" />
        <div className="h-3 bg-gray-200 rounded w-20 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="group relative bg-white rounded-2xl border-l-4 border-l-primary-500 shadow-primary-sm hover:shadow-primary-md transition-all hover:-translate-y-1 overflow-hidden">
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/0 via-transparent to-accent-500/0 group-hover:from-primary-500/5 group-hover:to-accent-500/5 transition-all pointer-events-none" />
      
      <div className="relative p-6">
        {/* Icon */}
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-sm font-semibold text-dark-600 uppercase tracking-wide">{title}</h3>
          {IconComponent && (
            <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <IconComponent className="h-6 w-6 text-primary-600" strokeWidth={2} />
            </div>
          )}
        </div>

        {/* Value */}
        <div className="mb-3">
          <div className="text-4xl font-bold text-gray-900 tracking-tight">{value}</div>
        </div>

        {/* Change indicator */}
        {change !== undefined && (
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
                trend === "up" && "bg-green-100 text-green-700",
                trend === "down" && "bg-red-100 text-red-700",
                trend === "stable" && "bg-gray-100 text-gray-700"
              )}
            >
              {trend === "up" && <ArrowUp className="h-3 w-3" strokeWidth={3} />}
              {trend === "down" && <ArrowDown className="h-3 w-3" strokeWidth={3} />}
              {trend === "stable" && <Minus className="h-3 w-3" strokeWidth={3} />}
              <span>
                {change > 0 && trend !== "down" ? "+" : ""}
                {change}%
              </span>
            </div>
            {description && <span className="text-xs text-gray-500">{description}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

export interface KPICardsGridProps {
  kpis: KPICardProps[];
  loading?: boolean;
}

export function KPICardsGrid({ kpis, loading }: KPICardsGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <KPICard
            key={i}
            title=""
            value=""
            icon="Activity"
            color="blue"
            loading={true}
          />
        ))}
      </div>
    );
  }

  if (kpis.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg border-2 border-dashed p-12 text-center">
        <p className="text-gray-600">Không có dữ liệu trong khoảng thời gian này</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {kpis.map((kpi) => (
        <KPICard key={kpi.title} {...kpi} />
      ))}
    </div>
  );
}

