"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { type CustomFieldDefinition } from "@/types/custom-fields";
import { cn } from "@/lib/utils";

interface DynamicFieldRendererProps {
  field: CustomFieldDefinition;
  value: any;
  onChange: (value: any) => void;
  error?: string;
}

export function DynamicFieldRenderer({ field, value, onChange, error }: DynamicFieldRendererProps) {
  function renderField() {
    switch (field.type) {
      case "TEXT":
        return (
          <Input
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.isRequired}
            minLength={field.minLength}
            maxLength={field.maxLength}
            pattern={field.pattern}
            className={cn(error && "border-red-500")}
          />
        );

      case "TEXTAREA":
        return (
          <Textarea
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.isRequired}
            minLength={field.minLength}
            maxLength={field.maxLength}
            rows={4}
            className={cn(error && "border-red-500")}
          />
        );

      case "NUMBER":
        return (
          <Input
            type="number"
            value={value || ""}
            onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : null)}
            placeholder={field.placeholder}
            required={field.isRequired}
            min={field.minValue}
            max={field.maxValue}
            className={cn(error && "border-red-500")}
          />
        );

      case "SELECT":
        return (
          <Select value={value || ""} onValueChange={onChange} required={field.isRequired}>
            <SelectTrigger className={cn(error && "border-red-500")}>
              <SelectValue placeholder={field.placeholder || "Chọn..."} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "MULTISELECT":
        const selected = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded">
              {selected.length === 0 ? (
                <span className="text-sm text-gray-400">{field.placeholder || "Chọn..."}</span>
              ) : (
                selected.map((v) => (
                  <Badge key={v} variant="secondary" className="gap-1">
                    {v}
                    <button type="button" onClick={() => onChange(selected.filter((x) => x !== v))} className="hover:bg-gray-300 rounded-full">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {field.options?.filter((o) => !selected.includes(o)).map((opt) => (
                <Button key={opt} type="button" variant="outline" size="sm" onClick={() => onChange([...selected, opt])} className="text-xs">
                  + {opt}
                </Button>
              ))}
            </div>
          </div>
        );

      case "CHECKBOX":
        return (
          <div className="flex items-center gap-2">
            <Checkbox checked={value || false} onCheckedChange={onChange} id={field.name} />
            <Label htmlFor={field.name} className="text-sm font-normal cursor-pointer">
              {field.placeholder || field.label}
            </Label>
          </div>
        );

      case "DATE":
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !value && "text-gray-400", error && "border-red-500")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? format(new Date(value), "dd/MM/yyyy", { locale: vi }) : <span>{field.placeholder || "Chọn ngày"}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={value ? new Date(value) : undefined} onSelect={(d) => onChange(d ? d.toISOString() : null)} initialFocus />
            </PopoverContent>
          </Popover>
        );

      case "DATETIME":
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !value && "text-gray-400", error && "border-red-500")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? format(new Date(value), "dd/MM/yyyy HH:mm", { locale: vi }) : <span>{field.placeholder || "Chọn ngày và giờ"}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={value ? new Date(value) : undefined} onSelect={(d) => {
                if (d) {
                  const current = value ? new Date(value) : new Date();
                  d.setHours(current.getHours(), current.getMinutes());
                  onChange(d.toISOString());
                }
              }} initialFocus />
              <div className="p-3 border-t">
                <Input
                  type="time"
                  value={value ? format(new Date(value), "HH:mm") : "00:00"}
                  onChange={(e) => {
                    const [h, m] = e.target.value.split(":");
                    const date = value ? new Date(value) : new Date();
                    date.setHours(parseInt(h), parseInt(m));
                    onChange(date.toISOString());
                  }}
                />
              </div>
            </PopoverContent>
          </Popover>
        );

      case "URL":
        return (
          <Input
            type="url"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || "https://example.com"}
            required={field.isRequired}
            className={cn(error && "border-red-500")}
          />
        );

      case "EMAIL":
        return (
          <Input
            type="email"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || "email@example.com"}
            required={field.isRequired}
            className={cn(error && "border-red-500")}
          />
        );

      case "FILE":
        // For FILE type in custom fields, we store file info as JSON
        // { fileName: string, fileUrl: string, uploadMethod?: "FILE" | "DRIVE" | "URL" }
        const fileValue = typeof value === "string" ? { fileName: value, fileUrl: "" } : (value || {});
        return (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Tên file"
                value={fileValue.fileName || ""}
                onChange={(e) => onChange({ ...fileValue, fileName: e.target.value })}
                required={field.isRequired}
                className={cn(error && "border-red-500", "flex-1")}
              />
              <Input
                type="url"
                placeholder="URL hoặc Drive link"
                value={fileValue.fileUrl || ""}
                onChange={(e) => onChange({ ...fileValue, fileUrl: e.target.value })}
                required={field.isRequired}
                className={cn(error && "border-red-500", "flex-1")}
              />
            </div>
            {fileValue.fileName && (
              <p className="text-sm text-gray-600">File: {fileValue.fileName}</p>
            )}
            <p className="text-xs text-gray-500">
              Nhập tên file và URL/Drive link (hoặc để trống nếu không bắt buộc)
            </p>
          </div>
        );

      default:
        return <Input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} />;
    }
  }

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        {field.label}
        {field.isRequired && <span className="text-red-500">*</span>}
      </Label>

      {field.description && <p className="text-sm text-gray-500">{field.description}</p>}

      {renderField()}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {(field.type === "TEXT" || field.type === "TEXTAREA") && value && field.maxLength && (
        <p className="text-xs text-gray-500">{value.length} / {field.maxLength} characters</p>
      )}
    </div>
  );
}

