"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Optional: log to console for visibility during dev
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="p-6">
      <div className="rounded border bg-white p-4">
        <h2 className="text-lg font-semibold mb-2">Đã xảy ra lỗi khi tải Requests</h2>
        <p className="text-sm text-gray-600 mb-4">{error.message || "Không rõ nguyên nhân."}</p>
        <button onClick={reset} className="px-4 py-2 bg-black text-white rounded">
          Thử lại
        </button>
      </div>
    </div>
  );
}


