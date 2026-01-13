import { Priority } from "@prisma/client";

export const toPriority = (v: string | undefined): Priority | undefined => {
  if (!v) return undefined;
  const u = v.toUpperCase();
  if (u === "LOW" || u === "MEDIUM" || u === "HIGH" || u === "URGENT") return u as Priority;
  return undefined;
};


