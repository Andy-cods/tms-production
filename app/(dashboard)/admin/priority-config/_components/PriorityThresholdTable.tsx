"use client"

import { useState } from "react"
import type { Priority } from "@prisma/client"

type PriorityThreshold = {
  id: string
  minScore: number
  maxScore: number
  priority: Priority
  createdAt: Date
  updatedAt: Date
}

type Props = {
  thresholds: PriorityThreshold[]
  onEdit: (threshold: PriorityThreshold) => void
}

const priorityColors = {
  LOW: "bg-gray-100 text-gray-800",
  MEDIUM: "bg-blue-100 text-blue-800", 
  HIGH: "bg-orange-100 text-orange-800",
  URGENT: "bg-red-100 text-red-800"
}

const priorityLabels = {
  LOW: "Thấp",
  MEDIUM: "Trung bình", 
  HIGH: "Cao",
  URGENT: "Khẩn cấp"
}

export function PriorityThresholdTable({ thresholds, onEdit }: Props) {
  const handleEdit = (threshold: PriorityThreshold) => {
    onEdit(threshold)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Khoảng điểm
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Độ ưu tiên
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {thresholds.map((threshold) => (
              <tr key={threshold.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center">
                    <span className="font-medium">{threshold.minScore}</span>
                    <span className="mx-2 text-gray-400">-</span>
                    <span className="font-medium">{threshold.maxScore}</span>
                    <span className="ml-2 text-gray-500">điểm</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                      priorityColors[threshold.priority]
                    }`}
                  >
                    {priorityLabels[threshold.priority]}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => handleEdit(threshold)}
                    className="text-blue-600 hover:text-blue-900 font-medium"
                  >
                    Chỉnh sửa
                  </button>
                </td>
              </tr>
            ))}
            {thresholds.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                  Không có ngưỡng điểm nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
