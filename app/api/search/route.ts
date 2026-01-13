import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { query } = await req.json();

    if (!query || query.length < 2) {
      return NextResponse.json({ 
        requests: [], 
        tasks: [], 
        users: [] 
      });
    }

    const searchQuery = query.toLowerCase();

    // Search requests
    const requests = await prisma.request.findMany({
      where: {
        OR: [
          { title: { contains: searchQuery, mode: "insensitive" } },
          { description: { contains: searchQuery, mode: "insensitive" } },
          { id: { contains: searchQuery } }
        ]
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        createdAt: true
      },
      take: 5,
      orderBy: { createdAt: "desc" }
    });

    // Search tasks - Fixed the duplicate OR clause issue
    const tasks = await prisma.task.findMany({
      where: {
        AND: [
          {
            OR: [
              { title: { contains: searchQuery, mode: "insensitive" } },
              { description: { contains: searchQuery, mode: "insensitive" } },
              { id: { contains: searchQuery } }
            ]
          },
          {
            OR: [
              { assigneeId: getUserId(session) },
              { request: { creatorId: getUserId(session) } }
            ]
          }
        ]
      },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        request: {
          select: {
            id: true,
            title: true,
            priority: true
          }
        }
      },
      take: 5,
      orderBy: { createdAt: "desc" }
    });

    // Search users (Admin only)
    let users: any[] = [];
    if ((session.user as any).role === "ADMIN") {
      users = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: searchQuery, mode: "insensitive" } },
            { email: { contains: searchQuery, mode: "insensitive" } }
          ]
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        },
        take: 5
      });
    }

    return NextResponse.json({
      requests,
      tasks,
      users
    });

  } catch (error) {
    console.error("[Search API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}