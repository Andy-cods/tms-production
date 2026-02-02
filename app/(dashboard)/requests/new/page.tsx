import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import NewRequestWizard from "@/components/forms/new-request-wizard";

export default async function NewRequestPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // Lấy thông tin user hiện tại để biết teamId
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { teamId: true },
  });

  const [categories, teams] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true, teamId: true },
      orderBy: { name: "asc" },
    }),
    prisma.team.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <NewRequestWizard
      categories={categories.map((c) => ({
        id: c.id,
        name: c.name,
        teamId: c.teamId ?? undefined,
      }))}
      teams={teams}
      currentUserTeamId={currentUser?.teamId}
    />
  );
}