// lib/auth-helpers.ts
import { Session } from "next-auth";

/**
 * Get user ID safely from session
 * Throws error if user not authenticated
 */
export function getUserId(session: Session | null): string {
  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }
  return session.user.id;
}

/**
 * Get user role safely from session
 */
export function getUserRole(session: Session | null): string {
  if (!session?.user) {
    throw new Error("User not authenticated");
  }
  return (session.user as any).role || "ASSIGNEE";
}

