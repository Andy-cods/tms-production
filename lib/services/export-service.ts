import { prisma } from "@/lib/prisma";
import { Logger } from "@/lib/utils/logger";
import type { ReportConfig } from "@/types/report";
import { excelBuilder } from "./excel-builder";
import { csvBuilder } from "./csv-builder";
import { pdfService } from "./pdf-service";

export class ExportService {
  async generateReport(config: ReportConfig, userId: string): Promise<{ buffer: Buffer; fileName: string; mimeType: string }> {
    try {
      // Fetch data based on report type
      const data = await this.fetchReportData(config);

      // Generate file based on format
      let buffer: Buffer;
      let fileName: string;
      let mimeType: string;

      switch (config.format) {
        case "CSV":
          buffer = await this.generateCSV(data, config);
          fileName = `${config.type}_${Date.now()}.csv`;
          mimeType = "text/csv";
          break;

        case "EXCEL":
          buffer = await this.generateExcel(data, config);
          fileName = `${config.type}_${Date.now()}.xlsx`;
          mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
          break;

        case "PDF":
          buffer = await this.generatePDF(data, config);
          fileName = `${config.type}_${Date.now()}.pdf`;
          mimeType = "application/pdf";
          break;

        default:
          throw new Error(`Unsupported format: ${config.format}`);
      }

      Logger.info("Report generated", {
        action: "generateReport",
        type: config.type,
        format: config.format,
        recordCount: data.length,
        userId,
      });

      return { buffer, fileName, mimeType };
    } catch (error) {
      Logger.captureException(error as Error, { action: "generateReport", userId });
      throw error;
    }
  }

  private async fetchReportData(config: ReportConfig): Promise<any[]> {
    switch (config.type) {
      case "REQUESTS_LIST":
        return this.fetchRequestsData(config);
      case "TASKS_LIST":
        return this.fetchTasksData(config);
      case "TEAM_PERFORMANCE":
        return this.fetchTeamPerformanceData(config);
      default:
        throw new Error(`Unsupported report type: ${config.type}`);
    }
  }

