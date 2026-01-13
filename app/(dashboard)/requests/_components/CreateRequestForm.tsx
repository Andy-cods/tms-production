"use client"

import { useState, useEffect, useMemo, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createRequestSchema } from "@/lib/validations/request"
import type { CreateRequestInput } from "@/lib/validations/request"
import { createRequestAction } from "@/actions/requests"
import { useToast } from "@/hooks/use-toast"
import { calculatePriorityScore } from "@/lib/services/priority-calculator"
import type { Priority, RequesterType } from "@prisma/client"
import { getCatalogRule, computeFixedDeadline } from "@/lib/catalog"

type Category = { id: string; name: string; teamId?: string | null }
type Team = { id: string; name: string }
type Attachment = { fileName: string; fileUrl: string }
type PriorityConfig = { id: string; question: string; weight: number; order: number }

export function CreateRequestForm({ 
  categories, 
  teams,
  priorityConfigs 
}: { 
  categories: Category[]
  teams: Team[]
  priorityConfigs: PriorityConfig[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [submitting, setSubmitting] = useState(false)
  const [priorityPreview, setPriorityPreview] = useState<{
    score: number
    priority: Priority
    reason: string
  } | null>(null)
  const [calculating, setCalculating] = useState(false)
  const toast = useToast()

  const form = useForm<CreateRequestInput>({
    defaultValues: {
      title: "",
      description: "",
      categoryId: "",
      teamId: "",
      priority: "MEDIUM",
      deadline: "",
      attachments: [],
      tags: [],
      isUrgent: false,
      urgencyScore: undefined,
      impactScore: undefined,
      riskScore: undefined,
      customScores: undefined,
      requesterType: "INTERNAL"
    }
  })

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset, getValues } = form

  const attachments = watch("attachments") || []
  const urgencyScore = watch("urgencyScore")
  const impactScore = watch("impactScore")
  const riskScore = watch("riskScore")
  const requesterType = watch("requesterType")
  const selectedTeamId = watch("teamId")
  const templateId = watch("templateId")
  const catalogRule = getCatalogRule(templateId)

  // Lock deadline when using a catalog template
  useEffect(() => {
    if (catalogRule?.enforceFixedTime) {
      const fixed = computeFixedDeadline(catalogRule)
      setValue("deadline", fixed.toISOString().slice(0, 10))
    }
  }, [catalogRule, setValue])

  // Filter categories based on selected team
  const filteredCategories = useMemo(() => {
    if (!selectedTeamId) return categories // Show all if no team
    return categories.filter(cat => cat.teamId === selectedTeamId)
  }, [selectedTeamId, categories])

  // Clear category when team changes (if category doesn't belong to new team)
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === "teamId") {
        const currentCategoryId = getValues("categoryId")
        if (currentCategoryId) {
          const isCategoryInNewTeam = filteredCategories.some(
            cat => cat.id === currentCategoryId
          )
          if (!isCategoryInNewTeam) {
            setValue("categoryId", "")
            console.log("[CreateRequestForm] Cleared category - not in selected team")
          }
        }
        console.log("[CreateRequestForm] Team changed:", value.teamId, "Filtered categories:", filteredCategories.length)
      }
    })
    return () => subscription.unsubscribe()
  }, [watch, filteredCategories, getValues, setValue])

  // Calculate priority preview when scores change
  useEffect(() => {
    const calculatePreview = async () => {
      if (!urgencyScore && !impactScore && !riskScore) {
        setPriorityPreview(null)
        return
      }

      setCalculating(true)
      try {
        const result = await calculatePriorityScore(
          {
            urgency: urgencyScore,
            impact: impactScore,
            risk: riskScore,
          },
          requesterType as RequesterType
        )
        if (result) {
          setPriorityPreview({
            score: result.totalScore,
            priority: result.priority,
            reason: result.reason
          })
        } else {
          setPriorityPreview(null)
        }
      } catch (error) {
        console.error("Priority calculation error:", error)
        setPriorityPreview(null)
      } finally {
        setCalculating(false)
      }
    }

    calculatePreview()
  }, [urgencyScore, impactScore, riskScore, requesterType])

  const onSubmit = handleSubmit(async (data: CreateRequestInput) => {
    // Validate with Zod first
    const validation = createRequestSchema.safeParse(data)
    if (!validation.success) {
      // Set form errors
      validation.error.issues.forEach(issue => {
        const field = issue.path[0] as keyof CreateRequestInput
        form.setError(field, { message: issue.message })
      })
      return
    }

    setSubmitting(true)

    // Convert to FormData format expected by server action
    const formData = new FormData()
    formData.append("title", data.title)
    formData.append("description", data.description)
    if (data.categoryId) formData.append("categoryId", data.categoryId)
    if (data.teamId) formData.append("teamId", data.teamId)
    formData.append("priority", data.priority)
    if (data.deadline) formData.append("deadline", data.deadline)
    if (data.tags?.length) formData.append("tags", data.tags.join(","))
    if (data.isUrgent) formData.append("isUrgent", "true")
    if (data.templateId) formData.append("templateId", data.templateId)
    if (data.attachments?.length) {
      formData.append("attachments", JSON.stringify(data.attachments))
    }
    // Priority scoring fields
    if (data.urgencyScore) formData.append("urgencyScore", data.urgencyScore.toString())
    if (data.impactScore) formData.append("impactScore", data.impactScore.toString())
    if (data.riskScore) formData.append("riskScore", data.riskScore.toString())
    if (data.customScores) formData.append("customScores", JSON.stringify(data.customScores))
    formData.append("requesterType", data.requesterType)

    startTransition(() => {
      createRequestAction(formData).then((result) => {
        if (!result.ok) {
          // Handle server-side validation errors
          toast.error("Lỗi tạo request", result.message)
          setSubmitting(false)
          return
        }

        // Success - reset form and navigate
        reset()
        toast.success("Tạo request thành công", "Request đã được tạo và chuyển đến danh sách.")
        router.push(`/requests?status=OPEN`)
      }).catch((error) => {
        console.error("Form submission error:", error)
        toast.error("Lỗi tạo request", "Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.")
        setSubmitting(false)
      })
    })
  })

  function addAttachment() {
    const newAttachments = [...attachments, { fileName: "", fileUrl: "" }]
    setValue("attachments", newAttachments)
  }

  function removeAttachment(index: number) {
    const newAttachments = attachments.filter((_, i) => i !== index)
    setValue("attachments", newAttachments)
  }

  function updateAttachment(index: number, field: keyof Attachment, value: string) {
    const newAttachments = [...attachments]
    newAttachments[index] = { ...newAttachments[index], [field]: value }
    setValue("attachments", newAttachments)
  }

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Tạo Request mới</h1>

      <form className="space-y-4 bg-white p-6 rounded-lg shadow" onSubmit={onSubmit}>
        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1">Tiêu đề *</label>
          <input 
            {...register("title")}
            className={`w-full border rounded px-3 py-2 ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Nhập tiêu đề request..."
          />
          {errors.title && (
            <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">Mô tả *</label>
          <textarea 
            {...register("description")}
            rows={5} 
            className={`w-full border rounded px-3 py-2 ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Mô tả chi tiết về request..."
          />
          {errors.description && (
            <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
          )}
        </div>

        {/* Row: Team, Category, Priority, Deadline */}
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Phòng ban xử lý</label>
            <select 
              {...register("teamId")}
              className={`w-full border rounded px-3 py-2 ${
                errors.teamId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">-- Chọn phòng ban --</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
            {errors.teamId && (
              <p className="text-red-600 text-sm mt-1">{errors.teamId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Phân loại {templateId && <span className="text-red-500">*</span>}
            </label>
            <select 
              {...register("categoryId")}
              className={`w-full border rounded px-3 py-2 ${
                errors.categoryId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">-- Chọn phân loại --</option>
              {filteredCategories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.categoryId && (
              <p className="text-red-600 text-sm mt-1">{errors.categoryId.message}</p>
            )}
            {selectedTeamId && (
              <p className="text-xs text-gray-500 mt-1">
                Hiển thị {filteredCategories.length} phân loại của phòng ban đã chọn
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Độ ưu tiên</label>
            <select 
              {...register("priority")}
              className="w-full border rounded px-3 py-2 border-gray-300"
            >
              <option value="LOW">Thấp</option>
              <option value="MEDIUM">Trung bình</option>
              <option value="HIGH">Cao</option>
              <option value="URGENT">Khẩn cấp</option>
            </select>
            {errors.priority && (
              <p className="text-red-600 text-sm mt-1">{errors.priority.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Deadline</label>
            <input 
              type="date" 
              {...register("deadline")}
              className={`w-full border rounded px-3 py-2 ${
                errors.deadline ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={!!catalogRule?.enforceFixedTime}
            />
            {errors.deadline && (
              <p className="text-red-600 text-sm mt-1">{errors.deadline.message}</p>
            )}
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium mb-1">Tags (phân tách bằng dấu phẩy)</label>
          <input 
            {...register("tags", {
              setValueAs: (value: unknown) => {
                if (Array.isArray(value)) return value as string[];
                if (typeof value === "string") {
                  return value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean);
                }
                if (value == null) return [] as string[];
                return [] as string[];
              },
            })}
            className="w-full border rounded px-3 py-2 border-gray-300"
            placeholder="urgent, vip"
          />
          {errors.tags && (
            <p className="text-red-600 text-sm mt-1">{errors.tags.message}</p>
          )}
        </div>

        {/* Attachments */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Google Drive Links</label>
            <button 
              type="button" 
              className="px-3 py-1 border rounded text-sm hover:bg-gray-50"
              onClick={addAttachment}
            >
              + Thêm file
            </button>
          </div>
          
          {attachments.map((att, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input 
                className="border rounded px-3 py-2 flex-1" 
                placeholder="Tên file"
                value={att.fileName}
                onChange={(e) => updateAttachment(i, "fileName", e.target.value)}
              />
              <input 
                className="border rounded px-3 py-2 flex-[2]" 
                placeholder="https://drive.google.com/..."
                value={att.fileUrl}
                onChange={(e) => updateAttachment(i, "fileUrl", e.target.value)}
              />
              <button 
                type="button" 
                className="px-3 border rounded hover:bg-gray-50"
                onClick={() => removeAttachment(i)}
              >
                ✕
              </button>
            </div>
          ))}
          {errors.attachments && (
            <p className="text-red-600 text-sm mt-1">{errors.attachments.message}</p>
          )}
        </div>

        {/* Urgent */}
        <div className="flex items-center gap-2">
          <input 
            id="urgent" 
            type="checkbox" 
            {...register("isUrgent", {
              setValueAs: (v: unknown) => {
                if (typeof v === "boolean") return v;
                if (typeof v === "string") return v === "true" || v === "on" || v === "1";
                return false;
              },
            })}
            className="w-4 h-4"
          />
          <label htmlFor="urgent" className="text-sm">Đánh dấu khẩn cấp</label>
        </div>

        {/* Priority Scoring Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Đánh giá độ ưu tiên</h3>
          
          {/* Requester Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Loại người yêu cầu
              <span className="ml-2 text-xs text-gray-500">
                (Khách hàng được ưu tiên cao hơn khi cùng điểm)
              </span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="INTERNAL"
                  {...register("requesterType")}
                  className="w-4 h-4"
                />
                <span className="text-sm">Nội bộ</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="CUSTOMER"
                  {...register("requesterType")}
                  className="w-4 h-4"
                />
                <span className="text-sm">Khách hàng</span>
              </label>
            </div>
            {errors.requesterType && (
              <p className="text-red-600 text-sm mt-1">{errors.requesterType.message}</p>
            )}
          </div>

          {/* Priority Questions */}
          {priorityConfigs.map((config, index) => {
            const fieldName = config.question.includes("khẩn cấp") || config.question.includes("urgency") 
              ? "urgencyScore" 
              : config.question.includes("tác động") || config.question.includes("impact")
              ? "impactScore"
              : config.question.includes("rủi ro") || config.question.includes("risk")
              ? "riskScore"
              : null

            if (!fieldName) return null

            return (
              <div key={config.id} className="mb-6">
                <label className="block text-sm font-medium mb-3">
                  {config.question}
                </label>
                <div className="flex gap-2 flex-wrap">
                  {[1, 2, 3, 4, 5].map((score) => {
                    const colors = ["🔵", "🟢", "🟡", "🟠", "🔴"]
                    const labels = ["Thấp", "Trung bình thấp", "Trung bình", "Cao", "Rất cao"]
                    const isSelected = watch(fieldName) === score
                    
                    return (
                      <label
                        key={score}
                        className={`flex items-center gap-2 px-3 py-2 border rounded cursor-pointer transition-colors ${
                          isSelected 
                            ? 'border-primary-500 bg-primary-50' 
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <input
                          type="radio"
                          value={score}
                          {...register(fieldName, { valueAsNumber: true })}
                          className="sr-only"
                        />
                        <span className="text-lg">{colors[score - 1]}</span>
                        <span className="text-sm font-medium">{score}</span>
                        <span className="text-xs text-gray-600">{labels[score - 1]}</span>
                      </label>
                    )
                  })}
                </div>
                {errors[fieldName as keyof typeof errors] && (
                  <p className="text-red-600 text-sm mt-1">
                    {(errors[fieldName as keyof typeof errors] as any)?.message}
                  </p>
                )}
              </div>
            )
          })}

          {/* Priority Preview */}
          {priorityPreview && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-primary-900 mb-2">Dự kiến độ ưu tiên</h4>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-primary-700">
                  {priorityPreview.priority}
                </span>
                <span className="text-sm text-primary-600">
                  ({priorityPreview.score.toFixed(1)} điểm)
                </span>
              </div>
              <p className="text-xs text-primary-600 mt-1">{priorityPreview.reason}</p>
            </div>
          )}

          {calculating && (
            <div className="text-sm text-gray-500 mb-4">Đang tính toán...</div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button 
            type="submit" 
            disabled={submitting}
            className="px-6 py-2 bg-primary-500 text-white rounded hover:bg-primary-600 disabled:opacity-50"
          >
            {submitting ? "Đang tạo..." : "Tạo Request"}
          </button>
          <button 
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border rounded hover:bg-gray-50"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  )
}
