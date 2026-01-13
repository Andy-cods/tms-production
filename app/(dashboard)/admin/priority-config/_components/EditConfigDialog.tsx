"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { updatePriorityConfigWeight } from "@/actions/priority-config"
import { useToast } from "@/hooks/use-toast"

const editConfigSchema = z.object({
  weight: z.number()
    .min(0.1, "Trọng số phải từ 0.1")
    .max(5.0, "Trọng số không được vượt quá 5.0")
})

type EditConfigForm = z.infer<typeof editConfigSchema>

type PriorityConfig = {
  id: string
  question: string
  weight: number
  order: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

type Props = {
  config: PriorityConfig | null
  isOpen: boolean
  onClose: () => void
}

export function EditConfigDialog({ config, isOpen, onClose }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const toast = useToast()

  const form = useForm<EditConfigForm>({
    resolver: zodResolver(editConfigSchema),
    defaultValues: {
      weight: config?.weight || 1.0
    }
  })

  const { register, handleSubmit, formState: { errors }, reset } = form

  // Reset form when config changes
  useState(() => {
    if (config) {
      reset({ weight: config.weight })
    }
  })

  const onSubmit = handleSubmit(async (data) => {
    if (!config) return

    setSubmitting(true)
    try {
      const result = await updatePriorityConfigWeight(config.id, data.weight)
      
      if (result.ok) {
        toast.success("Cập nhật thành công", result.message)
        onClose()
      } else {
        toast.error("Lỗi cập nhật", result.message)
      }
    } catch (error) {
      console.error("Update config error:", error)
      toast.error("Lỗi cập nhật", "Đã xảy ra lỗi không mong muốn")
    } finally {
      setSubmitting(false)
    }
  })

  if (!isOpen || !config) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Chỉnh sửa trọng số
          </h3>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Câu hỏi:</strong> {config.question}
            </p>
            <p className="text-sm text-gray-500">
              Trọng số hiện tại: {config.weight}
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trọng số mới
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="5.0"
                {...register("weight", { valueAsNumber: true })}
                className={`w-full border rounded px-3 py-2 ${
                  errors.weight ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Nhập trọng số (0.1 - 5.0)"
              />
              {errors.weight && (
                <p className="text-red-600 text-sm mt-1">{errors.weight.message}</p>
              )}
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
