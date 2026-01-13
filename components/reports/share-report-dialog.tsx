"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink, Copy, Check, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import type { ReportMetadata } from "@/types/report";
import { useToast } from "@/hooks/use-toast";

interface ShareReportDialogProps {
  report: ReportMetadata;
  trigger?: React.ReactNode;
}

export function ShareReportDialog({ report, trigger }: ShareReportDialogProps) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}${report.downloadUrl}` : "";

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Đã sao chép!", "Link đã được sao chép vào clipboard");

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Lỗi", "Không thể sao chép link");
    }
  };

  const isExpiring = new Date(report.expiresAt).getTime() - Date.now() < 24 * 60 * 60 * 1000; // < 24h

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <ExternalLink className="h-4 w-4 mr-2" />
            Chia sẻ
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Chia sẻ báo cáo</DialogTitle>
          <DialogDescription>
            Bất kỳ ai có link này đều có thể tải xuống báo cáo cho đến khi nó hết hạn.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input value={shareUrl} readOnly className="font-mono text-xs" />
            <Button onClick={copyToClipboard} size="sm" className="px-3">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          <Alert variant={isExpiring ? "destructive" : "default"}>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              {isExpiring ? (
                <span className="font-medium">
                  Cảnh báo: Link sẽ hết hạn{" "}
                  {formatDistanceToNow(new Date(report.expiresAt), { addSuffix: true, locale: vi })}
                </span>
              ) : (
                <span>
                  Link hết hạn{" "}
                  {formatDistanceToNow(new Date(report.expiresAt), { addSuffix: true, locale: vi })}
                </span>
              )}
            </AlertDescription>
          </Alert>

          <div className="text-sm text-muted-foreground">
            <p className="mb-1">
              <strong>Loại:</strong> {report.type}
            </p>
            <p className="mb-1">
              <strong>Định dạng:</strong> {report.format}
            </p>
            <p>
              <strong>Kích thước:</strong>{" "}
              {report.fileSize < 1024 * 1024
                ? `${(report.fileSize / 1024).toFixed(1)} KB`
                : `${(report.fileSize / (1024 * 1024)).toFixed(1)} MB`}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

