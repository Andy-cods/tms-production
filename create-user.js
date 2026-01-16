const { PrismaClient, Role } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const prisma = new PrismaClient();

async function createUser() {
  const email = process.argv[2] || 'staff@demo.com';
  const name = process.argv[3] || 'Staff Demo';
  const password = process.argv[4] || crypto.randomBytes(9).toString('base64url');
  const role = process.argv[5] || 'STAFF';
  
  const hashedPassword = await bcrypt.hash(password, 10);
  
  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: { password: hashedPassword },
      create: {
        email,
        name,
        password: hashedPassword,
        role: Role[role.toUpperCase()],
        isActive: true,
      },
    });
    
    console.log(`✅ User: ${user.email} / Password: ${password}`);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createUser();
