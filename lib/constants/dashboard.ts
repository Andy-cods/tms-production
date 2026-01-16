import type { MetricType } from "@/types/dashboard";

export const KPI_TYPES: MetricType[] = [
  'COMPLETION_RATE',
  'SLA_COMPLIANCE',
  'AVG_LEAD_TIME',
  'BACKLOG_COUNT',
  'THROUGHPUT',
];

export const KPI_COLORS: Record<MetricType, string> = {
  COMPLETION_RATE: 'bg-green-500',
  SLA_COMPLIANCE: 'bg-blue-500',
  AVG_LEAD_TIME: 'bg-orange-500',
  BACKLOG_COUNT: 'bg-purple-500',
  THROUGHPUT: 'bg-pink-500',
};

export const KPI_ICONS: Record<MetricType, string> = {
  COMPLETION_RATE: 'CheckCircle',
  SLA_COMPLIANCE: 'Clock',
  AVG_LEAD_TIME: 'Timer',
  BACKLOG_COUNT: 'ListTodo',
  THROUGHPUT: 'TrendingUp',
};

export const KPI_TITLES: Record<MetricType, string> = {
  COMPLETION_RATE: 'Tỷ lệ hoàn thành',
  SLA_COMPLIANCE: 'Tuân thủ SLA',
  AVG_LEAD_TIME: 'Thời gian xử lý TB',
  BACKLOG_COUNT: 'Công việc tồn đọng',
  THROUGHPUT: 'Năng suất',
};

export const KPI_DESCRIPTIONS: Record<MetricType, string> = {
  COMPLETION_RATE: 'Phần trăm yêu cầu đã hoàn thành trong kỳ',
  SLA_COMPLIANCE: 'Phần trăm yêu cầu đáp ứng SLA',
  AVG_LEAD_TIME: 'Thời gian trung bình từ tạo đến hoàn thành',
  BACKLOG_COUNT: 'Số lượng yêu cầu đang chờ xử lý',
  THROUGHPUT: 'Số lượng yêu cầu hoàn thành trong kỳ',
};

// Refresh interval: 5 minutes
export const REFRESH_INTERVAL = 5 * 60 * 1000;

// Cache TTL: 5 minutes
export const CACHE_TTL = 5 * 60 * 1000;

// Date range presets
export const DATE_RANGE_PRESETS = {
  week: {
    label: 'Tuần này',
    days: 7,
  },
  month: {
    label: 'Tháng này',
    days: 30,
  },
  quarter: {
    label: 'Quý này',
    days: 90,
  },
  year: {
    label: 'Năm này',
    days: 365,
  },
};

// Priority colors for charts
export const PRIORITY_COLORS = {
  LOW: '#9ca3af',      // gray-400
  MEDIUM: '#3b82f6',   // blue-500
  HIGH: '#f97316',     // orange-500
  URGENT: '#ef4444',   // red-500
};

export const PRIORITY_EMOJIS: Record<keyof typeof PRIORITY_COLORS, string> = {
  LOW: "🔵",
  MEDIUM: "🟡",
  HIGH: "🟠",
  URGENT: "🔴",
};

export function getPriorityEmoji(priority: string | null | undefined) {
  if (!priority) return "";
  return PRIORITY_EMOJIS[priority as keyof typeof PRIORITY_EMOJIS] ?? "";
}

// Task/workload status colors for charts (workload distribution pie)
export const TASK_STATUS_COLORS: Record<string, string> = {
  TODO: "#9CA3AF", // gray-400
  IN_PROGRESS: "#FF872E", // accent-500 (orange)
  IN_REVIEW: "#3B82F6", // blue-500
  BLOCKED: "#EF4444", // red-500
  DONE: "#52B26B", // primary-500 (green)
  REWORK: "#F59E0B", // amber-500
};

export const TASK_STATUS_LABELS: Record<string, string> = {
  TODO: "Chưa bắt đầu",
  IN_PROGRESS: "Đang làm",
  IN_REVIEW: "Chờ duyệt",
  BLOCKED: "Bị chặn",
  DONE: "Hoàn thành",
};

// Cumulative Flow Diagram palette (keep exact existing hues for this chart)
export const CFD_STATUS_COLORS: Record<string, string> = {
  DONE: "#10b981", // green
  IN_REVIEW: "#8b5cf6", // purple
  IN_PROGRESS: "#3b82f6", // blue
  TODO: "#6b7280", // gray
  BLOCKED: "#ef4444", // red
};

export const CFD_STATUS_LABELS: Record<string, string> = {
  DONE: "Hoàn thành",
  IN_REVIEW: "Chờ duyệt",
  IN_PROGRESS: "Đang làm",
  TODO: "Chưa bắt đầu",
  BLOCKED: "Bị chặn",
};

