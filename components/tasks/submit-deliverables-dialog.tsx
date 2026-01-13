"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/upload/file-upload";
import { submitTaskDeliverable } from "@/actions/task";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, Upload, X, FileIcon, Link as LinkIcon } from "lucide-react";
import type { Attachment } from "@prisma/client";
import { Input } from "@/components/ui/input";

interface SubmitDeliverablesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
  taskTitle: string;
}

export function SubmitDeliverablesDialog({
  open,
  onOpenChange,
  taskId,
  taskTitle,
}: SubmitDeliverablesDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [productLink, setProductLink] = useState("");

  const hasFiles = attachments.length > 0;
  const hasLink = productLink.trim().length > 0;
  const isLinkValid = (() => {
    if (!hasLink) return true;
    try {
      new URL(productLink.trim());
      return true;
    } catch {
      return false;
    }
  })();
  const isCommentValid = comment.trim().length >= 20;
  const canSubmit = isCommentValid && (hasFiles || hasLink) && isLinkValid;

  const handleFileUploadComplete = (newFiles: Attachment[]) => {
    // Merge with existing attachments, avoiding duplicates
    const existingIds = new Set(attachments.map((a) => a.id));
    const uniqueNewFiles = newFiles.filter((f) => !existingIds.has(f.id));
    const merged = [...attachments, ...uniqueNewFiles];

    // Limit to 3 files total
    if (merged.length > 3) {
      toast.error("Chỉ được upload tối đa 3 file");
      setAttachments(merged.slice(0, 3));
      return;
    }

    // Check file sizes (20MB each)
    const oversizedFiles = merged.filter((f) => (f.fileSize || 0) > 20 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error("Mỗi file không được vượt quá 20MB");
      setAttachments(merged.filter((f) => (f.fileSize || 0) <= 20 * 1024 * 1024));
      return;
    }

    setAttachments(merged);
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    setAttachments(attachments.filter((a) => a.id !== attachmentId));
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setComment(value);

    // Validate on change
    if (value.trim().length > 0 && value.trim().length < 20) {
      setCommentError("Comment phải có ít nhất 20 ký tự");
    } else {
      setCommentError(null);
    }
  };

  const handleSubmit = async () => {
    // Validate comment
    if (!comment.trim() || comment.trim().length < 20) {
      setCommentError("Comment phải có ít nhất 20 ký tự");
      return;
    }

    if (!hasFiles && !hasLink) {
      toast.error("Vui lòng tải lên file hoặc nhập link sản phẩm");
      return;
    }

    if (!isLinkValid) {
      toast.error("Link không hợp lệ. Vui lòng nhập URL đầy đủ");
      return;
    }

    // Check if files are safe (optional validation)
    const unsafeFiles = attachments.filter(
      (f) => f.scanStatus === "UNSAFE"
    );
    if (unsafeFiles.length > 0) {
      toast.error("Vui lòng xóa các file không an toàn trước khi submit");
      return;
    }

    setLoading(true);
    try {
      const result = await submitTaskDeliverable({
        taskId,
        comment: comment.trim(),
        files: attachments.map((a) => ({
          name: a.fileName,
          url: a.fileUrl || "",
          size: a.fileSize || 0,
          type: a.mimeType || "application/octet-stream",
        })),
        links: hasLink
          ? [
              {
                url: productLink.trim(),
                label: "Link sản phẩm",
              },
            ]
          : [],
      });

      if (result.success) {
        toast.success("Đã nộp kết quả thành công!");
        onOpenChange(false);
        router.refresh();
        // Reset form
        setComment("");
        setAttachments([]);
        setCommentError(null);
        setProductLink("");
      } else {
        toast.error((result as any).error || "Có lỗi xảy ra khi nộp kết quả");
      }
    } catch (error: any) {
      toast.error(error?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
      // Reset form on close
      setComment("");
      setAttachments([]);
      setCommentError(null);
      setProductLink("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Nộp kết quả công việc</DialogTitle>
          <p className="text-sm text-gray-600 mt-1">{taskTitle}</p>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* File Upload Section */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              File đính kèm <span className="text-gray-500 text-sm">(tối đa 3 file, mỗi file ≤20MB)</span>
            </Label>
            <div className="border rounded-lg p-4 bg-gray-50">
              <FileUpload maxFiles={3} onUpload={handleFileUploadComplete} />
            </div>

            {/* File Preview */}
            {attachments.length > 0 && (
              <div className="space-y-2 mt-4">
                <Label className="text-sm font-medium">Files đã chọn ({attachments.length}/3):</Label>
                <div className="space-y-2">
                  {attachments.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 bg-white border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <FileIcon className="w-5 h-5 text-gray-400" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {file.fileName}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {file.fileSize && (
                              <span className="text-xs text-gray-500">
                                {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                              </span>
                            )}
                            {file.scanStatus === "SAFE" && (
                              <span className="text-xs text-green-600">✓ An toàn</span>
                            )}
                            {file.scanStatus === "PENDING" && (
                              <span className="text-xs text-yellow-600">⏰ Đang quét...</span>
                            )}
                            {file.scanStatus === "SCANNING" && (
                              <span className="text-xs text-blue-600">🔄 Đang quét virus...</span>
                            )}
                            {file.scanStatus === "UNSAFE" && (
                              <span className="text-xs text-red-600">⚠️ Không an toàn</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveAttachment(file.id)}
                        disabled={loading}
                        className="ml-2"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Product Link */}
          <div className="space-y-2">
            <Label className="text-base font-semibold flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Link sản phẩm (tùy chọn)
            </Label>
            <Input
              type="url"
              placeholder="https://example.com/product"
              value={productLink}
              onChange={(e) => setProductLink(e.target.value)}
              className={!isLinkValid ? "border-red-500" : ""}
            />
            {hasLink && !isLinkValid && (
              <p className="text-xs text-red-600">Link không hợp lệ</p>
            )}
          </div>

          {/* Comment Section */}
          <div className="space-y-2">
            <Label htmlFor="comment" className="text-base font-semibold">
              Ghi chú/Giải thích <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={handleCommentChange}
              placeholder="Mô tả chi tiết về kết quả công việc đã hoàn thành (tối thiểu 20 ký tự)..."
              rows={6}
              required
              minLength={20}
              disabled={loading}
              className={commentError ? "border-red-500" : ""}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Tối thiểu 20 ký tự ({comment.trim().length}/20)
              </p>
              {commentError && (
                <p className="text-xs text-red-600">{commentError}</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !canSubmit}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {!loading && <Upload className="w-4 h-4 mr-2" />}
            Nộp kết quả
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
