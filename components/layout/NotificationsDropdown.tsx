"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, CheckCheck } from "lucide-react";
import { markNotificationAsRead, markAllNotificationsAsRead } from "@/actions/notifications";
import { toast } from "@/lib/utils/toast";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  requestId?: string;
  taskId?: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  hasMore: boolean;
  page: number;
}

export default function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const fetchNotifications = async (page = 1) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/notifications?page=${page}&limit=10`);
      const data: NotificationsResponse = await response.json();
      
      if (page === 1) {
        setNotifications(data.notifications);
      } else {
        setNotifications(prev => [...prev, ...data.notifications]);
      }
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      toast.error("Lỗi tải thông báo", {
        description: "Không thể tải danh sách thông báo. Vui lòng thử lại."
      });
    } finally {
      setLoading(false);
    }
  };

  // Load notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Auto-refresh unread count every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications(1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      startTransition(async () => {
        try {
          await markNotificationAsRead(notification.id);
          setNotifications(prev => 
            prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
          );
          setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
          console.error("Failed to mark notification as read:", error);
          toast.error("Lỗi cập nhật thông báo", {
            description: "Không thể đánh dấu thông báo đã đọc."
          });
        }
      });
    }

    // Navigate based on notification content
    if (notification.taskId) {
      // If has taskId → Go to My Tasks
      router.push(`/my-tasks`);
    } else if (notification.requestId) {
      // If has requestId → Go to Request detail
      router.push(`/requests/${notification.requestId}`);
    } else {
      // Default → Go to notifications page
      router.push(`/notifications`);
    }
    
    setIsOpen(false);
  };

  const handleMarkAllAsRead = () => {
    startTransition(async () => {
      try {
        await markAllNotificationsAsRead();
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      } catch (error) {
        console.error("Failed to mark all notifications as read:", error);
        toast.error("Lỗi cập nhật thông báo", {
          description: "Không thể đánh dấu tất cả thông báo đã đọc."
        });
      }
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Vừa xong";
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} ngày trước`;
    
    return date.toLocaleDateString("vi-VN");
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
        disabled={pending}
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border z-20 max-h-96 overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Thông báo</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={pending}
                  className="text-sm text-[#37B24D] hover:text-[#2D9441] disabled:opacity-50 flex items-center gap-1"
                >
                  <CheckCheck className="w-4 h-4" />
                  Đánh dấu đã đọc
                </button>
              )}
            </div>
            
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#37B24D] mx-auto mb-2"></div>
                  <p className="text-sm">Đang tải...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Không có thông báo</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                        !notification.isRead ? "bg-[#F0FDF4]" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                          !notification.isRead ? "bg-[#37B24D]" : "bg-gray-300"
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-900 truncate">
                            {notification.title}
                          </div>
                          <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {formatTimeAgo(notification.createdAt)}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Footer - View all notifications */}
            {notifications.length > 0 && (
              <>
                <div className="border-t p-2">
                  <button
                    onClick={() => {
                      router.push("/notifications");
                      setIsOpen(false);
                    }}
                    className="w-full text-center text-sm text-[#37B24D] hover:text-[#2D9441] py-2"
                  >
                    Xem tất cả thông báo
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
