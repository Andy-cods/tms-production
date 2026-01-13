// @ts-nocheck
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🗑️  Deleting all requests and related data...");

  try {
    // Count before deletion
    const requestCount = await prisma.request.count();
    const taskCount = await prisma.task.count();
    const commentCount = await prisma.comment.count();
    const attachmentCount = await prisma.attachment.count();

    console.log(`Found:`);
    console.log(`   - ${requestCount} requests`);
    console.log(`   - ${taskCount} tasks`);
    console.log(`   - ${commentCount} comments`);
    console.log(`   - ${attachmentCount} attachments`);

    if (requestCount === 0) {
      console.log("✅ No requests to delete.");
      return;
    }

    // Delete in transaction to ensure data integrity
    await prisma.$transaction(async (tx) => {
      // Delete tasks first (they reference requests)
      const deletedTasks = await tx.task.deleteMany({});
      console.log(`✅ Deleted ${deletedTasks.count} tasks`);

      // Delete comments (they reference requests)
      const deletedComments = await tx.comment.deleteMany({});
      console.log(`✅ Deleted ${deletedComments.count} comments`);

      // Delete attachments (they reference requests)
      const deletedAttachments = await tx.attachment.deleteMany({});
      console.log(`✅ Deleted ${deletedAttachments.count} attachments`);

      // Delete escalation logs (they reference requests)
      const deletedEscalations = await tx.escalationLog.deleteMany({});
      console.log(`✅ Deleted ${deletedEscalations.count} escalation logs`);

      // Delete audit logs related to requests
      const deletedAuditLogs = await tx.auditLog.deleteMany({
        where: {
          entity: "Request",
        },
      });
      console.log(`✅ Deleted ${deletedAuditLogs.count} audit logs`);

      // Delete notifications related to requests
      const deletedNotifications = await tx.notification.deleteMany({
        where: {
          requestId: { not: null },
        },
      });
      console.log(`✅ Deleted ${deletedNotifications.count} notifications`);

      // Finally, delete all requests
      const deletedRequests = await tx.request.deleteMany({});
      console.log(`✅ Deleted ${deletedRequests.count} requests`);
    });

    console.log("\n✅ All requests and related data deleted successfully!");
  } catch (error) {
    console.error("❌ Error deleting requests:", error);
    throw error;
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
