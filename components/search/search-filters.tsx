"use client";

import React from "react";
import type { SearchParams } from "./advanced-search-form";

type Props = {
	filters: Partial<SearchParams>;
	compact?: boolean;
	className?: string;
};

export default function SearchFilters({ filters, compact = false, className }: Props) {
	const activeKeys: string[] = [];
	if (filters.query) activeKeys.push("Từ khóa");
	if ((filters as any).status?.length) activeKeys.push("Trạng thái");
	if ((filters as any).priority?.length) activeKeys.push("Ưu tiên");
	if ((filters as any).createdAt?.from || (filters as any).createdAt?.to) activeKeys.push("Khoảng ngày tạo");
	if ((filters as any).deadline?.from || (filters as any).deadline?.to) activeKeys.push("Khoảng deadline");
	if ((filters as any).creatorId?.length) activeKeys.push("Người tạo");
	if ((filters as any).teamId?.length) activeKeys.push("Nhóm");
	if ((filters as any).categoryId?.length) activeKeys.push("Phân loại");

	const [expanded, setExpanded] = React.useState(false);

	return (
		<div className={className}>
			<div className="text-sm text-gray-700">
				{activeKeys.length === 0 ? (
					<span>Không có bộ lọc nào</span>
				) : (
					<span>{activeKeys.length} bộ lọc: {activeKeys.slice(0, compact ? 2 : activeKeys.length).join(", ")}{compact && activeKeys.length > 2 ? "…" : ""}</span>
				)}
			</div>
			{!compact && activeKeys.length > 0 && (
				<button onClick={() => setExpanded((v) => !v)} className="text-xs underline mt-1">{expanded ? "Thu gọn" : "Xem chi tiết"}</button>
			)}
			{expanded && (
				<pre className="mt-2 whitespace-pre-wrap break-words rounded bg-gray-50 p-2 text-xs">{JSON.stringify(filters, null, 2)}</pre>
			)}
		</div>
	);
}
