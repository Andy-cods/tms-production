import * as React from "react";

import { cn } from "@/lib/utils";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "hoverable" | "accent-left" | "gradient-border";
    accentColor?: "green" | "orange";
  }
>(({ className, variant = "default", accentColor = "green", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-2xl bg-white dark:bg-card transition-all duration-200 ease-in-out",
      variant === "default" && "border border-gray-200 dark:border-border shadow-sm dark:shadow-lg",
      variant === "hoverable" &&
        "border border-gray-200 dark:border-border shadow-sm dark:shadow-lg hover:shadow-md dark:hover:shadow-xl hover:-translate-y-1 cursor-pointer",
      variant === "accent-left" &&
        accentColor === "green" &&
        "border-l-4 border-l-primary-500 border-y border-r border-gray-200 dark:border-border shadow-sm dark:shadow-lg pl-5",
      variant === "accent-left" &&
        accentColor === "orange" &&
        "border-l-4 border-l-accent-500 border-y border-r border-gray-200 dark:border-border shadow-sm dark:shadow-lg pl-5",
      variant === "gradient-border" && "gradient-border shadow-md dark:shadow-lg",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex justify-between items-center p-6 mb-4", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-lg font-semibold leading-tight text-dark-700 dark:text-gray-100", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-gray-600 dark:text-gray-400", className)} {...props} />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center mt-4 pt-4 p-6 border-t border-gray-100 dark:border-border", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };

