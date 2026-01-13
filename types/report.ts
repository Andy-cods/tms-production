export type ReportType =
  | "REQUESTS_LIST"
  | "TASKS_LIST"
  | "DASHBOARD_SNAPSHOT"
  | "KPI_SUMMARY"
  | "TEAM_PERFORMANCE"
  | "HISTORICAL_TREND";

export type ReportFormat = "CSV" | "EXCEL" | "PDF";

export interface ReportConfig {
  type: ReportType;
  format: ReportFormat;
  filters: {
    dateRange: {
      from: Date;
      to: Date;
    };
    teamIds?: string[];
    userIds?: string[];
    status?: string[];
    priority?: string[];
    includeCompleted?: boolean;
    includeArchived?: boolean;
  };
  columns?: string[]; // For list reports
  groupBy?: "team" | "user" | "status" | "priority";
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ReportMetadata {
  id: string;
  type: ReportType;
  format: ReportFormat;
  generatedAt: Date;
  generatedBy: {
    id: string;
    name: string;
  };
  downloadUrl: string;
  expiresAt: Date;
  fileSize: number;
}

export interface QuickReport {
  title: string;
  type: ReportType;
  format: ReportFormat;
  filters: ReportConfig["filters"];
}

