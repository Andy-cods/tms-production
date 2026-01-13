"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, FolderOpen, Users as TeamIcon, Settings, Shield, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const adminNavItems = [
  { href: "/admin/overview", label: "Bảng Admin", icon: Shield },
  { href: "/admin/users", label: "Người dùng", icon: Users },
  { href: "/admin/categories", label: "Phân loại", icon: FolderOpen },
  { href: "/admin/templates", label: "Templates", icon: FileText },
  { href: "/admin/teams", label: "Nhóm", icon: TeamIcon },
  { href: "/admin/sla-config", label: "Cấu hình SLA", icon: Settings },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {adminNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
              isActive
                ? "bg-primary-50 text-primary-700 border border-primary-200"
                : "hover:bg-gray-50 text-gray-700 hover:text-dark-900",
              "group"
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5",
                isActive
                  ? "text-primary-600"
                  : "text-gray-600 group-hover:text-primary-600"
              )}
            />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

