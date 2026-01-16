import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { EditUserForm } from "./_components/EditUserForm";
import { decryptPII } from "@/lib/security/crypto";

export default async function UserEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      team: true,
    },
  });

  if (!user) {
    notFound();
  }
  const decryptedUser = {
    ...user,
    phone: decryptPII(user.phone ?? null),
    telegramUsername: decryptPII(user.telegramUsername ?? null),
  };

  const teams = await prisma.team.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Chỉnh sửa người dùng
        </h1>
        <p className="text-gray-600 mt-1">
          Cập nhật thông tin của {user.name}
        </p>
      </div>

      <EditUserForm
        user={decryptedUser}
        teams={teams}
        positions={[]}
      />
    </div>
  );
}

