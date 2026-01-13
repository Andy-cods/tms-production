// @ts-nocheck
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function seedTeamsAndAdmin() {
  console.log("🌱 Seeding Teams and Admin user...");

  // Hash password for admin
  const adminPassword = "123456";
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  // 1. Create Admin user first (needed for templates)
  const adminUser = await prisma.user.upsert({
    where: { email: "TechBC@gmail.com" },
    update: {
      name: "TechBC Admin",
      password: hashedPassword,
      role: Role.ADMIN,
      isActive: true,
    },
    create: {
      email: "TechBC@gmail.com",
      name: "TechBC Admin",
      password: hashedPassword,
      role: Role.ADMIN,
      isActive: true,
    },
  });
  console.log(`✅ Admin user created: ${adminUser.email} / Password: ${adminPassword}`);

  // 2. Create Teams
  // Note: Names must match what template files and import-employees are looking for
  const teams = [
    {
      name: "Phòng Marketing",
      description: "Phòng Marketing - Thiết kế, Content, Ads và Planning",
    },
    {
      name: "Phòng Chăm sóc khách hàng",
      description: "Phòng Chăm sóc khách hàng - Quản lý nền tảng, vận hành và phát triển sản phẩm, dịch vụ",
    },
    {
      name: "Phòng Hành chính nhân sự",
      description: "Phòng Hành chính nhân sự - Tuyển dụng, đào tạo, quản lý nhân sự và hành chính",
    },
    {
      name: "Phòng Kế toán",
      description: "Phòng Kế toán - Kế toán, thuế và báo cáo kế toán",
    },
    {
      name: "Phòng IT",
      description: "Phòng Công nghệ thông tin - Phát triển phần mềm, bảo trì hệ thống và hỗ trợ kỹ thuật",
    },
    {
      name: "Phòng Kinh doanh",
      description: "Phòng Kinh doanh - Bán hàng, Account và phát triển khách hàng",
    },
    {
      name: "Ban Giám đốc",
      description: "Ban Giám đốc - Điều hành và quản lý công ty",
    },
  ];

  const createdTeams = [];
  for (const teamData of teams) {
    const team = await prisma.team.upsert({
      where: { name: teamData.name },
      update: {
        description: teamData.description,
        isActive: true,
      },
      create: {
        name: teamData.name,
        description: teamData.description,
        isActive: true,
      },
    });
    createdTeams.push(team);
    console.log(`✅ Team created: ${team.name}`);
  }

  console.log(`✅ Created ${createdTeams.length} teams`);
  console.log("✅ Teams and Admin seeding completed!");
  
  return { adminUser, teams: createdTeams };
}

