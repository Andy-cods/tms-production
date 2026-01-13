"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShortcutsModal } from "./shortcuts-modal";
import { FloatingActionButton } from "./floating-action-button";
import { useSidebarStore } from "@/lib/stores/sidebar-store";

interface KeyboardShortcutsProviderProps {
  children: React.ReactNode;
}

export function KeyboardShortcutsProvider({ children }: KeyboardShortcutsProviderProps) {
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const router = useRouter();
  const { toggle: toggleSidebar } = useSidebarStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCommand = e.metaKey || e.ctrlKey;

      // Global shortcuts
      if (isCommand && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }

      if (isCommand && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
      }

      if (isCommand && e.key.toLowerCase() === "n") {
        e.preventDefault();
        router.push("/requests/new");
      }

      if (isCommand && e.key.toLowerCase() === "t") {
        e.preventDefault();
        router.push("/tasks/new");
      }

      if (e.shiftKey && e.key === "?") {
        e.preventDefault();
        setIsShortcutsModalOpen(true);
      }

      // Standalone ? (Shift not held)
      if (e.key === "?") {
        if (!e.shiftKey) {
          e.preventDefault();
          setIsShortcutsModalOpen(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, toggleSidebar]);

  return (
    <>
      {children}
      <ShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />
      <FloatingActionButton />
    </>
  );
}

