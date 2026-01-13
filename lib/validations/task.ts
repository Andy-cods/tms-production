import { z } from "zod";

export const TaskStatusEnum = z.enum([
  "TODO", "IN_PROGRESS", "BLOCKED", "IN_REVIEW", "REWORK", "DONE",
]);

export const CreateTaskSchema = z.object({
  requestId: z.string().uuid(),
  title: z.string().min(3).max(120),
  description: z.string().max(2000).optional().default(""),
  deadline: z.string().optional(), // ISO (yyyy-mm-dd) từ <input type="date">
});

export const AssignTaskSchema = z.object({
  taskId: z.string().uuid(),
  assigneeId: z.union([z.string().uuid(), z.literal("")]).optional(),
});

export const UpdateTaskStatusSchema = z.object({
  taskId: z.string().uuid(),
  status: TaskStatusEnum,
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type AssignTaskInput = z.infer<typeof AssignTaskSchema>;
export type UpdateTaskStatusInput = z.infer<typeof UpdateTaskStatusSchema>;
