// app/(dashboard)/layout.tsx
import "../globals.css";
import ModernSidebarServer from "@/components/layout/modern-sidebar-server";
import ModernHeaderServer from "@/components/layout/modern-header-server";
import CommandPalette from "@/components/layout/command-palette";
import { FloatingActionButton } from "@/components/layout/floating-action-button";
import { ToastProvider } from "@/components/providers/toast-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ToastProvider />
      <div className="min-h-screen flex bg-slate-50 dark:bg-background transition-colors duration-200">
        {/* Modern Sidebar */}
        <ModernSidebarServer />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Modern Header */}
          <ModernHeaderServer />
          
        
          {/* Page Content */}
          <main className="flex-1 p-6 overflow-y-auto bg-slate-50 dark:bg-background transition-colors duration-200">
            {children}
          </main>
        </div>
        
        {/* Global Components */}
        <CommandPalette />
        <FloatingActionButton />
      </div>
    </ThemeProvider>
  );
}