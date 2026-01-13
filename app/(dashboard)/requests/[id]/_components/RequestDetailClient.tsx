'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Trash2, 
  FileText, 
  User, 
  Clock, 
  Calendar,
  Flag,
  Tag,
  UserCheck,
  FolderOpen,
  CheckCircle2,
  XCircle,
  RotateCcw,
  CheckSquare,
  Sparkles,
  Settings
} from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { StatusBadge, PriorityBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { SlaBadge } from "@/components/sla/sla-badge";
import { TasksSection } from "@/components/requests/tasks-section";
import { CommentsSection } from "@/components/requests/comments-section";
import { ActivityTimeline } from "@/components/requests/activity-timeline";
import { AttachmentsCard } from "@/components/requests/attachments-card";
import { InfoField } from "@/components/requests/info-field";
import { DeleteRequestModal } from "@/components/requests/delete-request-modal";
import ArchiveButton from "./ArchiveButton";
import { acceptRequest, approveRequest, rejectRequest, requesterApproveRequest } from "@/actions/requests";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ProductLinkReviewSection } from "@/components/tasks/product-link-review-section";

interface RequestDetailClientProps {
  request: any;
  session: any;
  activities: any[];
  canEdit: boolean;
  canDelete: boolean;
  templates?: any[];
  tasksForReview?: any[];
}

