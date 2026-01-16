import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProfileClient } from "./_components/ProfileClient";
import { decryptPII } from "@/lib/security/crypto";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userId = (session.user as any).id;

  // Get user with stats
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      telegramUsername: true,
      twoFactorEnabled: true,
      team: {
        select: {
          id: true,
          name: true,
        },
      },
      stats: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  // Ensure stats exist (create if missing)
  if (!user.stats) {
    await prisma.userStats.create({
      data: {
        userId,
        level: 1,
        experiencePoints: 0,
        totalTasksCompleted: 0,
        onTimeCompletions: 0,
        lateCompletions: 0,
        currentStreak: 0,
        longestStreak: 0,
        slaCompliantCount: 0,
        slaViolationCount: 0,
        totalTimeTrackedSeconds: 0,
        avgCompletionDays: 0,
      },
    });

    // Reload user
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        telegramUsername: true,
        twoFactorEnabled: true,
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        stats: true,
      },
    });
    const decryptedUser = {
      ...updatedUser!,
      phone: decryptPII(updatedUser?.phone ?? null),
      telegramUsername: decryptPII(updatedUser?.telegramUsername ?? null),
    };
    return <ProfileClient user={decryptedUser} />;
  }
  const decryptedUser = {
    ...user,
    phone: decryptPII(user.phone ?? null),
    telegramUsername: decryptPII(user.telegramUsername ?? null),
  };
  return <ProfileClient user={decryptedUser} />;
}
