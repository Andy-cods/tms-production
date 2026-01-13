"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PERMISSION_TICKETS, PermissionTicket } from "@/lib/constants/permission-tickets";

interface PermissionTicketSelectorProps {
  selected: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}

export function PermissionTicketSelector({ selected, onChange, disabled }: PermissionTicketSelectorProps) {
  const [query, setQuery] = useState("");

  const toggle = (value: string) => {
    if (disabled) return;
    const exists = selected.includes(value);
    const next = exists ? selected.filter((item) => item !== value) : [...selected, value];
    onChange(next);
  };

  const filteredTickets = useMemo(() => {
    if (!query.trim()) return PERMISSION_TICKETS;
    const keyword = query.trim().toLowerCase();
    return PERMISSION_TICKETS.filter((ticket) => {
      return (
        ticket.label.toLowerCase().includes(keyword) ||
        ticket.description.toLowerCase().includes(keyword) ||
        ticket.value.toLowerCase().includes(keyword)
      );
    });
  }, [query]);

  const grouped = useMemo(() => {
    return filteredTickets.reduce((acc, ticket) => {
      if (!acc[ticket.category]) acc[ticket.category] = [];
      acc[ticket.category].push(ticket);
      return acc;
    }, {} as Record<string, PermissionTicket[]>);
  }, [filteredTickets]);

  const categoryEntries = useMemo(() => Object.entries(grouped), [grouped]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Tìm kiếm quyền (ví dụ: báo cáo, phân công...)"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="h-9 max-w-md"
        />
        <Badge variant="outline" className="text-xs">
          {selected.length} quyền được chọn
        </Badge>
      </div>

      <div className="max-h-[360px] overflow-auto rounded-lg border border-dashed border-gray-200 p-3">
        <div className="space-y-4">
          {categoryEntries.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-8">Không tìm thấy quyền phù hợp với từ khóa.</p>
          )}

          {categoryEntries.map(([category, tickets]) => (
            <div key={category} className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">{category}</h4>
              <div className="grid gap-2 md:grid-cols-2">
                {tickets.map((ticket) => {
                  const isActive = selected.includes(ticket.value);
                  return (
                    <Button
                      key={ticket.value}
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={disabled}
                      onClick={() => toggle(ticket.value)}
                      className={cn(
                        "h-auto min-h-[64px] w-full justify-start border text-left transition-all",
                        isActive
                          ? "border-primary-500 bg-primary-50 text-primary-700 shadow-sm"
                          : "border-gray-200 hover:border-primary-300"
                      )}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm leading-tight">{ticket.label}</span>
                          {isActive && <Badge variant="secondary" className="text-[10px]">Đã chọn</Badge>}
                        </div>
                        <p className="text-xs text-gray-600 leading-snug line-clamp-2">{ticket.description}</p>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
