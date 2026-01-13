import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminCategoriesClient } from "./_components/AdminCategoriesClient";

export default async function AdminCategoriesPage() {
  const session = await auth();

  if (!session?.user || (session.user as any).role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Get categories (flat list)
  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      isActive: true,
      teamId: true,
    },
    orderBy: [{ name: "asc" }],
  });

  // Get all teams
  const teams = await prisma.team.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: "asc" },
  });

  // Get flat list for parent selection
  const allCategories = await prisma.category.findMany({
    select: { id: true, name: true, teamId: true },
    orderBy: { name: "asc" },
  });

  return (
    <AdminCategoriesClient
      categories={categories as any}
      teams={teams}
      allCategories={allCategories}
    />
  );
}


