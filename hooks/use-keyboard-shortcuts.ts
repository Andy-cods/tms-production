import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

interface Shortcut {
  keys: string[];
  description: string;
  action: () => void;
  global?: boolean;
}

export function useKeyboardShortcuts(
  shortcuts: Shortcut[],
  isEnabled: boolean = true
) {
  const router = useRouter();
  const pathname = usePathname();
  const shortcutRefs = useRef<Map<string, Shortcut>>(new Map());

  useEffect(() => {
    if (!isEnabled) return;

    // Build shortcut map
    shortcuts.forEach((shortcut) => {
      shortcut.keys.forEach((key) => {
        shortcutRefs.current.set(key, shortcut);
      });
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd (Mac) or Ctrl (Windows/Linux)
      const isCommand = e.metaKey || e.ctrlKey;
      
      if (!isCommand) return;

      const key = e.key.toLowerCase();
      const shortcut = shortcutRefs.current.get(key);

      if (shortcut) {
        e.preventDefault();
        e.stopPropagation();
        shortcut.action();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts, isEnabled, pathname]);

  return {
    // Register shortcut helpers
    register: (key: string, action: () => void) => {
      shortcutRefs.current.set(key, {
        keys: [key],
        description: "",
        action,
      });
    },
  };
}

// Page-specific shortcuts
export function usePageShortcuts(
  page: string,
  callbacks: {
    onRefresh?: () => void;
    onExport?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onComment?: () => void;
  }
) {
  useKeyboardShortcuts(
    [
      ...(page === "dashboard"
        ? [
            ...(callbacks.onRefresh
              ? [
                  {
                    keys: ["r"],
                    description: "Refresh",
                    action: callbacks.onRefresh,
                    global: true,
                  },
                ]
              : []),
            ...(callbacks.onExport
              ? [
                  {
                    keys: ["e"],
                    description: "Export",
                    action: callbacks.onExport,
                    global: true,
                  },
                ]
              : []),
          ]
        : page === "request-detail"
        ? [
            ...(callbacks.onEdit
              ? [
                  {
                    keys: ["e"],
                    description: "Edit",
                    action: callbacks.onEdit,
                    global: true,
                  },
                ]
              : []),
            ...(callbacks.onDelete
              ? [
                  {
                    keys: ["Backspace"],
                    description: "Delete (with confirm)",
                    action: callbacks.onDelete,
                    global: true,
                  },
                ]
              : []),
            ...(callbacks.onComment
              ? [
                  {
                    keys: ["c"],
                    description: "Add comment",
                    action: callbacks.onComment,
                    global: true,
                  },
                ]
              : []),
          ]
        : []),
    ],
    true
  );
}

