import Papa from "papaparse";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export class CSVBuilder {
  buildRequestsCSV(data: any[]): Buffer {
    const rows = data.map((request, index) => ({
      STT: index + 1,
      Title: request.title,
      Status: request.status,
      Priority: request.priority,
      Category: request.category?.name || "",
      Creator: request.creator?.name || "",
      "Creator Email": request.creator?.email || "",
      Team: request.team?.name || "",
      "Task Count": request._count?.tasks || 0,
      "Created Date": format(new Date(request.createdAt), "dd/MM/yyyy HH:mm", { locale: vi }),
      Deadline: request.deadline ? format(new Date(request.deadline), "dd/MM/yyyy HH:mm", { locale: vi }) : "",
      "Completed Date": request.completedAt ? format(new Date(request.completedAt), "dd/MM/yyyy HH:mm", { locale: vi }) : "",
      "SLA Status": request.slaStatus || "",
    }));

    const csv = Papa.unparse(rows, {
      header: true,
      columns: [
        "STT",
        "Title",
        "Status",
        "Priority",
        "Category",
        "Creator",
        "Creator Email",
        "Team",
        "Task Count",
        "Created Date",
        "Deadline",
        "Completed Date",
        "SLA Status",
      ],
    });

    // Add BOM for proper UTF-8 encoding in Excel
    return Buffer.from("\uFEFF" + csv, "utf-8");
  }

  buildTasksCSV(data: any[]): Buffer {
    const rows = data.map((task, index) => ({
      STT: index + 1,
      Title: task.title,
      Status: task.status,
      Priority: task.request?.priority || "",
      Assignee: task.assignee?.name || "Unassigned",
      "Assignee Email": task.assignee?.email || "",
      Request: task.request?.title || "",
      "Request Creator": task.request?.creator?.name || "",
      "Created Date": format(new Date(task.createdAt), "dd/MM/yyyy HH:mm", { locale: vi }),
      Deadline: task.deadline ? format(new Date(task.deadline), "dd/MM/yyyy HH:mm", { locale: vi }) : "",
      "Completed Date": task.completedAt ? format(new Date(task.completedAt), "dd/MM/yyyy HH:mm", { locale: vi }) : "",
      "SLA Status": task.slaStatus || "",
    }));

    const csv = Papa.unparse(rows);
    return Buffer.from("\uFEFF" + csv, "utf-8");
  }

  buildTeamPerformanceCSV(data: any[]): Buffer {
    const rows: any[] = [];

    data.forEach((teamData) => {
      // Team summary row
      rows.push({
        Type: "TEAM",
        Name: teamData.team.name,
        "Total Requests": teamData.metrics.totalRequests,
        Completed: teamData.metrics.completedRequests,
        "Completion Rate": `${((teamData.metrics.completedRequests / teamData.metrics.totalRequests) * 100).toFixed(1)}%`,
        "SLA Compliance": `${teamData.metrics.slaCompliance.toFixed(1)}%`,
        "Avg Lead Time": teamData.metrics.avgLeadTime.toFixed(1),
      });

      // Member rows (if any)
      if (teamData.members) {
        teamData.members.forEach((member: any) => {
          rows.push({
            Type: "MEMBER",
            Name: member.name,
            Email: member.email || "",
            Role: member.role,
            "Active Tasks": member._count?.assignedTasks || 0,
            "Completed Tasks": member.completedTasks || 0,
          });
        });
      }

      // Separator
      rows.push({});
    });

    const csv = Papa.unparse(rows);
    return Buffer.from("\uFEFF" + csv, "utf-8");
  }
}

export const csvBuilder = new CSVBuilder();

