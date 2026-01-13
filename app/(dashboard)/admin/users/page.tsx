import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModernUserTable } from "./_components/ModernUserTable";
import { AdminUsersClient } from "./_components/AdminUsersClient";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  
  // RBAC: Only ADMIN
  if (!session?.user || (session.user as any).role !== Role.ADMIN) {
    redirect("/403");
  }

  const sp = await searchParams;
  const search = typeof sp.q === "string" ? sp.q : "";
  const roleFilter = typeof sp.role === "string" ? sp.role : "all";
  const statusFilter = typeof sp.status === "string" ? sp.status : "all";
  const positionFilter = typeof sp.position === "string" ? sp.position : "all";

  // Build where clause
  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  if (roleFilter && roleFilter !== "all") {
    // Validate roleFilter is a valid Role enum value
    if (Object.values(Role).includes(roleFilter as Role)) {
      where.role = roleFilter as Role;
    }
  }

  if (statusFilter === "active") {
    where.isActive = true;
  } else if (statusFilter === "inactive") {
    where.isActive = false;
  }

  // position filtering not supported in schema

  // Fetch users
  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      positionText: true,
      phone: true,
      telegramUsername: true,
      isActive: true,
      createdAt: true,
      team: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Fetch teams for dropdown
  const teams = await prisma.team.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  // Get unique positions for filter
  const positions: string[] = [];

  return (
    <AdminUsersClient
      users={users}
      teams={teams}
      positions={positions}
      initialSearch={search}
      initialRoleFilter={roleFilter}
      initialStatusFilter={statusFilter}
      initialPositionFilter={positionFilter}
    />
  );
}

