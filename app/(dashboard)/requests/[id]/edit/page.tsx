import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EditRequestForm } from "./_components/EditRequestForm";
import { Role } from "@prisma/client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditRequestPage(props: Props) {
  const { id } = await props.params;
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userId = (session.user as any).id as string;
  const userRole = (session.user as any).role as Role;

  // Fetch request with related data
  const request = await prisma.request.findUnique({
    where: { id },
    include: {
      category: {
        select: { id: true, name: true, teamId: true },
      },
      team: {
        select: { id: true, name: true, leaderId: true },
      },
      creator: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!request) {
    notFound();
  }

  // Permission check: Admin, Leader của team, hoặc creator
  const isAdmin = userRole === Role.ADMIN;
  const isLeader = userRole === Role.LEADER && request.team?.leaderId === userId;
  const isCreator = request.creatorId === userId;

  if (!isAdmin && !isLeader && !isCreator) {
    redirect("/requests");
  }

  // Fetch categories and teams for form
  const [categories, teams] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, teamId: true },
    }),
    prisma.team.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  // Determine if this is a catalog request
  const isCatalogRequest = !!request.createdFromTemplateId;

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Chỉnh sửa yêu cầu
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {isCatalogRequest 
              ? "Yêu cầu theo catalog: Chỉ có thể chỉnh sửa tiêu đề và nội dung" 
              : "Yêu cầu tùy chỉnh: Có thể chỉnh sửa đầy đủ thông tin"}
          </p>
        </div>

        <EditRequestForm
          request={request}
          categories={categories}
          teams={teams}
          isCatalogRequest={isCatalogRequest}
        />
      </div>
    </div>
  );
}

