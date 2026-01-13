"use client";

import { useState, useEffect } from "react";
import { Check, Plus, X, ListTodo } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

interface TodoListProps {
  userId: string;
}

export function TodoList({ userId }: TodoListProps) {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodoText, setNewTodoText] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Load todos from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`todos_${userId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Filter out old todos (older than today)
        const today = new Date().toDateString();
        const filtered = parsed.filter((todo: TodoItem) => {
          const todoDate = new Date(todo.createdAt).toDateString();
          return todoDate === today;
        });
        setTodos(filtered);
        // Update localStorage with filtered todos
        if (filtered.length !== parsed.length) {
          localStorage.setItem(`todos_${userId}`, JSON.stringify(filtered));
        }
      } catch (error) {
        console.error("Error loading todos:", error);
      }
    }
  }, [userId]);

  // Save todos to localStorage
  const saveTodos = (newTodos: TodoItem[]) => {
    localStorage.setItem(`todos_${userId}`, JSON.stringify(newTodos));
    setTodos(newTodos);
  };

  // Add new todo
  const handleAddTodo = () => {
    if (newTodoText.trim()) {
      const newTodo: TodoItem = {
        id: Date.now().toString(),
        text: newTodoText.trim(),
        completed: false,
        createdAt: new Date().toISOString(),
      };
      saveTodos([...todos, newTodo]);
      setNewTodoText("");
      setIsAdding(false);
    }
  };

  // Toggle todo completion
  const handleToggleTodo = (id: string) => {
    const updated = todos.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    saveTodos(updated);
  };

  // Delete todo
  const handleDeleteTodo = (id: string) => {
    const updated = todos.filter((todo) => todo.id !== id);
    saveTodos(updated);
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddTodo();
    } else if (e.key === "Escape") {
      setNewTodoText("");
      setIsAdding(false);
    }
  };

  const completedCount = todos.filter((t) => t.completed).length;
  const totalCount = todos.length;
  const completionPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <Card variant="hoverable">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 bg-primary-100 rounded-lg">
            <ListTodo className="h-5 w-5 text-primary-600" />
          </div>
          <div className="flex-1">
            <div>To-do hôm nay</div>
            {totalCount > 0 && (
              <div className="text-xs font-normal text-gray-500 mt-1">
                {completedCount}/{totalCount} hoàn thành
              </div>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Existing todos */}
          {todos.map((todo) => (
            <div
              key={todo.id}
              className={cn(
                "group flex items-center gap-3 p-3 rounded-lg transition-all duration-200",
                "hover:bg-gray-50 border border-transparent hover:border-gray-200",
                todo.completed && "opacity-60"
              )}
            >
              {/* Checkbox */}
              <button
                onClick={() => handleToggleTodo(todo.id)}
                className={cn(
                  "flex-shrink-0 w-5 h-5 rounded border-2 transition-all duration-200",
                  "flex items-center justify-center",
                  todo.completed
                    ? "bg-primary-500 border-primary-500 text-white"
                    : "border-gray-300 hover:border-primary-400 hover:bg-primary-50"
                )}
              >
                {todo.completed && <Check className="h-3 w-3" />}
              </button>

              {/* Todo text */}
              <div
                className={cn(
                  "flex-1 text-sm transition-all duration-200",
                  todo.completed
                    ? "line-through text-gray-500"
                    : "text-gray-900"
                )}
                onClick={() => handleToggleTodo(todo.id)}
              >
                {todo.text}
              </div>

              {/* Delete button */}
              <button
                onClick={() => handleDeleteTodo(todo.id)}
                className={cn(
                  "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center",
                  "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                  "text-gray-400 hover:text-red-500 hover:bg-red-50"
                )}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}

          {/* Add new todo */}
          {isAdding ? (
            <div className="flex items-center gap-3 p-3 rounded-lg border-2 border-primary-300 bg-primary-50/50">
              <div className="flex-shrink-0 w-5 h-5 rounded border-2 border-gray-300" />
              <Input
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                onKeyDown={handleKeyPress}
                onBlur={() => {
                  if (!newTodoText.trim()) {
                    setIsAdding(false);
                  }
                }}
                placeholder="Nhập công việc cần làm..."
                className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
                autoFocus
              />
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleAddTodo}
                  disabled={!newTodoText.trim()}
                  className="h-7 px-2"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setNewTodoText("");
                    setIsAdding(false);
                  }}
                  className="h-7 px-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg",
                "text-gray-500 hover:text-gray-700 hover:bg-gray-50",
                "border border-dashed border-gray-300 hover:border-primary-300",
                "transition-all duration-200 text-sm"
              )}
            >
              <div className="flex-shrink-0 w-5 h-5 rounded border-2 border-gray-300 flex items-center justify-center">
                <Plus className="h-3 w-3" />
              </div>
              <span>Thêm công việc mới...</span>
            </button>
          )}

          {/* Empty state */}
          {todos.length === 0 && !isAdding && (
            <div className="text-center py-8 text-gray-400 text-sm">
              Chưa có công việc nào. Thêm công việc đầu tiên của bạn!
            </div>
          )}

          {/* Progress bar (if there are todos) */}
          {totalCount > 0 && (
            <div className="pt-4 mt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-600">
                  Tiến độ
                </span>
                <span className="text-xs font-medium text-gray-900">
                  {Math.round(completionPercent)}%
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 transition-all duration-300 rounded-full"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

