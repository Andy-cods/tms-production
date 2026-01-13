import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[120px] w-full rounded-xl border-[1.5px] bg-white dark:bg-input px-4 py-3 text-base transition-smooth resize-y",
          "text-gray-900 dark:text-foreground",
          "placeholder:text-gray-400 dark:placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:border-primary-500 focus-visible:ring-4 focus-visible:ring-primary-500/20",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-muted",
          error
            ? "border-red-500 dark:border-red-400 focus-visible:border-red-500 dark:focus-visible:border-red-400 focus-visible:ring-red-500/20 dark:focus-visible:ring-red-400/20"
            : "border-gray-200 dark:border-border",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };

