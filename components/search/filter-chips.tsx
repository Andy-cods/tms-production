"use client";

import React from "react";
import type { SearchParams } from "./advanced-search-form";

type Props = {
	filters: Partial<SearchParams>;
	onRemove: (filterKey: string) => void;
	onClearAll: () => void;
	className?: string;
};

function formatDate(d?: Date | string) {
	if (!d) return "";
	const dt = typeof d === "string" ? new Date(d) : d;
	return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(dt);
}

export default function FilterChips({ filters, onRemove, onClearAll, className }: Props) {
	const chips: Array<{ key: string; label: string }> = [];

	if (filters.query) chips.push({ key: "query", label: `Từ khóa: ${filters.query}` });

	if (Array.isArray((filters as any).status) && (filters as any).status!.length) {
		chips.push({ key: "status", label: `Trạng thái: ${(filters as any).status!.join(", ")}` });
	}
	if (Array.isArray((filters as any).priority) && (filters as any).priority!.length) {
		chips.push({ key: "priority", label: `Ưu tiên: ${(filters as any).priority!.join(", ")}` });
	}
	if (Array.isArray((filters as any).categoryId) && (filters as any).categoryId!.length) {
		chips.push({ key: "categoryId", label: `Phân loại: ${(filters as any).categoryId!.length} mục` });
	}
	if (Array.isArray((filters as any).creatorId) && (filters as any).creatorId!.length) {
		chips.push({ key: "creatorId", label: `Người tạo: ${(filters as any).creatorId!.length} mục` });
	}
	if (Array.isArray((filters as any).teamId) && (filters as any).teamId!.length) {
		chips.push({ key: "teamId", label: `Nhóm: ${(filters as any).teamId!.length} mục` });
	}
	if (Array.isArray((filters as any).tags) && (filters as any).tags!.length) {
		chips.push({ key: "tags", label: `Tag: ${(filters as any).tags!.join(", ")}` });
	}

	if ((filters as any).createdAt?.from || (filters as any).createdAt?.to) {
		chips.push({ key: "createdAt", label: `Tạo: ${formatDate((filters as any).createdAt?.from)} - ${formatDate((filters as any).createdAt?.to)}` });
	}
	if ((filters as any).deadline?.from || (filters as any).deadline?.to) {
		chips.push({ key: "deadline", label: `Deadline: ${formatDate((filters as any).deadline?.from)} - ${formatDate((filters as any).deadline?.to)}` });
	}

	if ((filters as any).hasOverdue) chips.push({ key: "hasOverdue", label: "Chỉ quá hạn" });
	if ((filters as any).hasDeadline) chips.push({ key: "hasDeadline", label: "Có deadline" });
	if ((filters as any).isOverdue) chips.push({ key: "isOverdue", label: "Công việc quá hạn" });

	return (
		<div className={className}>
			{chips.length > 0 && (
				<div className="flex flex-wrap items-center gap-2">
					{chips.map((c) => (
						<span key={c.key} className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs">
							<span>{c.label}</span>
							<button aria-label={`Remove ${c.key}`} onClick={() => onRemove(c.key)} className="text-gray-500 hover:text-black">×</button>
						</span>
					))}
					{chips.length > 1 && (
						<button onClick={onClearAll} className="text-sm underline">Xóa tất cả</button>
					)}
				</div>
			)}
		</div>
	);
}