export function RequestDetailClient({ 
  request, 
  session, 
  activities, 
  canEdit, 
  canDelete,
  templates,
  tasksForReview = []
}: RequestDetailClientProps) {
  const router = useRouter();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectComment, setRejectComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [templatePopoverOpen, setTemplatePopoverOpen] = useState(false);

  // Rejection comment templates
  const rejectionTemplates = [
    {
      label: "Chất lượng chưa đạt yêu cầu",
      content: "Chất lượng sản phẩm chưa đạt yêu cầu. Vui lòng xem xét lại và chỉnh sửa theo feedback chi tiết bên dưới."
    },
    {
      label: "Thiếu thông tin cần thiết",
      content: "Sản phẩm còn thiếu một số thông tin cần thiết. Vui lòng bổ sung đầy đủ thông tin theo yêu cầu."
    },
    {
      label: "Không đúng format yêu cầu",
      content: "Sản phẩm không đúng format yêu cầu. Vui lòng chỉnh sửa lại theo đúng format đã được quy định."
    },
    {
      label: "Cần chỉnh sửa nội dung",
      content: "Nội dung sản phẩm cần được chỉnh sửa. Vui lòng xem xét lại và cập nhật theo yêu cầu."
    },
    {
      label: "Cần làm lại hoàn toàn",
      content: "Sản phẩm cần được làm lại hoàn toàn. Vui lòng tham khảo lại yêu cầu ban đầu và thực hiện lại từ đầu."
    }
  ];

  const userRole = session?.user?.role;
  const userId = session?.user?.id;
  const isAdmin = userRole === "ADMIN";
  const isLeaderForRequest = request.team?.leaderId === userId;
  const isRequesterForRequest = request.creatorId === userId;
  const isTeamMember = request.team?.members?.some((m: any) => m.id === userId) || false;
  const isAccepted = !!request.acceptedAt;
  
  // Permission: Ai có thể tiếp nhận?
  // - Admin, Leader của team được giao, hoặc member của team
  // - Chỉ khi chưa tiếp nhận và status là OPEN
  const canAccept = (
    isAdmin || 
    isLeaderForRequest || 
    isTeamMember
  ) && 
  !isAccepted && 
  request.status === "OPEN";
  
  // Permission: Admin can approve any request at any step
  // Leader can approve requests assigned to their team (Step 1: → IN_REVIEW)
  // Nhưng phải đã tiếp nhận trước
  const canLeaderApprove = (
    (userRole === "ADMIN") || 
    (userRole === "LEADER" && isLeaderForRequest)
  ) && 
  isAccepted && // Phải đã tiếp nhận
  request.status !== "DONE" && 
  request.status !== "ARCHIVED" &&
  request.status !== "IN_REVIEW"; // Leader không duyệt lại nếu đã IN_REVIEW
  
  // Requester can approve when status is IN_REVIEW (Step 2: → DONE)
  const canRequesterApprove = isRequesterForRequest && 
                               request.status === "IN_REVIEW";
  
  const canReject = (
    (userRole === "ADMIN") || 
    (userRole === "LEADER" && isLeaderForRequest)
  ) && 
  request.status !== "DONE" && 
  request.status !== "ARCHIVED" &&
  request.status !== "CLARIFICATION";

  const handleAddTask = () => {
    console.log('Navigate to new task page');
    router.push(`/requests/${request.id}/tasks/new`);
  };

  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const handleAccept = async () => {
    setLoading(true);
    try {
      const result = await acceptRequest(request.id);
      if (result.success) {
        toast.success(result.message || "Đã tiếp nhận yêu cầu thành công!");
        router.refresh();
      } else {
        toast.error(result.error || "Có lỗi xảy ra");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const handleLeaderApprove = async () => {
    setLoading(true);
    try {
      const result = await approveRequest(request.id);
      if (result.success) {
        toast.success(result.message || "Đã duyệt yêu cầu thành công!");
        router.refresh();
      } else {
        toast.error(result.error || "Có lỗi xảy ra");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const handleRequesterApprove = async () => {
    setLoading(true);
    try {
      const result = await requesterApproveRequest(request.id);
      if (result.success) {
        toast.success(result.message || "Đã xác nhận hoàn thành yêu cầu!");
        router.refresh();
      } else {
        toast.error(result.error || "Có lỗi xảy ra");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectComment.trim() || rejectComment.trim().length < 10) {
      toast.error("Vui lòng nhập lý do từ chối (tối thiểu 10 ký tự)");
      return;
    }

    setLoading(true);
    try {
      const result = await rejectRequest(request.id, rejectComment.trim());
      if (result.success) {
        toast.success("Đã từ chối yêu cầu và gửi lại để làm lại");
        setIsRejectDialogOpen(false);
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
  };

  const isOverdue = (deadline: string | null) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Yêu cầu", href: "/requests" },
          { label: request.title },
        ]}
      />

      {/* IN_REVIEW Status Banner */}
      {request.status === "IN_REVIEW" && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-purple-900 mb-1">
                Yêu cầu đã được Leader duyệt
              </h3>
              <p className="text-sm text-purple-700">
                {isRequesterForRequest 
                  ? "Leader đã duyệt yêu cầu này. Vui lòng xem xét và xác nhận hoàn thành cuối cùng."
                  : "Đang chờ người yêu cầu xác nhận hoàn thành cuối cùng."
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {request.title}
              </h1>
              <StatusBadge status={request.status} />
              <PriorityBadge priority={request.priority} />
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                #{request.id.slice(0, 8)}
              </span>
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                Tạo bởi {request.creator?.name || "Không rõ"}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {new Date(request.createdAt).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            {/* Accept Request (Bước đầu tiên - bắt buộc) */}
            {canAccept && (
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleAccept}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Tiếp nhận
              </Button>
            )}
            
            {/* Leader/Admin Approve (Step 1) - chỉ hiện sau khi đã tiếp nhận */}
            {canLeaderApprove && (
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleLeaderApprove}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {userRole === "ADMIN" ? "Duyệt" : "Duyệt (Leader)"}
              </Button>
            )}
            
            {/* Requester Approve (Step 2) */}
            {canRequesterApprove && (
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleRequesterApprove}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Xác nhận hoàn thành
              </Button>
            )}
            
            {canReject && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsRejectDialogOpen(true)}
                disabled={loading}
                className="border-orange-300 text-orange-700 hover:bg-orange-50"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Gửi lại để review
              </Button>
            )}
            <ArchiveButton 
              requestId={request.id} 
              status={request.status} 
            />
            {canDelete && (
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Xóa
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-primary">
            <h2 className="text-sm font-semibold text-gray-600 uppercase mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Mô tả
            </h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <p className="whitespace-pre-wrap">{request.description}</p>
            </div>
          </div>
          
          {/* Product Links Pending Review */}
          {tasksForReview && tasksForReview.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-yellow-200 border-l-4 border-l-yellow-500">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <span className="text-yellow-600">🔗</span>
                Link sản phẩm cần duyệt ({tasksForReview.length})
              </h2>
              <div className="space-y-4">
                {tasksForReview.map((task: any) => {
                  const submittedByUser = task._submittedByUser || null;
                  
                  return (
                    <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{task.title}</h3>
                          <p className="text-sm text-gray-600">
                            Người thực hiện: {task.assignee?.name || "Chưa phân công"}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/my-tasks/${task.id}`)}
                        >
                          Xem chi tiết
                        </Button>
                      </div>
                      <ProductLinkReviewSection
                        task={{
                          id: task.id,
                          productLink: task.productLink,
                          productLinkSubmittedAt: task.productLinkSubmittedAt,
                          productLinkSubmittedBy: task.productLinkSubmittedBy,
                          productLinkReviewStatus: task.productLinkReviewStatus,
                          productLinkReviewedAt: task.productLinkReviewedAt,
                          productLinkReviewedBy: task.productLinkReviewedBy,
                          productLinkReviewComment: task.productLinkReviewComment,
                          assignee: task.assignee,
                        }}
                        submittedByUser={submittedByUser}
                        session={session}
                        isLeader={isLeaderForRequest}
                        isRequester={isRequesterForRequest}
                        isAdmin={isAdmin}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Template Checklist Section */}
          {request.template && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-500" />
                    Checklist theo Template
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {request.template.name} • Ước tính {request.template.estimatedDays || 1} ngày
                  </p>
                </div>
              </div>

              {request.template.description && (
                <p className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-3">
                  {request.template.description}
                </p>
              )}

              <div className="space-y-3">
                {request.template.checklistItems?.length ? (
                  request.template.checklistItems.map((item: any, index: number) => (
                    <div
                      key={item.id || index}
                      className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:border-primary-300 transition"
                    >
                      <div className="flex-shrink-0 mt-1">
                        <CheckSquare className="w-4 h-4 text-primary-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {item.title}
                        </p>
                        {item.description && (
                          <p className="text-xs text-gray-600 mt-1 whitespace-pre-line">
                            {item.description}
                          </p>
                        )}
                      </div>
                      {item.estimatedHours ? (
                        <span className="text-xs text-gray-500 font-medium">
                          ~{item.estimatedHours}h
                        </span>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">
                    Template không có checklist cụ thể.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Tasks Section */}
          <TasksSection 
            requestId={request.id}
            tasks={request.tasks?.map((task: any) => ({
              id: task.id,
              title: task.title,
              description: task.description || undefined,
              status: task.status,
              deadline: task.deadline?.toISOString() || new Date().toISOString(),
              assignee: {
                id: task.assignee?.id || "",
                name: task.assignee?.name || "Chưa phân công",
              },
              createdAt: task.createdAt.toISOString(),
              parentTaskId: task.parentTaskId || null,
            })) || []}
            canAddTask={canEdit}
            currentUserId={session?.user?.id as string}
            userRole={(session?.user as any)?.role as string}
            templates={templates?.map(t => ({
              ...t,
              createdAt: t.createdAt.toISOString(),
              updatedAt: t.updatedAt.toISOString(),
              lastUsedAt: t.lastUsedAt?.toISOString() || null,
              checklistItems: t.checklistItems.map((item: any) => ({
                ...item,
                createdAt: item.createdAt.toISOString(),
                updatedAt: item.updatedAt.toISOString(),
              })),
            }))}
            onAddTask={handleAddTask}
          />
          
          {/* Attachments */}
          {request.attachments?.length > 0 && (
            <AttachmentsCard attachments={request.attachments.map((att: any) => ({
              id: att.id,
              fileName: att.fileName,
              fileUrl: att.fileUrl,
              fileSize: att.fileSize || 0,
              mimeType: att.fileType || undefined,
            }))} />
          )}
          
          {/* Comments */}
          <CommentsSection 
            requestId={request.id}
            comments={request.comments?.map((comment: any) => ({
              id: comment.id,
              content: comment.content,
              createdAt: comment.createdAt.toISOString(),
              user: {
                id: comment.author.id,
                name: comment.author.name || "Không rõ",
              },
            })) || []}
            currentUser={session?.user ? {
              id: session.user.id || "",
              name: session.user.name || "Người dùng",
            } : undefined}
          />
        </div>
        
        {/* Sidebar - Right (1/3) */}
        <div className="space-y-6">
          {/* Info Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-sm font-semibold text-gray-600 uppercase mb-4">
              Thông tin
            </h2>
            <div className="space-y-4">
              <InfoField
                label="Độ ưu tiên"
                icon={<Flag className="w-4 h-4" />}
              >
                <PriorityBadge priority={request.priority} />
              </InfoField>
              
              <InfoField
                label="Phân loại"
                icon={<Tag className="w-4 h-4" />}
              >
                <span className="font-medium text-gray-900">
                  {request.category?.name || "Chưa phân loại"}
                </span>
              </InfoField>
              
              <InfoField
                label="Người yêu cầu"
                icon={<User className="w-4 h-4" />}
              >
                <div className="flex items-center gap-2">
                  <Avatar 
                    size="sm" 
                    fallback={request.creator?.name?.[0] || "?"} 
                  />
                  <span className="font-medium text-gray-900">
                    {request.creator?.name || "Không rõ"}
                  </span>
                </div>
              </InfoField>
              
              <InfoField
                label="Nhóm xử lý"
                icon={<UserCheck className="w-4 h-4" />}
              >
                <span className="font-medium text-gray-900">
                  {request.team?.name || "Chưa phân công"}
                </span>
              </InfoField>
              
              <InfoField
                label="Ngày tạo"
                icon={<Calendar className="w-4 h-4" />}
              >
                <span className="font-medium text-gray-900">
                  {new Date(request.createdAt).toLocaleDateString('vi-VN', {
                    weekday: 'long',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </InfoField>
              
              <InfoField
                label="Hạn hoàn thành"
                icon={<Clock className="w-4 h-4" />}
              >
                <span className={`font-medium ${
                  isOverdue(request.deadline) ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {request.deadline ? new Date(request.deadline).toLocaleDateString('vi-VN', {
                    weekday: 'long',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : "Không có"}
                </span>
                {request.deadline && isOverdue(request.deadline) && (
                  <span className="block text-xs text-red-600 mt-1">
                    Đã quá hạn
                  </span>
                )}
              </InfoField>

              {request.slaDeadline && (
                <InfoField
                  label="SLA"
                  icon={<Clock className="w-4 h-4" />}
                >
                  <SlaBadge
                    deadline={request.slaDeadline}
                    pausedDuration={request.slaPausedDuration || 0}
                    status={request.slaStatus || undefined}
                  />
                </InfoField>
              )}
            </div>
          </div>
          
          {/* Activity Timeline */}
          <ActivityTimeline 
            requestId={request.id}
            activities={activities}
          />
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gửi lại để review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Lý do từ chối và yêu cầu làm lại *</Label>
              <Textarea
                placeholder="Vui lòng giải thích lý do từ chối và yêu cầu nhân viên làm lại (tối thiểu 10 ký tự)..."
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                rows={4}
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                {rejectComment.length}/10 ký tự tối thiểu
              </p>
            </div>
          </div>
          <DialogFooter className="flex items-center justify-between sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setIsRejectDialogOpen(false);
                setRejectComment("");
              }}
              disabled={loading}
            >
              Hủy
            </Button>
            <div className="flex items-center gap-2">
              <Popover open={templatePopoverOpen} onOpenChange={setTemplatePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={loading}
                    className="gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Dùng template
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <div className="p-2">
                    <p className="text-sm font-medium mb-2 px-2 py-1">Chọn template:</p>
                    <div className="space-y-1">
                      {rejectionTemplates.map((template, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setRejectComment(template.content);
                            setTemplatePopoverOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-md transition-colors"
                        >
                          {template.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <Button
                onClick={handleReject}
                disabled={loading || rejectComment.trim().length < 10}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {loading ? "Đang xử lý..." : "Xác nhận gửi lại"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <DeleteRequestModal
        requestId={request.id}
        requestTitle={request.title}
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        redirectAfterDelete={true}
      />
    </div>
  );
}