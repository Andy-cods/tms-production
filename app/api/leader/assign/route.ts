import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Role, TaskStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id as string;
    const userRole = (session.user as any).role as Role;

    if (userRole !== Role.ADMIN && userRole !== Role.LEADER) {
      return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    }

    const { requestId, assigneeId } = await request.json();

    if (!requestId || !assigneeId) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    const requestRecord = await prisma.request.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        title: true,
        teamId: true,
      },
    });

    if (!requestRecord) {
      return NextResponse.json({ error: "Không tìm thấy yêu cầu" }, { status: 404 });
    }

    const assignee = await prisma.user.findUnique({
      where: { id: assigneeId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        teamId: true,
      },
    });

    if (!assignee || assignee.role !== Role.STAFF) {
      return NextResponse.json({ error: "Người được phân công không hợp lệ" }, { status: 400 });
    }

    if (userRole === Role.LEADER) {
      const leader = await prisma.user.findUnique({
        where: { id: userId },
        select: { teamId: true },
      });

      if (!leader?.teamId) {
        return NextResponse.json({ error: "Leader chưa thuộc phòng ban" }, { status: 400 });
      }

      if (requestRecord.teamId && requestRecord.teamId !== leader.teamId) {
        return NextResponse.json({ error: "Leader chỉ được phân công yêu cầu trong phòng ban của mình" }, { status: 403 });
      }

      if (assignee.teamId !== leader.teamId) {
        return NextResponse.json({ error: "Không thể phân công nhân sự ngoài phòng ban" }, { status: 403 });
      }
    }

    const existingTask = await prisma.task.findFirst({
      where: { requestId },
      orderBy: { createdAt: "asc" },
    });

    const task = existingTask
      ? await prisma.task.update({
          where: { id: existingTask.id },
          data: {
            assigneeId,
            status: TaskStatus.TODO,
          },
        })
      : await prisma.task.create({
          data: {
            title: requestRecord.title ?? `Task for request ${requestId}`,
            requestId,
            assigneeId,
            status: TaskStatus.TODO,
          },
        });

    revalidatePath("/leader");
    revalidatePath(`/requests/${requestId}`);

    return NextResponse.json({ success: true, task });
    
  } catch (error) {
    console.error("[POST /api/leader/assign] Error:", error);
    return NextResponse.json(
      { error: "Failed to assign" },
      { status: 500 }
    );
  }
}


