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
import { FileUpload } from "@/components/upload/file-upload";
import { submitTaskDeliverable } from "@/actions/task";
import { toast } from "sonner";
import { Upload, Loader2, Link as LinkIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

export function SubmitDeliverableDialog({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState("");
  const [files, setFiles] = useState<any[]>([]);
  const [productLink, setProductLink] = useState("");

  const hasFiles = files.length > 0;

  const hasValidLink = (() => {
    if (!productLink.trim()) return false;
    try {
      new URL(productLink.trim());
      return true;
    } catch {
      return false;
    }
  })();

  const canSubmit = comment.trim().length >= 20 && (hasFiles || productLink.trim().length > 0);

  function handleFilesUploaded(uploadedFiles: any[]) {
    setFiles(uploadedFiles.slice(0, 3));
  }

  async function handleSubmit() {
    if (!comment || comment.trim().length < 20) {
      toast.error("Vui lòng nhập ghi chú tối thiểu 20 ký tự");
      return;
    }

    if (!hasFiles && !productLink.trim()) {
      toast.error("Vui lòng tải lên file hoặc nhập link sản phẩm");
      return;
    }

    if (productLink.trim() && !hasValidLink) {
      toast.error("URL không hợp lệ. Vui lòng nhập đầy đủ (ví dụ: https://example.com)");
      return;
    }

    setLoading(true);

    try {
      // Map files to correct format for submitTaskDeliverable
      const mappedFiles = hasFiles
        ? files.map((file) => ({
            name: file.name || file.fileName || "unknown",
            url: file.url || file.fileUrl || "",
            size: file.size || file.fileSize || 0,
            type: file.type || file.mimeType || "application/octet-stream",
            method: file.method || "FILE",
          }))
        : [];

      const linkPayload = productLink.trim() && hasValidLink
        ? [
            {
              url: productLink.trim(),
              label: files.length > 0 ? "Link tham chiếu" : "Link sản phẩm",
            },
          ]
        : [];

      const result = await submitTaskDeliverable({
        taskId,
        comment: comment.trim(),
        files: mappedFiles,
        links: linkPayload,
      });

      if (result.success) {
        toast.success("Nộp kết quả thành công! Đang chờ duyệt.");
        setOpen(false);
        setComment("");
        setFiles([]);
        setProductLink("");
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
        <Button className="bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg">
          <Upload className="h-4 w-4 mr-2" />
          📤 Nộp kết quả
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nộp kết quả công việc</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Comment */}
          <div>
            <Label>Ghi chú *</Label>
            <Textarea
              placeholder="Mô tả kết quả, những gì đã hoàn thành... (tối thiểu 20 ký tự)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              {comment.length}/20 ký tự tối thiểu
            </p>
          </div>

          {/* File Upload */}
          <div>
            <Label>File kết quả (tối đa 3 files, 20MB/file)</Label>
            <div className="mt-2">
              <FileUpload multiple maxFiles={3} maxSize={20 * 1024 * 1024} onUpload={handleFilesUploaded} />
            </div>
          </div>

          {/* Product Link */}
          <div>
            <Label className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Link sản phẩm (tùy chọn)
            </Label>
            <Input
              type="url"
              placeholder="https://example.com/product"
              value={productLink}
              onChange={(e) => setProductLink(e.target.value)}
              className="mt-2"
            />
            {productLink && !hasValidLink && (
              <p className="text-xs text-red-500 mt-1">
                URL không hợp lệ. Vui lòng nhập URL đầy đủ với http:// hoặc https://
              </p>
            )}
          </div>

          {/* Preview Files */}
          {files.length > 0 && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm font-medium mb-2">Files đã chọn ({files.length}/3):</p>
              <ul className="space-y-1">
                {files.map((f, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex items-center gap-2">
                    <span>📎</span>
                    <span className="flex-1">{f.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || loading || (productLink.trim().length > 0 && !hasValidLink)}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Gửi nộp
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false);
                setComment("");
                setFiles([]);
                setProductLink("");
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

