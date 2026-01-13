import { pdf } from "@react-pdf/renderer";
import { Logger } from "@/lib/utils/logger";
import type { ReportConfig } from "@/types/report";
import { KPISummaryDocument, TeamPerformanceDocument } from "@/lib/templates/pdf-templates";

export class PDFService {
  /**
   * Generate KPI Summary PDF
   */
  async generateKPISummaryPDF(data: any, config: ReportConfig): Promise<Buffer> {
    try {
      const doc = KPISummaryDocument({ data, config });
      const asPdf = pdf(doc);
      const blob = await asPdf.toBlob();
      const arrayBuffer = await blob.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      Logger.captureException(error as Error, { action: "generateKPISummaryPDF" });
      throw error;
    }
  }

  /**
   * Generate Team Performance PDF
   */
  async generateTeamPerformancePDF(data: any, config: ReportConfig): Promise<Buffer> {
    try {
      const doc = TeamPerformanceDocument({ data, config });
      const asPdf = pdf(doc);
      const blob = await asPdf.toBlob();
      const arrayBuffer = await blob.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      Logger.captureException(error as Error, { action: "generateTeamPerformancePDF" });
      throw error;
    }
  }

  /**
   * Note: Dashboard snapshot would require Puppeteer
   * For production, consider using a screenshot service like:
   * - PDFShift API
   * - Headless Chrome as a Service
   * - Serverless Puppeteer (AWS Lambda)
   */
  async generateDashboardSnapshot(dashboardUrl: string): Promise<Buffer> {
    throw new Error(
      "Dashboard snapshot requires Puppeteer. Use PDFShift API or serverless Chrome for production."
    );
  }
}

export const pdfService = new PDFService();

