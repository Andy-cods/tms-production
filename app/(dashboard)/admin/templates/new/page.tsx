import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TemplateBuilder } from "@/components/templates/template-builder";

export default async function NewTemplatePage() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    redirect("/dashboard");
  }

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create Template</h1>
        <p className="text-sm text-gray-500 mt-1">Build custom request template with fields</p>
      </div>

      <TemplateBuilder 
        categories={categories as any} 
      />
    </div>
  );
}


