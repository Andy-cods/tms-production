"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader, RefreshCountdown } from "@/components/dashboard/dashboard-header";
import { DashboardFiltersComponent } from "@/components/dashboard/dashboard-filters";
import { KPICardsGrid } from "@/components/dashboard/kpi-card";
import { CompletionRateChart } from "@/components/dashboard/completion-rate-chart";
import { SLAComplianceChart } from "@/components/dashboard/sla-compliance-chart";
import { WorkloadDistributionChart } from "@/components/dashboard/workload-distribution-chart";
import { WorkloadHeatmap } from "@/components/dashboard/workload-heatmap";
import { BottleneckAlerts } from "@/components/dashboard/bottleneck-alerts";
import { ResponseTimeChart } from "@/components/dashboard/response-time-chart";
import { CycleTimeTrend } from "@/components/dashboard/cycle-time-trend";
import { QualityMetrics } from "@/components/dashboard/quality-metrics";
import { TeamLeaderboard } from "@/components/dashboard/team-leaderboard";
import { TeamRadarChart } from "@/components/dashboard/team-radar-chart";
import { CategoryAnalysis } from "@/components/dashboard/category-analysis";
import { TagCloud } from "@/components/dashboard/tag-cloud";
import type { DashboardFilters, KPICard } from "@/types/dashboard";
import type { SLAComplianceByPriority, WorkloadDistribution } from "@/lib/services/chart-service";
import type { HeatmapDataPoint, Bottleneck } from "@/lib/services/workload-service";
import type { ResponseTimeData, CycleTimeData } from "@/lib/services/performance-service";
import type { ReworkData, ApprovalData, ClarificationData } from "@/lib/services/quality-service";
import type { TeamLeaderboardData, TeamRadarData } from "@/lib/services/team-performance-service";
import type { TagCloudData } from "@/lib/services/category-service";
import type { CategoryData } from "@/lib/types/dashboard";

interface Props {
  initialKpis: KPICard[];
  initialCompletionTrend: any[];
  initialSlaData: SLAComplianceByPriority[];
  initialWorkloadData: WorkloadDistribution[];
  initialHeatmapData: HeatmapDataPoint[];
  initialBottlenecks: Bottleneck[];
  initialResponseTimeData: ResponseTimeData[];
  initialCycleTimeData: CycleTimeData[];
  initialInsights: string[];
  initialReworkData: ReworkData;
  initialApprovalData: ApprovalData;
  initialClarificationData: ClarificationData;
  initialTeamLeaderboard: TeamLeaderboardData[];
  initialTeamRadarData: TeamRadarData[];
  initialCategoryData: CategoryData[];
  initialTagData: TagCloudData[];
  initialFilters: DashboardFilters;
  teams: Array<{ id: string; name: string }>;
  userRole: string;
}

