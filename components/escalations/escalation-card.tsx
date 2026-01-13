"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  Clock,
  User,
  FileText,
  CheckCheck,
  X,
  UserCog,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  acknowledgeEscalationAction,
  resolveEscalationAction,
  reassignEscalationAction,
} from "@/actions/escalation";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

/**
 * Escalation Card Component
 * 
 * Displays individual escalation with timeline and quick actions.
 * 
 * References: mindmap L1, L1C
 */

interface EscalationCardProps {
  escalation: {
    id: string;
    reason: string;
    status: "PENDING" | "ACKNOWLEDGED" | "RESOLVED";
    createdAt: string;
    resolvedAt: string | null;
    rule: {
      name: string;
      triggerType: string;
    };
    recipient: {
      name: string;
      email: string;
      role: string;
    };
    entity: {
      type: "REQUEST" | "TASK";
      id: string;
      title: string;
      status: string;
      priority?: string;
      assigneeName?: string;
    };
  };
  getAgeColor: (createdAt: string) => string;
  getTriggerLabel: (type: string) => string;
  currentUserId: string;
  userRole: string;
}

export function EscalationCard({
  escalation,
  getAgeColor,
  getTriggerLabel,
  currentUserId,
  userRole,
}: EscalationCardProps) {
  const router = useRouter();
  const toast = useToast();

  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const [resolveNotes, setResolveNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Check if user can act on this escalation
  const canAct = userRole === "ADMIN"; // Admins can always act

  /**
   * Handle acknowledge
   */
  const handleAcknowledge = async () => {
    setIsProcessing(true);

    try {
      const result = await acknowledgeEscalationAction(escalation.id);

      if (result.success) {
        toast.success("Thành công", "Đã acknowledge escalation");
        router.refresh();
      } else {
        toast.error("Lỗi", (result as any).error || "Không thể acknowledge");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Đã xảy ra lỗi";
      toast.error("Lỗi", errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle resolve
   */
  const handleResolve = async () => {
    setIsProcessing(true);

    try {
      const result = await resolveEscalationAction(
        escalation.id,
        resolveNotes
      );

      if (result.success) {
        toast.success("Thành công", "Đã resolve escalation");
        setShowResolveDialog(false);
        setResolveNotes("");
        router.refresh();
      } else {
        toast.error("Lỗi", (result as any).error || "Không thể resolve");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Đã xảy ra lỗi";
      toast.error("Lỗi", errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Navigate to entity
   */
  const handleViewDetails = () => {
    const path =
      escalation.entity.type === "REQUEST"
        ? `/requests/${escalation.entity.id}`
        : `/requests/${escalation.entity.id}`; // Assuming task is within request
    router.push(path);
  };

  /**
   * Get status badge variant
   */
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return "destructive";
      case "ACKNOWLEDGED":
        return "secondary";
      case "RESOLVED":
        return "default";
      default:
        return "outline";
    }
  };

  return (
    <>
      <div
        className={`border rounded-lg p-4 transition-all hover:shadow-md ${getAgeColor(
          escalation.createdAt
        )}`}
      >
        <div className="flex items-start justify-between gap-4">
          {/* Left: Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={getStatusBadge(escalation.status)}>
                {escalation.status}
              </Badge>
              <Badge variant="outline">
                {getTriggerLabel(escalation.rule.triggerType)}
              </Badge>
              <span className="text-xs text-gray-600">
                {formatDistanceToNow(new Date(escalation.createdAt), {
                  addSuffix: true,
                  locale: vi,
                })}
              </span>
            </div>

            {/* Entity Info */}
            <div className="mb-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="font-semibold text-gray-900">
                  {escalation.entity.title}
                </span>
                <Badge variant="outline" className="text-xs">
                  {escalation.entity.type}
                </Badge>
              </div>
            </div>

            {/* Reason */}
            <p className="text-sm text-gray-700 mb-3">{escalation.reason}</p>

            {/* Timeline */}
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Created: {new Date(escalation.createdAt).toLocaleString("vi-VN")}</span>
              </div>
              {escalation.resolvedAt && (
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-green-600" />
                  <span>
                    Resolved: {new Date(escalation.resolvedAt).toLocaleString("vi-VN")}
                  </span>
                </div>
              )}
            </div>

            {/* Recipient */}
            <div className="flex items-center gap-2 mt-2 text-sm">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Escalated to:</span>
              <span className="font-medium">{escalation.recipient.name}</span>
              <Badge variant="outline" className="text-xs">
                {escalation.recipient.role}
              </Badge>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex flex-col gap-2 min-w-[120px]">
            {/* View Details */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewDetails}
              className="gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Chi tiết
            </Button>

            {/* Acknowledge (only if PENDING) */}
            {escalation.status === "PENDING" && canAct && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleAcknowledge}
                disabled={isProcessing}
                className="gap-2"
              >
                <CheckCheck className="w-4 h-4" />
                Acknowledge
              </Button>
            )}

            {/* Resolve (if not RESOLVED) */}
            {escalation.status !== "RESOLVED" && canAct && (
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowResolveDialog(true)}
                disabled={isProcessing}
                className="gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Resolve
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Resolve Dialog */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Escalation</DialogTitle>
            <DialogDescription>
              Đánh dấu escalation này là đã xử lý xong.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="resolve-notes">Ghi chú giải quyết</Label>
              <Textarea
                id="resolve-notes"
                placeholder="VD: Đã reassign task cho senior developer, vấn đề đã được xử lý..."
                value={resolveNotes}
                onChange={(e) => setResolveNotes(e.target.value)}
                rows={4}
                className="mt-1"
              />
              <p className="text-xs text-gray-600 mt-1">
                Tùy chọn - mô tả cách bạn đã giải quyết escalation này
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowResolveDialog(false);
                setResolveNotes("");
              }}
            >
              Hủy
            </Button>
            <Button onClick={handleResolve} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Xác nhận Resolve"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

