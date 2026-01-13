"use client";

import * as React from "react";
import { X } from "lucide-react";
import { SearchInput } from "./search-input";
import { FilterDropdown, type FilterOption } from "./filter-dropdown";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export interface FilterConfig {
  id: string;
  label: string;
  type: "select" | "multiselect";
  options: FilterOption[];
  defaultValue?: string | string[];
}

export type FilterValues = Record<string, string | string[]>;

export interface FilterBarProps {
  filters: FilterConfig[];
  searchPlaceholder?: string;
  onFilterChange: (filters: FilterValues) => void;
  onSearch?: (query: string) => void;
  showSearch?: boolean;
  showClearAll?: boolean;
  className?: string;
}

export function FilterBar({
  filters,
  searchPlaceholder = "Tìm kiếm...",
  onFilterChange,
  onSearch,
  showSearch = true,
  showClearAll = true,
  className,
}: FilterBarProps) {
  const [filterValues, setFilterValues] = React.useState<FilterValues>(() => {
    const initial: FilterValues = {};
    filters.forEach((filter) => {
      if (filter.defaultValue) {
        initial[filter.id] = filter.defaultValue;
      }
    });
    return initial;
  });

  const [searchQuery, setSearchQuery] = React.useState("");

  const handleFilterChange = (filterId: string, value: string | string[]) => {
    const newFilters = { ...filterValues, [filterId]: value };
    setFilterValues(newFilters);
    onFilterChange(newFilters);
  };

  const removeFilter = (filterId: string) => {
    const newFilters = { ...filterValues };
    delete newFilters[filterId];
    setFilterValues(newFilters);
    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    setFilterValues({});
    setSearchQuery("");
    onFilterChange({});
    onSearch?.("");
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  };

  // Get active filters for pills
  const activeFilters = React.useMemo(() => {
    return Object.entries(filterValues)
      .filter(([_, value]) => {
        if (Array.isArray(value)) return value.length > 0;
        return !!value;
      })
      .map(([id, value]) => {
        const filter = filters.find((f) => f.id === id);
        if (!filter) return null;

        let displayValue = "";
        if (Array.isArray(value)) {
          displayValue = value
            .map((v) => filter.options.find((opt) => opt.value === v)?.label || v)
            .join(", ");
        } else {
          displayValue = filter.options.find((opt) => opt.value === value)?.label || value;
        }

        return {
          id,
          label: filter.label,
          displayValue,
        };
      })
      .filter(Boolean) as Array<{ id: string; label: string; displayValue: string }>;
  }, [filterValues, filters]);

  const hasActiveFilters = activeFilters.length > 0 || !!searchQuery;

  return (
    <div className={cn("bg-white rounded-xl shadow-sm border border-gray-200 p-4", className)}>
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        {showSearch && (
          <div className="flex-1 min-w-[240px]">
            <SearchInput
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder={searchPlaceholder}
            />
          </div>
        )}

        {/* Filter Dropdowns */}
        {filters.map((filter) => (
          <FilterDropdown
            key={filter.id}
            label={filter.label}
            options={filter.options}
            value={filterValues[filter.id]}
            onChange={(value) => handleFilterChange(filter.id, value)}
            multiSelect={filter.type === "multiselect"}
          />
        ))}

        {/* Active Filter Pills */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {activeFilters.map((filter) => (
              <div
                key={filter.id}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium border border-primary-200"
              >
                <span>
                  {filter.label}: {filter.displayValue}
                </span>
                <button
                  onClick={() => removeFilter(filter.id)}
                  className="hover:bg-primary-100 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Clear All */}
        {showClearAll && hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="ml-auto">
            <X className="w-4 h-4 mr-1" />
            Xóa tất cả
          </Button>
        )}
      </div>
    </div>
  );
}

