"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  debounce?: number;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ value, onChange, placeholder = "Tìm kiếm...", className, debounce = 300 }, ref) => {
    const [internalValue, setInternalValue] = React.useState(value);

    React.useEffect(() => {
      setInternalValue(value);
    }, [value]);

    React.useEffect(() => {
      const timer = setTimeout(() => {
        if (internalValue !== value) {
          onChange(internalValue);
        }
      }, debounce);

      return () => clearTimeout(timer);
    }, [internalValue, debounce, onChange, value]);

    return (
      <div className={cn("relative", className)}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        <input
          ref={ref}
          type="text"
          placeholder={placeholder}
          value={internalValue}
          onChange={(e) => setInternalValue(e.target.value)}
          className="w-full pl-10 pr-10 py-2.5 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all text-gray-900 placeholder:text-gray-400"
        />
        {internalValue && (
          <button
            onClick={() => {
              setInternalValue("");
              onChange("");
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>
    );
  }
);
SearchInput.displayName = "SearchInput";