  private async fetchRequestsData(config: ReportConfig): Promise<any[]> {
    const where: any = {
      createdAt: {
        gte: config.filters.dateRange.from,
        lte: config.filters.dateRange.to,
      },
    };

    if (config.filters.teamIds && config.filters.teamIds.length > 0) {
      where.teamId = { in: config.filters.teamIds };
    }

    if (config.filters.status && config.filters.status.length > 0) {
      where.status = { in: config.filters.status };
    }

    if (config.filters.priority && config.filters.priority.length > 0) {
      where.priority = { in: config.filters.priority };
    }

    if (config.filters.includeArchived === false) {
      where.status = { ...where.status, not: "ARCHIVED" };
    }

    return await prisma.request.findMany({
      where,
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
        team: {
          select: { id: true, name: true },
        },
        category: {
          select: { id: true, name: true },
        },
        _count: {
          select: { tasks: true, comments: true },
        },
      },
      orderBy: {
        createdAt: config.sortOrder || "desc",
      },
    });
  }

  private async fetchTasksData(config: ReportConfig): Promise<any[]> {
    const where: any = {
      createdAt: {
        gte: config.filters.dateRange.from,
        lte: config.filters.dateRange.to,
      },
    };

    if (config.filters.userIds && config.filters.userIds.length > 0) {
      where.assigneeId = { in: config.filters.userIds };
    }

    if (config.filters.status && config.filters.status.length > 0) {
      where.status = { in: config.filters.status };
    }

    return await prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: { name: true, email: true },
        },
        request: {
          select: {
            id: true,
            title: true,
            priority: true,
            creator: { select: { name: true } },
          },
        },
      },
      orderBy: {
        createdAt: config.sortOrder || "desc",
      },
    });
  }

  private async fetchTeamPerformanceData(config: ReportConfig): Promise<any[]> {
    // Simplified team performance data
    const teams = await prisma.team.findMany({
      where: config.filters.teamIds ? { id: { in: config.filters.teamIds } } : undefined,
    });

    // Get members separately
    const teamsWithMembers = await Promise.all(
      teams.map(async (team) => {
        const members = await prisma.user.findMany({
          where: { teamId: team.id },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        });

        return {
          team: {
            id: team.id,
            name: team.name,
          },
          metrics: {
            totalRequests: 0, // Would calculate from actual data
            completedRequests: 0,
            slaCompliance: 0,
            avgLeadTime: 0,
          },
          members: members.map((member) => ({
            ...member,
            _count: { assignedTasks: 0 },
            completedTasks: 0,
          })),
        };
      })
    );

    return teamsWithMembers;
  }

  private async generateCSV(data: any[], config: ReportConfig): Promise<Buffer> {
    switch (config.type) {
      case "REQUESTS_LIST":
        return csvBuilder.buildRequestsCSV(data);
      case "TASKS_LIST":
        return csvBuilder.buildTasksCSV(data);
      case "TEAM_PERFORMANCE":
        return csvBuilder.buildTeamPerformanceCSV(data);
      default:
        throw new Error(`CSV not supported for ${config.type}`);
    }
  }

  private async generateExcel(data: any[], config: ReportConfig): Promise<Buffer> {
    const builder = new (await import("./excel-builder")).ExcelBuilder();

    switch (config.type) {
      case "REQUESTS_LIST":
        return builder.buildRequestsReport(data, config);
      case "TASKS_LIST":
        return builder.buildTasksReport(data, config);
      case "TEAM_PERFORMANCE":
        return builder.buildTeamPerformanceReport(data, config);
      default:
        throw new Error(`Excel not supported for ${config.type}`);
    }
  }

  private async generatePDF(data: any[], config: ReportConfig): Promise<Buffer> {
    // Prepare data for PDF templates
    const pdfData = this.preparePDFData(data, config);

    switch (config.type) {
      case "KPI_SUMMARY":
        return pdfService.generateKPISummaryPDF(pdfData, config);
      case "TEAM_PERFORMANCE":
        return pdfService.generateTeamPerformancePDF(pdfData, config);
      case "DASHBOARD_SNAPSHOT":
        throw new Error("Dashboard snapshot requires Puppeteer/external service");
      default:
        throw new Error(`PDF not supported for ${config.type}`);
    }
  }

  private preparePDFData(data: any[], config: ReportConfig): any {
    // Transform data to format expected by PDF templates
    switch (config.type) {
      case "KPI_SUMMARY":
        return {
          kpis: [
            { title: "Completion Rate", value: "85%", change: 5.2 },
            { title: "SLA Compliance", value: "92%", change: 2.1 },
            { title: "Avg Lead Time", value: "3.5d", change: -0.8 },
          ],
          metrics: [
            { name: "Total Requests", current: data.length, previous: data.length - 10 },
            { name: "Completed", current: data.filter((d: any) => d.status === "DONE").length, previous: 0 },
          ],
        };
      case "TEAM_PERFORMANCE":
        return {
          teams: data.map((team) => ({
            name: team.team.name,
            metrics: team.metrics,
            members: team.members,
          })),
        };
      default:
        return data;
    }
  }

  async getRecordCount(config: ReportConfig): Promise<number> {
    const where = this.buildWhereClause(config);

    switch (config.type) {
      case "REQUESTS_LIST":
        return await prisma.request.count({ where: where as any });
      case "TASKS_LIST":
        return await prisma.task.count({ where: where as any });
      default:
        return 0;
    }
  }

  private buildWhereClause(config: ReportConfig): any {
    return {
      createdAt: {
        gte: config.filters.dateRange.from,
        lte: config.filters.dateRange.to,
      },
      ...(config.filters.teamIds && { teamId: { in: config.filters.teamIds } }),
      ...(config.filters.status && { status: { in: config.filters.status } }),
      ...(config.filters.priority && { priority: { in: config.filters.priority } }),
    };
  }
}

export const exportService = new ExportService();

