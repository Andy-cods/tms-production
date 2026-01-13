const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function main() {
  try {
    console.log('🔍 Testing database connection...');
    console.log('📍 DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@'));
    
    // Test connection
    const result = await prisma.$queryRaw`SELECT NOW() as current_time, version() as version`;
    console.log('✅ Database connected successfully!');
    console.log('⏰ Current time:', result[0].current_time);
    console.log('🗄️  PostgreSQL version:', result[0].version.split(',')[0]);
    
    // Count records
    const [userCount, requestCount, taskCount] = await Promise.all([
      prisma.user.count(),
      prisma.request.count(),
      prisma.task.count(),
    ]);
    
    console.log('\n📊 Database Statistics:');
    console.log(`   👥 Users: ${userCount}`);
    console.log(`   📋 Requests: ${requestCount}`);
    console.log(`   ✅ Tasks: ${taskCount}`);
    
    console.log('\n✨ Database connection test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Database connection failed!');
    console.error('Error:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Check if PostgreSQL is running: docker ps');
    console.error('   2. Verify DATABASE_URL in .env.local');
    console.error('   3. Run: npx prisma db push');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

