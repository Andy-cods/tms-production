import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TeamManagementClient } from "./_components/team-management-client";

export default async function AdminTeamsPage() {
  const session = await auth();
  
  // RBAC: Only ADMIN
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    redirect("/403");
  }

  // Fetch teams with members and stats
  const teams = await prisma.team.findMany({
    include: {
      members: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
        orderBy: {
          name: "asc",
        },
      },
      _count: {
        select: {
          requests: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  // Fetch all users with LEADER role for dropdown
  const leaders = await prisma.user.findMany({
    where: {
      role: { in: ["LEADER", "ADMIN"] },
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      teamId: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  // Fetch all users for member management
  const allUsers = await prisma.user.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      teamId: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <TeamManagementClient
      teams={teams.map((t) => ({
        ...t,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      }))}
      leaders={leaders}
      allUsers={allUsers}
    />
  );
}

