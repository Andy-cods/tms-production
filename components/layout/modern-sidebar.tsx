"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  Users,
  BarChart3,
  Bell,
  Award,
  UserCog,
  FolderOpen,
  Building2,
  Settings,
  HelpCircle,
  Menu,
  X,
  ChevronDown,
  Layers,
  Shield,
} from "lucide-react";
import { useSidebarStore } from "@/lib/stores/sidebar-store";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ModernSidebarProps {
  role?: string;
  userName?: string;
  escalationsCount?: number;
  notificationsCount?: number;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  requiresRole?: string;
}

// NavLink Component with badge support
function NavLink({ 
  href, 
  icon: Icon, 
  children, 
  badge, 
  indent = false,
  isCollapsed = false
}: { 
  href: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  badge?: number
  indent?: boolean
  isCollapsed?: boolean
}) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + "/")
  
  const content = (
    <Link
      href={href}
      className={clsx(
        "flex items-center gap-3 py-3 transition-colors relative group",
        indent ? "px-12" : "px-6",
        isActive 
          ? "bg-white/10 dark:bg-white/20 border-l-4 border-[#FF922B]" 
          : "hover:bg-white/10 dark:hover:bg-white/15 border-l-4 border-transparent"
      )}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      {!isCollapsed && (
        <>
          <span className="font-medium flex-1">{children}</span>
          {badge !== undefined && badge > 0 && (
            <span className="min-w-[20px] h-5 px-1.5 bg-[#FF922B] text-white text-xs font-bold rounded-full flex items-center justify-center">
              {badge > 9 ? '9+' : badge}
            </span>
          )}
        </>
      )}
      {isCollapsed && badge !== undefined && badge > 0 && (
        <span className="absolute top-1 right-1 h-2 w-2 bg-[#FF922B] rounded-full border-2 border-white" />
      )}
    </Link>
  )

  if (isCollapsed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right">
            <p>{children}</p>
            {badge !== undefined && badge > 0 && (
              <p className="text-xs text-red-500">{badge} unread</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return content
}

const mainNavItems: NavItem[] = [
  { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/requests", label: "Yêu cầu", icon: FileText },
  { href: "/my-tasks", label: "Công việc của tôi", icon: CheckSquare },
  { href: "/notifications", label: "Thông báo", icon: Bell },
];

const adminNavItems: NavItem[] = [
  { href: "/admin/overview", label: "Bảng Admin", icon: Shield },
  { href: "/admin/users", label: "Người dùng", icon: UserCog },
  { href: "/admin/categories", label: "Danh mục", icon: FolderOpen },
  { href: "/admin/teams", label: "Phòng ban", icon: Building2 },
  { href: "/admin/assignment-config", label: "Cấu hình phân công", icon: Settings },
  { href: "/reports", label: "Báo cáo", icon: BarChart3 },
  { href: "/templates", label: "Templates", icon: Layers },
];

export default function ModernSidebar({
  role,
  userName,
  escalationsCount = 0,
  notificationsCount = 0,
}: ModernSidebarProps) {
  const pathname = usePathname();
  const { isCollapsed, toggle, setCollapsed } = useSidebarStore();
  const [adminOpen, setAdminOpen] = useState(
    pathname.startsWith("/admin") || pathname.startsWith("/reports") || pathname.startsWith("/templates")
  );

  // Keyboard shortcut for toggling sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        toggle();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggle]);

  // Auto-collapse on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(true);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Check on mount

    return () => window.removeEventListener("resize", handleResize);
  }, [setCollapsed]);

  const sidebarContent = (
    <>
      {/* Logo Area */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-white/10 dark:border-white/20">
        {!isCollapsed ? (
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">TMS</span>
            </div>
            <div>
              <h1 className="font-bold text-lg text-white">TMS</h1>
              <p className="text-xs text-white/70">Task Management</p>
            </div>
          </Link>
        ) : (
          <Link href="/dashboard" className="flex items-center justify-center w-full">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">TMS</span>
            </div>
          </Link>
        )}
        <button
          onClick={toggle}
          className="p-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/20 transition-colors text-white"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {/* Main Section */}
        <div className="space-y-1">
          {!isCollapsed && (
            <p className="px-6 text-xs font-semibold text-white/50 uppercase mb-2">Chính</p>
          )}
          
          {/* Main Navigation Items */}
          <NavLink href="/dashboard" icon={LayoutDashboard} isCollapsed={isCollapsed}>
            Tổng quan
          </NavLink>
          
          <NavLink href="/personal" icon={LayoutDashboard} isCollapsed={isCollapsed}>
            Dashboard cá nhân
          </NavLink>
          
          <NavLink href="/requests" icon={FileText} isCollapsed={isCollapsed}>
            Yêu cầu
          </NavLink>
          
          {/* Bảng Leader */}
          {role === "LEADER" && (
            <NavLink href="/leader" icon={Users} isCollapsed={isCollapsed}>
              Bảng Leader
            </NavLink>
          )}
          
          <NavLink href="/notifications" icon={Bell} badge={notificationsCount} isCollapsed={isCollapsed}>
            Thông báo
          </NavLink>

          <NavLink href="/achievements" icon={Award} isCollapsed={isCollapsed}>
            Thành tích
          </NavLink>

        </div>

        {/* Admin Section */}
        {role === "ADMIN" && (
          <div className="mt-4">
            {!isCollapsed ? (
              <>
                <button
                  onClick={() => setAdminOpen(!adminOpen)}
                  className="w-full flex items-center justify-between px-6 py-2 text-xs font-semibold text-white/50 dark:text-white/60 uppercase hover:text-white/70 dark:hover:text-white/80 transition-colors"
                >
                  <span>QUẢN TRỊ</span>
                  <ChevronDown className={clsx("w-4 h-4 transition-transform", adminOpen && "rotate-180")} />
                </button>
                
                {adminOpen && (
                  <div className="space-y-1 mt-1">
                    <NavLink href="/admin/overview" icon={Shield} indent isCollapsed={isCollapsed}>
                      Bảng Admin
                    </NavLink>
                    <NavLink href="/admin/users" icon={UserCog} indent isCollapsed={isCollapsed}>
                      Người dùng
                    </NavLink>
                    <NavLink href="/admin/categories" icon={FolderOpen} indent isCollapsed={isCollapsed}>
                      Danh mục
                    </NavLink>
                    <NavLink href="/admin/teams" icon={Building2} indent isCollapsed={isCollapsed}>
                      Phòng ban
                    </NavLink>
                    <NavLink href="/admin/assignment-config" icon={Settings} indent isCollapsed={isCollapsed}>
                      Cấu hình phân công
                    </NavLink>
                    <NavLink href="/reports" icon={BarChart3} indent isCollapsed={isCollapsed}>
                      Báo cáo
                    </NavLink>
                    <NavLink href="/templates" icon={Layers} indent isCollapsed={isCollapsed}>
                      Templates
                    </NavLink>
                  </div>
                )}
              </>
            ) : (
              // Collapsed admin items
              adminNavItems.map((item) => (
                <NavLink key={item.href} href={item.href} icon={item.icon} isCollapsed={isCollapsed}>
                  {item.label}
                </NavLink>
              ))
            )}
          </div>
        )}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-white/10 dark:border-white/20 p-3 space-y-1">
        {/* Profile */}
        <Link
          href="/profile"
          className={clsx(
            "flex items-center gap-3 px-6 py-3 rounded-lg text-sm font-medium transition-colors",
            "hover:bg-white/10 dark:hover:bg-white/15",
            pathname === "/profile"
              ? "bg-white/10 dark:bg-white/20 text-white border-l-4 border-[#FF922B]"
              : "text-white/90 dark:text-white/80 hover:text-white"
          )}
        >
          <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-sm">
              {userName?.[0]?.toUpperCase() || "U"}
            </span>
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{userName || "User"}</p>
              <p className="text-xs text-white/70">{role || "ASSIGNEE"}</p>
            </div>
          )}
        </Link>

        {/* Help & Docs */}
        <NavLink href="/help" icon={HelpCircle} isCollapsed={isCollapsed}>
          Help & Docs
        </NavLink>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed top-0 left-0 h-screen transition-all duration-200 ease-in-out",
          "bg-gradient-to-b from-[#37B24D] to-[#2f9e44]",
          "dark:from-[#1e5d2e] dark:to-[#164522]",
          "text-white flex flex-col shadow-xl z-50",
          isCollapsed ? "w-[72px]" : "w-[280px]"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Spacer to prevent content overlap */}
      <div className={clsx("transition-all duration-200 ease-in-out", isCollapsed ? "w-[72px]" : "w-[280px]")} />
    </>
  );
}

