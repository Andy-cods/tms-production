"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import MyTasksBadge from "./MyTasksBadge";
import {
  BarChart3,
  FileText,
  CheckSquare,
  FileBarChart,
  Settings,
  Users,
  FolderOpen,
  Layers,
  ChevronDown,
  LogOut,
  Bell,
  LayoutDashboard,
  BookOpen,
  Shield,
} from "lucide-react";
import { useState } from "react";

const baseMainItems = [
  { href: "/dashboard", label: "Tổng quan", icon: BarChart3 },
  { href: "/personal", label: "Dashboard cá nhân", icon: LayoutDashboard },
  { href: "/requests", label: "Yêu cầu", icon: FileText },
  { href: "/my-tasks", label: "Công việc của tôi", icon: CheckSquare },
  { href: "/notifications", label: "Thông báo", icon: Bell },
];

export default function Sidebar({ role, userName }: { role?: string; userName?: string }) {
  const pathname = usePathname();
  const isAdmin = role === "ADMIN";
  const [adminOpen, setAdminOpen] = useState(
    pathname.startsWith("/admin") || pathname.startsWith("/templates") || pathname.startsWith("/reports")
  );

  const mainItems = baseMainItems;

  const adminItems = isAdmin
    ? [
        { href: "/admin/overview", label: "Bảng Admin", icon: Shield },
        { href: "/admin/users", label: "Người dùng", icon: Users },
        { href: "/admin/categories", label: "Danh mục", icon: FolderOpen },
        { href: "/admin/teams", label: "Phòng ban", icon: Users },
        { href: "/admin/assignment-config", label: "Cấu hình phân công", icon: Settings },
        { href: "/reports", label: "Báo cáo", icon: FileBarChart },
        { href: "/templates", label: "Templates", icon: BookOpen },
      ]
    : [];

  return (
    <aside className="w-[280px] h-screen bg-gradient-to-b from-[#37B24D] to-[#2f9e44] text-white flex flex-col shadow-xl">
      {/* Logo section */}
      <div className="h-[72px] px-6 flex items-center border-b border-white/10">
        <Link href="/dashboard" className="block">
          <h1 className="text-2xl font-bold text-white">TMS</h1>
          <p className="text-xs text-white/70 mt-0.5">Task Management</p>
        </Link>
      </div>

      {/* Navigation section */}
      <nav className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Main navigation */}
        <div>
          <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2 px-4">
            Chính
          </p>
          <ul className="space-y-1">
            {mainItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={clsx(
                      "flex items-center justify-between gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-smooth",
                      active
                        ? "bg-white/20 text-white border-l-4 border-[#FF922B] font-semibold"
                        : "text-white/90 hover:text-white hover:bg-white/10 border-l-4 border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" strokeWidth={2} />
                      <span>{item.label}</span>
                    </div>
                    {item.href === "/my-tasks" && <MyTasksBadge />}
                  </Link>
                </li>
              );
            })}

            {/* Bảng Leader */}
            {role === "LEADER" ? (
              <li>
                <Link
                  href="/leader"
                  className={clsx(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-smooth",
                    pathname.startsWith("/leader")
                      ? "bg-white/20 text-white border-l-4 border-[#FF922B] font-semibold"
                      : "text-white/90 hover:text-white hover:bg-white/10 border-l-4 border-transparent"
                  )}
                >
                  <Users className="h-5 w-5" strokeWidth={2} />
                  <span>Bảng Leader</span>
                </Link>
              </li>
            ) : null}
          </ul>
        </div>

        {/* Admin Section (ADMIN only) */}
        {isAdmin && (
          <div>
            <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2 px-4">
              Quản trị
            </p>
            <div>
              <button
                onClick={() => setAdminOpen(!adminOpen)}
                className={clsx(
                  "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-smooth",
                  "text-white/90 hover:text-white hover:bg-white/10",
                  adminOpen && "bg-white/10"
                )}
              >
                <div className="flex items-center gap-3">
                  <Settings className="h-5 w-5" strokeWidth={2} />
                  <span>Panel Quản trị</span>
                </div>
                <ChevronDown
                  className={clsx("h-4 w-4 transition-transform", adminOpen && "rotate-180")}
                />
              </button>

              {adminOpen && (
                <ul className="mt-2 ml-2 space-y-1 border-l-2 border-white/20 pl-3 animate-slideUp">
                  {adminItems.map((item) => {
                    const active = pathname === item.href || pathname.startsWith(item.href + "/");
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={clsx(
                            "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-smooth",
                            active
                              ? "bg-white/15 text-white border-l-2 border-[#FF922B] font-semibold"
                              : "text-white/80 hover:text-white hover:bg-white/10 border-l-2 border-transparent"
                          )}
                        >
                          <Icon className="h-4 w-4" strokeWidth={2} />
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* User section at bottom */}
      <div className="p-6 border-t border-white/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
            {userName?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{userName || "User"}</p>
            <p className="text-xs text-white/60">{role || "ASSIGNEE"}</p>
          </div>
        </div>

        <Link
          href="/signout"
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-smooth"
        >
          <LogOut className="h-4 w-4" strokeWidth={2} />
          <span>Đăng xuất</span>
        </Link>
      </div>
    </aside>
  );
}
