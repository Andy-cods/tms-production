"use client";

import React from "react";

interface InfoFieldProps {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function InfoField({ label, icon, children, className }: InfoFieldProps) {
  return (
    <div className={`pb-4 border-b border-gray-100 last:border-0 last:pb-0 ${className}`}>
      <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
        {icon}
        {label}
      </div>
      <div className="pl-6">
        {children}
      </div>
    </div>
  );
}
