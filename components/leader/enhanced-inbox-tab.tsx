"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { 
  CheckCircle, 
  User, 
  Clock, 
  Tag, 
  UserPlus, 
  Eye, 
  AlertCircle,
  Zap,
  Loader2,
  AlertTriangle,
  MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { autoAssignRequest, manualAssignWithCheck } from "@/actions/assignment";

interface PendingRequest {
  id: string;
  title: string;
  description?: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  requesterType: "INTERNAL" | "CUSTOMER";
  createdAt: string;
  deadline: string;
  creator: {
    name: string;
    email: string;
  };
  category: {
    name: string;
  };
}

interface TeamMemberWithWIP {
  id: string;
  name: string;
  wipLimit: number;
  activeCount: number;
  utilization: number;
}

interface EnhancedInboxTabProps {
  requests?: PendingRequest[];
  teamMembers?: TeamMemberWithWIP[];
  teamId: string;
  isLoading?: boolean;
}

/**
 * Enhanced Inbox Tab with Auto-Assignment and WIP Indicators
 * 
 * Features:
 * - Auto-assign button with load balancing
 * - Manual assign dropdown with WIP indicators
 * - Color-coded utilization (green/yellow/red)
 * - Warning tooltips for overloaded users
 * 
 * References: mindmap LB, WIP, CONF_WIP
 */
export function EnhancedInboxTab({ 
  requests = [], 
  teamMembers = [],
  teamId,
  isLoading = false 
}: EnhancedInboxTabProps) {
  const router = useRouter();
  const toast = useToast();
  const [assigningRequestId, setAssigningRequestId] = useState<string | null>(null);
  const [manualAssigning, setManualAssigning] = useState<string | null>(null);

  // Get WIP indicator color with brand colors
  const getWIPColor = (utilization: number) => {
    if (utilization < 0.7) return "text-[#37b24d]";  // Primary Green < 70%
    if (utilization < 0.9) return "text-[#ff922b]";  // Primary Orange 70-90%
    return "text-[#fa5252]"; // Status Red > 90%
  };

  // Get WIP background color with brand colors
  const getWIPBgColor = (utilization: number) => {
    if (utilization < 0.7) return "bg-green-50";
    if (utilization < 0.9) return "bg-orange-50";
    return "bg-red-50";
  };

  // Handle auto-assign
  const handleAutoAssign = async (requestId: string) => {
    setAssigningRequestId(requestId);

    try {
      const result = await autoAssignRequest(requestId);

      if (result.success) {
        toast.success("Thành công", `Đã phân công cho ${result.assigneeName}`);
        router.refresh();
      } else {
        toast.error("Lỗi", result.error || "Không thể tự động phân công");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Đã xảy ra lỗi";
      toast.error("Lỗi", errorMessage);
    } finally {
      setAssigningRequestId(null);
    }
  };

  // Handle manual assign
  const handleManualAssign = async (requestId: string, assigneeId: string) => {
    setManualAssigning(requestId);

    try {
      // First, create a task for the request
      const request = requests.find(r => r.id === requestId);
      if (!request) {
        throw new Error("Request not found");
      }

      // Create task (you may need to adjust this based on your existing task creation logic)
      const createTaskResult = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          title: request.title,
          description: request.description,
          assigneeId,
        }),
      });

      if (!createTaskResult.ok) {
        throw new Error("Failed to create task");
      }

      const task = await createTaskResult.json();

      // Check WIP limit
      const assignResult = await manualAssignWithCheck(task.id, assigneeId);

      if (!assignResult.success && assignResult.warning) {
        // Show warning dialog with override option
        if (assignResult.canOverride) {
          const confirmed = confirm(
            `${assignResult.error}\n\nBạn có muốn tiếp tục (override)?`
          );

          if (confirmed) {
            // Retry with override
            const overrideResult = await manualAssignWithCheck(task.id, assigneeId, true);
            
            if (overrideResult.success) {
              toast.success("Thành công", `Đã phân công cho ${overrideResult.assigneeName} (override WIP limit)`);
              router.refresh();
            }
          }
        } else {
          toast.error("Không thể phân công", assignResult.error);
        }
      } else if (assignResult.success) {
        toast.success("Thành công", `Đã phân công cho ${assignResult.assigneeName}`);
        router.refresh();
      } else {
        toast.error("Lỗi", assignResult.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Đã xảy ra lỗi";
      toast.error("Lỗi", errorMessage);
    } finally {
      setManualAssigning(null);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-100 text-[#fa5252] border-red-200";
      case "HIGH":
        return "bg-orange-100 text-[#ff922b] border-orange-200";
      case "MEDIUM":
        return "bg-yellow-100 text-[#ffd43b] border-yellow-200";
      case "LOW":
        return "bg-gray-100 text-[#37b24d] border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  if (isLoading) {
    return <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>;
  }

  if (!requests?.length) {
    return (
      <div className="text-center py-16">
        <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
        <h3 className="text-lg font-semibold mb-2">Tuyệt vời! Không có yêu cầu chờ xử lý</h3>
        <p className="text-gray-600">Tất cả yêu cầu đã được phân công.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <div
          key={request.id}
          className="border border-gray-200 rounded-xl p-6 hover:border-primary/50 hover:shadow-md transition-all"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {request.title}
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                <Badge className={getPriorityColor(request.priority)}>
                  {request.priority}
                </Badge>
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  {request.creator.name}
                </span>
                <span className="flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" />
                  {request.category.name}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDistanceToNow(new Date(request.createdAt), {
                    addSuffix: true,
                    locale: vi,
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          {request.description && (
            <p className="text-sm text-gray-700 mb-4 line-clamp-2">
              {request.description}
            </p>
          )}

          {/* Action Buttons - Consolidated */}
          <div className="flex items-center gap-2">
            {/* Assign Button - Auto-assign with dropdown for manual */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  disabled={assigningRequestId === request.id || manualAssigning === request.id}
                  className="gap-2 bg-[#37b24d] hover:bg-[#2d8f3f] text-white"
                >
                  {assigningRequestId === request.id || manualAssigning === request.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang phân công...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Phân công
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuItem
                  onClick={() => handleAutoAssign(request.id)}
                  disabled={assigningRequestId === request.id}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Tự động phân công
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="p-2">
                  <p className="text-xs font-medium text-gray-700 mb-2 px-2">Giao thủ công:</p>
                  <Select
                    disabled={manualAssigning === request.id}
                    onValueChange={(assigneeId) => handleManualAssign(request.id, assigneeId)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn thành viên..." />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.map((member) => {
                        const utilizationPercent = member.utilization * 100;
                        const wipColor = getWIPColor(member.utilization);

                        return (
                          <SelectItem key={member.id} value={member.id}>
                            <div className="flex items-center justify-between gap-3 w-full">
                              <span>{member.name}</span>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-medium ${wipColor}`}>
                                  {member.activeCount}/{member.wipLimit}
                                </span>
                                {member.utilization >= 0.9 && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>User đã quá tải ({utilizationPercent.toFixed(0)}%)</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* More Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/requests/${request.id}`)}>
                  <Eye className="w-4 h-4 mr-2" />
                  Xem chi tiết
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}
    </div>
  );
}