const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function DashboardClient({
  initialKpis,
  initialCompletionTrend,
  initialSlaData,
  initialWorkloadData,
  initialHeatmapData,
  initialBottlenecks,
  initialResponseTimeData,
  initialCycleTimeData,
  initialInsights,
  initialReworkData,
  initialApprovalData,
  initialClarificationData,
  initialTeamLeaderboard,
  initialTeamRadarData,
  initialCategoryData,
  initialTagData,
  initialFilters,
  teams,
  userRole,
}: Props) {
  const router = useRouter();
  const [kpis, setKpis] = useState(initialKpis);
  const [completionTrend, setCompletionTrend] = useState(initialCompletionTrend);
  const [slaData, setSlaData] = useState(initialSlaData);
  const [workloadData, setWorkloadData] = useState(initialWorkloadData);
  const [heatmapData, setHeatmapData] = useState(initialHeatmapData);
  const [bottlenecks, setBottlenecks] = useState(initialBottlenecks);
  const [responseTimeData, setResponseTimeData] = useState(initialResponseTimeData);
  const [cycleTimeData, setCycleTimeData] = useState(initialCycleTimeData);
  const [insights, setInsights] = useState(initialInsights);
  const [reworkData, setReworkData] = useState(initialReworkData);
  const [approvalData, setApprovalData] = useState(initialApprovalData);
  const [clarificationData, setClarificationData] = useState(initialClarificationData);
  const [teamLeaderboard, setTeamLeaderboard] = useState(initialTeamLeaderboard);
  const [teamRadarData, setTeamRadarData] = useState(initialTeamRadarData);
  const [categoryData, setCategoryData] = useState(initialCategoryData);
  const [tagData, setTagData] = useState(initialTagData);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [nextRefresh, setNextRefresh] = useState(new Date(Date.now() + AUTO_REFRESH_INTERVAL));
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === 'visible');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async (newFilters?: DashboardFilters) => {
    const targetFilters = newFilters || filters;
    setLoading(true);
    setError(null);

    try {
      // In a real implementation, call server actions or API routes
      // For now, we use router.refresh() to trigger server component re-render
      router.refresh();
      
      // Update timestamp
      setLastUpdated(new Date());
      setNextRefresh(new Date(Date.now() + AUTO_REFRESH_INTERVAL));

      // Show success notification (optional)
      if (typeof window !== 'undefined' && (window as any).showToast) {
        (window as any).showToast({
          title: "Đã làm mới",
          description: "Dữ liệu dashboard đã được cập nhật",
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu');
      console.error('Dashboard refresh error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, router]);

  // Auto-refresh when visible
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      fetchDashboardData();
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [isVisible, fetchDashboardData]);

  // Handle filter change
  const handleFilterChange = useCallback((newFilters: DashboardFilters) => {
    setFilters(newFilters);
    fetchDashboardData(newFilters);
  }, [fetchDashboardData]);

  // Manual refresh
  const handleRefresh = useCallback(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <DashboardHeader 
        lastUpdated={lastUpdated}
        onRefresh={handleRefresh}
        loading={loading}
      />

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-red-800">Không thể tải dữ liệu</p>
            <p className="text-xs text-red-600 mt-1">{error}</p>
          </div>
          <button
            onClick={handleRefresh}
            className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Auto-refresh countdown */}
      <div className="flex items-center justify-between">
        <DashboardFiltersComponent
          initialFilters={filters}
          onFilterChange={handleFilterChange}
          teams={teams}
          currentUserRole={userRole}
        />
        {isVisible && (
          <RefreshCountdown 
            nextRefresh={nextRefresh}
            onComplete={handleRefresh}
          />
        )}
      </div>

      {/* KPI Cards */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Chỉ số chính (KPI)</h2>
        <KPICardsGrid kpis={kpis} loading={loading} />
      </section>

      {/* Workload Heatmap + Bottleneck Alerts */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Phân tích hoạt động</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Heatmap (2 columns on desktop) */}
          <div className="lg:col-span-2 bg-white rounded-lg border p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Bản đồ nhiệt hoạt động</h3>
            <p className="text-sm text-gray-600 mb-4">Thời điểm tạo yêu cầu nhiều nhất</p>
            <WorkloadHeatmap data={heatmapData} loading={loading} />
          </div>

          {/* Bottleneck alerts (1 column) */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Cảnh báo tắc nghẽn</h3>
            <BottleneckAlerts bottlenecks={bottlenecks} loading={loading} />
          </div>
        </div>
      </section>

      {/* Charts Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Biểu đồ & Phân tích</h2>
        
        {/* Row 1: Completion Rate Trend */}
        <div className="grid grid-cols-1 gap-4">
          <CompletionRateChart 
            data={completionTrend} 
            period={filters.period}
            loading={loading}
          />
        </div>

        {/* Row 2: SLA Compliance + Workload Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SLAComplianceChart data={slaData} loading={loading} />
          <WorkloadDistributionChart data={workloadData} loading={loading} />
        </div>
      </section>

      {/* Performance Deep Dive */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Phân tích hiệu suất chi tiết</h2>
        
        {/* Insights */}
        {insights.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 Thông tin chi tiết</h3>
            <ul className="space-y-1 text-sm text-blue-800">
              {insights.map((insight, index) => (
                <li key={`insight-${index}`}>{insight}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Performance charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Response Time Distribution */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              Phân bố thời gian phản hồi
            </h3>
            <p className="text-sm text-gray-600 mb-4">Thời gian từ tạo → phân công</p>
            <ResponseTimeChart data={responseTimeData} slaTarget={8} loading={loading} />
          </div>

          {/* Cycle Time Trend */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              Xu hướng thời gian xử lý
            </h3>
            <p className="text-sm text-gray-600 mb-4">Thời gian từ tạo → hoàn thành</p>
            <CycleTimeTrend data={cycleTimeData} showBreakdown={true} loading={loading} />
          </div>
        </div>
      </section>

      {/* Quality Metrics */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Chỉ số chất lượng</h2>
        <div className="bg-white rounded-lg border p-6">
          <QualityMetrics 
            reworkData={reworkData}
            approvalData={approvalData}
            clarificationData={clarificationData}
            loading={loading}
          />
        </div>
      </section>

      {/* Team Performance (for ADMIN/LEADER) */}
      {(userRole === 'ADMIN' || userRole === 'LEADER') && teamLeaderboard.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Hiệu suất theo đội ngũ</h2>
          
          {/* Leaderboard */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🏆</span>
              <h3 className="text-base font-semibold text-gray-900">Bảng xếp hạng đội ngũ</h3>
            </div>
            <TeamLeaderboard 
              teams={teamLeaderboard} 
              loading={loading}
              onTeamClick={(teamId) => {
                const newFilters = { ...filters, teamId };
                setFilters(newFilters);
                handleFilterChange(newFilters);
              }}
            />
          </div>

          {/* Radar Comparison */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              So sánh năng lực đội ngũ
            </h3>
            <p className="text-sm text-gray-600 mb-4">5 chỉ số then chốt</p>
            <TeamRadarChart 
              teams={teamRadarData} 
              loading={loading}
            />
          </div>
        </section>
      )}

      {/* Category & Tag Analysis */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Phân tích nội dung</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Category Analysis */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              Phân tích theo phân loại
            </h3>
            <CategoryAnalysis 
              categories={categoryData} 
              loading={loading}
              onCategoryClick={(categoryId) => {
                // Filter by category (would need to add categoryId to filters)
                console.log('Filter by category:', categoryId);
              }}
            />
          </div>

          {/* Tag Cloud */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              Tag phổ biến
            </h3>
            <p className="text-sm text-gray-600 mb-4">Nhấn vào tag để lọc</p>
            <TagCloud 
              tags={tagData} 
              loading={loading}
              onTagClick={(tag) => {
                // Filter by tag (would need to add tags to filters)
                console.log('Filter by tag:', tag);
              }}
            />
          </div>
        </div>
      </section>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-blue-500 z-50 animate-pulse">
          <div className="h-full bg-blue-600 animate-[shimmer_1s_ease-in-out_infinite]" style={{ width: '50%' }} />
        </div>
      )}
    </div>
  );
}

