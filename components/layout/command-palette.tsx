"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Search,
  FileText,
  CheckSquare,
  User,
  Plus,
  LayoutDashboard,
  AlertTriangle,
  Clock,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebouncedCallback } from "use-debounce";

interface SearchResult {
  requests: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    createdAt: string;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    request: { id: string; title: string };
  }>;
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
}

const quickActions = [
  { id: "new-request", label: "Create new request", icon: Plus, href: "/requests/new" },
  { id: "dashboard", label: "Go to dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { id: "my-tasks", label: "View my tasks", icon: CheckSquare, href: "/my-tasks" },
  { id: "escalations", label: "View escalations", icon: AlertTriangle, href: "/escalations" },
];

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult>({
    requests: [],
    tasks: [],
    users: []
  });
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("command-palette-recent");
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Debounced search
  const searchAPI = useDebouncedCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults({ requests: [], tasks: [], users: [] });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery })
      });

      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  }, 300);

  const handleSearch = (value: string) => {
    setQuery(value);
    setSelectedIndex(0);
    
    if (value.length >= 2) {
      setLoading(true);
      searchAPI(value);
    } else {
      setResults({ requests: [], tasks: [], users: [] });
      setLoading(false);
    }
  };

  const saveRecentSearch = (search: string) => {
    const updated = [search, ...recentSearches.filter(s => s !== search)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("command-palette-recent", JSON.stringify(updated));
  };

  const handleSelect = (href: string, label?: string) => {
    if (label) saveRecentSearch(label);
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  const allResults = [
    ...quickActions.map(a => ({ ...a, type: "action" })),
    ...results.requests.map(r => ({ ...r, type: "request", href: `/requests/${r.id}` })),
    ...results.tasks.map(t => ({ ...t, type: "task", href: `/requests/${t.request.id}` })),
    ...results.users.map(u => ({ ...u, type: "user", href: `/admin/users` }))
  ];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(i => (i + 1) % allResults.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(i => (i - 1 + allResults.length) % allResults.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = allResults[selectedIndex];
        if (selected?.href) {
          handleSelect(
            selected.href, 
            "label" in selected ? selected.label : (selected as any).title
          );
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, selectedIndex, allResults]);

  const hasResults = results.requests.length > 0 || results.tasks.length > 0 || results.users.length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center border-b px-4 py-3">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <input
            type="text"
            placeholder="Search requests, tasks, users..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="flex-1 outline-none text-base bg-transparent"
            autoFocus
          />
          {loading && <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />}
          <kbd className="ml-3 px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded border">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {/* Recent Searches */}
          {!query && recentSearches.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                Recent
              </div>
              {recentSearches.map((search, i) => (
                <button
                  key={i}
                  onClick={() => handleSearch(search)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-md text-left"
                >
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{search}</span>
                </button>
              ))}
            </div>
          )}

          {/* Quick Actions */}
          {!query && (
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                Quick Actions
              </div>
              {quickActions.map((action, i) => (
                <button
                  key={action.id}
                  onClick={() => handleSelect(action.href, action.label)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors",
                    selectedIndex === i ? "bg-[#37B24D] text-white" : "hover:bg-gray-50"
                  )}
                >
                  <action.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{action.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Search Results */}
          {query && hasResults && (
            <>
              {/* Requests */}
              {results.requests.length > 0 && (
                <div className="p-2">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                    Requests
                  </div>
                  {results.requests.map((req, i) => {
                    const idx = quickActions.length + i;
                    return (
                      <button
                        key={req.id}
                        onClick={() => handleSelect(`/requests/${req.id}`, req.title)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 rounded-md text-left",
                          selectedIndex === idx ? "bg-[#37B24D] text-white" : "hover:bg-gray-50"
                        )}
                      >
                        <FileText className="w-4 h-4 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{req.title}</p>
                          <p className="text-xs opacity-70">#{req.id.slice(0, 8)}</p>
                        </div>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded",
                          selectedIndex === idx ? "bg-white/20" : "bg-gray-100"
                        )}>
                          {req.status}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Tasks */}
              {results.tasks.length > 0 && (
                <div className="p-2">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                    Tasks
                  </div>
                  {results.tasks.map((task, i) => {
                    const idx = quickActions.length + results.requests.length + i;
                    return (
                      <button
                        key={task.id}
                        onClick={() => handleSelect(`/requests/${task.request.id}`, task.title)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 rounded-md text-left",
                          selectedIndex === idx ? "bg-[#37B24D] text-white" : "hover:bg-gray-50"
                        )}
                      >
                        <CheckSquare className="w-4 h-4 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{task.title}</p>
                          <p className="text-xs opacity-70">in {task.request.title}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Users */}
              {results.users.length > 0 && (
                <div className="p-2">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                    Users
                  </div>
                  {results.users.map((user, i) => {
                    const idx = quickActions.length + results.requests.length + results.tasks.length + i;
                    return (
                      <button
                        key={user.id}
                        onClick={() => handleSelect("/admin/users", user.name)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 rounded-md text-left",
                          selectedIndex === idx ? "bg-[#37B24D] text-white" : "hover:bg-gray-50"
                        )}
                      >
                        <User className="w-4 h-4 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{user.name}</p>
                          <p className="text-xs opacity-70">{user.email}</p>
                        </div>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">
                          {user.role}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* No Results */}
          {query && !loading && !hasResults && (
            <div className="p-8 text-center text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm">
                No results found for &quot;{query}&quot;
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-4 py-2 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">↑↓</kbd> Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">Enter</kbd> Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">Esc</kbd> Close
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

