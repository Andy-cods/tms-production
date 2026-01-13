"use client"

import { useState } from "react"
import { PriorityConfigTable } from "./PriorityConfigTable"
import { PriorityThresholdTable } from "./PriorityThresholdTable"
import { EditConfigDialog } from "./EditConfigDialog"
import { EditThresholdDialog } from "./EditThresholdDialog"
import type { Priority } from "@prisma/client"

type PriorityConfig = {
  id: string
  question: string
  weight: number
  order: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

type PriorityThreshold = {
  id: string
  minScore: number
  maxScore: number
  priority: Priority
  createdAt: Date
  updatedAt: Date
}

type Props = {
  priorityConfigs: PriorityConfig[]
  priorityThresholds: PriorityThreshold[]
}

export function AdminPriorityConfigClient({ priorityConfigs, priorityThresholds }: Props) {
  const [editingConfig, setEditingConfig] = useState<PriorityConfig | null>(null)
  const [editingThreshold, setEditingThreshold] = useState<PriorityThreshold | null>(null)
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false)
  const [isThresholdDialogOpen, setIsThresholdDialogOpen] = useState(false)

  const handleEditConfig = (config: PriorityConfig) => {
    setEditingConfig(config)
    setIsConfigDialogOpen(true)
  }

  const handleEditThreshold = (threshold: PriorityThreshold) => {
    setEditingThreshold(threshold)
    setIsThresholdDialogOpen(true)
  }

  const handleCloseConfigDialog = () => {
    setIsConfigDialogOpen(false)
    setEditingConfig(null)
  }

  const handleCloseThresholdDialog = () => {
    setIsThresholdDialogOpen(false)
    setEditingThreshold(null)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Cấu hình độ ưu tiên
        </h1>
        <p className="text-gray-600">
          Quản lý câu hỏi đánh giá và ngưỡng điểm
        </p>
      </div>

      {/* Section 1: Priority Config Questions */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Câu hỏi đánh giá
          </h2>
          <button
            disabled
            className="px-4 py-2 bg-gray-300 text-gray-500 rounded-md cursor-not-allowed text-sm"
          >
            Thêm câu hỏi (Phase 2)
          </button>
        </div>
        
        <PriorityConfigTable 
          configs={priorityConfigs} 
          onEdit={handleEditConfig}
        />
      </div>

      {/* Section 2: Priority Thresholds */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Ngưỡng điểm
          </h2>
          <div className="text-sm text-gray-500">
            Điểm tối đa: 25 (5 × 5 điểm)
          </div>
        </div>
        
        <PriorityThresholdTable 
          thresholds={priorityThresholds}
          onEdit={handleEditThreshold}
        />
      </div>

      {/* Dialogs */}
      <EditConfigDialog
        config={editingConfig}
        isOpen={isConfigDialogOpen}
        onClose={handleCloseConfigDialog}
      />

      <EditThresholdDialog
        threshold={editingThreshold}
        isOpen={isThresholdDialogOpen}
        onClose={handleCloseThresholdDialog}
      />
    </div>
  )
}
