"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutGroup {
  category: string;
  shortcuts: Array<{
    keys: string[];
    description: string;
  }>;
}

const shortcutGroups: ShortcutGroup[] = [
  {
    category: "Navigation",
    shortcuts: [
      { keys: ["⌘", "K"], description: "Open command palette" },
      { keys: ["⌘", "B"], description: "Toggle sidebar" },
      { keys: ["⌘", "/"], description: "Focus search" },
      { keys: ["⌘", "?"], description: "Show this shortcuts modal" },
    ],
  },
  {
    category: "Actions",
    shortcuts: [
      { keys: ["⌘", "N"], description: "New request" },
      { keys: ["⌘", "T"], description: "New task" },
      { keys: ["⌘", "E"], description: "Edit current item" },
      { keys: ["⌘", "⌫"], description: "Delete (with confirm)" },
    ],
  },
  {
    category: "Dashboard",
    shortcuts: [
      { keys: ["⌘", "R"], description: "Refresh data" },
      { keys: ["⌘", "E"], description: "Export report" },
    ],
  },
  {
    category: "Request Detail",
    shortcuts: [
      { keys: ["⌘", "E"], description: "Edit request" },
      { keys: ["⌘", "⌫"], description: "Delete request (with confirm)" },
      { keys: ["⌘", "C"], description: "Add comment" },
    ],
  },
];

export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Press <kbd className="px-1.5 py-0.5 bg-slate-100 rounded">?</kbd> to open this modal
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[400px] overflow-y-auto space-y-6">
          {shortcutGroups.map((group) => (
            <div key={group.category}>
              <h3 className="text-sm font-semibold text-slate-900 mb-2 uppercase tracking-wide">
                {group.category}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                  >
                    <span className="text-sm text-slate-600">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <div key={keyIndex}>
                          <Badge
                            variant="outline"
                            className="font-mono text-xs bg-slate-100 border-slate-300 px-2 py-0.5"
                          >
                            {key}
                          </Badge>
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="mx-1 text-slate-400">+</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Press <kbd className="px-1.5 py-0.5 bg-slate-100 rounded">Esc</kbd> to close
          </p>
          <button
            onClick={onClose}
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

