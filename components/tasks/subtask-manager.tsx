"use client";

import { useState, useEffect } from "react";
import {
  canAddSubtasks,
  createSubtask,
  deleteSubtask,
  getSubtasks,
  getSubtaskStatus,
  getAvailableAssignees,
} from "@/actions/subtask";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Task, TaskStatus, User } from "@prisma/client";

/**
 * SubtaskManager Component
 * 
 * Comprehensive subtask management interface with:
 * - List view with status badges
 * - Inline creation form
 * - Delete with confirmation
 * - Progress tracking
 * - Status aggregation
 * 
 * References: mindmap ST1-3, I1-3
 */

export interface SubtaskManagerProps {
  taskId: string;
  requestId?: string; // Needed to load available assignees
  canManage?: boolean;
}

interface SubtaskWithAssignee extends Task {
  assignee?: Pick<User, "id" | "name" | "email"> | null;
}

export function SubtaskManager({
  taskId,
  requestId,
  canManage = true,
}: SubtaskManagerProps) {
  // State
  const [subtasks, setSubtasks] = useState<SubtaskWithAssignee[]>([]);
  const [canAdd, setCanAdd] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingAssignees, setLoadingAssignees] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [subtaskToDelete, setSubtaskToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [availableAssignees, setAvailableAssignees] = useState<
    Pick<User, "id" | "name" | "email">[]
  >([]);

  // Status state
  const [statusSummary, setStatusSummary] = useState<{
    canComplete: boolean;
    summary: string;
    counts: {
      total: number;
      done: number;
    };
  } | null>(null);

  const toast = useToast();

  // Load data
  useEffect(() => {
    const abortController = new AbortController();
    let mounted = true;

    async function loadSubtasks() {
      if (!mounted) return;
      
      setIsLoading(true);
      setError(null);

      try {
        // Load subtasks only (simplest)
        const result = await getSubtasks(taskId);
        
        if (!mounted || abortController.signal.aborted) return;
        
        if (result.success) {
          setSubtasks(result.subtasks || []);
          setCanAdd(canManage); // Assume can add if load successful and user has permission
        } else {
          setError(result.error || "Failed to load subtasks");
          setCanAdd(false);
        }
      } catch (error) {
        if (!mounted || abortController.signal.aborted) return;
        console.error('[SubtaskManager] Error:', error);
        setError("An error occurred while loading subtasks");
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadSubtasks();

    return () => {
      mounted = false;
      abortController.abort();
    };
  }, [taskId, canManage]);

  // Load assignees on-demand when form is opened
  async function handleShowForm() {
    setShowForm(true);
    
    if (availableAssignees.length === 0 && requestId) {
      setLoadingAssignees(true);
      try {
        const result = await getAvailableAssignees(requestId);
        if (result.success) {
          setAvailableAssignees(result.assignees || []);
        }
      } catch (error) {
        console.error('[SubtaskManager] Error loading assignees:', error);
      } finally {
        setLoadingAssignees(false);
      }
    }
  }

  // Handle create subtask
  async function handleCreateSubtask(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Lỗi", "Vui lòng nhập tiêu đề subtask");
      return;
    }

    setIsAdding(true);

    try {
      const result = await createSubtask({
        parentId: taskId,
        title: title.trim(),
        description: description.trim() || undefined,
        assigneeId: assigneeId || undefined,
      });

      if (result.success) {
        toast.success("Thành công", "Đã tạo subtask mới");

        // Reset form
        setTitle("");
        setDescription("");
        setAssigneeId("");
        setShowForm(false);

        // Reload subtasks
        const reloadResult = await getSubtasks(taskId);
        if (reloadResult.success) {
          setSubtasks(reloadResult.subtasks || []);
        }
      } else {
        toast.error("Lỗi", (result as any).error || "Không thể tạo subtask");
      }
    } catch (error) {
      console.error("Create subtask error:", error);
      const errorMessage = error instanceof Error ? error.message : "Đã xảy ra lỗi khi tạo subtask";
      toast.error("Lỗi", errorMessage);
    } finally {
      setIsAdding(false);
    }
  }

  // Handle delete subtask
  async function handleDeleteSubtask() {
    if (!subtaskToDelete) return;

    setIsDeleting(true);

    try {
      const result = await deleteSubtask(subtaskToDelete);

      if (result.success) {
        toast.success("Thành công", "Đã xóa subtask");

        setDeleteDialogOpen(false);
        setSubtaskToDelete(null);

        // Reload subtasks
        const reloadResult = await getSubtasks(taskId);
        if (reloadResult.success) {
          setSubtasks(reloadResult.subtasks || []);
        }
      } else {
        toast.error("Lỗi", (result as any).error || "Không thể xóa subtask");
      }
    } catch (error) {
      console.error("Delete subtask error:", error);
      const errorMessage = error instanceof Error ? error.message : "Đã xảy ra lỗi khi xóa subtask";
      toast.error("Lỗi", errorMessage);
    } finally {
      setIsDeleting(false);
    }
  }

  // Open delete dialog
  function confirmDelete(subtaskId: string) {
    setSubtaskToDelete(subtaskId);
    setDeleteDialogOpen(true);
  }

  // Get status badge
  function getStatusBadge(status: TaskStatus) {
    switch (status) {
      case "TODO":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="w-3 h-3" />
            Chưa làm
          </Badge>
        );
      case "IN_PROGRESS":
        return (
          <Badge className="bg-blue-500 gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Đang làm
          </Badge>
        );
      case "BLOCKED":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="w-3 h-3" />
            Bị chặn
          </Badge>
        );
      case "IN_REVIEW":
        return (
          <Badge className="bg-purple-500 gap-1">
            <AlertCircle className="w-3 h-3" />
            Review
          </Badge>
        );
      case "REWORK":
        return (
          <Badge className="bg-orange-500 gap-1">
            <AlertCircle className="w-3 h-3" />
            Làm lại
          </Badge>
        );
      case "DONE":
        return (
          <Badge className="bg-green-500 gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Hoàn thành
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  }

  // Calculate progress percentage
  const progressPercentage =
    statusSummary && statusSummary.counts.total > 0
      ? (statusSummary.counts.done / statusSummary.counts.total) * 100
      : 0;

  if (!taskId) {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-gray-500">Loading subtasks...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col items-center justify-center gap-3">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <p className="text-sm text-red-600">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={async () => {
                setError(null);
                setIsLoading(true);
                try {
                  const result = await getSubtasks(taskId);
                  if (result.success) {
                    setSubtasks(result.subtasks || []);
                    setCanAdd(canManage);
                  } else {
                    setError(result.error || "Failed to load subtasks");
                  }
                } catch (error) {
                  setError("An error occurred while loading subtasks");
                } finally {
                  setIsLoading(false);
                }
              }}
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Subtasks</CardTitle>
            {canManage && canAdd && (
              <Button 
                size="sm" 
                onClick={handleShowForm}
                className="bg-primary-500 hover:bg-primary-600 text-white shadow-sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                Thêm subtask
              </Button>
            )}
          </div>

          {/* Status Summary */}
          {statusSummary && statusSummary.counts.total > 0 && (
            <div className="space-y-2 pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{statusSummary.summary}</span>
                <span className="font-medium">
                  {statusSummary.counts.done}/{statusSummary.counts.total}
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Add Subtask Form */}
          {canManage && canAdd && showForm && (
            <form onSubmit={handleCreateSubtask} className="space-y-3 p-4 border rounded-lg bg-gray-50">
              <div>
                <Label htmlFor="title">Tiêu đề *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Thiết kế giao diện đăng nhập"
                  required
                  disabled={isAdding}
                />
              </div>

              <div>
                <Label htmlFor="description">Mô tả (tùy chọn)</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Chi tiết công việc..."
                  disabled={isAdding}
                />
              </div>

              <div>
                <Label htmlFor="assignee">Người thực hiện (tùy chọn)</Label>
                <Select value={assigneeId} onValueChange={setAssigneeId} disabled={isAdding || loadingAssignees}>
                  <SelectTrigger id="assignee">
                    <SelectValue placeholder={loadingAssignees ? "Đang tải..." : "Chọn người thực hiện"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Không chỉ định</SelectItem>
                    {availableAssignees.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={isAdding || !title.trim()}
                  className="bg-primary-500 hover:bg-primary-600 text-white shadow-sm"
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      Đang tạo...
                    </>
                  ) : (
                    "Tạo subtask"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setTitle("");
                    setDescription("");
                    setAssigneeId("");
                  }}
                  disabled={isAdding}
                >
                  Hủy
                </Button>
              </div>
            </form>
          )}

          {/* Subtasks List */}
          {subtasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">Chưa có subtask nào</p>
              {canManage && canAdd && (
                <p className="text-xs mt-1">Click "Thêm subtask" để bắt đầu</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {subtasks.map((subtask, index) => (
                <div
                  key={subtask.id}
                  className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {/* Number */}
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                    {index + 1}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{subtask.title}</h4>
                        {subtask.description && (
                          <p className="text-xs text-gray-600 mt-1">
                            {subtask.description}
                          </p>
                        )}
                        {subtask.assignee && (
                          <p className="text-xs text-gray-500 mt-1">
                            👤 {subtask.assignee.name}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(subtask.status)}
                        {canManage && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => confirmDelete(subtask.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Warning if can't add */}
          {!canAdd && canManage && (
            <div className="text-xs text-gray-500 italic">
              ℹ️ Không thể thêm subtask cho task này
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa subtask</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa subtask này? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setSubtaskToDelete(null);
              }}
              disabled={isDeleting}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSubtask}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                "Xóa subtask"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

