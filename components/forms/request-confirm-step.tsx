"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { createRequest, createRequestWithTemplate } from "@/actions/requests";

export function RequestConfirmStep({ data, onBack }: { data: any; onBack: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    try {
      let result: any;
      if (data.requestType === "catalog") {
        result = await createRequestWithTemplate({
          title: data.title,
          description: data.description,
          priority: data.priority,
          categoryId: data.categoryId,
          teamId: data.teamId,
          suggestedAssigneeId: data.suggestedAssigneeId,
          deadline: data.deadlineTo || data.deadlineFrom,
          requesterType: data.requesterType,
          templateId: data.templateId,
        });
      } else {
        result = await createRequest({
          ...data,
          suggestedAssigneeId: data.suggestedAssigneeId,
        });
      }

      if (result?.success) {
        toast.success("Yêu cầu đã được tạo thành công!");
        const requestId = result.requestId || result.request?.id;
        router.push(`/requests/${requestId}`);
      } else {
        toast.error(result?.error || "Có lỗi xảy ra");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">Xác nhận thông tin</h2>

        <div className="space-y-4">
          <InfoRow label="Tiêu đề" value={data.title} />
          <InfoRow label="Mô tả" value={data.description} />
          <InfoRow label="Độ ưu tiên" value={priorityLabel[data.priority as keyof typeof priorityLabel] || data.priority} />
          <InfoRow label="Loại yêu cầu" value={data.requesterType === "CUSTOMER" ? "Khách hàng" : "Nội bộ"} />
          <InfoRow label="Thời hạn" value={`${formatDate(data.deadlineFrom)} - ${formatDate(data.deadlineTo)}`} />
          {data.teamId && <InfoRow label="Phòng ban" value={String(data.teamId)} />} 
          {data.categoryId && <InfoRow label="Phân loại" value={String(data.categoryId)} />}
          {data.templateId && <InfoRow label="Template" value={String(data.templateId)} />}
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={onBack} disabled={loading}>
          ← Quay lại
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={loading} 
          className="bg-primary-500 hover:bg-primary-600 text-white flex-1 disabled:opacity-100 disabled:bg-primary-500 disabled:cursor-not-allowed" 
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang gửi...
            </>
          ) : (
            "✓ Gửi yêu cầu"
          )}
        </Button>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b">
      <span className="text-sm text-gray-600 w-40">{label}:</span>
      <span className="text-sm font-medium text-gray-900 flex-1">{value}</span>
    </div>
  );
}

const priorityLabel = {
  LOW: "🟢 Thấp",
  MEDIUM: "🟡 Trung bình",
  HIGH: "🟠 Cao",
  URGENT: "🔴 Khẩn cấp",
};

function formatDate(d?: string | Date) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("vi-VN");
}


