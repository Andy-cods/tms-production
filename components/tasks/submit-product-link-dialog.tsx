"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { submitProductLink } from "@/actions/task";
import { toast } from "sonner";
import { Link2, Loader2, Upload as UploadIcon } from "lucide-react";
import { FileUpload } from "@/components/upload/file-upload";

interface SubmitProductLinkDialogProps {
  taskId: string;
  isResubmission?: boolean;
  rejectionCount?: number;
}

export function SubmitProductLinkDialog({ taskId, isResubmission = false, rejectionCount = 0 }: SubmitProductLinkDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [productLink, setProductLink] = useState("");
  const [comment, setComment] = useState("");
  const [files, setFiles] = useState<any[]>([]);

  const canSubmit = productLink.trim().length > 0 && isValidUrl(productLink.trim());

  function isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  function handleFilesUploaded(uploaded: any[]) {
    setFiles(uploaded.slice(0, 3));
  }

  async function handleSubmit() {
    if (!productLink.trim()) {
      toast.error("Vui lòng nhập link sản phẩm");
      return;
    }

    if (!isValidUrl(productLink.trim())) {
      toast.error("URL không hợp lệ. Vui lòng nhập URL đầy đủ (ví dụ: https://example.com)");
      return;
    }

    if (comment && comment.trim().length < 20) {
      toast.error("Ghi chú phải có ít nhất 20 ký tự");
      return;
    }

    setLoading(true);

    try {
      const mappedFiles = files.length
        ? files.map((file) => ({
            name: file.name || file.fileName || "unknown",
            url: file.url || file.fileUrl || "",
            size: file.size || file.fileSize || 0,
            type: file.type || file.mimeType || "application/octet-stream",
            method: file.method || "FILE",
          }))
        : [];

      const result = await submitProductLink({
        taskId,
        productLink: productLink.trim(),
        comment: comment.trim() || undefined,
        files: mappedFiles,
      });

      if (result.success) {
        toast.success("Đã nộp link sản phẩm thành công! Đang chờ duyệt.");
        setOpen(false);
        setProductLink("");
        setComment("");
        setFiles([]);
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={isResubmission ? "bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-lg" : "bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg"}>
          <Link2 className="h-4 w-4 mr-2" />
          {isResubmission ? `🔄 Nộp lại link (${rejectionCount + 1}/3)` : "🔗 Nộp link sản phẩm"}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isResubmission ? `Nộp lại link sản phẩm (Lần ${rejectionCount + 1}/3)` : "Nộp link sản phẩm"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Product Link */}
          <div>
            <Label>Link sản phẩm *</Label>
            <Input
              type="text"
              placeholder="https://drive.google.com/... hoặc https://dropbox.com/..."
              value={productLink}
              onChange={(e) => setProductLink(e.target.value)}
              className="mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              Hỗ trợ: Google Drive, OneDrive, Dropbox, Box, hoặc bất kỳ URL hợp lệ nào
            </p>
            {productLink && !isValidUrl(productLink.trim()) && (
              <p className="text-xs text-red-500 mt-1">
                URL không hợp lệ. Vui lòng nhập URL đầy đủ (bắt đầu bằng http:// hoặc https://)
              </p>
            )}
          </div>

          {/* Comment */}
          <div>
            <Label>Ghi chú (tùy chọn)</Label>
            <Textarea
              placeholder="Mô tả về sản phẩm, những gì đã hoàn thành... (tối thiểu 20 ký tự nếu có)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              {comment.length}/20 ký tự tối thiểu (nếu có ghi chú)
            </p>
          </div>

          {/* File Upload */}
          <div>
            <Label>File đính kèm (tối đa 3 files, 20MB/file)</Label>
            <div className="mt-2">
              <FileUpload multiple maxFiles={3} maxSize={20 * 1024 * 1024} onUpload={handleFilesUploaded} />
            </div>
            {files.length > 0 && (
              <div className="bg-gray-50 p-3 rounded-lg mt-3">
                <p className="text-sm font-medium mb-2">Files đã chọn ({files.length}/3):</p>
                <ul className="space-y-1">
                  {files.map((file, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-center gap-2">
                      <UploadIcon className="h-4 w-4" />
                      <span className="flex-1">{file.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Info */}
          {isResubmission ? (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-sm text-orange-800">
                <strong>⚠️ Nộp lại sau khi bị từ chối:</strong> Đây là lần nộp lại thứ {rejectionCount + 1}/3. 
                Vui lòng chỉnh sửa sản phẩm theo phản hồi trước đó trước khi nộp lại.
              </p>
              {rejectionCount >= 2 && (
                <p className="text-sm text-red-700 font-semibold mt-2">
                  ⚠️ Đây là lần nộp lại cuối cùng! Nếu bị từ chối lần này, bạn sẽ cần liên hệ Leader hoặc Admin để được hỗ trợ.
                </p>
              )}
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Lưu ý:</strong> Sau khi nộp, task sẽ chuyển sang trạng thái "Đang chờ duyệt". 
                Leader sẽ duyệt trước, sau đó người yêu cầu sẽ duyệt bước cuối.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4 mr-2" />
                  Gửi nộp
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false);
                setProductLink("");
                setComment("");
                setFiles([]);
              }}
              disabled={loading}
            >
              Hủy
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

