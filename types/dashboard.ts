export interface KPICard {
  title: string;
  value: number | string;
  change?: number; // percentage
  trend?: 'up' | 'down' | 'stable';
  icon: string;
  color: string;
  description?: string;
}

export interface DashboardFilters {
  teamId?: string;
  period: 'week' | 'month' | 'quarter' | 'year';
  startDate?: Date;
  endDate?: Date;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface TeamMetrics {
  teamId: string;
  teamName: string;
  completionRate: number;
  slaCompliance: number;
  activeRequests: number;
  activeTasks: number;
}

export type MetricType = 
  | 'COMPLETION_RATE'
  | 'SLA_COMPLIANCE'
  | 'AVG_LEAD_TIME'
  | 'BACKLOG_COUNT'
  | 'THROUGHPUT';

export type MetricPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface DashboardMetricData {
  metricType: MetricType;
  value: number;
  previousValue?: number;
  change?: number;
  period: MetricPeriod;
  teamId?: string;
  metadata?: Record<string, any>;
}

export interface RawMetricsData {
  totalRequests: number;
  completedRequests: number;
  totalTasks: number;
  completedTasks: number;
  overdueRequests: number;
  overdueTasks: number;
  avgLeadTime: number; // in hours
  byPriority: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    URGENT: number;
  };
  byStatus: {
    OPEN: number;
    IN_PROGRESS: number;
    IN_REVIEW: number;
    DONE: number;
    REJECTED: number;
  };
}

