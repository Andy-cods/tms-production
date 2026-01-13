"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

type DurationUnit = "hours" | "days";

interface DurationPickerProps {
  value: number; // Total hours
  onChange: (hours: number) => void;
  label?: string;
  showQuickSelect?: boolean;
  minHours?: number;
  maxHours?: number;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

export function DurationPicker({
  value,
  onChange,
  label = "Thời lượng",
  showQuickSelect = true,
  minHours = 1,
  maxHours = 720,
  required = false,
  className,
  disabled = false,
}: DurationPickerProps) {
  const [unit, setUnit] = useState<DurationUnit>("hours");
  const [inputValue, setInputValue] = useState<string>("");

  useEffect(() => {
    if (unit === "hours") {
      setInputValue(value.toString());
    } else {
      setInputValue((value / 24).toFixed(1));
    }
  }, [value, unit]);

  function handleInputChange(newValue: string) {
    setInputValue(newValue);

    const numValue = parseFloat(newValue);
    if (isNaN(numValue) || numValue < 0) return;

    const hours = unit === "hours" ? numValue : numValue * 24;

    if (hours >= minHours && hours <= maxHours) {
      onChange(Math.round(hours));
    }
  }

  function handleUnitChange(newUnit: DurationUnit) {
    setUnit(newUnit);
    if (newUnit === "days") {
      setInputValue((value / 24).toFixed(1));
    } else {
      setInputValue(value.toString());
    }
  }

  function handleQuickSelect(hours: number) {
    onChange(hours);
  }

  const formatDisplay = (hours: number) => {
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    const remainHours = hours % 24;
    return remainHours > 0 ? `${days}d ${remainHours}h` : `${days}d`;
  };

  const isInvalid = value < minHours || value > maxHours || isNaN(value);

  return (
    <div className={cn("space-y-3", className)}>
      {label && (
        <Label>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            type="number"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            min={unit === "hours" ? minHours : minHours / 24}
            max={unit === "hours" ? maxHours : maxHours / 24}
            step={unit === "hours" ? 1 : 0.5}
            placeholder={unit === "hours" ? "Nhập số giờ" : "Nhập số ngày"}
            required={required}
            disabled={disabled}
            className={cn(isInvalid && "border-red-500")}
          />
        </div>

        <Select value={unit} onValueChange={(v) => handleUnitChange(v as DurationUnit)} disabled={disabled}>
          <SelectTrigger className="w-[120px]" disabled={disabled}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hours">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Giờ
              </div>
            </SelectItem>
            <SelectItem value="days">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Ngày
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!isInvalid && value > 0 && (
        <div className="text-sm text-gray-600">= <strong>{formatDisplay(value)}</strong></div>
      )}

      {isInvalid && value > 0 && (
        <p className="text-sm text-red-600">
          Thời lượng phải từ {formatDisplay(minHours)} đến {formatDisplay(maxHours)}
        </p>
      )}

      {showQuickSelect && (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => handleQuickSelect(4)} className="text-xs">
            4h
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => handleQuickSelect(8)} className="text-xs">
            8h (1 ngày)
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => handleQuickSelect(24)} className="text-xs">
            24h (1 ngày)
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => handleQuickSelect(40)} className="text-xs">
            40h (5 ngày)
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => handleQuickSelect(80)} className="text-xs">
            80h (10 ngày)
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => handleQuickSelect(168)} className="text-xs">
            1 tuần
          </Button>
        </div>
      )}
    </div>
  );
}


