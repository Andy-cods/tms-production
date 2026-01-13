import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    
    // If no session, return 0 instead of 401 to prevent console errors
    if (!session?.user) {
      return NextResponse.json({ count: 0 });
    }

    // Get userId from session (can be in session.user.id or session.user as any)
    const userId = (session.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ count: 0 });
    }

    const count = await prisma.notification.count({
      where: {
        userId: userId,
        isRead: false
      }
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("[Notifications Count API] Error:", error);
    // Return 0 instead of error to prevent UI issues
    return NextResponse.json({ count: 0 });
  }
}
