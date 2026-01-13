// Script to view all users in the database
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function viewUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        positionText: true,
        isActive: true,
        team: {
          select: {
            name: true,
          },
        },
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('\n📊 DANH SÁCH USERS TRONG DATABASE:\n');
    console.log('═'.repeat(120));
    console.log(
      'Email'.padEnd(35) +
      '| Name'.padEnd(30) +
      '| Role'.padEnd(12) +
      '| Team'.padEnd(20) +
      '| Status'.padEnd(10) +
      '| Password (hash)'
    );
    console.log('═'.repeat(120));

    users.forEach((user) => {
      const email = (user.email || '').padEnd(35);
      const name = (user.name || '').padEnd(30);
      const role = (user.role || '').padEnd(12);
      const team = (user.team?.name || 'N/A').padEnd(20);
      const status = (user.isActive ? '✅ Active' : '❌ Inactive').padEnd(10);
      const password = user.password ? user.password.substring(0, 30) + '...' : 'N/A';

      console.log(`${email}| ${name}| ${role}| ${team}| ${status}| ${password}`);
    });

    console.log('═'.repeat(120));
    console.log(`\n📈 Tổng số: ${users.length} users\n`);

    // Summary by role
    const roleCount = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});

    console.log('📊 Phân bổ theo Role:');
    Object.entries(roleCount).forEach(([role, count]) => {
      console.log(`   - ${role}: ${count}`);
    });

    // Detailed view with full password
    console.log('\n\n📋 CHI TIẾT TỪNG USER (với mật khẩu đầy đủ):\n');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   - Role: ${user.role}`);
      console.log(`   - Team: ${user.team?.name || 'N/A'}`);
      console.log(`   - Status: ${user.isActive ? '✅ Active' : '❌ Inactive'}`);
      console.log(`   - Password (hash): ${user.password}`);
      console.log(`   - Created: ${user.createdAt}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

viewUsers();

