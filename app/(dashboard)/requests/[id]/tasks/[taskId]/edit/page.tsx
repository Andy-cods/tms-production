import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { EditTaskForm } from "./_components/EditTaskForm";

interface Props {
  params: Promise<{ id: string; taskId: string }>;
}

export default async function EditTaskPage(props: Props) {
  const { id, taskId } = await props.params;
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id as string;
  const userRole = (session.user as any).role;

  // Get task with request info
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      request: {
        select: {
          id: true,
          title: true,
          creatorId: true,
          teamId: true,
          team: {
            select: {
              id: true,
              name: true,
              leaderId: true,
              members: {
                where: { isActive: true },
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
                orderBy: { name: "asc" },
              },
            },
          },
        },
      },
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!task) {
    notFound();
  }

  // Verify task belongs to request
  if (task.requestId !== id) {
    notFound();
  }

  // RBAC: Admin, Leader of the team, Request creator, or Assignee can edit
  const isAdmin = userRole === "ADMIN";
  const isLeader = task.request.team?.leaderId === userId;
  const isCreator = task.request.creatorId === userId;
  const isAssignee = task.assigneeId === userId;

  if (!isAdmin && !isLeader && !isCreator && !isAssignee) {
    redirect("/403");
  }

  const isFixedTask = !!task.createdFromTemplateId;
  const teamMembers = task.request.team?.members || [];

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Chỉnh sửa nhiệm vụ
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {isFixedTask
              ? "Nhiệm vụ cố định: Chỉ có thể chỉnh sửa nội dung, không thể chỉnh sửa thời gian"
              : "Nhiệm vụ tùy chọn: Có thể chỉnh sửa đầy đủ thông tin. Nếu có thay đổi về thời gian, Leader sẽ được thông báo."}
          </p>
        </div>

        <EditTaskForm
          task={{
            id: task.id,
            title: task.title,
            description: task.description,
            deadline: task.deadline,
            assigneeId: task.assigneeId,
            createdFromTemplateId: task.createdFromTemplateId,
          }}
          requestId={id}
          teamMembers={teamMembers}
          isFixedTask={isFixedTask}
        />
      </div>
    </div>
  );
}

