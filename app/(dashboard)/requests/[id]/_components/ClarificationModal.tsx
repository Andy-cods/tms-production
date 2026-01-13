"use client";

import { useState, useTransition } from "react";
import { requestClarification } from "@/actions/clarification";

interface ClarificationModalProps {
  requestId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ClarificationModal({ requestId, isOpen, onClose }: ClarificationModalProps) {
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    startTransition(async () => {
      try {
        await requestClarification({ requestId, message: message.trim() });
        setMessage("");
        onClose();
      } catch (error) {
        console.error("Failed to request clarification:", error);
        alert("Không thể gửi yêu cầu làm rõ. Vui lòng thử lại.");
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-lg font-semibold mb-4">Yêu cầu làm rõ</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Lý do cần làm rõ:
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mô tả chi tiết những điểm cần làm rõ..."
              required
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={pending}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={pending || !message.trim()}
              className="px-4 py-2 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pending ? "Đang gửi..." : "Gửi yêu cầu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
