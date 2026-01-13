import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * GET /api/teams/members
 * Returns members of the current user's team
 * Only returns non-absent members
 */
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get current user's team
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { teamId: true }
    });

    if (!currentUser?.teamId) {
      console.log("[GET /api/teams/members] User has no team");
      return NextResponse.json({ 
        success: true,
        members: [] 
      });
    }

    // Get team members (exclude absent users)
    const members = await prisma.user.findMany({
      where: {
        teamId: currentUser.teamId,
        isAbsent: false  // Only active members
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      },
      orderBy: { name: "asc" }
    });

    console.log(`[GET /api/teams/members] Found ${members.length} members`);
    
    return NextResponse.json({ 
      success: true,
      members 
    });
    
  } catch (error) {
    console.error("[GET /api/teams/members] Error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Failed to load members" 
      },
      { status: 500 }
    );
  }
}

