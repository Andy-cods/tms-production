import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import NewTaskForm from "./_components/NewTaskForm";

type Props = { 
  params: Promise<{ id: string }> 
};

export default async function NewTaskPage(props: Props) {
  const { id } = await props.params;
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  const request = await prisma.request.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      teamId: true
    }
  });

  if (!request) {
    redirect("/requests");
  }

  // Get team members for assignee dropdown
  const teamMembers = await prisma.user.findMany({
    where: { 
      teamId: request.teamId,
      isAbsent: false 
    },
    select: {
      id: true,
      name: true,
      email: true
    },
    orderBy: { name: "asc" }
  });

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Tạo nhiệm vụ mới</h1>
        <p className="text-gray-500 mt-2">
          Cho yêu cầu: {request.title}
        </p>
      </div>

      <NewTaskForm
        requestId={request.id}
        teamMembers={teamMembers}
      />
    </div>
  );
}
