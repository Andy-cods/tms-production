"use client";

import { useMemo, useState } from "react";
import { createSlaConfig, toggleSlaConfig, updateSlaConfig } from "@/actions/sla-config";
import { useToast } from "@/hooks/use-toast";

type SlaConfig = {
	id: string;
	name: string;
	targetEntity: "REQUEST" | "TASK";
	priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | null;
	category: string | null;
	targetHours: number;
	description: string | null;
	isActive: boolean;
	createdAt: string | Date;
	updatedAt: string | Date;
};

export function SlaConfigAdminClient({ configs, categories }: { configs: SlaConfig[]; categories: { id: string; name: string }[] }) {
	const toast = useToast();
	const [editing, setEditing] = useState<SlaConfig | null>(null);
	const [creating, setCreating] = useState<boolean>(false);
	const [busy, setBusy] = useState<string | null>(null);

	const byEntity = useMemo(() => {
		return {
			REQUEST: configs.filter(c => c.targetEntity === "REQUEST"),
			TASK: configs.filter(c => c.targetEntity === "TASK"),
		};
	}, [configs]);

	async function onToggle(cfg: SlaConfig, checked: boolean) {
		setBusy(cfg.id);
		const res = await toggleSlaConfig(cfg.id, checked);
		setBusy(null);
		if (!res.ok) toast.error("Lỗi", res.message);
		else toast.success("Thành công", res.message);
	}

	function PriorityCell(p: SlaConfig["priority"]) {
		if (!p) return <span className="text-gray-500">Tất cả</span>;
		return <span>{p}</span>;
	}

	function CategoryCell(c: SlaConfig["category"]) {
		if (!c) return <span className="text-gray-500">Tất cả</span>;
		return <span>{c}</span>;
	}

	function Table({ list }: { list: SlaConfig[] }) {
		return (
			<div className="rounded border bg-white overflow-x-auto">
				<table className="w-full text-sm">
					<thead className="bg-gray-50">
						<tr>
							<th className="px-3 py-2 text-left">Tên quy tắc</th>
							<th className="px-3 py-2 text-left">Áp dụng</th>
							<th className="px-3 py-2 text-left">Thời gian mục tiêu (giờ)</th>
							<th className="px-3 py-2 text-left">Trạng thái</th>
							<th className="px-3 py-2 text-left">Hành động</th>
						</tr>
					</thead>
					<tbody>
						{list.map((c) => (
							<tr key={c.id} className="border-t">
								<td className="px-3 py-2">{c.name}</td>
								<td className="px-3 py-2">
									<div className="flex items-center gap-2">
										<PriorityCell {...({} as any)} />
										<CategoryCell {...({} as any)} />
									</div>
								</td>
								<td className="px-3 py-2">{c.targetHours}</td>
								<td className="px-3 py-2">
									<label className="inline-flex items-center gap-2 text-xs">
										<input type="checkbox" checked={c.isActive} disabled={busy === c.id} onChange={(e) => onToggle(c, e.target.checked)} />
										<span>{c.isActive ? "Hoạt động" : "Tạm dừng"}</span>
									</label>
								</td>
								<td className="px-3 py-2">
									<button className="px-2 py-1 border rounded text-xs mr-2" onClick={() => setEditing(c)}>Sửa</button>
								</td>
							</tr>
						))}
						{list.length === 0 && (
							<tr>
								<td className="px-3 py-6 text-center text-gray-500" colSpan={5}>Không có quy tắc</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		);
	}

	return (
		<div className="p-6 max-w-6xl mx-auto space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Cấu hình SLA</h1>
				<p className="text-gray-600">Quản lý thời gian xử lý mục tiêu</p>
			</div>

			<div className="flex items-center justify-between">
				<div className="flex gap-4 text-sm">
					<button className="px-3 py-1 rounded border bg-gray-900 text-white">SLA Yêu cầu (Request)</button>
					<button className="px-3 py-1 rounded border">SLA Công việc (Task)</button>
				</div>
				<button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={() => setCreating(true)}>+ Thêm quy tắc SLA</button>
			</div>

			{/* Request tab */}
			<Table list={byEntity.REQUEST} />

			{/* Task tab */}
			<Table list={byEntity.TASK} />
		</div>
	);
}
