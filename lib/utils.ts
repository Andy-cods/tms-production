import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | null | undefined, formatString?: string): string {
  if (date === null || date === undefined) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const defaultFormat = 'dd/MM/yyyy HH:mm';
    const formatToUse = formatString || defaultFormat;
    
    return format(dateObj, formatToUse);
  } catch (error) {
    return 'Invalid Date';
  }
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || bytes < 0) return '0 Bytes';
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  const value = bytes / Math.pow(k, i);
  
  // Bytes should not have decimal places, others should have 2 decimal places
  if (i === 0) {
    return Math.round(value) + ' ' + sizes[i];
  } else {
    const formattedValue = value.toFixed(2);
    return formattedValue + ' ' + sizes[i];
  }
}

export function highlightText(text: string, query: string): string {
  if (!query || query.trim() === '') return text;
  
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
}
