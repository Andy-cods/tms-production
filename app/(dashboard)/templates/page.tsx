import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TemplatesClient } from "./_components/TemplatesClient";

export const metadata = {
  title: "Template Library | TMS",
};

export default async function TemplatesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as any)?.role;
  if (role !== "ADMIN") {
    redirect("/403");
  }

  // Get all templates (public + user's private)
  const [templates, categories, teams] = await Promise.all([
    prisma.taskTemplate.findMany({
    where: {
      OR: [{ isPublic: true }, { createdById: session.user.id }],
    },
    include: {
      defaultCategory: {
        select: {
          id: true,
          name: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
      checklistItems: {
        orderBy: {
          order: "asc",
        },
      },
      _count: {
        select: {
          checklistItems: true,
        },
      },
    },
    orderBy: [{ usageCount: "desc" }, { createdAt: "desc" }],
    }),
    prisma.category.findMany({
      orderBy: {
        name: "asc",
      },
    }),
    prisma.team.findMany({
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
      },
    }),
  ]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Template Library</h1>
        <p className="text-gray-600 mt-1">
          Tạo tasks nhanh chóng từ templates có sẵn
        </p>
      </div>

      <TemplatesClient
        templates={templates.map((t) => ({
          ...t,
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString(),
          lastUsedAt: t.lastUsedAt?.toISOString() || null,
          checklistItems: t.checklistItems.map((item) => ({
            ...item,
            createdAt: item.createdAt.toISOString(),
            updatedAt: item.updatedAt.toISOString(),
          })),
        }))}
        categories={categories}
        teams={teams}
        currentUserId={(session.user as any).id as string}
      />
    </div>
  );
}
