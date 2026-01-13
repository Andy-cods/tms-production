import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ModernSidebar from "./modern-sidebar";
import { getUserId } from "@/lib/auth-helpers";

export default async function ModernSidebarServer() {
  const session = await auth();
  
  if (!session?.user) {
    return null;
  }

  // Fetch counts with proper error handling
  let escalationsCount = 0;
  let notificationsCount = 0;

  try {
    // Count active escalations - simplified where clause
    const escalations = await prisma.escalationLog.count({
      where: {
        OR: [
          { status: "PENDING" },
          { status: "ACKNOWLEDGED" }
        ]
      }
    });
    escalationsCount = escalations;
  } catch (error) {
    console.error("[Sidebar] Error counting escalations:", error);
    // Keep default 0
  }

  try {
    // Count unread notifications - FIX: isRead instead of read
    const userId = getUserId(session);
    const notifications = await prisma.notification.count({
      where: {
        userId: userId,
        isRead: false
      }
    });
    notificationsCount = notifications;
  } catch (error) {
    console.error("[Sidebar] Error counting notifications:", error);
    // Keep default 0
  }

  return (
    <ModernSidebar
      role={(session.user as any).role || "ASSIGNEE"}
      userName={session.user.name || undefined}
      escalationsCount={escalationsCount}
      notificationsCount={notificationsCount}
    />
  );
}

