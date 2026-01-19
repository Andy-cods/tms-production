"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DateTimePickerProps {
  value?: Date | null;
  onChange: (date: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DateTimePicker({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = "Chọn ngày giờ",
  disabled = false,
  className,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    value ? new Date(value) : undefined
  );

  // Time state - 24-hour format internally
  const [timeValue, setTimeValue] = useState<string>(
    value ? format(new Date(value), "HH:mm") : "09:00"
  );

  // Auto-select today when popover opens if no date selected
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && !selectedDate && !value) {
      // Auto-select today so Apply button is enabled
      setSelectedDate(new Date());
    }
    setOpen(isOpen);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const handleApply = () => {
    if (!selectedDate) return;

    const [hours, minutes] = timeValue.split(":").map(Number);
    
    if (isNaN(hours) || isNaN(minutes)) {
      return; // Invalid time
    }

    const newDate = new Date(selectedDate);
    newDate.setHours(hours, minutes, 0, 0);

    onChange(newDate);
    setOpen(false);
  };

  const handleClear = () => {
    setSelectedDate(undefined);
    setTimeValue("09:00");
    onChange(null);
    setOpen(false);
  };

  const handleNow = () => {
    const now = new Date();
    setSelectedDate(now);
    setTimeValue(format(now, "HH:mm"));
  };

  // Update local state when value changes
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      setSelectedDate(date);
      setTimeValue(format(date, "HH:mm"));
    } else {
      setSelectedDate(undefined);
      setTimeValue("09:00");
    }
  }, [value]);

  const displayValue = value
    ? format(value, "dd/MM/yyyy 'lúc' HH:mm", { locale: vi })
    : placeholder;

  // Validate time format (HH:mm)
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Allow only digits and colon
    const sanitized = input.replace(/[^\d:]/g, '');
    
    // Format: HH:mm
    if (sanitized.length <= 5) {
      // Auto-format: add colon after 2 digits
      let formatted = sanitized;
      if (sanitized.length > 2 && sanitized[2] !== ':') {
        formatted = sanitized.slice(0, 2) + ':' + sanitized.slice(2);
      }
      
      // Validate hours (0-23) and minutes (0-59)
      const parts = formatted.split(':');
      if (parts.length === 2) {
        const hours = parseInt(parts[0]) || 0;
        const minutes = parseInt(parts[1]) || 0;
        if (hours <= 23 && minutes <= 59) {
          setTimeValue(formatted);
        }
      } else if (formatted.length <= 2) {
        setTimeValue(formatted);
      }
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal h-11 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors",
            !value && "text-gray-500",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-gray-500 flex-shrink-0" />
          <span className={cn("flex-1 truncate", value && "text-gray-900 font-medium")}>
            {displayValue}
          </span>
          {value && (
            <X 
              className="h-4 w-4 text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
            />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0 shadow-xl border border-gray-200" align="start">
        <div className="flex flex-col sm:flex-row">
          {/* Calendar Section */}
          <div className="p-4 border-b sm:border-b-0 sm:border-r border-gray-200">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={(date) => {
                if (minDate && date < minDate) return true;
                if (maxDate && date > maxDate) return true;
                return false;
              }}
              initialFocus
              locale={vi}
            />
            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 text-xs h-8"
                onClick={handleClear}
              >
                <X className="h-3 w-3 mr-1" />
                Xóa
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 text-xs h-8"
                onClick={handleNow}
              >
                Bây giờ
              </Button>
            </div>
          </div>

          {/* Time Picker Section */}
          <div className="p-4 min-w-[280px]">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-primary-600" />
              <label className="text-sm font-semibold text-gray-900">
                Chọn giờ
              </label>
            </div>

            {/* Time Input */}
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600 mb-1.5 block">
                  Giờ:Phút (24h)
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    value={timeValue}
                    onChange={handleTimeChange}
                    placeholder="09:00"
                    className="text-center text-lg font-mono font-semibold h-12 text-gray-900 border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                    maxLength={5}
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <span className="text-gray-400 text-sm">24h</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  Định dạng: HH:mm (ví dụ: 09:30, 14:45, 23:59)
                </p>
              </div>

              {/* Quick Time Buttons */}
              <div>
                <label className="text-xs text-gray-600 mb-2 block">
                  Chọn nhanh
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {["08:00", "09:00", "12:00", "14:00", "17:00", "18:00", "20:00", "22:00"].map((time) => (
                    <Button
                      key={time}
                      type="button"
                      variant={timeValue === time ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "text-xs h-8",
                        timeValue === time && "bg-primary-600 hover:bg-primary-700"
                      )}
                      onClick={() => setTimeValue(time)}
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setOpen(false)}
              >
                Hủy
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white"
                onClick={handleApply}
                disabled={!selectedDate}
              >
                Áp dụng
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
