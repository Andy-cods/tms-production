"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { updatePriorityThreshold } from "@/actions/priority-config"
import { useToast } from "@/hooks/use-toast"

const editThresholdSchema = z.object({
  minScore: z.number()
    .min(0, "Điểm tối thiểu phải từ 0")
    .max(25, "Điểm tối thiểu không được vượt quá 25"),
  maxScore: z.number()
    .min(0, "Điểm tối đa phải từ 0")
    .max(25, "Điểm tối đa không được vượt quá 25")
}).refine((data) => data.minScore < data.maxScore, {
  message: "Điểm tối thiểu phải nhỏ hơn điểm tối đa",
  path: ["maxScore"]
})

type EditThresholdForm = z.infer<typeof editThresholdSchema>

type PriorityThreshold = {
  id: string
  minScore: number
  maxScore: number
  priority: string
  createdAt: Date
  updatedAt: Date
}

type Props = {
  threshold: PriorityThreshold | null
  isOpen: boolean
  onClose: () => void
}

export function EditThresholdDialog({ threshold, isOpen, onClose }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const toast = useToast()

  const form = useForm<EditThresholdForm>({
    resolver: zodResolver(editThresholdSchema),
    defaultValues: {
      minScore: threshold?.minScore || 0,
      maxScore: threshold?.maxScore || 25
    }
  })

  const { register, handleSubmit, formState: { errors }, reset } = form

  // Reset form when threshold changes
  useState(() => {
    if (threshold) {
      reset({ 
        minScore: threshold.minScore, 
        maxScore: threshold.maxScore 
      })
    }
  })

  const onSubmit = handleSubmit(async (data) => {
    if (!threshold) return

    setSubmitting(true)
    try {
      const result = await updatePriorityThreshold(
        threshold.id, 
        data.minScore, 
        data.maxScore
      )
      
      if (result.ok) {
        toast.success("Cập nhật thành công", result.message)
        onClose()
      } else {
        toast.error("Lỗi cập nhật", result.message)
      }
    } catch (error) {
      console.error("Update threshold error:", error)
      toast.error("Lỗi cập nhật", "Đã xảy ra lỗi không mong muốn")
    } finally {
      setSubmitting(false)
    }
  })

  if (!isOpen || !threshold) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Chỉnh sửa ngưỡng điểm
          </h3>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Độ ưu tiên:</strong> {threshold.priority}
            </p>
            <p className="text-sm text-gray-500">
              Khoảng điểm hiện tại: {threshold.minScore} - {threshold.maxScore}
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Điểm tối thiểu
                </label>
                <input
                  type="number"
                  min="0"
                  max="25"
                  {...register("minScore", { valueAsNumber: true })}
                  className={`w-full border rounded px-3 py-2 ${
                    errors.minScore ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0"
                />
                {errors.minScore && (
                  <p className="text-red-600 text-sm mt-1">{errors.minScore.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Điểm tối đa
                </label>
                <input
                  type="number"
                  min="0"
                  max="25"
                  {...register("maxScore", { valueAsNumber: true })}
                  className={`w-full border rounded px-3 py-2 ${
                    errors.maxScore ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="25"
                />
                {errors.maxScore && (
                  <p className="text-red-600 text-sm mt-1">{errors.maxScore.message}</p>
                )}
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <p className="text-sm text-yellow-800">
                ⚠️ Cảnh báo: Thay đổi khoảng điểm có thể tạo ra khoảng trống hoặc trùng lặp với các ngưỡng khác.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "Đang cập nhật..." : "Cập nhật"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded hover:bg-gray-200"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
