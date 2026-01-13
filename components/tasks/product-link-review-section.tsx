"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { approveProductLink, rejectProductLink } from "@/actions/task";
import { toast } from "sonner";
import { CheckCircle2, XCircle, ExternalLink, Loader2, Clock, Link2 } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { UserAvatar } from "@/components/shared/user-avatar";

interface ProductLinkReviewSectionProps {
  task: {
    id: string;
    productLink: string | null;
    productLinkSubmittedAt: Date | null;
    productLinkSubmittedBy: string | null;
    productLinkReviewStatus: string | null;
    productLinkReviewedAt: Date | null;
    productLinkReviewedBy: string | null;
    productLinkReviewComment: string | null;
    assignee?: {
      id: string;
      name: string | null;
    } | null;
  };
  submittedByUser?: {
    id: string;
    name: string | null;
  } | null;
  session?: {
    user?: {
      id?: string;
      role?: string;
    } | null;
  } | null;
  isLeader?: boolean;
  isRequester?: boolean;
  isAdmin?: boolean;
}

export function ProductLinkReviewSection({
  task,
  submittedByUser,
  session,
  isLeader = false,
  isRequester = false,
  isAdmin = false,
}: ProductLinkReviewSectionProps) {
  const router = useRouter();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectComment, setRejectComment] = useState("");
  const [loading, setLoading] = useState(false);

  const status = task.productLinkReviewStatus;
  const isPending = status === "PENDING";
  const isLeaderApproved = status === "LEADER_APPROVED";
  const isApproved = status === "APPROVED";
  const isRejected = status === "REJECTED";

  const leaderIsRequester = isLeader && isRequester;

  const canApproveFirstStep = isPending && (isLeader || isAdmin);
  const canApproveSecondStep = isLeaderApproved && (isRequester || isAdmin);
  const canReview = canApproveFirstStep || canApproveSecondStep || (isRejected && (isAdmin || isLeader || isRequester));

  const approveButtonLabel = leaderIsRequester && isPending ? "Duyệt & hoàn tất" : "Duyệt";

  async function handleApprove() {
    setLoading(true);
    try {
      const result = await approveProductLink({ taskId: task.id });
      if (result.success) {
        toast.success(
          leaderIsRequester && isPending
            ? "Đã duyệt và hoàn tất link sản phẩm"
            : isLeaderApproved
            ? "Đã duyệt hoàn toàn link sản phẩm"
            : "Đã duyệt link sản phẩm thành công!"
        );
        router.refresh();
      } else {
        toast.error(result.error || "Có lỗi xảy ra");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }

  async function handleReject() {
    if (!rejectComment.trim() || rejectComment.trim().length < 20) {
      toast.error("Vui lòng nhập lý do từ chối (tối thiểu 20 ký tự)");
      return;
    }

    setLoading(true);
    try {
      const result = await rejectProductLink({
        taskId: task.id,
        comment: rejectComment.trim(),
      });
      if (result.success) {
        toast.success("Đã từ chối link sản phẩm");
        setRejectDialogOpen(false);
        setRejectComment("");
        router.refresh();
      } else {
        toast.error(result.error || "Có lỗi xảy ra");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }

  if (!task.productLink) {
    return null;
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-blue-600" />
          Link sản phẩm đã nộp
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center gap-2 flex-wrap">
          {isPending && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
              <Clock className="h-4 w-4" />
              Đang chờ Leader duyệt
            </span>
          )}
          {isLeaderApproved && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              <CheckCircle2 className="h-4 w-4" />
              Leader đã duyệt - Chờ người yêu cầu duyệt
            </span>
          )}
          {isApproved && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              <CheckCircle2 className="h-4 w-4" />
              Đã duyệt hoàn toàn
            </span>
          )}
          {isRejected && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
              <XCircle className="h-4 w-4" />
              Đã từ chối - Cần chỉnh sửa lại
            </span>
          )}
        </div>

        {/* Product Link */}
        <div>
          <Label className="text-sm font-medium text-gray-700">Link sản phẩm:</Label>
          <div className="mt-1 flex items-center gap-2">
            <a
              href={task.productLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 break-all"
            >
              {task.productLink}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Submission Info */}
        {task.productLinkSubmittedAt && (
          <div className="text-sm text-gray-600">
            <p>
              Nộp bởi: {submittedByUser?.name || "Unknown"} •{" "}
              {format(new Date(task.productLinkSubmittedAt), "dd/MM/yyyy HH:mm", { locale: vi })}
            </p>
          </div>
        )}

        {/* Rejection Comment */}
        {isRejected && task.productLinkReviewComment && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm font-semibold text-red-800 mb-1">Lý do từ chối:</p>
            <p className="text-sm text-red-700">{task.productLinkReviewComment}</p>
            {(task as any).productLinkRejectionCount > 0 && (
              <p className="text-xs text-red-600 mt-2">
                Số lần từ chối: {(task as any).productLinkRejectionCount}/3
              </p>
            )}
          </div>
        )}

        {/* Review Actions */}
        {canReview && (
          <div className="flex items-center gap-3 pt-2 border-t">
            <Button
              onClick={handleApprove}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {approveButtonLabel}
                </>
              )}
            </Button>
            {(isLeader || isRequester || isAdmin) && (
              <Button
                onClick={() => setRejectDialogOpen(true)}
                disabled={loading}
                variant="destructive"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Từ chối
              </Button>
            )}
          </div>
        )}
      </CardContent>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối link sản phẩm</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Lý do từ chối *</Label>
              <Textarea
                placeholder="Vui lòng giải thích lý do từ chối link sản phẩm này (tối thiểu 20 ký tự)..."
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                rows={4}
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                {rejectComment.length}/20 ký tự tối thiểu
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectComment("");
              }}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button
              onClick={handleReject}
              disabled={loading || rejectComment.trim().length < 20}
              variant="destructive"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Xác nhận từ chối"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

