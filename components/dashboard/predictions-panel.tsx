"use client";

import React from "react";
import {
  TrendingUp,
  AlertTriangle,
  Calendar,
  BarChart3,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type {
  ForecastData,
  BurnoutRisk,
  CapacityShortfall,
} from "@/lib/services/prediction-service";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface Props {
  forecast: ForecastData | null;
  burnoutRisks: BurnoutRisk[];
  capacityShortfalls: CapacityShortfall[];
  loading?: boolean;
}

export function PredictionsPanel({ 
  forecast, 
  burnoutRisks, 
  capacityShortfalls,
  loading 
}: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-64 bg-gray-100 rounded animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Card 1: Forecast */}
      <div className="border rounded-lg p-6 bg-gradient-to-br from-blue-50 to-white">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Dự báo hoàn thành</h3>
        </div>

        {forecast ? (
          <div className="space-y-4">
            <div>
              <p className="text-3xl font-bold text-gray-900">
                {forecast.backlogCount}
              </p>
              <p className="text-sm text-gray-600">yêu cầu còn lại</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Dự kiến hoàn thành</span>
                <Badge
                  variant="outline"
                  className={
                    forecast.confidence === 'high' ? 'bg-green-50 text-green-700' :
                    forecast.confidence === 'medium' ? 'bg-yellow-50 text-yellow-700' :
                    'bg-gray-50 text-gray-700'
                  }
                >
                  {forecast.confidence === 'high' ? 'Độ tin cậy cao' :
                   forecast.confidence === 'medium' ? 'Độ tin cậy TB' :
                   'Độ tin cậy thấp'}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 text-gray-900">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="font-medium">
                  {format(forecast.forecastDate, 'dd MMMM yyyy', { locale: vi })}
                </span>
              </div>

              <p className="text-xs text-gray-600">
                ({forecast.estimatedDays} ngày, năng suất TB: {forecast.avgThroughput}/ngày)
              </p>
            </div>

            <Progress 
              value={Math.min(100, (forecast.backlogCount / (forecast.backlogCount + 10)) * 100)} 
              className="h-2"
            />
          </div>
        ) : (
          <p className="text-sm text-gray-500">Chưa có dữ liệu dự báo</p>
        )}
      </div>

      {/* Card 2: Burnout Risks */}
      <div className="border rounded-lg p-6 bg-gradient-to-br from-orange-50 to-white">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          <h3 className="font-semibold text-gray-900">Cảnh báo burnout</h3>
        </div>

        {burnoutRisks.length > 0 ? (
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {burnoutRisks.slice(0, 3).map((risk) => (
              <div 
                key={risk.userId}
                className={`border rounded-lg p-3 ${
                  risk.severity === 'high' ? 'bg-red-50 border-red-200' :
                  risk.severity === 'medium' ? 'bg-orange-50 border-orange-200' :
                  'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-sm text-gray-900">
                    {risk.userName}
                  </p>
                  <Badge 
                    variant="outline"
                    className={
                      risk.severity === 'high' ? 'bg-red-100 text-red-700' :
                      risk.severity === 'medium' ? 'bg-orange-100 text-orange-700' :
                      'bg-yellow-100 text-yellow-700'
                    }
                  >
                    {risk.riskScore}
                  </Badge>
                </div>

                <div className="space-y-1 mb-2">
                  {risk.factors.slice(0, 2).map((factor, idx) => (
                    <p key={idx} className="text-xs text-gray-600">
                      • {factor}
                    </p>
                  ))}
                </div>

                <p className="text-xs text-gray-700 italic">
                  💡 {risk.recommendation}
                </p>
              </div>
            ))}

            {burnoutRisks.length > 3 && (
              <p className="text-xs text-center text-gray-500">
                +{burnoutRisks.length - 3} người khác
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-green-600 font-medium mb-1">✅ Không phát hiện rủi ro</p>
            <p className="text-xs text-gray-600">Workload đang ổn định</p>
          </div>
        )}
      </div>

      {/* Card 3: Capacity Planning */}
      <div className="border rounded-lg p-6 bg-gradient-to-br from-purple-50 to-white">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">Kế hoạch năng lực</h3>
        </div>

        {capacityShortfalls.length > 0 ? (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={capacityShortfalls}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="week" 
                  tick={{ fontSize: 10 }}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ fontSize: 12 }}
                  formatter={(value: any) => [`${value} tasks`, '']}
                />
                <Bar dataKey="capacity" fill="#10b981" name="Capacity" />
                <Bar dataKey="demand" fill="#3b82f6" name="Demand" />
              </BarChart>
            </ResponsiveContainer>

            {/* Summary */}
            <div className="space-y-2">
              {capacityShortfalls
                .filter(s => s.shortfall > 0)
                .slice(0, 2)
                .map((shortfall) => (
                  <div 
                    key={shortfall.week}
                    className={`text-xs p-2 rounded ${
                      shortfall.severity === 'high' ? 'bg-red-50 text-red-700' :
                      shortfall.severity === 'medium' ? 'bg-orange-50 text-orange-700' :
                      'bg-yellow-50 text-yellow-700'
                    }`}
                  >
                    ⚠️ {shortfall.week}: Thiếu {shortfall.shortfall} slot
                  </div>
                ))}
              
              {capacityShortfalls.every(s => s.shortfall === 0) && (
                <div className="text-center py-2">
                  <p className="text-xs text-green-600">✅ Năng lực đủ cho 4 tuần tới</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Chưa có dữ liệu dự báo</p>
        )}
      </div>
    </div>
  );
}

