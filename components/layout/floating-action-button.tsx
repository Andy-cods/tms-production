"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, FileText, CheckSquare, BarChart3, X } from "lucide-react";
import { cn } from "@/lib/utils";

const speedDialItems = [
  {
    id: "new-request",
    label: "New Request",
    icon: FileText,
    href: "/requests/new",
    color: "bg-blue-500 hover:bg-blue-600"
  },
  {
    id: "new-task",
    label: "Quick Report",
    icon: BarChart3,
    href: "/reports",
    color: "bg-purple-500 hover:bg-purple-600"
  }
];

export function FloatingActionButton() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Auto-hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down & past 100px
        setIsVisible(false);
        setIsOpen(false); // Close menu when hiding
      } else {
        // Scrolling up
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  const handleItemClick = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* FAB Container */}
      <div
        className={cn(
          "fixed bottom-6 right-6 z-50 transition-all duration-300",
          isVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0 pointer-events-none"
        )}
      >
        {/* Speed Dial Items */}
        <div
          className={cn(
            "absolute bottom-16 right-0 flex flex-col gap-3 transition-all duration-300",
            isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
          )}
        >
          {speedDialItems.map((item, index) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.href)}
              className={cn(
                "flex items-center gap-3 group transition-all duration-200",
                "animate-in slide-in-from-bottom-2"
              )}
              style={{
                animationDelay: `${index * 50}ms`,
                animationFillMode: "backwards"
              }}
            >
              {/* Label */}
              <span className="px-3 py-2 bg-white text-gray-900 text-sm font-medium rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {item.label}
              </span>
              
              {/* Button */}
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-all",
                  "hover:scale-110 active:scale-95",
                  item.color
                )}
              >
                <item.icon className="w-5 h-5" />
              </div>
            </button>
          ))}
        </div>

        {/* Main FAB Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl transition-all",
            "bg-gradient-to-br from-[#37B24D] to-[#2f9e44]",
            "hover:shadow-2xl hover:scale-110 active:scale-95",
            "focus:outline-none focus:ring-4 focus:ring-[#37B24D]/50"
          )}
          aria-label={isOpen ? "Close menu" : "Open quick actions"}
        >
          <Plus
            className={cn(
              "w-6 h-6 transition-transform duration-300",
              isOpen && "rotate-45"
            )}
          />
        </button>
      </div>
    </>
  );
}