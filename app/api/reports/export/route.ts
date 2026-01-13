import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { TaskStatus } from "@prisma/client";

/**
 * POST /api/reports/export
 * Export reports in CSV/EXCEL/PDF format
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { reportType, format, dateFrom, dateTo, filters } = body;

    console.log(`[Export] Type: ${reportType}, Format: ${format}`);

    // Validate format
    if (!["csv", "excel"].includes(format?.toLowerCase())) {
      return NextResponse.json(
        { error: "Invalid format. Must be csv or excel" },
        { status: 400 }
      );
    }

    // Fetch data based on report type
    let data: any[] = [];
    let filename = "";

    switch (reportType?.toUpperCase()) {
      case "REQUESTS_LIST":
      case "REQUESTS":
        data = await fetchRequestsData(dateFrom, dateTo, filters);
        filename = `yeu_cau_${new Date().toISOString().split("T")[0]}`;
        break;
      
      case "TASKS_LIST":
      case "TASKS":
        data = await fetchTasksData(dateFrom, dateTo, filters);
        filename = `cong_viec_${new Date().toISOString().split("T")[0]}`;
        break;
      
      case "KPI_SUMMARY":
      case "KPI":
        data = await fetchKPIData(dateFrom, dateTo);
        filename = `kpi_${new Date().toISOString().split("T")[0]}`;
        break;
      
      case "TEAM_PERFORMANCE":
      case "PERFORMANCE":
        data = await fetchPerformanceData(dateFrom, dateTo);
        filename = `hieu_suat_${new Date().toISOString().split("T")[0]}`;
        break;
      
      default:
        return NextResponse.json(
          { error: "Invalid report type" },
          { status: 400 }
        );
    }

    // Generate file based on format
    if (format.toLowerCase() === "csv") {
      return generateCSV(data, filename);
    } else if (format.toLowerCase() === "excel") {
      return await generateExcel(data, filename, reportType);
    }

    return NextResponse.json({ error: "Unknown format" }, { status: 400 });
    
  } catch (error) {
    console.error("[POST /api/reports/export] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Export failed" },
      { status: 500 }
    );
  }
}

// Helper: Fetch requests data
async function fetchRequestsData(dateFrom?: string, dateTo?: string, filters?: any) {
  const where: any = {};

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo);
  }

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.priority) {
    where.priority = filters.priority;
  }

  const requests = await prisma.request.findMany({
    where,
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      createdAt: true,
      deadline: true,
      creator: { select: { name: true, email: true } },
      team: { select: { name: true } },
      _count: { select: { tasks: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 1000,
  });

  return requests.map(r => ({
    "Mã yêu cầu": r.id,
    "Tiêu đề": r.title,
    "Người yêu cầu": r.creator?.name || r.creator?.email || "N/A",
    "Phòng ban": r.team?.name || "N/A",
    "Độ ưu tiên": r.priority,
    "Trạng thái": r.status,
    "Số nhiệm vụ": r._count?.tasks || 0,
    "Ngày tạo": r.createdAt.toLocaleDateString("vi-VN"),
    "Hạn": r.deadline ? r.deadline.toLocaleDateString("vi-VN") : "N/A"
  }));
}

// Helper: Fetch tasks data
async function fetchTasksData(dateFrom?: string, dateTo?: string, filters?: any) {
  const where: any = {};

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo);
  }

  if (filters?.status) {
    where.status = filters.status;
  }

  const tasks = await prisma.task.findMany({
    where,
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
      deadline: true,
      completedAt: true,
      request: { select: { title: true } },
      assignee: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 1000,
  });

  return tasks.map(t => ({
    "Mã nhiệm vụ": t.id,
    "Tiêu đề": t.title,
    "Yêu cầu": t.request?.title || "N/A",
    "Người thực hiện": t.assignee?.name || t.assignee?.email || "Chưa giao",
    "Trạng thái": t.status,
    "Ngày tạo": t.createdAt.toLocaleDateString("vi-VN"),
    "Hạn": t.deadline ? t.deadline.toLocaleDateString("vi-VN") : "N/A",
    "Hoàn thành": t.completedAt ? t.completedAt.toLocaleDateString("vi-VN") : "N/A"
  }));
}

// Helper: Fetch KPI data
async function fetchKPIData(dateFrom?: string, dateTo?: string) {
  const where: any = {};
  
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo);
  }

  const totalRequests = await prisma.request.count({ where });
  const completedRequests = await prisma.request.count({
    where: { ...where, status: "DONE" } // Request status, not TaskStatus
  });

  const totalTasks = await prisma.task.count({ where });
  const completedTasks = await prisma.task.count({
    where: { ...where, status: TaskStatus.DONE }
  });

  // Build separate where clause for overdue to avoid invalid spread of createdAt
  const overdueWhere: any = {
    deadline: { lt: new Date() },
    status: { notIn: [TaskStatus.DONE] } // Chỉ loại trừ DONE, không có ARCHIVED trong enum
  };

  if (dateFrom || dateTo) {
    overdueWhere.createdAt = {};
    if (dateFrom) overdueWhere.createdAt.gte = new Date(dateFrom);
    if (dateTo) overdueWhere.createdAt.lte = new Date(dateTo);
  }

  const overdueTasksCount = await prisma.task.count({
    where: overdueWhere
  });

  return [
    { "Chỉ số": "Tổng yêu cầu", "Giá trị": totalRequests },
    { "Chỉ số": "Yêu cầu hoàn thành", "Giá trị": completedRequests },
    { "Chỉ số": "% Hoàn thành yêu cầu", "Giá trị": `${totalRequests > 0 ? Math.round((completedRequests / totalRequests) * 100) : 0}%` },
    { "Chỉ số": "Tổng nhiệm vụ", "Giá trị": totalTasks },
    { "Chỉ số": "Nhiệm vụ hoàn thành", "Giá trị": completedTasks },
    { "Chỉ số": "% Hoàn thành nhiệm vụ", "Giá trị": `${totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%` },
    { "Chỉ số": "Nhiệm vụ quá hạn", "Giá trị": overdueTasksCount }
  ];
}

// Helper: Fetch performance data
async function fetchPerformanceData(dateFrom?: string, dateTo?: string) {
  const users = await prisma.user.findMany({
    where: { role: { not: "ADMIN" } },
    select: {
      name: true,
      email: true,
      role: true,
      team: { select: { name: true } },
      tasksAssigned: {
        where: dateFrom || dateTo ? {
          createdAt: {
            ...(dateFrom && { gte: new Date(dateFrom) }),
            ...(dateTo && { lte: new Date(dateTo) })
          }
        } : undefined,
        select: {
          status: true,
          completedAt: true,
          deadline: true,
        },
        take: 2000,
      },
    },
    take: 100,
  });

  return users.map(u => {
    const total = u.tasksAssigned.length;
    const completed = u.tasksAssigned.filter((t: any) => t.status === TaskStatus.DONE).length;
    const onTime = u.tasksAssigned.filter((t: any) => 
      t.status === TaskStatus.DONE && 
      t.completedAt && 
      t.deadline && 
      t.completedAt <= t.deadline
    ).length;

    return {
      "Nhân viên": u.name || u.email,
      "Phòng ban": u.team?.name || "N/A",
      "Vai trò": u.role,
      "Tổng nhiệm vụ": total,
      "Hoàn thành": completed,
      "% Hoàn thành": total > 0 ? `${Math.round((completed / total) * 100)}%` : "0%",
      "Đúng hạn": onTime,
      "% Đúng hạn": completed > 0 ? `${Math.round((onTime / completed) * 100)}%` : "0%"
    };
  });
}

// Generate CSV with UTF-8 BOM
function generateCSV(data: any[], filename: string) {
  if (data.length === 0) {
    return NextResponse.json(
      { error: "Không có dữ liệu để xuất" },
      { status: 400 }
    );
  }

  const headers = Object.keys(data[0]);
  const csvRows = [];

  // Add headers
  csvRows.push(headers.join(","));

  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      // Escape quotes and wrap in quotes if contains comma
      const escaped = String(value).replace(/"/g, '""');
      return escaped.includes(",") ? `"${escaped}"` : escaped;
    });
    csvRows.push(values.join(","));
  }

  const csvString = csvRows.join("\n");
  
  // Add UTF-8 BOM for proper Vietnamese display in Excel
  const BOM = "\uFEFF";
  const csvWithBOM = BOM + csvString;

  return new NextResponse(csvWithBOM, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.csv"`
    }
  });
}

// Generate Excel with styling
async function generateExcel(data: any[], filename: string, reportType: string) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Báo cáo");

  if (data.length === 0) {
    return NextResponse.json(
      { error: "Không có dữ liệu để xuất" },
      { status: 400 }
    );
  }

  const headers = Object.keys(data[0]);

  // Add headers with styling
  worksheet.addRow(headers);
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF2E7D32" }  // Green
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };

  // Add data rows
  data.forEach(item => {
    const row = headers.map(h => item[h]);
    worksheet.addRow(row);
  });

  // Auto-fit columns
  worksheet.columns.forEach((column: any) => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, (cell: any) => {
      const length = cell.value ? String(cell.value).length : 10;
      if (length > maxLength) maxLength = length;
    });
    column.width = Math.min(maxLength + 2, 50);
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}.xlsx"`
    }
  });
}

