// @ts-nocheck
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🗑️  Bắt đầu xóa team IT và các yêu cầu cũ...\n");

  try {
    // 1. Tìm team IT
    const itTeam = await prisma.team.findFirst({
      where: { name: "IT" },
    });

    if (!itTeam) {
      console.log("⚠️  Không tìm thấy team IT");
    } else {
      console.log(`✅ Tìm thấy team IT: ${itTeam.id}`);

      // 2. Xóa tất cả requests của team IT
      const itRequests = await prisma.request.findMany({
        where: { teamId: itTeam.id },
        select: { id: true, title: true },
      });

      if (itRequests.length > 0) {
        console.log(`\n📋 Tìm thấy ${itRequests.length} requests của team IT:`);
        itRequests.forEach((req) => {
          console.log(`   - ${req.title} (${req.id})`);
        });

        // Xóa tất cả dữ liệu liên quan đến requests
        for (const req of itRequests) {
          await prisma.$transaction(async (tx) => {
            // Xóa comments
            await tx.comment.deleteMany({
              where: { requestId: req.id },
            });

            // Xóa tasks
            await tx.task.deleteMany({
              where: { requestId: req.id },
            });

            // Xóa attachments
            await tx.attachment.deleteMany({
              where: { requestId: req.id },
            });

            // Xóa notifications
            await tx.notification.deleteMany({
              where: { requestId: req.id },
            });

            // Xóa audit logs
            await tx.auditLog.deleteMany({
              where: { entityId: req.id, entity: "Request" },
            });

            // Xóa escalation logs
            await tx.escalationLog.deleteMany({
              where: { requestId: req.id },
            });

            // Xóa request
            await tx.request.delete({
              where: { id: req.id },
            });
          });
        }

        console.log(`✅ Đã xóa ${itRequests.length} requests của team IT`);
      } else {
        console.log("ℹ️  Không có requests nào của team IT");
      }

      // 3. Xóa categories của team IT
      const itCategories = await prisma.category.findMany({
        where: { teamId: itTeam.id },
        select: { id: true, name: true },
      });

      if (itCategories.length > 0) {
        console.log(`\n📁 Tìm thấy ${itCategories.length} categories của team IT:`);
        itCategories.forEach((cat) => {
          console.log(`   - ${cat.name} (${cat.id})`);
        });

        // Xóa task templates liên quan
        await prisma.taskTemplate.deleteMany({
          where: {
            defaultCategoryId: { in: itCategories.map((c) => c.id) },
          },
        });

        // Xóa categories
        await prisma.category.deleteMany({
          where: { teamId: itTeam.id },
        });

        console.log(`✅ Đã xóa ${itCategories.length} categories của team IT`);
      } else {
        console.log("ℹ️  Không có categories nào của team IT");
      }

      // 4. Kiểm tra users trong team IT
      const itUsers = await prisma.user.findMany({
        where: { teamId: itTeam.id },
        select: { id: true, name: true, email: true },
      });

      if (itUsers.length > 0) {
        console.log(`\n👥 Tìm thấy ${itUsers.length} users trong team IT:`);
        itUsers.forEach((user) => {
          console.log(`   - ${user.name} (${user.email})`);
        });
        console.log("⚠️  Cần chuyển users sang team khác trước khi xóa team");
        
        // Set teamId = null cho các users
        await prisma.user.updateMany({
          where: { teamId: itTeam.id },
          data: { teamId: null },
        });
        console.log(`✅ Đã gỡ teamId cho ${itUsers.length} users`);
      } else {
        console.log("ℹ️  Không có users nào trong team IT");
      }

      // 5. Xóa dashboard metrics
      await prisma.dashboardMetric.deleteMany({
        where: { teamId: itTeam.id },
      });

      // 6. Xóa team IT
      await prisma.team.delete({
        where: { id: itTeam.id },
      });

      console.log(`\n✅ Đã xóa team IT thành công!`);
    }

    // 7. Xóa tất cả requests cũ (không phân biệt team)
    console.log("\n🗑️  Bắt đầu xóa tất cả requests cũ...");
    
    const allRequests = await prisma.request.findMany({
      select: { id: true, title: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    if (allRequests.length > 0) {
      console.log(`📋 Tìm thấy ${allRequests.length} requests tổng cộng`);

      // Xóa tất cả requests và dữ liệu liên quan
      for (const req of allRequests) {
        await prisma.$transaction(async (tx) => {
          // Xóa comments
          await tx.comment.deleteMany({
            where: { requestId: req.id },
          });

          // Xóa tasks
          await tx.task.deleteMany({
            where: { requestId: req.id },
          });

          // Xóa attachments
          await tx.attachment.deleteMany({
            where: { requestId: req.id },
          });

          // Xóa notifications
          await tx.notification.deleteMany({
            where: { requestId: req.id },
          });

          // Xóa audit logs
          await tx.auditLog.deleteMany({
            where: { entityId: req.id, entity: "Request" },
          });

          // Xóa escalation logs
          await tx.escalationLog.deleteMany({
            where: { requestId: req.id },
          });

          // Xóa request
          await tx.request.delete({
            where: { id: req.id },
          });
        });
      }

      console.log(`✅ Đã xóa ${allRequests.length} requests thành công!`);
    } else {
      console.log("ℹ️  Không có requests nào để xóa");
    }

    console.log("\n✅ Hoàn tất!");
  } catch (error) {
    console.error("❌ Lỗi:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

