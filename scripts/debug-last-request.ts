import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const request = await prisma.request.findFirst({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      createdFromTemplateId: true,
      template: {
        select: {
          id: true,
          name: true,
          checklistItems: {
            select: {
              id: true,
              title: true,
              description: true,
              order: true,
            },
          },
        },
      },
    },
  });

  console.dir(request, { depth: null });
}

main()
  .catch((error) => {
    console.error(error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


