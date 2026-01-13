"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { KeyboardShortcutsProvider } from "@/components/layout/keyboard-shortcuts-provider";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <KeyboardShortcutsProvider>
        {children}
        <Toaster 
          position="top-right"
          expand={false}
          richColors
          closeButton
          visibleToasts={3}
          toastOptions={{
            classNames: {
              toast: 'rounded-lg shadow-lg border group-[.toaster]:bg-white dark:group-[.toaster]:bg-slate-800 group-[.toaster]:text-slate-950 dark:group-[.toaster]:text-slate-50 group-[.toaster]:border-slate-200 dark:group-[.toaster]:border-slate-700',
              title: 'font-medium text-slate-900 dark:text-slate-50',
              description: 'text-sm text-slate-600 dark:text-slate-400',
              actionButton: 'bg-primary text-white hover:bg-primary/90',
              cancelButton: 'bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-slate-50',
              closeButton: 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700',
              success: 'group-[.toaster]:bg-green-50 dark:group-[.toaster]:bg-green-900/20 group-[.toaster]:border-l-4 group-[.toaster]:border-green-500 group-[.toaster]:text-green-900 dark:group-[.toaster]:text-green-100',
              error: 'group-[.toaster]:bg-red-50 dark:group-[.toaster]:bg-red-900/20 group-[.toaster]:border-l-4 group-[.toaster]:border-red-500 group-[.toaster]:text-red-900 dark:group-[.toaster]:text-red-100',
              warning: 'group-[.toaster]:bg-orange-50 dark:group-[.toaster]:bg-orange-900/20 group-[.toaster]:border-l-4 group-[.toaster]:border-orange-500 group-[.toaster]:text-orange-900 dark:group-[.toaster]:text-orange-100',
              info: 'group-[.toaster]:bg-blue-50 dark:group-[.toaster]:bg-blue-900/20 group-[.toaster]:border-l-4 group-[.toaster]:border-blue-500 group-[.toaster]:text-blue-900 dark:group-[.toaster]:text-blue-100',
              loading: 'group-[.toaster]:bg-slate-50 dark:group-[.toaster]:bg-slate-800 group-[.toaster]:text-slate-950 dark:group-[.toaster]:text-slate-50',
            },
          }}
        />
      </KeyboardShortcutsProvider>
    </ThemeProvider>
  );
}

