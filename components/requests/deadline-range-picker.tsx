"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Calendar as CalendarIcon,
  Sparkles,
  Info,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { getDeadlineRange, validateDeadline } from "@/actions/deadline";
import { addHours, format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface DeadlineRangePickerProps {
  categoryId: string | null;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
}

export function DeadlineRangePicker({
  categoryId,
  value,
  onChange,
  required = false,
  disabled = false,
}: DeadlineRangePickerProps) {
  const [range, setRange] = useState<any>(null);
  const [validation, setValidation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (categoryId) {
      loadRange();
    } else {
      setRange(null);
      setValidation(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  useEffect(() => {
    if (categoryId && value) {
      validateCurrentDeadline();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, value]);

  async function loadRange() {
    setLoading(true);
    const result = await getDeadlineRange(categoryId!);
    if (result.success && result.range) {
      setRange(result.range);
      if (!value && result.range.suggested) {
        onChange(result.range.suggested);
      }
    }
    setLoading(false);
  }

  async function validateCurrentDeadline() {
    const result = await validateDeadline(categoryId!, value);
    if (result.success && result.validation) {
      setValidation(result.validation);
    }
  }

  function handleUseSuggested() {
    if (range?.suggested) {
      onChange(range.suggested);
    }
  }

  function handleQuickSelect(hours: number) {
    const deadline = addHours(new Date(), hours);
    onChange(deadline.toISOString());
  }

  return (
    <div className="space-y-3">
      {/* Label with icon */}
      <Label className="flex items-center gap-2">
        <CalendarIcon className="h-4 w-4 text-gray-500" />
        Deadline
        {required && <span className="text-red-500">*</span>}
      </Label>

      {/* Main input */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal h-auto py-3",
              !value && "text-gray-400",
              "hover:bg-gray-50 transition-colors"
            )}
          >
            <div className="flex items-center gap-3 w-full">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                  <CalendarIcon className="h-5 w-5 text-primary-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                {value ? (
                  <>
                    <p className="text-sm font-medium text-gray-900">
                      {format(new Date(value), "EEEE, dd MMMM yyyy", { locale: vi })}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {format(new Date(value), "HH:mm")} • {getTimeFromNow(new Date(value))}
                    </p>
                  </>
                ) : (
                  <p className="text-sm">Chọn deadline...</p>
                )}
              </div>
              {value && validation?.isValid && (
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              )}
              {value && !validation?.isValid && (
                <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0" />
              )}
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-4 space-y-4">
            {/* Calendar */}
            <div className="rounded-lg border border-gray-200">
              <Calendar
                mode="single"
                selected={value ? new Date(value) : undefined}
                onSelect={(date) => {
                  if (date) {
                    const currentTime = value ? new Date(value) : new Date();
                    // Giữ lại giờ phút hiện tại hoặc dùng mặc định 17:00
                    const hours = currentTime?.getHours() || 17;
                    const minutes = currentTime?.getMinutes() || 0;
                    date.setHours(hours, minutes, 0, 0);
                    onChange(date.toISOString());
                  }
                }}
                disabled={(date) => {
                  // Nếu đã chọn ngày hôm nay, chỉ disable các giờ đã qua
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  if (date < today) return true;
                  if (date.getTime() === today.getTime() && value) {
                    const selectedDate = new Date(value);
                    const now = new Date();
                    return selectedDate < now;
                  }
                  return false;
                }}
                initialFocus
              />
            </div>

            {/* Time Picker */}
            <div className="border-t border-gray-200 pt-4 space-y-3">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary-600" />
                Chọn giờ phút
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  disabled={disabled}
                  value={value ? format(new Date(value), "HH:mm") : "17:00"}
                  onChange={(e) => {
                    const [hours, minutes] = e.target.value.split(":");
                    const selectedDate = value ? new Date(value) : new Date();
                    // Nếu chưa chọn ngày, dùng ngày hôm nay
                    if (!value) {
                      selectedDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                      // Nếu giờ đã qua, tự động chuyển sang ngày mai
                      if (selectedDate < new Date()) {
                        selectedDate.setDate(selectedDate.getDate() + 1);
                      }
                    } else {
                      selectedDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                    }
                    onChange(selectedDate.toISOString());
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                />
              </div>
              <p className="text-xs text-gray-500">
                {value 
                  ? `Deadline: ${format(new Date(value), "dd/MM/yyyy 'lúc' HH:mm", { locale: vi })}`
                  : "Vui lòng chọn ngày và giờ deadline"}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 pt-2 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                className="flex-1 text-xs"
                onClick={() => {
                  const now = new Date();
                  onChange(now.toISOString());
                }}
              >
                Bây giờ
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                className="flex-1 text-xs"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
              >
                Xóa
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {range && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleQuickSelect(24)}
            className="text-xs"
          >
            +24h
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleQuickSelect(48)}
            className="text-xs"
          >
            +48h
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleQuickSelect(72)}
            className="text-xs"
          >
            +3 ngày
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleQuickSelect(168)}
            className="text-xs"
          >
            +1 tuần
          </Button>
        </div>
      )}

      {range?.suggested && !value && (
        <Alert className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <Sparkles className="h-4 w-4 text-blue-600" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">Gợi ý deadline</p>
                <p className="text-xs text-blue-700 mt-1">
                  {format(new Date(range.suggested), "dd/MM/yyyy HH:mm", { locale: vi })}
                  {" "}• {range.category?.defaultHours || 0}h
                </p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={handleUseSuggested} className="text-blue-600 hover:bg-blue-100">
                Áp dụng
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {range && (
        <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <Info className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-gray-600">
            <p className="font-medium text-gray-700 mb-1">Khuyến nghị cho category này:</p>
            <div className="flex items-center gap-3">
              {range.category?.minHours && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Tối thiểu: {range.category.minHours}h
                </span>
              )}
              {range.category?.maxHours && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Tối đa: {range.category.maxHours}h
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {validation && !validation.isValid && (
        <Alert variant="destructive" className="animate-in fade-in duration-200">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium mb-1">Cảnh báo deadline</p>
            <ul className="space-y-1">
              {validation.warnings?.map((w: string, i: number) => (
                <li key={i} className="text-sm">• {w}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {validation?.suggestions && validation.suggestions.length > 0 && (
        <Alert className="bg-yellow-50 border-yellow-200 animate-in fade-in duration-200">
          <Info className="h-4 w-4 text-yellow-600" />
          <AlertDescription>
            <p className="text-sm font-medium text-yellow-900 mb-1">💡 Gợi ý</p>
            <ul className="space-y-1">
              {validation.suggestions.map((s: string, i: number) => (
                <li key={i} className="text-sm text-yellow-800">{s}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function getTimeFromNow(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (hours < 24) return `Còn ${hours} giờ`;
  if (days === 1) return "Còn 1 ngày";
  return `Còn ${days} ngày`;
}
