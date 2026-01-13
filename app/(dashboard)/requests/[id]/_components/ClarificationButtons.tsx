"use client";

import { useState, useTransition } from "react";
import { resolveRequestClarification } from "@/actions/clarification";
import ClarificationModal from "./ClarificationModal";

interface ClarificationButtonsProps {
  requestId: string;
  status: string;
  userRole?: string;
}

export default function ClarificationButtons({ requestId, status, userRole }: ClarificationButtonsProps) {
  const [showModal, setShowModal] = useState(false);
  const [pending, startTransition] = useTransition();

  const isLeaderOrAdmin = userRole === "LEADER" || userRole === "ADMIN";

  const handleResolve = () => {
    startTransition(async () => {
      try {
        await resolveRequestClarification(requestId);
      } catch (error) {
        console.error("Failed to resolve clarification:", error);
        alert("Không thể cập nhật trạng thái. Vui lòng thử lại.");
      }
    });
  };

  if (!isLeaderOrAdmin) return null;

  return (
    <>
      {status !== "CLARIFICATION" && (
        <button
          onClick={() => setShowModal(true)}
          className="px-3 py-2 text-sm rounded bg-orange-600 text-white hover:bg-orange-700"
        >
          Yêu cầu làm rõ
        </button>
      )}
      
      {status === "CLARIFICATION" && (
        <button
          onClick={handleResolve}
          disabled={pending}
          className="px-3 py-2 text-sm rounded border hover:bg-gray-50 disabled:opacity-50"
        >
          {pending ? "Đang xử lý..." : "Đã làm rõ"}
        </button>
      )}

      <ClarificationModal
        requestId={requestId}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
