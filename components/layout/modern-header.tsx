"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import {
  Menu,
  Search,
  Bell,
  Settings,
  User,
  LogOut,
  HelpCircle,
  Keyboard,
  ChevronDown,
  Calendar,
} from "lucide-react";
import { useSidebarStore } from "@/lib/stores/sidebar-store";
import { ThemeToggle } from "./theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/lib/hooks/use-notifications";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ModernHeaderProps {
  userName?: string;
  userRole?: string;
}

export default function ModernHeader({ userName, userRole }: ModernHeaderProps) {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications();
  const { toggle: toggleSidebar } = useSidebarStore();
  const router = useRouter();

  const handleSignOut = async () => {
    await router.push("/signout");
  };

  return (
    <>
      {/* Header */}
      <header className="h-16 bg-white dark:bg-card border-b border-gray-200 dark:border-border sticky top-0 z-40 flex items-center justify-between px-6 transition-colors duration-200">
        <div className="h-full flex items-center justify-between w-full">
          {/* Sidebar Toggle - Mobile/Tablet only */}
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>

          {/* Left - Search */}
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search requests, tasks, users... (⌘K)"
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-input border border-gray-200 dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#37B24D] focus:bg-white dark:focus:bg-muted transition-colors text-gray-900 dark:text-foreground"
                onClick={(e) => {
                  e.preventDefault();
                  const event = new KeyboardEvent('keydown', {
                    key: 'k',
                    metaKey: true,
                    bubbles: true
                  });
                  window.dispatchEvent(event);
                }}
                readOnly
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-100 dark:bg-muted text-gray-500 dark:text-muted-foreground text-xs rounded border border-gray-200 dark:border-border">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Right - Actions */}
          <div className="flex items-center gap-4">
          {/* Notifications */}
          <NotificationCenter />

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  <div className="w-8 h-8 rounded-full bg-[#37B24D] text-white flex items-center justify-center font-semibold">
                    {userName?.[0]?.toUpperCase()}
                  </div>
                  <div className="text-left hidden md:block">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{userName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{userRole}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="w-4 h-4 mr-2" />
                    Hồ sơ của tôi
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile/absence" className="cursor-pointer">
                    <Calendar className="w-4 h-4 mr-2" />
                    Quản lý vắng mặt
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/help" className="cursor-pointer">
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Trợ giúp
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleSignOut}
                  className="text-red-600 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </>
  );
}


