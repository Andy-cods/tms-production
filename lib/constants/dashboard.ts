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
  LOW: '#94a3b8',      // slate-400
  MEDIUM: '#3b82f6',   // blue-500
  HIGH: '#f97316',     // orange-500
  URGENT: '#ef4444',   // red-500
};

// Status colors for charts
export const STATUS_COLORS = {
  OPEN: '#3b82f6',         // blue-500
  IN_PROGRESS: '#eab308',  // yellow-500
  IN_REVIEW: '#a855f7',    // purple-500
  DONE: '#22c55e',         // green-500
  REJECTED: '#ef4444',     // red-500
  ARCHIVED: '#6b7280',     // gray-500
};

