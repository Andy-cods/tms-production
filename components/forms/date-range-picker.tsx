"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarGlyph, CalendarIcon, ArrowRight, Sparkles, Info, Clock } from "lucide-react";
import { format, addHours, differenceInHours } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DateRangePickerProps {
  startDate: string | null;
  endDate: string | null;
  onStartChange: (date: string) => void;
  onEndChange: (date: string) => void;
  categoryId?: string | null;
  label?: string;
  showSuggestions?: boolean;
  required?: boolean;
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  categoryId,
  label = "Thời gian dự kiến",
  showSuggestions = true,
  required = false,
}: DateRangePickerProps) {
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [suggested, setSuggested] = useState<{
    start: Date;
    end: Date;
    duration: number;
  } | null>(null);

  useEffect(() => {
    if (startDate && endDate) {
      const hours = differenceInHours(new Date(endDate), new Date(startDate));
      setDuration(hours);
    } else {
      setDuration(null);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    if (categoryId && showSuggestions) {
      loadSuggestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  async function loadSuggestions() {
    const now = new Date();
    const suggestedStart = addHours(now, 2);
    const suggestedEnd = addHours(suggestedStart, 24);

    setSuggested({
      start: suggestedStart,
      end: suggestedEnd,
      duration: 24,
    });
  }

  function handleUseSuggested() {
    if (!suggested) return;
    onStartChange(suggested.start.toISOString());
    onEndChange(suggested.end.toISOString());
  }

  function handleQuickSelect(hours: number) {
    const start = startDate ? new Date(startDate) : new Date();
    const end = addHours(start, hours);

    if (!startDate) {
      onStartChange(start.toISOString());
    }
    onEndChange(end.toISOString());
  }

  function handleStartSelect(date: Date | undefined) {
    if (date) {
      const currentStart = startDate ? new Date(startDate) : null;
      const hours = currentStart?.getHours() || 9;
      const minutes = currentStart?.getMinutes() || 0;

      date.setHours(hours, minutes, 0, 0);
      onStartChange(date.toISOString());
      setStartOpen(false);
    }
  }

  function handleEndSelect(date: Date | undefined) {
    if (date) {
      const currentEnd = endDate ? new Date(endDate) : null;
      const hours = currentEnd?.getHours() || 17;
      const minutes = currentEnd?.getMinutes() || 0;

      date.setHours(hours, minutes, 0, 0);
      onEndChange(date.toISOString());
      setEndOpen(false);
    }
  }

  const formatDuration = (hours: number) => {
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    const remainHours = hours % 24;
    return remainHours > 0 ? `${days}d ${remainHours}h` : `${days}d`;
  };

  return (
    <div className="space-y-4">
      {label && (
        <Label className="flex items-center gap-2">
          <CalendarGlyph className="h-4 w-4 text-gray-500" />
          {label}
          {required && <span className="text-red-500">*</span>}
        </Label>
      )}

      <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Start card */}
        <div className="relative">
          <div className="absolute top-2 left-3 z-10">
            <Badge variant="outline" className="text-xs bg-white">Bắt đầu</Badge>
          </div>
          <Popover open={startOpen} onOpenChange={setStartOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full h-auto pt-8 pb-4 px-4 flex flex-col items-start hover:bg-gray-50 transition-colors">
                {startDate ? (
                  <>
                    <p className="text-lg font-semibold text-gray-900">{format(new Date(startDate), "dd", { locale: vi })}</p>
                    <p className="text-sm text-gray-500">{format(new Date(startDate), "MMMM yyyy", { locale: vi })}</p>
                    <p className="text-xs text-gray-400 mt-1">{format(new Date(startDate), "HH:mm")}</p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">Chọn ngày bắt đầu</p>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={startDate ? new Date(startDate) : undefined} onSelect={handleStartSelect} initialFocus />
              <div className="p-3 border-t bg-gray-50">
                <Input
                  type="time"
                  value={startDate ? format(new Date(startDate), "HH:mm") : "09:00"}
                  onChange={(e) => {
                    const [hours, minutes] = e.target.value.split(":");
                    const date = startDate ? new Date(startDate) : new Date();
                    date.setHours(parseInt(hours), parseInt(minutes));
                    onStartChange(date.toISOString());
                  }}
                  className="w-full"
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Connector (desktop) */}
        <div className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
            <ArrowRight className="h-4 w-4 text-primary-600" />
          </div>
        </div>

        {/* End card */}
        <div className="relative">
          <div className="absolute top-2 left-3 z-10">
            <Badge variant="outline" className="text-xs bg-white">Kết thúc</Badge>
          </div>
          <Popover open={endOpen} onOpenChange={setEndOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full h-auto pt-8 pb-4 px-4 flex flex-col items-start hover:bg-gray-50 transition-colors">
                {endDate ? (
                  <>
                    <p className="text-lg font-semibold text-gray-900">{format(new Date(endDate), "dd", { locale: vi })}</p>
                    <p className="text-sm text-gray-500">{format(new Date(endDate), "MMMM yyyy", { locale: vi })}</p>
                    <p className="text-xs text-gray-400 mt-1">{format(new Date(endDate), "HH:mm")}</p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">Chọn ngày kết thúc</p>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate ? new Date(endDate) : undefined}
                onSelect={handleEndSelect}
                disabled={(date) => (startDate ? date < new Date(startDate) : false)}
                initialFocus
              />
              <div className="p-3 border-t bg-gray-50">
                <Input
                  type="time"
                  value={endDate ? format(new Date(endDate), "HH:mm") : "17:00"}
                  onChange={(e) => {
                    const [hours, minutes] = e.target.value.split(":");
                    const date = endDate ? new Date(endDate) : new Date();
                    date.setHours(parseInt(hours), parseInt(minutes));
                    onEndChange(date.toISOString());
                  }}
                  className="w-full"
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {duration !== null && (
        <div className="flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-primary-50 to-indigo-50 rounded-lg border border-primary-200">
          <Clock className="h-5 w-5 text-primary-600" />
          <div className="text-center">
            <p className="text-xs text-gray-600">Thời lượng</p>
            <p className="text-lg font-bold text-primary-700">{formatDuration(duration)}</p>
          </div>
        </div>
      )}

      {startDate && (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => handleQuickSelect(24)} className="text-xs">
            +1 ngày
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => handleQuickSelect(48)} className="text-xs">
            +2 ngày
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => handleQuickSelect(72)} className="text-xs">
            +3 ngày
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => handleQuickSelect(168)} className="text-xs">
            +1 tuần
          </Button>
        </div>
      )}

      {suggested && showSuggestions && (!startDate || !endDate) && (
        <Alert className="bg-blue-50 border-blue-200">
          <Sparkles className="h-4 w-4 text-blue-600" />
          <AlertDescription className="flex items-center justify-between">
            <div className="text-sm">
              <strong>Gợi ý:</strong> Bắt đầu {format(suggested.start, "dd/MM HH:mm", { locale: vi })} → Kết thúc {format(suggested.end, "dd/MM HH:mm", { locale: vi })}
              <span className="text-xs text-gray-500 ml-2">({formatDuration(suggested.duration)})</span>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={handleUseSuggested} className="text-blue-600">
              Dùng
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}


