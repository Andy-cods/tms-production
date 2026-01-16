// lib/utils/dates.ts
export function parseDateOrNull(s?: string): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}
