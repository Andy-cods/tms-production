const { PrismaClient, Role } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const password = crypto.randomBytes(9).toString('base64url');
    const hashedPassword = await bcrypt.hash(password, 10);
    
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
    console.log(`   Password: ${password}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
