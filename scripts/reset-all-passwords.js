// Script to reset all user passwords to format: employeeId@123
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Employee mapping: email -> employeeId
// This should match the data in prisma/seeds/import-employees.ts
const employeeMap = {
  "an@bcagency.vn": "S01",
  "nam@bcagency.vn": "TE99",
  "hoantd@bcagency.vn": "TE03",
  "hoangtv@bcagency.vn": "TE04",
  "myntt@bcagency.vn": "CS02",
  "toannm@bcagency.vn": "S03",
  "quangtx@bcagency.vn": "S08",
  "dungttk@bcagency.vn": "S09",
  "ngocpm@bcagency.vn": "S12",
  "hanhltm@bcagency.vn": "HR01",
  "tranghtt@bcagency.vn": "S20",
  "sonvh@bcagency.vn": "TE06",
  "tramth@bcagency.vn": "TE07",
  "trangnp@bcagency.vn": "HR04",
  "xoandt@bcagency.vn": "KT03",
  "thangnt@bcagency.vn": "A10",
  "phucdt@bcagency.vn": "A22",
  "vuda@bcagency.vn": "S26",
  "linhpk@bcagency.vn": "A28",
};

async function resetAllPasswords() {
  try {
    console.log('\n🔄 Bắt đầu reset mật khẩu cho tất cả users...\n');

    // Get all users from database
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
      orderBy: {
        email: 'asc',
      },
    });

    if (users.length === 0) {
      console.log('⚠️  Không tìm thấy user nào trong database!');
      return;
    }

    console.log(`📊 Tìm thấy ${users.length} users trong database\n`);

    let updated = 0;
    let skipped = 0;
    const results = [];

    for (const user of users) {
      const employeeId = employeeMap[user.email.toLowerCase()];

      if (!employeeId) {
        console.log(`⚠️  Skip: ${user.email} - Không tìm thấy employeeId`);
        skipped++;
        results.push({
          email: user.email,
          name: user.name,
          status: 'SKIPPED',
          reason: 'Không có trong danh sách employee',
        });
        continue;
      }

      // Generate password: employeeId@123
      const newPassword = `${employeeId}@123`;
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await prisma.user.update({
        where: { email: user.email },
        data: {
          password: hashedPassword,
        },
      });

      console.log(`✅ ${user.email} (${user.name}) -> Password: ${newPassword}`);
      updated++;
      results.push({
        email: user.email,
        name: user.name,
        employeeId: employeeId,
        password: newPassword,
        status: 'UPDATED',
      });
    }

    // Summary
    console.log('\n' + '═'.repeat(80));
    console.log('📊 TỔNG KẾT:');
    console.log('═'.repeat(80));
    console.log(`   ✅ Đã cập nhật: ${updated} users`);
    console.log(`   ⚠️  Đã bỏ qua: ${skipped} users`);
    console.log('═'.repeat(80));

    // Show updated users
    if (results.filter(r => r.status === 'UPDATED').length > 0) {
      console.log('\n📋 DANH SÁCH USERS ĐÃ CẬP NHẬT:\n');
      results
        .filter(r => r.status === 'UPDATED')
        .forEach((r, index) => {
          console.log(`${index + 1}. ${r.email}`);
          console.log(`   - Name: ${r.name}`);
          console.log(`   - Employee ID: ${r.employeeId}`);
          console.log(`   - Password: ${r.password}`);
          console.log('');
        });
    }

    // Show skipped users
    if (results.filter(r => r.status === 'SKIPPED').length > 0) {
      console.log('\n⚠️  DANH SÁCH USERS BỊ BỎ QUA:\n');
      results
        .filter(r => r.status === 'SKIPPED')
        .forEach((r, index) => {
          console.log(`${index + 1}. ${r.email} - ${r.reason}`);
        });
      console.log('');
    }

    console.log('✅ Hoàn tất! Tất cả users có thể đăng nhập với mật khẩu: <employeeId>@123\n');

  } catch (error) {
    console.error('\n❌ Lỗi:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetAllPasswords();

