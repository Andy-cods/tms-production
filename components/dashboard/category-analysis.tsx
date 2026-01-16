"use client";

import React, { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { CategoryData } from "@/lib/types/dashboard";
import { TooltipCard } from "@/components/charts/tooltip-card";

interface Props {
  categories: CategoryData[];
  loading?: boolean;
  onCategoryClick?: (categoryId: string) => void;
}

type CategoryTooltipItem = { payload: CategoryData };

function CategoryTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: CategoryTooltipItem[];
}) {
  if (!active || !payload || payload.length === 0) return null;

  const item = payload[0]?.payload;
  if (!item) return null;

  return (
    <TooltipCard>
      <p className="text-sm font-medium text-gray-900 mb-1">{item.categoryName}</p>
      <p className="text-xs text-gray-700">Tổng: {item.total}</p>
      <p className="text-xs text-gray-700">Hoàn thành: {item.completed}</p>
      <p className="text-xs text-gray-600">Tỷ lệ: {item.completionRate.toFixed(1)}%</p>
    </TooltipCard>
  );
}

export function CategoryAnalysis({ categories, loading, onCategoryClick }: Props) {
  const [sortKey, setSortKey] = useState<keyof CategoryData>('total');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-[300px] bg-gray-100 rounded animate-pulse"></div>
        <div className="h-[200px] bg-gray-100 rounded animate-pulse"></div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-gray-50 rounded">
        <p className="text-gray-600">Không có dữ liệu phân loại</p>
      </div>
    );
  }

  const handleSort = (key: keyof CategoryData) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sortedCategories = [...categories].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    const mult = sortDir === 'asc' ? 1 : -1;
    return (aVal > bVal ? 1 : -1) * mult;
  });

  const totalRequests = categories.reduce((sum, cat) => sum + cat.total, 0);

  return (
    <div className="space-y-6">
      {/* Pie Chart */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Phân bố theo phân loại</h4>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={categories as any}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry: any) => `${entry.categoryName}: ${((entry.total / totalRequests) * 100).toFixed(0)}%`}
              outerRadius={100}
              dataKey="total"
              paddingAngle={2}
            >
              {categories.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CategoryTooltip />} />
          </PieChart>
        </ResponsiveContainer>        <div className="text-center text-sm text-gray-600 mt-2">
          Tổng: {totalRequests} yêu cầu
        </div>
      </div>

      {/* Stats Table */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Chi tiết thống kê</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b text-xs">
              <tr>
                <th className="px-3 py-2 text-left cursor-pointer hover:bg-gray-100" onClick={() => handleSort('categoryName')}>
                  Phân loại
                </th>
                <th className="px-3 py-2 text-right cursor-pointer hover:bg-gray-100" onClick={() => handleSort('total')}>
                  Tổng
                </th>
                <th className="px-3 py-2 text-left cursor-pointer hover:bg-gray-100" onClick={() => handleSort('completionRate')}>
                  Hoàn thành
                </th>
                <th className="px-3 py-2 text-right cursor-pointer hover:bg-gray-100" onClick={() => handleSort('avgLeadTime')}>
                  Thời gian TB
                </th>
                <th className="px-3 py-2 text-right cursor-pointer hover:bg-gray-100" onClick={() => handleSort('active')}>
                  Đang xử lý
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedCategories.map((cat) => (
                <tr 
                  key={cat.categoryId}
                  className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onCategoryClick?.(cat.categoryId)}
                >
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="font-medium text-gray-900">{cat.categoryName}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right text-gray-700">
                    {cat.total}
                  </td>
                  <td className="px-3 py-2">
                    <div className="space-y-1">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${cat.completionRate}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600">
                        {cat.completionRate.toFixed(0)}% ({cat.completed}/{cat.total})
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right text-gray-700">
                    {cat.avgLeadTime.toFixed(1)} ngày
                  </td>
                  <td className="px-3 py-2 text-right">
                    <span className={`font-medium ${cat.active > 5 ? 'text-red-600' : 'text-gray-700'}`}>
                      {cat.active}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

