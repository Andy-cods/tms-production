import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  Info,
  Clock
} from "lucide-react";
import type { ScanStatus } from "@prisma/client";

interface ScanStatusBadgeProps {
  status: ScanStatus;
  score?: number | null;
  className?: string;
}

/**
 * Visual badge component for virus scan status
 * Maps scan status to colors, icons, and Vietnamese labels
 */
export function ScanStatusBadge({ status, score, className }: ScanStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "PENDING":
        return {
          variant: "secondary" as const,
          icon: Clock,
          label: "Đang chờ quét...",
          className: "bg-gray-100 text-gray-700 border-gray-300",
          animate: false,
        };
      
      case "SCANNING":
        return {
          variant: "secondary" as const,
          icon: Loader2,
          label: "Đang quét virus...",
          className: "bg-blue-100 text-blue-700 border-blue-300",
          animate: true,
        };
      
      case "SAFE":
        return {
          variant: "default" as const,
          icon: CheckCircle2,
          label: score !== null && score !== undefined 
            ? `An toàn (${score}/100)` 
            : "An toàn",
          className: "bg-green-100 text-green-700 border-green-300",
          animate: false,
        };
      
      case "UNSAFE":
        return {
          variant: "destructive" as const,
          icon: XCircle,
          label: score !== null && score !== undefined
            ? `Không an toàn (${score}/100)`
            : "Không an toàn",
          className: "bg-red-100 text-red-700 border-red-300",
          animate: false,
        };
      
      case "ERROR":
        return {
          variant: "secondary" as const,
          icon: AlertTriangle,
          label: "Lỗi quét, vui lòng thử lại",
          className: "bg-yellow-100 text-yellow-700 border-yellow-300",
          animate: false,
        };
      
      case "SKIPPED":
        return {
          variant: "secondary" as const,
          icon: Info,
          label: "Bỏ qua quét (Drive/URL)",
          className: "bg-gray-100 text-gray-600 border-gray-300",
          animate: false,
        };
      
      default:
        return {
          variant: "secondary" as const,
          icon: Info,
          label: "Không rõ",
          className: "bg-gray-100 text-gray-600 border-gray-300",
          animate: false,
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant}
      className={`${config.className} ${className || ""}`}
    >
      <Icon 
        className={`w-3 h-3 mr-1 ${config.animate ? "animate-spin" : ""}`}
      />
      {config.label}
    </Badge>
  );
}

/**
 * Detailed scan status display with additional info
 */
export function ScanStatusDetail({ 
  status, 
  score, 
  scannedAt 
}: { 
  status: ScanStatus; 
  score?: number | null;
  scannedAt?: Date | null;
}) {
  const getStatusMessage = () => {
    switch (status) {
      case "PENDING":
        return "File đang chờ được quét virus. Quá trình này có thể mất vài phút.";
      
      case "SCANNING":
        return "Đang quét file với VirusTotal. Vui lòng chờ...";
      
      case "SAFE":
        return `File đã được quét và an toàn. Điểm số: ${score || 0}/100.`;
      
      case "UNSAFE":
        return `⚠️ Cảnh báo: File có thể chứa mã độc. Điểm số: ${score || 0}/100. Vui lòng tải file khác.`;
      
      case "ERROR":
        return "Không thể quét file. Có thể do lỗi mạng hoặc file quá lớn. Vui lòng thử lại.";
      
      case "SKIPPED":
        return "File từ Drive/URL không được quét tự động. Vui lòng đảm bảo nguồn đáng tin cậy.";
      
      default:
        return "Trạng thái không xác định.";
    }
  };

  return (
    <div className="space-y-2">
      <ScanStatusBadge status={status} score={score} />
      <p className="text-sm text-gray-600">{getStatusMessage()}</p>
      {scannedAt && (
        <p className="text-xs text-gray-500">
          Quét lúc: {new Date(scannedAt).toLocaleString("vi-VN")}
        </p>
      )}
    </div>
  );
}

