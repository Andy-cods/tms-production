import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TemplateLibraryClient } from "./_components/TemplateLibraryClient";

export default async function TemplatesPage() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [templates, categories] = await Promise.all([
    prisma.taskTemplate.findMany({
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
            requests: true,
            checklistItems: true,
          },
        },
      },
      orderBy: [
        { usageCount: "desc" },
        { createdAt: "desc" },
      ],
    }),
    prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="p-6">
      <TemplateLibraryClient 
        templates={templates} 
        categories={categories.map(c => ({ id: c.id, name: c.name }))} 
      />
    </div>
  );
}


