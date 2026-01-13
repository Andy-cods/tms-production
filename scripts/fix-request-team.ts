// scripts/fix-request-team.ts
import { PrismaClient } from "@prisma/client";

type Args = { dryRun: boolean; limit?: number };

function parseArgs(): Args {
  const a = process.argv.slice(2);
  const dryRun = a.includes("--dry-run");
  const limitArg = a.find((x) => x.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : undefined;
  return { dryRun, limit };
}

const prisma = new PrismaClient();

async function main() {
  const { dryRun, limit } = parseArgs();

  console.log("=== Fix Request.teamId (backfill) ===");
  console.log("DATABASE_URL:", process.env.DATABASE_URL ? "[set]" : "[MISSING]");
  console.log("Mode:", dryRun ? "DRY-RUN (no writes)" : "WRITE");
  if (limit) console.log("Limit:", limit);

  // Tìm các request chưa gán teamId
  const requests = await prisma.request.findMany({
    where: { teamId: null },
    take: limit,
    select: {
      id: true,
      title: true,
      creatorId: true,
      teamId: true,
      category: { select: { id: true, name: true, teamId: true } },
      creator: { select: { id: true, email: true, teamId: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  if (requests.length === 0) {
    console.log("No requests need fixing. ✅");
    return;
  }

  console.log(`Found ${requests.length} request(s) with teamId = NULL.`);

  let fixed = 0;
  const unresolved: Array<{
    id: string;
    title: string;
    categoryId?: string | null;
    categoryTeam?: string | null;
    creatorId: string;
    creatorTeam?: string | null;
  }> = [];

  for (const r of requests) {
    const effectiveTeamId = r.teamId ?? r.category?.teamId ?? r.creator?.teamId ?? null;

    if (!effectiveTeamId) {
      unresolved.push({
        id: r.id,
        title: r.title,
        categoryId: r.category?.id,
        categoryTeam: r.category?.teamId ?? null,
        creatorId: r.creatorId,
        creatorTeam: r.creator?.teamId ?? null,
      });
      continue;
    }

    if (dryRun) {
      console.log(`[DRY] would update request ${r.id} -> teamId=${effectiveTeamId}`);
      fixed++;
      continue;
    }

    await prisma.request.update({
      where: { id: r.id },
      data: { teamId: effectiveTeamId },
    });
    console.log(`Updated request ${r.id} -> teamId=${effectiveTeamId}`);
    fixed++;
  }

  console.log("---- Summary ----");
  console.log("Updated (or would update in dry-run):", fixed);
  console.log("Unresolved (need manual review):", unresolved.length);
  if (unresolved.length) {
    console.table(unresolved);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
