import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TemplateBuilder } from "@/components/templates/template-builder";

export default async function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Request templates are not supported in current schema
  notFound();

  const categories: any[] = [];

  return (
    <div className="p-6 space-y-6">
      <div />
    </div>
  );
}
