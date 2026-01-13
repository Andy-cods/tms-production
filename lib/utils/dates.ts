// lib/utils/dates.ts
export const parseDateOrNull = (s?: string) => {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};
