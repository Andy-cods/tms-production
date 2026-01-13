import * as React from "react";
import { cn } from "@/lib/utils";

export interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, id, ...props }, ref) => {
    const radioId = id || `radio-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            type="radio"
            id={radioId}
            ref={ref}
            className={cn(
              "peer h-5 w-5 appearance-none rounded-full border-2 border-primary-500 bg-white transition-all duration-150 cursor-pointer",
              "checked:bg-white checked:border-primary-600",
              "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-500/20",
              "disabled:cursor-not-allowed disabled:opacity-50",
              className
            )}
            {...props}
          />
          {/* Inner dot when checked */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="h-2.5 w-2.5 rounded-full bg-primary-500 opacity-0 peer-checked:opacity-100 transition-all duration-150" />
          </div>
        </div>
        {label && (
          <label
            htmlFor={radioId}
            className="text-sm font-medium text-gray-700 cursor-pointer select-none"
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);
Radio.displayName = "Radio";

export { Radio };

