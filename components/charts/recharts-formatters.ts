export function formatPercent(value: unknown, digits = 0) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "0%";
  return `${n.toFixed(digits)}%`;
}


