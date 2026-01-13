import ExcelJS from "exceljs";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import type { ReportConfig } from "@/types/report";

export class ExcelBuilder {
  private workbook: ExcelJS.Workbook;

  constructor() {
    this.workbook = new ExcelJS.Workbook();
    this.workbook.creator = "TMS System";
    this.workbook.created = new Date();
    this.workbook.modified = new Date();
  }

  async buildRequestsReport(data: any[], config: ReportConfig): Promise<Buffer> {
    const sheet = this.workbook.addWorksheet("Requests", {
      properties: { tabColor: { argb: "3B82F6" } },
    });

    // Define columns
    sheet.columns = [
      { header: "STT", key: "stt", width: 8 },
      { header: "Title", key: "title", width: 40 },
      { header: "Status", key: "status", width: 15 },
      { header: "Priority", key: "priority", width: 12 },
      { header: "Category", key: "category", width: 20 },
      { header: "Creator", key: "creator", width: 25 },
      { header: "Team", key: "team", width: 20 },
      { header: "Tasks", key: "taskCount", width: 10 },
      { header: "Created Date", key: "createdAt", width: 18 },
      { header: "Deadline", key: "deadline", width: 18 },
      { header: "Completed Date", key: "completedAt", width: 18 },
      { header: "SLA Status", key: "slaStatus", width: 15 },
    ];

    // Style header row
    this.styleHeader(sheet.getRow(1));

    // Add data rows
    data.forEach((request, index) => {
      const row = sheet.addRow({
        stt: index + 1,
        title: request.title,
        status: request.status,
        priority: request.priority,
        category: request.category?.name || "N/A",
        creator: request.creator?.name || "N/A",
        team: request.team?.name || "N/A",
        taskCount: request._count?.tasks || 0,
        createdAt: request.createdAt ? format(new Date(request.createdAt), "dd/MM/yyyy HH:mm", { locale: vi }) : "",
        deadline: request.deadline ? format(new Date(request.deadline), "dd/MM/yyyy HH:mm", { locale: vi }) : "",
        completedAt: request.completedAt ? format(new Date(request.completedAt), "dd/MM/yyyy HH:mm", { locale: vi }) : "",
        slaStatus: request.slaStatus || "N/A",
      });

      // Conditional formatting
      this.applyStatusFormatting(row, request.status);
      this.applyPriorityFormatting(row, request.priority);
      this.applySLAFormatting(row, request.slaStatus);
    });

    // Auto-filter
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: data.length + 1, column: sheet.columns?.length || 12 },
    };

    // Freeze header row
    sheet.views = [{ state: "frozen", xSplit: 0, ySplit: 1 }];

    // Add summary sheet
    await this.addSummarySheet(data, config);

    return Buffer.from(await this.workbook.xlsx.writeBuffer());
  }

  async buildTasksReport(data: any[], config: ReportConfig): Promise<Buffer> {
    const sheet = this.workbook.addWorksheet("Tasks");

    sheet.columns = [
      { header: "STT", key: "stt", width: 8 },
      { header: "Title", key: "title", width: 40 },
      { header: "Status", key: "status", width: 15 },
      { header: "Priority", key: "priority", width: 12 },
      { header: "Assignee", key: "assignee", width: 25 },
      { header: "Request", key: "request", width: 30 },
      { header: "Created Date", key: "createdAt", width: 18 },
      { header: "Deadline", key: "deadline", width: 18 },
      { header: "Completed Date", key: "completedAt", width: 18 },
    ];

    this.styleHeader(sheet.getRow(1));

    data.forEach((task, index) => {
      sheet.addRow({
        stt: index + 1,
        title: task.title,
        status: task.status,
        priority: task.request?.priority || "N/A",
        assignee: task.assignee?.name || "Unassigned",
        request: task.request?.title || "N/A",
        createdAt: task.createdAt ? format(new Date(task.createdAt), "dd/MM/yyyy HH:mm", { locale: vi }) : "",
        deadline: task.deadline ? format(new Date(task.deadline), "dd/MM/yyyy HH:mm", { locale: vi }) : "",
        completedAt: task.completedAt ? format(new Date(task.completedAt), "dd/MM/yyyy HH:mm", { locale: vi }) : "",
      });
    });

    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: data.length + 1, column: sheet.columns?.length || 9 },
    };

    sheet.views = [{ state: "frozen", xSplit: 0, ySplit: 1 }];

    return Buffer.from(await this.workbook.xlsx.writeBuffer());
  }

  async buildTeamPerformanceReport(data: any[], config: ReportConfig): Promise<Buffer> {
    // Summary sheet
    const summarySheet = this.workbook.addWorksheet("Team Summary");

    summarySheet.columns = [
      { header: "Team", key: "team", width: 25 },
      { header: "Members", key: "memberCount", width: 12 },
      { header: "Total Requests", key: "totalRequests", width: 15 },
      { header: "Completed", key: "completed", width: 12 },
      { header: "Completion Rate", key: "completionRate", width: 18 },
      { header: "SLA Compliance", key: "slaCompliance", width: 18 },
      { header: "Avg Lead Time (days)", key: "avgLeadTime", width: 20 },
    ];

    this.styleHeader(summarySheet.getRow(1));

    // Add team data
    data.forEach((teamData) => {
      const row = summarySheet.addRow({
        team: teamData.team.name,
        memberCount: teamData.members.length,
        totalRequests: teamData.metrics.totalRequests,
        completed: teamData.metrics.completedRequests,
        completionRate: `${((teamData.metrics.completedRequests / teamData.metrics.totalRequests) * 100).toFixed(1)}%`,
        slaCompliance: `${teamData.metrics.slaCompliance.toFixed(1)}%`,
        avgLeadTime: teamData.metrics.avgLeadTime.toFixed(1),
      });

      // Color code completion rate
      const completionCell = row.getCell("completionRate");
      const rate = (teamData.metrics.completedRequests / teamData.metrics.totalRequests) * 100;
      if (rate >= 90) {
        completionCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "C6EFCE" } };
      } else if (rate >= 70) {
        completionCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEB9C" } };
      } else {
        completionCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC7CE" } };
      }
    });

    return Buffer.from(await this.workbook.xlsx.writeBuffer());
  }

  private applyStatusFormatting(row: ExcelJS.Row, status: string) {
    const statusCell = row.getCell("status");
    const colors: Record<string, string> = {
      OPEN: "E3F2FD",
      IN_PROGRESS: "FFF9C4",
      IN_REVIEW: "F3E5F5",
      DONE: "C8E6C9",
      ARCHIVED: "EEEEEE",
      REJECTED: "FFCDD2",
    };
    statusCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: colors[status] || "FFFFFF" },
    };
  }

  private applyPriorityFormatting(row: ExcelJS.Row, priority: string) {
    const priorityCell = row.getCell("priority");
    const colors: Record<string, string> = {
      LOW: "BBDEFB",
      MEDIUM: "FFF59D",
      HIGH: "FFCC80",
      URGENT: "EF9A9A",
    };
    priorityCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: colors[priority] || "FFFFFF" },
    };
    if (priority === "URGENT") {
      priorityCell.font = { bold: true };
    }
  }

  private applySLAFormatting(row: ExcelJS.Row, slaStatus: string | null) {
    if (!slaStatus) return;

    const slaCell = row.getCell("slaStatus");
    if (slaStatus === "OVERDUE") {
      slaCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFC7CE" },
      };
      slaCell.font = { bold: true, color: { argb: "C00000" } };
    } else if (slaStatus === "AT_RISK") {
      slaCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFEB9C" },
      };
    }
  }

  private styleHeader(row: ExcelJS.Row) {
    row.font = { bold: true, color: { argb: "FFFFFF" } };
    row.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "3B82F6" },
    };
    row.alignment = { vertical: "middle", horizontal: "center" };
    row.height = 25;
  }

  private async addSummarySheet(data: any[], config: ReportConfig) {
    const summarySheet = this.workbook.addWorksheet("Summary");
    summarySheet.properties.tabColor = { argb: "10B981" };

    // Report metadata
    summarySheet.addRow(["Báo cáo TMS"]);
    summarySheet.addRow(["Ngày tạo:", format(new Date(), "dd/MM/yyyy HH:mm", { locale: vi })]);
    summarySheet.addRow([
      "Khoảng thời gian:",
      `${format(config.filters.dateRange.from, "dd/MM/yyyy", { locale: vi })} - ${format(config.filters.dateRange.to, "dd/MM/yyyy", { locale: vi })}`,
    ]);
    summarySheet.addRow([]);

    // Statistics
    summarySheet.addRow(["Tổng số records:", data.length]);

    if (config.type === "REQUESTS_LIST") {
      const statusCounts = data.reduce((acc: Record<string, number>, r: any) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      }, {});

      summarySheet.addRow([]);
      summarySheet.addRow(["Theo Status:"]);
      Object.entries(statusCounts).forEach(([status, count]) => {
        summarySheet.addRow(["", status, count]);
      });
    }

    // Style summary
    summarySheet.getCell("A1").font = { bold: true, size: 14 };
    summarySheet.getColumn(1).width = 25;
    summarySheet.getColumn(2).width = 30;
  }
}

export const excelBuilder = new ExcelBuilder();

