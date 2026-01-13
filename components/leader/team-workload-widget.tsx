"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Users, RefreshCw, TrendingUp, AlertTriangle } from "lucide-react";
import { RebalanceDialog } from "./rebalance-dialog";
import { useToast } from "@/hooks/use-toast";
import { reassignTask } from "@/actions/assignment";
import type { RebalanceSuggestion } from "@/lib/services/load-balancer";

interface WorkloadMember {
  userId: string;
  userName: string;
  activeCount: number;
  wipLimit: number;
  utilization: number;
  isOverloaded: boolean;
  isAtLimit: boolean;
}

interface TeamWorkloadWidgetProps {
  members: WorkloadMember[];
  rebalanceSuggestions: RebalanceSuggestion[];
  onRefresh?: () => void;
}

/**
 * Team Workload Widget
 * 
 * Displays team member utilization with horizontal bar charts.
 * Includes rebalancing dialog for task distribution optimization.
 * 
 * References: mindmap WL, WIP, LB
 */
export function TeamWorkloadWidget({
  members,
  rebalanceSuggestions,
  onRefresh,
}: TeamWorkloadWidgetProps) {
  const [selectedMember, setSelectedMember] = useState<WorkloadMember | null>(null);
  const [showRebalanceDialog, setShowRebalanceDialog] = useState(false);
  const toast = useToast();

  // Get utilization color with brand colors
  const getUtilizationColor = (utilization: number) => {
    if (utilization < 0.7) return "bg-[#37b24d]"; // Primary Green
    if (utilization < 0.9) return "bg-[#ffd43b]"; // Status Yellow
    return "bg-[#fa5252]"; // Status Red
  };

  // Get text color with brand colors
  const getTextColor = (utilization: number) => {
    if (utilization < 0.7) return "text-[#37b24d]"; // Primary Green
    if (utilization < 0.9) return "text-[#ff922b]"; // Primary Orange
    return "text-[#fa5252]"; // Status Red
  };

  // Handle rebalancing apply
  const handleApplyRebalancing = async (selectedTaskIds: string[]) => {
    const tasksToReassign = rebalanceSuggestions.filter((s) =>
      selectedTaskIds.includes(s.taskId)
    );

    let successCount = 0;
    let failCount = 0;

    for (const suggestion of tasksToReassign) {
      try {
        await reassignTask(
          suggestion.taskId,
          suggestion.toUserId,
          suggestion.reason
        );
        successCount++;
      } catch (error) {
        console.error("Reassign failed:", error);
        failCount++;
      }
    }

    if (successCount > 0) {
      toast.success("Thành công", `Đã chuyển giao ${successCount} task`);

      if (onRefresh) {
        onRefresh();
      }
    }

    if (failCount > 0) {
      toast.warning("Cảnh báo", `${failCount} task không thể chuyển giao`);
    }
  };

  // Calculate team stats
  const avgUtilization =
    members.length > 0
      ? members.reduce((sum, m) => sum + m.utilization, 0) / members.length
      : 0;
  const overloadedCount = members.filter((m) => m.isOverloaded).length;
  const atCapacityCount = members.filter((m) => m.isAtLimit).length;

  return (
    <>
      <Card className="p-6 shadow-sm border-l-4 border-[#37b24d]">
        <CardHeader className="p-0 pb-6">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-4">
              <Users className="w-6 h-6 text-[#37b24d]" />
              Workload Team
            </CardTitle>
            <div className="flex items-center gap-3">
              {rebalanceSuggestions.length > 0 && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setShowRebalanceDialog(true)}
                  className="gap-2 bg-[#37b24d] hover:bg-[#2d8f3f] text-white"
                >
                  <RefreshCw className="w-4 h-4" />
                  Cân bằng lại ({rebalanceSuggestions.length})
                </Button>
              )}
              {onRefresh && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onRefresh}
                  className="border-[#37b24d] text-[#37b24d] hover:bg-[#37b24d] hover:text-white"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Team Stats */}
          <div className="grid grid-cols-3 gap-6 mt-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-[#37b24d]">
                {(avgUtilization * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-gray-600 font-medium">Utilization TB</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-[#fa5252]">{overloadedCount}</div>
              <div className="text-sm text-gray-600 font-medium">Quá tải</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-[#ff922b]">{atCapacityCount}</div>
              <div className="text-sm text-gray-600 font-medium">Đầy tải</div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          {members
            .sort((a, b) => b.utilization - a.utilization) // Sort by utilization descending
            .map((member) => {
              const utilizationPercent = member.utilization * 100;

              return (
                <div
                  key={member.userId}
                  className="p-4 border rounded-lg hover:border-[#37b24d]/50 transition-all cursor-pointer shadow-sm hover:shadow-md"
                  onClick={() => setSelectedMember(member)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {member.userName}
                      </span>
                      {member.isOverloaded && (
                        <Badge className="text-xs gap-1 bg-[#fa5252] text-white">
                          <AlertTriangle className="w-3 h-3" />
                          Quá tải
                        </Badge>
                      )}
                      {member.isAtLimit && !member.isOverloaded && (
                        <Badge className="text-xs bg-[#ff922b] text-white">
                          Đầy tải
                        </Badge>
                      )}
                    </div>
                    <span className={`text-sm font-semibold ${getTextColor(member.utilization)}`}>
                      {member.activeCount}/{member.wipLimit}
                    </span>
                  </div>

                  {/* Horizontal Progress Bar */}
                  <div className="relative">
                    <Progress
                      value={Math.min(utilizationPercent, 100)}
                      className="h-6"
                      indicatorClassName={getUtilizationColor(member.utilization)}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-semibold text-white drop-shadow">
                        {utilizationPercent.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
        </CardContent>
      </Card>

      {/* Member Task List Dialog */}
      {selectedMember && (
        <Dialog
          open={!!selectedMember}
          onOpenChange={() => setSelectedMember(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedMember.userName} - Tasks
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Workload</span>
                <span className={`text-sm font-semibold ${getTextColor(selectedMember.utilization)}`}>
                  {selectedMember.activeCount}/{selectedMember.wipLimit} tasks (
                  {(selectedMember.utilization * 100).toFixed(1)}%)
                </span>
              </div>
              <Progress
                value={Math.min(selectedMember.utilization * 100, 100)}
                indicatorClassName={getUtilizationColor(selectedMember.utilization)}
              />
              {selectedMember.isOverloaded && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                  <AlertTriangle className="w-4 h-4" />
                  <span>User đang quá tải. Cân nhắc chuyển giao một số task.</span>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Rebalance Dialog */}
      <RebalanceDialog
        open={showRebalanceDialog}
        onOpenChange={setShowRebalanceDialog}
        suggestions={rebalanceSuggestions}
        onApply={handleApplyRebalancing}
      />
    </>
  );
}

