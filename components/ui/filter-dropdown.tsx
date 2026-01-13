"use client";

import * as React from "react";
import { Filter, ChevronDown, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterDropdownProps {
  label: string;
  options: FilterOption[];
  value?: string | string[];
  onChange: (value: string | string[]) => void;
  multiSelect?: boolean;
  className?: string;
}

export function FilterDropdown({
  label,
  options,
  value,
  onChange,
  multiSelect = false,
  className,
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const selectedValues = React.useMemo(() => {
    if (multiSelect) {
      return Array.isArray(value) ? value : value ? [value] : [];
    }
    return value ? [value as string] : [];
  }, [value, multiSelect]);

  const hasValue = selectedValues.length > 0;

  const filteredOptions = React.useMemo(() => {
    if (!searchTerm) return options;
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  const isSelected = (optionValue: string) => selectedValues.includes(optionValue);

  const handleSelect = (optionValue: string) => {
    if (multiSelect) {
      const newValues = isSelected(optionValue)
        ? selectedValues.filter((v) => v !== optionValue)
        : [...selectedValues, optionValue];
      onChange(newValues);
    } else {
      onChange(optionValue);
      setIsOpen(false);
    }
  };

  const clearSelection = () => {
    onChange(multiSelect ? [] : "");
  };

  const applyFilter = () => {
    setIsOpen(false);
  };

  // Close on click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50/50 transition-all bg-white"
      >
        <Filter className="w-4 h-4 text-gray-600" />
        <span className="font-medium text-gray-700">{label}</span>
        {hasValue && <span className="w-2 h-2 rounded-full bg-primary-500" />}
        <ChevronDown className={cn("w-4 h-4 text-gray-600 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-64 bg-white rounded-xl border border-gray-200 shadow-lg z-50">
          {/* Search */}
          {options.length > 5 && (
            <div className="p-3 border-b border-gray-200">
              <input
                type="text"
                placeholder="Tìm kiếm..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}

          {/* Options */}
          <div className="max-h-[300px] overflow-y-auto p-2">
            {filteredOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm",
                  isSelected(option.value)
                    ? "bg-primary-50 text-primary-700 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <span>{option.label}</span>
                {isSelected(option.value) && <Check className="w-4 h-4" />}
              </button>
            ))}
            
            {filteredOptions.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                Không tìm thấy kết quả
              </p>
            )}
          </div>

          {/* Footer */}
          {multiSelect && (
            <div className="p-3 border-t border-gray-200 flex gap-2">
              <button
                onClick={clearSelection}
                className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Xóa
              </button>
              <button
                onClick={applyFilter}
                className="flex-1 px-3 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors"
              >
                Áp dụng
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

