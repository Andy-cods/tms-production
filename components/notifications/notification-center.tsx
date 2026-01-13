"use client";

import { useState, useEffect } from "react";
import { Bell, CheckCheck, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "@/actions/notifications";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  priority: "URGENT" | "WARNING" | "INFO";
  isRead: boolean;
  createdAt: string;
}

export function NotificationCenter() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadNotifications = async () => {
    setLoading(true);
    const result = await getNotifications();
    if (result.success) {
      setNotifications(result.notifications as any);
      setUnreadCount(result.unreadCount || 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadNotifications();
    const i = setInterval(loadNotifications, 30000);
    return () => clearInterval(i);
  }, []);

  const onClickNotification = async (n: Notification) => {
    if (!n.isRead) {
      await markNotificationAsRead(n.id);
      setUnreadCount((c) => Math.max(0, c - 1));
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
    }
    if (n.link) router.push(n.link);
    setIsOpen(false);
  };

  const onMarkAll = async () => {
    await markAllNotificationsAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const priorityIcon = (p: Notification["priority"]) => (p === "URGENT" ? "🔴" : p === "WARNING" ? "🟡" : "🔵");

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs" variant="destructive">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg">Thông báo</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={onMarkAll} className="text-xs">
                <CheckCheck className="h-4 w-4 mr-1" />
                Đánh dấu tất cả
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsOpen(false);
                router.push("/settings/notifications");
              }}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="h-[400px] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Đang tải...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>Không có thông báo mới</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${!n.isRead ? "bg-blue-50/50" : ""}`}
                  onClick={() => onClickNotification(n)}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{priorityIcon(n.priority)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-medium text-sm ${!n.isRead ? "text-gray-900" : "text-gray-600"}`}>{n.title}</h4>
                        {!n.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{n.message}</p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: vi })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
