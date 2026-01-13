// components/layout/Header.tsx
"use client";

import { usePathname } from "next/navigation";
import { Home, ChevronRight } from "lucide-react";
import NotificationsDropdown from "./NotificationsDropdown";

interface HeaderProps {
  userName?: string;
  userRole?: string;
}

export default function Header({ userName, userRole }: HeaderProps) {
  const pathname = usePathname();

  // Generate breadcrumb from pathname
  const getBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean);
    const breadcrumbs: Array<{ label: string; href: string; icon?: any }> = [
      { label: "Home", href: "/dashboard", icon: Home },
    ];

    let currentPath = "";
    segments.forEach((segment) => {
      currentPath += `/${segment}`;
      const label = segment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      breadcrumbs.push({ label, href: currentPath });
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="h-[72px] bg-white border-b border-gray-200 shadow-sm">
      <div className="h-full px-8 flex items-center justify-between">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            const Icon = crumb.icon;

            return (
              <div key={crumb.href} className="flex items-center gap-2">
                {Icon ? (
                  <Icon className="h-4 w-4 text-gray-600" />
                ) : (
                  index > 0 && <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
                {isLast ? (
                  <span className="font-semibold text-primary-600">{crumb.label}</span>
                ) : (
                  <a
                    href={crumb.href}
                    className="text-gray-600 hover:text-primary-600 transition-smooth"
                  >
                    {crumb.label}
                  </a>
                )}
              </div>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <NotificationsDropdown />

          {/* User info */}
          {userName && (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{userName}</p>
                <p className="text-xs text-gray-500">{userRole || "User"}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold shadow-sm">
                {userName?.[0]?.toUpperCase() || "U"}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
