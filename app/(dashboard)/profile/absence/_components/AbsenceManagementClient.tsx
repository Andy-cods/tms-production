"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarIcon, UserX, UserCheck, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { setAbsenceAction, clearAbsenceAction } from "@/actions/absence";
import { cn } from "@/lib/utils";

interface AbsenceManagementClientProps {
  user: {
    id: string;
    name: string;
    isAbsent: boolean;
    absenceReason: string | null;
    absenceUntil: string | null;
    delegateTo: string | null;
    delegateName: string | null;
  };
  potentialDelegates: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
}

export function AbsenceManagementClient({
  user,
  potentialDelegates,
}: AbsenceManagementClientProps) {
  const router = useRouter();
  const toast = useToast();

  const [isAbsent, setIsAbsent] = useState(user.isAbsent);
  const [absenceReason, setAbsenceReason] = useState(user.absenceReason || "");
  const [absenceUntil, setAbsenceUntil] = useState<Date | undefined>(
    user.absenceUntil ? new Date(user.absenceUntil) : undefined
  );
  const [delegateTo, setDelegateTo] = useState(user.delegateTo || "none");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSetAbsence = async () => {
    if (!absenceReason.trim()) {
      toast.error("Lỗi", "Vui lòng nhập lý do vắng mặt");
      return;
    }

    if (!absenceUntil) {
      toast.error("Lỗi", "Vui lòng chọn ngày kết thúc");
      return;
    }

    setIsProcessing(true);

    try {
      const result = await setAbsenceAction({
        absenceReason,
        absenceUntil: absenceUntil.toISOString(),
        delegateTo: delegateTo === "none" ? null : delegateTo,
      });

      if (result.success) {
        toast.success("Thành công", "Đã đặt trạng thái vắng mặt");
        router.refresh();
      } else {
        toast.error("Lỗi", result.error || "Không thể đặt trạng thái");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Đã xảy ra lỗi";
      toast.error("Lỗi", errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearAbsence = async () => {
    setIsProcessing(true);

    try {
      const result = await clearAbsenceAction();

      if (result.success) {
        toast.success("Thành công", "Đã xóa trạng thái vắng mặt");
        router.refresh();
      } else {
        toast.error("Lỗi", result.error || "Không thể xóa trạng thái");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Đã xảy ra lỗi";
      toast.error("Lỗi", errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Status */}
      {user.isAbsent && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-900">
              <AlertCircle className="w-5 h-5" />
              Đang vắng mặt
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <strong>Lý do:</strong> {user.absenceReason}
            </div>
            {user.absenceUntil && (
              <div>
                <strong>Đến ngày:</strong>{" "}
                {format(new Date(user.absenceUntil), "dd/MM/yyyy", { locale: vi })}
              </div>
            )}
            {user.delegateName && (
              <div>
                <strong>Ủy quyền cho:</strong> {user.delegateName}
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAbsence}
              disabled={isProcessing}
              className="mt-4"
            >
              <UserCheck className="w-4 h-4 mr-2" />
              Kết thúc vắng mặt
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Set Absence Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserX className="w-5 h-5 text-primary" />
            Đặt trạng thái vắng mặt
          </CardTitle>
          <CardDescription>
            Tasks mới sẽ được tự động assign cho người được ủy quyền
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Absence Reason */}
          <div>
            <Label htmlFor="absence-reason">Lý do vắng mặt *</Label>
            <Input
              id="absence-reason"
              placeholder="VD: Nghỉ phép, Công tác, Bệnh..."
              value={absenceReason}
              onChange={(e) => setAbsenceReason(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Absence Until */}
          <div>
            <Label>Đến ngày *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal mt-1",
                    !absenceUntil && "text-gray-500"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {absenceUntil ? (
                    format(absenceUntil, "dd/MM/yyyy", { locale: vi })
                  ) : (
                    "Chọn ngày"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={absenceUntil}
                  onSelect={setAbsenceUntil}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Delegate To */}
          <div>
            <Label htmlFor="delegate-to">Ủy quyền cho (tùy chọn)</Label>
            <Select value={delegateTo || "none"} onValueChange={setDelegateTo}>
              <SelectTrigger id="delegate-to" className="mt-1">
                <SelectValue placeholder="Chọn người nhận ủy quyền..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Không ủy quyền</SelectItem>
                {potentialDelegates.map((delegate) => (
                  <SelectItem key={delegate.id} value={delegate.id}>
                    {delegate.name} ({delegate.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-600 mt-1">
              Nếu chọn, tasks mới sẽ được ưu tiên assign cho người này
            </p>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSetAbsence}
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <UserX className="w-4 h-4 mr-2" />
                Đặt trạng thái vắng mặt
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

