import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import type { ReportConfig } from "@/types/report";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    fontSize: 10,
  },
  header: {
    marginBottom: 20,
    borderBottom: "2 solid #3B82F6",
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
  },
  subtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 5,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#374151",
  },
  table: {
    marginTop: 10,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingVertical: 8,
  },
  tableHeader: {
    backgroundColor: "#F3F4F6",
    fontWeight: "bold",
  },
  tableCell: {
    fontSize: 9,
    padding: 5,
  },
  kpiCard: {
    border: "1 solid #E5E7EB",
    borderRadius: 4,
    padding: 15,
    marginBottom: 10,
    width: "48%",
  },
  kpiValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#3B82F6",
  },
  kpiLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 5,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: "center",
    fontSize: 10,
    color: "#9CA3AF",
  },
});

interface KPISummaryProps {
  data: {
    kpis: Array<{
      title: string;
      value: string | number;
      change?: number;
    }>;
    metrics: Array<{
      name: string;
      current: string | number;
      previous: string | number;
    }>;
  };
  config: ReportConfig;
}

export const KPISummaryDocument = ({ data, config }: KPISummaryProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>KPI Summary Report</Text>
        <Text style={styles.subtitle}>
          Khoảng thời gian: {format(config.filters.dateRange.from, "dd/MM/yyyy", { locale: vi })} -{" "}
          {format(config.filters.dateRange.to, "dd/MM/yyyy", { locale: vi })}
        </Text>
        <Text style={styles.subtitle}>
          Ngày tạo: {format(new Date(), "dd/MM/yyyy HH:mm", { locale: vi })}
        </Text>
      </View>

      {/* KPI Cards */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Chỉ số hiệu suất chính</Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {data.kpis.map((kpi, index) => (
            <View key={index} style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{kpi.value}</Text>
              <Text style={styles.kpiLabel}>{kpi.title}</Text>
              {kpi.change !== undefined && (
                <Text
                  style={{
                    fontSize: 10,
                    color: kpi.change > 0 ? "#10B981" : "#EF4444",
                    marginTop: 5,
                  }}
                >
                  {kpi.change > 0 ? "↑" : "↓"} {Math.abs(kpi.change).toFixed(1)}%
                </Text>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Summary Table */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tổng hợp thống kê</Text>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, { width: "40%" }]}>Chỉ số</Text>
            <Text style={[styles.tableCell, { width: "30%" }]}>Hiện tại</Text>
            <Text style={[styles.tableCell, { width: "30%" }]}>Trước đó</Text>
          </View>

          {data.metrics.map((metric, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: "40%" }]}>{metric.name}</Text>
              <Text style={[styles.tableCell, { width: "30%" }]}>{metric.current}</Text>
              <Text style={[styles.tableCell, { width: "30%" }]}>{metric.previous}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Footer */}
      <Text style={styles.footer}>TMS - Task Management System | Confidential</Text>
    </Page>
  </Document>
);

interface TeamPerformanceProps {
  data: {
    teams: Array<{
      name: string;
      metrics: {
        completionRate: number;
        slaCompliance: number;
        avgLeadTime: number;
      };
      members: Array<{
        name: string;
        completedTasks: number;
        completionRate?: number;
        slaCompliance?: number;
      }>;
    }>;
  };
  config: ReportConfig;
}

export const TeamPerformanceDocument = ({ data, config }: TeamPerformanceProps) => (
  <Document>
    {data.teams.map((team, teamIndex) => (
      <Page key={teamIndex} size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{team.name} - Báo cáo hiệu suất</Text>
          <Text style={styles.subtitle}>
            Khoảng thời gian: {format(config.filters.dateRange.from, "dd/MM/yyyy", { locale: vi })} -{" "}
            {format(config.filters.dateRange.to, "dd/MM/yyyy", { locale: vi })}
          </Text>
        </View>

        {/* Team Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chỉ số team</Text>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={[styles.kpiCard, { width: "32%" }]}>
              <Text style={styles.kpiValue}>{team.metrics.completionRate.toFixed(1)}%</Text>
              <Text style={styles.kpiLabel}>Tỷ lệ hoàn thành</Text>
            </View>
            <View style={[styles.kpiCard, { width: "32%" }]}>
              <Text style={styles.kpiValue}>{team.metrics.slaCompliance.toFixed(1)}%</Text>
              <Text style={styles.kpiLabel}>SLA Compliance</Text>
            </View>
            <View style={[styles.kpiCard, { width: "32%" }]}>
              <Text style={styles.kpiValue}>{team.metrics.avgLeadTime.toFixed(1)}d</Text>
              <Text style={styles.kpiLabel}>Thời gian TB</Text>
            </View>
          </View>
        </View>

        {/* Member Performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hiệu suất thành viên</Text>

          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, { width: "40%" }]}>Tên</Text>
              <Text style={[styles.tableCell, { width: "20%" }]}>Tasks</Text>
              <Text style={[styles.tableCell, { width: "20%" }]}>Hoàn thành</Text>
              <Text style={[styles.tableCell, { width: "20%" }]}>SLA</Text>
            </View>

            {team.members.map((member, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: "40%" }]}>{member.name}</Text>
                <Text style={[styles.tableCell, { width: "20%" }]}>{member.completedTasks}</Text>
                <Text style={[styles.tableCell, { width: "20%" }]}>
                  {member.completionRate?.toFixed(1) || "N/A"}%
                </Text>
                <Text style={[styles.tableCell, { width: "20%" }]}>
                  {member.slaCompliance?.toFixed(1) || "N/A"}%
                </Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.footer}>
          Trang {teamIndex + 1} / {data.teams.length} | TMS System
        </Text>
      </Page>
    ))}
  </Document>
);

