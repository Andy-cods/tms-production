"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X, Plus } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getAllUserPositions } from "@/actions/category";

interface PositionSelectorProps {
  value: string[];
  onChange: (positions: string[]) => void;
  label?: string;
}

export function PositionSelector({
  value,
  onChange,
  label = "Preferred Positions",
}: PositionSelectorProps) {
  const [open, setOpen] = useState(false);
  const [positions, setPositions] = useState<Array<{ position: string; count: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPositions();
  }, []);

  async function loadPositions() {
    setLoading(true);
    const result = await getAllUserPositions();
    if ((result as any).success && (result as any).positions) {
      setPositions((result as any).positions);
    }
    setLoading(false);
  }

  function handleSelect(position: string) {
    if (value.includes(position)) {
      onChange(value.filter((p) => p !== position));
    } else {
      onChange([...value, position]);
    }
  }

  function handleRemove(position: string) {
    onChange(value.filter((p) => p !== position));
  }

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}

      {/* Selected positions */}
      <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-lg bg-gray-50">
        {value.length === 0 ? (
          <span className="text-sm text-gray-400">
            Chưa chọn positions nào
          </span>
        ) : (
          value.map((pos) => (
            <Badge
              key={pos}
              variant="secondary"
              className="gap-1 pl-3 pr-1"
            >
              <span>{pos}</span>
              <button
                onClick={() => handleRemove(pos)}
                className="hover:bg-gray-300 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))
        )}
      </div>

      {/* Position picker */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
          >
            <Plus className="h-4 w-4 mr-2" />
            Thêm position
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Tìm position..." />
            <CommandEmpty>Không tìm thấy position</CommandEmpty>
            <CommandGroup className="max-h-[200px] overflow-auto">
              {loading ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  Đang tải...
                </div>
              ) : (
                positions.map((item) => (
                  <CommandItem
                    key={item.position}
                    value={item.position}
                    onSelect={() => {
                      handleSelect(item.position);
                      setOpen(false);
                    }}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={value.includes(item.position) ? "font-semibold" : ""}>
                        {item.position}
                      </span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {item.count} users
                      </Badge>
                    </div>
                  </CommandItem>
                ))
              )}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Helper text */}
      <p className="text-xs text-gray-500">
        Chọn positions phù hợp cho category này. Hệ thống sẽ ưu tiên assign
        cho users có position khớp.
      </p>
    </div>
  );
}

