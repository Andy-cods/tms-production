import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * GET /api/teams/[teamId]/members
 * Returns members of a specific team
 * Optional: chỉ gợi ý/đề xuất
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { teamId } = await params;

    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID is required" },
        { status: 400 }
      );
    }

    // Get team members (exclude inactive users, include all roles)
    const members = await prisma.user.findMany({
      where: {
        teamId: teamId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: { name: "asc" }
    });

    return NextResponse.json({ 
      success: true,
      members 
    });
    
  } catch (error) {
    console.error("[GET /api/teams/[teamId]/members] Error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Failed to load members" 
      },
      { status: 500 }
    );
  }
}

