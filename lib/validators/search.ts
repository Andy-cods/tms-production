import { z } from "zod";
import type { DateRangeFilter, SortOrder } from "@/types/search";

const StatusValues = ["OPEN","IN_PROGRESS","IN_REVIEW","REWORK","DONE","REJECTED","ARCHIVED"] as const;
const TaskStatusValues = ["TODO","IN_PROGRESS","BLOCKED","IN_REVIEW","REWORK","DONE"] as const;
const PriorityValues = ["LOW","MEDIUM","HIGH","URGENT"] as const;
const RequestSortFields = ["createdAt","deadline","priority","status"] as const;
const TaskSortFields = ["createdAt","deadline","priority","status","title"] as const;

const dateRangeSchema = z.object({
	from: z.preprocess((v) => v ? new Date(String(v)) : undefined, z.date().optional()),
	to: z.preprocess((v) => v ? new Date(String(v)) : undefined, z.date().optional()),
}).refine((val) => {
	if (val.from && val.to) {
		return val.from <= val.to;
	}
	return true;
}, { message: "Ngày bắt đầu phải trước ngày kết thúc" });

const commaToArray = (v: unknown): string[] | undefined => {
	if (Array.isArray(v)) return v.map((s) => String(s).trim()).filter(Boolean);
	if (typeof v === "string") return v.split(",").map((s) => s.trim()).filter(Boolean);
	return undefined;
};

const basePaging = {
	sortOrder: z.enum(["asc","desc"]).optional().default("desc"),
	page: z.preprocess((v) => v == null ? undefined : Number(v), z.number().int().min(1, "Trang phải từ 1").optional().default(1)),
	limit: z.preprocess((v) => v == null ? 10 : Number(v), z.number().int().min(5, "Giới hạn phải từ 5 đến 100").max(100, "Giới hạn phải từ 5 đến 100").default(10)),
};

export const requestSearchSchema = z.object({
	query: z.preprocess((v) => typeof v === "string" ? v.trim() : v, z.string().min(2, "Từ khóa tìm kiếm phải có ít nhất 2 ký tự").optional()),
	title: z.preprocess((v) => typeof v === "string" ? v.trim() : v, z.string().optional()),
	description: z.preprocess((v) => typeof v === "string" ? v.trim() : v, z.string().optional()),
	status: z.preprocess(commaToArray, z.array(z.enum(StatusValues)).optional()),
	priority: z.preprocess(commaToArray, z.array(z.enum(PriorityValues)).optional()),
	categoryId: z.preprocess(commaToArray, z.array(z.string()).optional()),
	creatorId: z.preprocess(commaToArray, z.array(z.string()).optional()),
	teamId: z.preprocess(commaToArray, z.array(z.string()).optional()),
	tags: z.preprocess(commaToArray, z.array(z.string()).optional()),
	createdAt: dateRangeSchema.optional(),
	deadline: dateRangeSchema.optional(),
	hasOverdue: z.preprocess((v) => v === "true" || v === "1" || v === true, z.boolean().optional()),
	sortBy: z.enum(RequestSortFields).optional().default("createdAt"),
	...basePaging,
});

export type RequestSearchParams = z.infer<typeof requestSearchSchema>;

export const taskSearchSchema = z.object({
	query: z.preprocess((v) => typeof v === "string" ? v.trim() : v, z.string().min(2, "Từ khóa tìm kiếm phải có ít nhất 2 ký tự").optional()),
	title: z.preprocess((v) => typeof v === "string" ? v.trim() : v, z.string().optional()),
	status: z.preprocess(commaToArray, z.array(z.enum(TaskStatusValues)).optional()),
	priority: z.preprocess(commaToArray, z.array(z.enum(PriorityValues)).optional()),
	assigneeId: z.preprocess(commaToArray, z.array(z.string()).optional()),
	requestId: z.preprocess((v) => typeof v === "string" ? v.trim() : v, z.string().optional()),
	hasDeadline: z.preprocess((v) => v === "true" || v === "1" || v === true, z.boolean().optional()),
	isOverdue: z.preprocess((v) => v === "true" || v === "1" || v === true, z.boolean().optional()),
	createdAt: dateRangeSchema.optional(),
	deadline: dateRangeSchema.optional(),
	sortBy: z.enum(TaskSortFields).optional().default("createdAt"),
	...basePaging,
});

export type TaskSearchParams = z.infer<typeof taskSearchSchema>;
