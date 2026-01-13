"use client";

import React, { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface Props {
  lastUpdated: Date;
  onRefresh: () => void;
  loading?: boolean;
}

export function DashboardHeader({ lastUpdated, onRefresh, loading }: Props) {
  const [relativeTime, setRelativeTime] = useState("");

  // Update relative time every minute
  useEffect(() => {
    const updateTime = () => {
      setRelativeTime(formatDistanceToNow(lastUpdated, { 
        addSuffix: true, 
        locale: vi 
      }));
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [lastUpdated]);

  // Keyboard shortcut: R for refresh
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'r' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        onRefresh();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onRefresh]);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-600 mt-1">
          Tổng quan hiệu suất và chỉ số quan trọng
          {relativeTime && (
            <span className="ml-2 text-gray-500">
              · Cập nhật {relativeTime}
            </span>
          )}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Làm mới dữ liệu (Ctrl+R)"
          aria-label="Làm mới dữ liệu"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </button>
      </div>
    </div>
  );
}

interface CountdownProps {
  nextRefresh: Date;
  onComplete: () => void;
}

export function RefreshCountdown({ nextRefresh, onComplete }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diff = nextRefresh.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("0:00");
        onComplete();
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [nextRefresh, onComplete, isPaused]);

  return (
    <div 
      className="text-xs text-gray-500"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      title={isPaused ? "Đang tạm dừng" : "Tự động làm mới"}
    >
      {isPaused ? "⏸️ Tạm dừng" : `🔄 Tự động làm mới sau ${timeLeft}`}
    </div>
  );
}

