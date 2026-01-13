"use client";

import { useEffect, useState } from "react";
import { Play, Pause, Square, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { startTimer, stopTimer, pauseTimer, resumeTimer } from "@/actions/time-tracking";

interface TaskTimerProps {
  taskId: string;
  activeTimer?: {
    id: string;
    startTime: string;
    isPaused: boolean;
    pausedAt: string | null;
    task?: { id: string };
  } | null;
  onTimerChange?: () => void;
}

export function TaskTimer({ taskId, activeTimer, onTimerChange }: TaskTimerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!activeTimer || (activeTimer.task && activeTimer.task.id !== taskId)) {
      setElapsedSeconds(0);
      setIsRunning(false);
      setIsPaused(false);
      return;
    }

    setIsRunning(true);
    setIsPaused(activeTimer.isPaused);

    const start = new Date(activeTimer.startTime).getTime();
    const update = () => setElapsedSeconds(Math.floor((Date.now() - start) / 1000));
    update();

    if (!activeTimer.isPaused) {
      const id = setInterval(update, 1000);
      return () => clearInterval(id);
    }
  }, [activeTimer, taskId]);

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const onStart = async () => {
    const res = await startTimer(taskId);
    if (!res.success) alert(res.error);
    onTimerChange?.();
  };
  const onStop = async () => {
    if (!activeTimer) return;
    if (!confirm("Dừng timer và lưu thời gian?")) return;
    const res = await stopTimer(activeTimer.id);
    if (!res.success) alert(res.error);
    else {
      const duration = (res as any).duration || 0;
      alert(`Đã lưu: ${fmt(duration)}`);
    }
    onTimerChange?.();
  };
  const onPause = async () => {
    if (!activeTimer) return;
    const res = await pauseTimer(activeTimer.id);
    if (!res.success) alert(res.error);
    onTimerChange?.();
  };
  const onResume = async () => {
    if (!activeTimer) return;
    const res = await resumeTimer(activeTimer.id);
    if (!res.success) alert(res.error);
    onTimerChange?.();
  };

  return (
    <div className="flex items-center gap-2">
      {isRunning && (
        <Badge variant="outline" className="font-mono text-sm px-3 py-1">
          <Clock className="w-3 h-3 mr-1" />
          {fmt(elapsedSeconds)}
        </Badge>
      )}

      {!isRunning ? (
        <Button size="sm" variant="outline" onClick={onStart} className="gap-2">
          <Play className="w-4 h-4" /> Bắt đầu
        </Button>
      ) : (
        <>
          {isPaused ? (
            <Button size="sm" variant="outline" onClick={onResume} className="gap-2">
              <Play className="w-4 h-4" /> Tiếp tục
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={onPause} className="gap-2">
              <Pause className="w-4 h-4" /> Tạm dừng
            </Button>
          )}
          <Button size="sm" variant="destructive" onClick={onStop} className="gap-2">
            <Square className="w-4 h-4" /> Dừng
          </Button>
        </>
      )}
    </div>
  );
}
