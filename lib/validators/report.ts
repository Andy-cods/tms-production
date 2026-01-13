import { z } from "zod";

export const reportConfigSchema = z.object({
  type: z.enum([
    "REQUESTS_LIST",
    "TASKS_LIST",
    "DASHBOARD_SNAPSHOT",
    "KPI_SUMMARY",
    "TEAM_PERFORMANCE",
    "HISTORICAL_TREND",
  ]),
  format: z.enum(["CSV", "EXCEL", "PDF"]),
  filters: z.object({
    dateRange: z
      .object({
        from: z.date(),
        to: z.date(),
      })
      .refine((data) => data.from <= data.to, {
        message: "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc",
      }),
    teamIds: z.array(z.string()).optional(),
    userIds: z.array(z.string()).optional(),
    status: z.array(z.string()).optional(),
    priority: z.array(z.string()).optional(),
    includeCompleted: z.boolean().default(true),
    includeArchived: z.boolean().default(false),
  }),
  columns: z.array(z.string()).optional(),
  groupBy: z.enum(["team", "user", "status", "priority"]).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type ReportConfigInput = z.infer<typeof reportConfigSchema>;

