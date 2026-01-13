// @ts-nocheck
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedITTeam() {
  console.log("🌱 Seeding IT team...");

  // Get or create IT team
  let itTeam = await prisma.team.findFirst({
    where: { 
      OR: [
        { name: "IT" },
        { name: "Phòng IT" },
        { name: { contains: "IT", mode: "insensitive" } }
      ]
    },
  });

  if (!itTeam) {
    itTeam = await prisma.team.create({
      data: {
        name: "Phòng IT",
        description: "Phòng Công nghệ thông tin - Phát triển phần mềm, bảo trì hệ thống và hỗ trợ kỹ thuật",
        isActive: true,
      },
    });
    console.log(`✅ IT team created: ${itTeam.name}`);
  } else {
    console.log(`✅ IT team found: ${itTeam.name}`);
  }

  // Get or create IT category
  let itCategory = await prisma.category.findFirst({
    where: { 
      name: { contains: "IT", mode: "insensitive" },
      teamId: itTeam.id 
    },
  });

  if (!itCategory) {
    itCategory = await prisma.category.create({
      data: {
        name: "IT - Hỗ trợ kỹ thuật",
        description: "Các công việc liên quan đến phát triển phần mềm, bảo trì hệ thống và hỗ trợ kỹ thuật",
        teamId: itTeam.id,
        estimatedDuration: 24,
      },
    });
    console.log(`✅ IT category created: ${itCategory.name}`);
  }

  return { itTeam, itCategory };
}

