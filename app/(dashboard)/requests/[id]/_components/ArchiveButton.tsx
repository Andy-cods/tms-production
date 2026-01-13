"use client";

import { useState, useTransition } from "react";
import { archiveRequest } from "@/actions/requests";
import { useToast } from "@/hooks/use-toast";

interface ArchiveButtonProps {
  requestId: string;
  status: string;
}

export default function ArchiveButton({ requestId, status }: ArchiveButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  // Only show for DONE requests
  if (status !== "DONE") return null;

  const handleArchive = () => {
    startTransition(async () => {
      try {
        await archiveRequest(requestId);
        setShowConfirm(false);
        toast.success("Lưu trữ thành công", "Request đã được lưu trữ.");
      } catch (error) {
        console.error("Failed to archive request:", error);
        toast.error("Lỗi lưu trữ", "Không thể lưu trữ request. Vui lòng thử lại.");
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="px-3 py-2 text-sm rounded bg-gray-600 text-white hover:bg-gray-700"
      >
        Lưu trữ
      </button>

      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Xác nhận lưu trữ</h3>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn lưu trữ request này? Request sẽ được ẩn khỏi danh sách mặc định.
            </p>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={pending}
              >
                Hủy
              </button>
              <button
                onClick={handleArchive}
                disabled={pending}
                className="px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pending ? "Đang lưu trữ..." : "Xác nhận lưu trữ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
