"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { requestSearchSchema, taskSearchSchema, type RequestSearchParams, type TaskSearchParams } from "@/lib/validators/search";

export type SearchEntity = "request" | "task";
export type SearchParams = RequestSearchParams | TaskSearchParams;

export type Option = { value: string; label: string };

type Props = {
	entity: SearchEntity;
	onSearch: (params: SearchParams) => void;
	initialValues?: Partial<SearchParams>;
	categories?: Option[];
	users?: Option[];
	teams?: Option[];
	className?: string;
};

export default function AdvancedSearchForm({ entity, onSearch, initialValues, categories = [], users = [], teams = [], className }: Props) {
	const schema = entity === "request" ? requestSearchSchema : taskSearchSchema;
	const {
		register,
		handleSubmit,
		reset,
		watch,
		setValue,
		formState: { errors, isSubmitting }
	} = useForm<SearchParams>({
		resolver: zodResolver(schema as any),
		defaultValues: {
			page: 1,
			limit: 10,
			sortBy: entity === "request" ? "createdAt" : "createdAt",
			sortOrder: "desc",
			...initialValues as any,
		} as any,
	});

	const [open, setOpen] = React.useState(false);

	// Debounce general query input
	const query = watch("query" as any) as string | undefined;
	React.useEffect(() => {
		const t = setTimeout(() => {
			// Only auto-trigger when typing in general query to keep UX snappy
			onSearch(getValuesSafe());
		}, 300);
		return () => clearTimeout(t);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [query]);

	function getValuesSafe(): SearchParams {
		const current = (Object.fromEntries(Object.entries((watch() as any) ?? {}).filter(([, v]) => v !== undefined)) as any) as SearchParams;
		return current;
	}

	function onSubmit() {
		onSearch(getValuesSafe());
	}

	function onReset() {
		reset({
			page: 1,
			limit: 10,
			sortBy: entity === "request" ? "createdAt" : "createdAt",
			sortOrder: "desc",
		} as any);
		onSearch(getValuesSafe());
	}

	// Helpers to manage multi-select via checkboxes
	function toggleArrayField(name: keyof SearchParams, value: string) {
		const curr = (watch(name as any) as string[] | undefined) ?? [];
		const next = curr.includes(value) ? curr.filter((v) => v !== value) : [...curr, value];
		setValue(name as any, next as any);
	}

	const isRequest = entity === "request";

	return (
		<div className={className}>
			<button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="inline-flex items-center gap-2 rounded border px-3 py-2 text-sm">
				<span>🔍 Tìm kiếm nâng cao</span>
				<span className="text-xs opacity-70">{open ? "Ẩn" : "Hiện"}</span>
			</button>

			{open && (
				<form className="mt-3 space-y-3" onSubmit={handleSubmit(onSubmit)}>
					{/* General search */}
					<div>
						<label className="block text-sm font-medium mb-1">Tìm kiếm tổng quát</label>
						<div className="flex items-center gap-2">
							<input type="text" placeholder="Nhập từ khóa..." className="w-full rounded border px-3 py-2 text-sm" {...register("query" as any)} />
							<button type="button" className="text-sm underline" onClick={() => { setValue("query" as any, "" as any); onSearch(getValuesSafe()); }}>Xóa</button>
						</div>
						{(errors as any)?.query && <p className="text-xs text-red-600 mt-1">{(errors as any).query.message as string}</p>}
					</div>

					{/* Grid of filters */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
						{/* Status */}
						<div>
							<label className="block text-sm font-medium mb-1">Trạng thái</label>
							<div className="flex flex-wrap gap-2 text-sm">
								{(isRequest ? ["OPEN","IN_PROGRESS","IN_REVIEW","DONE","ARCHIVED"] : ["TODO","IN_PROGRESS","BLOCKED","IN_REVIEW","REWORK","DONE"]).map((s) => (
									<label key={s} className="inline-flex items-center gap-2">
										<input type="checkbox" onChange={() => toggleArrayField("status" as any, s)} checked={((watch("status" as any) as string[] | undefined) ?? []).includes(s)} />
										<span>{s}</span>
									</label>
								))}
							</div>
						</div>

						{/* Priority (requests only) */}
						{isRequest && (
							<div>
								<label className="block text-sm font-medium mb-1">Độ ưu tiên</label>
								<div className="flex flex-wrap gap-2 text-sm">
									{[
										{v: "LOW", l: "🔵 LOW"},
										{v: "MEDIUM", l: "🟡 MEDIUM"},
										{v: "HIGH", l: "🟠 HIGH"},
										{v: "URGENT", l: "🔴 URGENT"},
									].map((p) => (
										<label key={p.v} className="inline-flex items-center gap-2">
											<input type="checkbox" onChange={() => toggleArrayField("priority" as any, p.v)} checked={((watch("priority" as any) as string[] | undefined) ?? []).includes(p.v)} />
											<span>{p.l}</span>
										</label>
									))}
								</div>
							</div>
						)}

						{/* Category / Creator / Team */}
						{isRequest && (
							<>
								<div>
									<label className="block text-sm font-medium mb-1">Phân loại</label>
									<select className="w-full rounded border px-2 py-2 text-sm" value={((watch("categoryId" as any) as string[] | undefined)?.[0]) ?? ""} onChange={(e) => setValue("categoryId" as any, e.target.value ? [e.target.value] as any : [] as any)}>
										<option value="">-- Chọn --</option>
										{categories.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
									</select>
								</div>
								<div>
									<label className="block text-sm font-medium mb-1">Người tạo</label>
									<select className="w-full rounded border px-2 py-2 text-sm" value={((watch("creatorId" as any) as string[] | undefined)?.[0]) ?? ""} onChange={(e) => setValue("creatorId" as any, e.target.value ? [e.target.value] as any : [] as any)}>
										<option value="">-- Chọn --</option>
										{users.map((u) => (<option key={u.value} value={u.value}>{u.label}</option>))}
									</select>
								</div>
								<div>
									<label className="block text-sm font-medium mb-1">Nhóm</label>
									<select className="w-full rounded border px-2 py-2 text-sm" value={((watch("teamId" as any) as string[] | undefined)?.[0]) ?? ""} onChange={(e) => setValue("teamId" as any, e.target.value ? [e.target.value] as any : [] as any)}>
										<option value="">-- Chọn --</option>
										{teams.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
									</select>
								</div>
							</>
						)}

						{/* Date ranges */}
						<div>
							<label className="block text-sm font-medium mb-1">Ngày tạo - Từ</label>
							<input type="date" className="w-full rounded border px-2 py-2 text-sm" {...register("createdAt.from" as any)} />
						</div>
						<div>
							<label className="block text-sm font-medium mb-1">Ngày tạo - Đến</label>
							<input type="date" className="w-full rounded border px-2 py-2 text-sm" {...register("createdAt.to" as any)} />
						</div>
						<div>
							<label className="block text-sm font-medium mb-1">Deadline - Từ</label>
							<input type="date" className="w-full rounded border px-2 py-2 text-sm" {...register("deadline.from" as any)} />
						</div>
						<div>
							<label className="block text-sm font-medium mb-1">Deadline - Đến</label>
							<input type="date" className="w-full rounded border px-2 py-2 text-sm" {...register("deadline.to" as any)} />
						</div>

						{/* Boolean */}
						<div className="flex items-center gap-2">
							<input type="checkbox" id="hasOverdue" {...register("hasOverdue" as any)} />
							<label htmlFor="hasOverdue" className="text-sm">Chỉ quá hạn</label>
						</div>
						{isRequest && (
							<div className="flex items-center gap-2">
								<input type="checkbox" id="hasTags" onChange={(e) => { if (!e.target.checked) setValue("tags" as any, [] as any); }} />
								<label htmlFor="hasTags" className="text-sm">Có gắn tag</label>
							</div>
						)}

						{/* Sort */}
						<div>
							<label className="block text-sm font-medium mb-1">Sắp xếp theo</label>
							<select className="w-full rounded border px-2 py-2 text-sm" {...register("sortBy" as any)}>
								{(isRequest ? [
									{v: "createdAt", l: "Ngày tạo"},
									{v: "deadline", l: "Deadline"},
									{v: "priority", l: "Độ ưu tiên"},
									{v: "status", l: "Trạng thái"},
								] : [
									{v: "createdAt", l: "Ngày tạo"},
									{v: "deadline", l: "Deadline"},
									{v: "status", l: "Trạng thái"},
									{v: "title", l: "Tiêu đề"},
								]).map((o) => (<option key={o.v} value={o.v}>{o.l}</option>))}
							</select>
						</div>
						<div>
							<label className="block text-sm font-medium mb-1">Thứ tự</label>
							<select className="w-full rounded border px-2 py-2 text-sm" {...register("sortOrder" as any)}>
								<option value="asc">Tăng dần ↑</option>
								<option value="desc">Giảm dần ↓</option>
							</select>
						</div>
					</div>

					{/* Actions */}
					<div className="flex items-center gap-2 pt-2">
						<button type="submit" disabled={isSubmitting} className="rounded bg-black text-white px-3 py-2 text-sm">🔍 Tìm kiếm</button>
						<button type="button" onClick={onReset} className="rounded border px-3 py-2 text-sm">🔄 Đặt lại</button>
						<button type="button" onClick={() => {
							try { localStorage.setItem(`search:${entity}`, JSON.stringify(getValuesSafe())); } catch {}
						}} className="rounded border px-3 py-2 text-sm">💾 Lưu tìm kiếm</button>
					</div>
				</form>
			)}
		</div>
	);
}
