import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) {
    return Response.json({ count: 0 }, { status: 200 });
  }

  const count = await prisma.task.count({
    where: {
      assigneeId: userId,
      NOT: { status: "DONE" },
    },
  });

  return Response.json({ count }, { status: 200 });
}


