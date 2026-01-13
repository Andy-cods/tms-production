"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Users, AlertCircle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { setAbsence, clearAbsence } from "@/actions/absence";
import { useRouter } from "next/navigation";

interface AbsenceClientProps {
  currentAbsence: {
    isAbsent: boolean | null;
    absenceReason: string | null;
    absenceUntil: Date | null;
    delegateTo: string | null;
    delegate: {
      id: string;
      name: string | null;
      email: string | null;
    } | null;
  } | null;
  availableUsers: Array<{
    id: string;
    name: string | null;
    email: string | null;
    role: string;
    team: { name: string } | null;
  }>;
}

export default function AbsenceClient({ 
  currentAbsence, 
  availableUsers 
}: AbsenceClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    reason: "",
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: "",
    delegateToId: ""
  });

  const handleSetAbsence = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await setAbsence({
        reason: formData.reason,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        delegateToId: formData.delegateToId || undefined
      });

      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || "Failed to set absence");
      }
    } catch (error) {
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleClearAbsence = async () => {
    if (!confirm("Are you sure you want to clear your absence?")) return;

    setLoading(true);
    try {
      const result = await clearAbsence();
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || "Failed to clear absence");
      }
    } catch (error) {
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Current absence status
  if (currentAbsence?.isAbsent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            Đang vắng mặt
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <p className="font-medium text-orange-900 dark:text-orange-100 mb-2">
              Bạn đang được đánh dấu là không có mặt
            </p>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Lý do:</span>
                <p className="font-medium">{currentAbsence.absenceReason}</p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Đến ngày:</span>
                <p className="font-medium">
                  {currentAbsence.absenceUntil 
                    ? format(new Date(currentAbsence.absenceUntil), "MMMM d, yyyy")
                    : "Chưa thiết lập"
                  }
                </p>
              </div>
              {currentAbsence.delegate && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Công việc được ủy quyền cho:</span>
                  <p className="font-medium">{currentAbsence.delegate.name}</p>
                  <p className="text-xs text-gray-500">{currentAbsence.delegate.email}</p>
                </div>
              )}
            </div>
          </div>

          <Button 
            onClick={handleClearAbsence}
            disabled={loading}
            variant="destructive"
            className="w-full"
          >
            Hủy vắng mặt và quay lại làm việc
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Set absence form
  return (
    <Card>
      <CardHeader>
        <CardTitle>Thiết lập thời gian vắng mặt</CardTitle>
        <CardDescription>
          Cấu hình vắng mặt và tùy chọn ủy quyền công việc
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSetAbsence} className="space-y-6">
          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Lý do *</Label>
            <Textarea
              id="reason"
              placeholder="Nghỉ phép, ốm đau, công tác..."
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              required
              rows={3}
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Ngày bắt đầu *</Label>
              <Input
                type="date"
                id="startDate"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Ngày kết thúc *</Label>
              <Input
                type="date"
                id="endDate"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
                min={formData.startDate}
              />
            </div>
          </div>

          {/* Delegate To */}
          <div className="space-y-2">
            <Label htmlFor="delegateToId">
              Ủy quyền công việc cho (Tùy chọn)
            </Label>
            <select
              id="delegateToId"
              value={formData.delegateToId}
              onChange={(e) => setFormData({ ...formData, delegateToId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
            >
              <option value="">-- Không ủy quyền --</option>
              {availableUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.role}) 
                  {user.team && ` - ${user.team.name}`}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500">
              Công việc đang hoạt động (CẦN LÀM, ĐANG LÀM) sẽ được chuyển cho người này
            </p>
          </div>

          {/* Info */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-medium mb-1">Điều gì xảy ra khi bạn thiết lập vắng mặt:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Bạn sẽ được đánh dấu là không có mặt</li>
                  <li>Công việc mới sẽ không được giao tự động cho bạn</li>
                  <li>Nếu ủy quyền, công việc đang thực hiện sẽ chuyển ngay</li>
                  <li>Bạn có thể hủy vắng mặt bất cứ lúc nào</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Submit */}
          <Button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#37B24D] hover:bg-[#2f9e44]"
          >
            {loading ? "Đang thiết lập..." : "Thiết lập vắng mặt"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
