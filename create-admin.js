const { PrismaClient, Role } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    const user = await prisma.user.upsert({
      where: { email: 'TechBC@gmail.com' },
      update: {
        name: 'TechBC Admin',
        password: hashedPassword,
        role: Role.ADMIN,
        isActive: true,
      },
      create: {
        email: 'TechBC@gmail.com',
        name: 'TechBC Admin',
        password: hashedPassword,
        role: Role.ADMIN,
        isActive: true,
      },
    });
    
    console.log('✅ Admin user created!');
    console.log(`   Email: ${user.email}`);
    console.log(`   Password: 123456`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
