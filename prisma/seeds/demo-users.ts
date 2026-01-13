// @ts-nocheck
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function seedDemoUsers() {
  console.log("🌱 Seeding demo users...");

  // Get or create a team for demo users
  let demoTeam = await prisma.team.findFirst({
    where: { name: { contains: "Marketing", mode: "insensitive" } },
  });

  if (!demoTeam) {
    // Try to get any team
    demoTeam = await prisma.team.findFirst({
      where: { isActive: true },
    });
  }

  // Hash password for demo users
  const defaultPassword = "123456"; // Simple password for demo
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  // Create Staff user
  const staffUser = await prisma.user.upsert({
    where: { email: "staff@demo.com" },
    update: {
      name: "Nhân viên Demo",
      password: hashedPassword,
      role: Role.STAFF,
      teamId: demoTeam?.id || null,
      isActive: true,
    },
    create: {
      email: "staff@demo.com",
      name: "Nhân viên Demo",
      password: hashedPassword,
      role: Role.STAFF,
      teamId: demoTeam?.id || null,
      isActive: true,
    },
  });
  console.log("✅ Demo Staff user created:", staffUser.email);

  // Create Leader user
  const leaderUser = await prisma.user.upsert({
    where: { email: "leader@demo.com" },
    update: {
      name: "Leader Demo",
      password: hashedPassword,
      role: Role.LEADER,
      teamId: demoTeam?.id || null,
      isActive: true,
    },
    create: {
      email: "leader@demo.com",
      name: "Leader Demo",
      password: hashedPassword,
      role: Role.LEADER,
      teamId: demoTeam?.id || null,
      isActive: true,
    },
  });
  console.log("✅ Demo Leader user created:", leaderUser.email);

  console.log("✅ Demo users seeded successfully!");
  console.log("📝 Demo accounts:");
  console.log(`   - Staff: ${staffUser.email} / Password: ${defaultPassword}`);
  console.log(`   - Leader: ${leaderUser.email} / Password: ${defaultPassword}`);
}

