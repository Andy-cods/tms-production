"use client";

import React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { CheckCircle, AlertCircle, MessageCircle } from "lucide-react";
import type { ReworkData, ApprovalData, ClarificationData } from "@/lib/services/quality-service";

interface Props {
  reworkData: ReworkData;
  approvalData: ApprovalData;
  clarificationData: ClarificationData;
  loading?: boolean;
}

export function QualityMetrics({ reworkData, approvalData, clarificationData, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-50 rounded-lg p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
            <div className="h-[200px] bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="space-y-6">
      {/* Quality Insights */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          Thông tin chất lượng
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Tỷ lệ làm lại:</p>
            <p className={`text-lg font-bold ${reworkData.overall <= 10 ? 'text-green-600' : 'text-red-600'}`}>
              {reworkData.overall.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-gray-600">Duyệt lần đầu:</p>
            <p className={`text-lg font-bold ${approvalData.overall >= 80 ? 'text-green-600' : 'text-amber-600'}`}>
              {approvalData.overall.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-gray-600">Cần làm rõ:</p>
            <p className={`text-lg font-bold ${clarificationData.overall <= 15 ? 'text-green-600' : 'text-amber-600'}`}>
              {clarificationData.overall.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rework Rate Trend */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <h3 className="text-base font-semibold text-gray-900">Xu hướng làm lại</h3>
          </div>
          
          {reworkData.trend.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={reworkData.trend} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 20]} tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ fontSize: 12 }}
                    formatter={(value: any) => `${value}%`}
                    labelFormatter={(label) => `${label}`}
                  />
                  <ReferenceLine 
                    y={10} 
                    stroke="#ef4444" 
                    strokeDasharray="5 5"
                    label={{ value: 'Mục tiêu 10%', fontSize: 10, fill: '#6b7280' }}
                  />
                  <Line 
                    type="monotone"
                    dataKey="rate" 
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-3 text-xs text-gray-600">
                {reworkData.trend.length >= 2 && (
                  <p>
                    {reworkData.trend[reworkData.trend.length - 1].rate < reworkData.trend[reworkData.trend.length - 2].rate
                      ? '📈 Đang cải thiện'
                      : '📉 Cần chú ý'}
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center bg-gray-50 rounded">
              <p className="text-sm text-gray-600">Chưa có dữ liệu</p>
            </div>
          )}
        </div>

        {/* First-Time Approval Leaderboard */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <h3 className="text-base font-semibold text-gray-900">Bảng xếp hạng duyệt lần đầu</h3>
          </div>
          
          {approvalData.byAssignee.length > 0 ? (
            <div className="space-y-2">
              {approvalData.byAssignee.slice(0, 10).map((assignee, index) => (
                <div key={assignee.assigneeId} className="flex items-center gap-2">
                  <span className="text-lg w-6">
                    {index < 3 ? medals[index] : `${index + 1}.`}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium text-gray-900 truncate">
                        {assignee.name}
                      </span>
                      <span className={`font-bold ${
                        assignee.rate >= 90 ? 'text-green-600' :
                        assignee.rate >= 70 ? 'text-blue-600' :
                        'text-amber-600'
                      }`}>
                        {assignee.rate.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          assignee.rate >= 90 ? 'bg-green-500' :
                          assignee.rate >= 70 ? 'bg-blue-500' :
                          'bg-amber-500'
                        }`}
                        style={{ width: `${assignee.rate}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {assignee.approvedFirstTime}/{assignee.totalTasks} tasks
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center bg-gray-50 rounded">
              <p className="text-sm text-gray-600">Chưa có dữ liệu</p>
            </div>
          )}
        </div>

        {/* Clarification Analysis */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="h-5 w-5 text-amber-500" />
            <h3 className="text-base font-semibold text-gray-900">Phân tích làm rõ</h3>
          </div>
          
          {clarificationData.byRequester.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart 
                  data={clarificationData.byRequester.slice(0, 5)} 
                  margin={{ top: 10, right: 10, left: 0, bottom: 40 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    tick={{ fontSize: 11 }}
                    width={80}
                  />
                  <Tooltip 
                    contentStyle={{ fontSize: 12 }}
                    formatter={(value: any, _name?: string, props?: any) => [
                      `${value}% (${props.payload.count}/${props.payload.totalRequests})`,
                      'Cần làm rõ'
                    ]}
                  />
                  <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
                    {clarificationData.byRequester.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.rate > 30 ? '#f97316' : '#f59e0b'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-3 text-xs text-gray-600">
                <p>Tổng: {clarificationData.overall.toFixed(1)}% yêu cầu cần làm rõ</p>
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center bg-gray-50 rounded">
              <p className="text-sm text-gray-600">Chưa có dữ liệu</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

