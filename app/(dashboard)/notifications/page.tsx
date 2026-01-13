import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { NotificationsClient } from "./_components/NotificationsClient";

export const metadata = {
  title: "Thông báo | TMS",
  description: "Quản lý thông báo"
};

export default async function NotificationsPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  // Fetch all notifications for current user
  const notifications = await prisma.notification.findMany({
    where: {
      userId: session.user.id
    },
    orderBy: { createdAt: "desc" },
    take: 100  // Limit to recent 100
  });

  // Count unread
  const unreadCount = await prisma.notification.count({
    where: {
      userId: session.user.id,
      isRead: false
    }
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Thông báo</h1>
        <p className="text-gray-600 mt-1">
          Tất cả thông báo và cập nhật của bạn
        </p>
      </div>

      <NotificationsClient 
        notifications={notifications}
        unreadCount={unreadCount}
      />
    </div>
  );
}

