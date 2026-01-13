const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  console.log('=== DATABASE URL ===');
  console.log(process.env.DATABASE_URL?.substring(0, 50) + '...');
  
  console.log('\n=== CHECKING COLUMNS ===');
  try {
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'requests' 
      AND column_name IN ('acceptedAt', 'acceptedBy')
      ORDER BY column_name;
    `;
    console.log('Columns found:', JSON.stringify(result, null, 2));
    
    if (result.length === 0) {
      console.log('\n❌ Columns acceptedAt/acceptedBy NOT FOUND!');
      console.log('Need to add columns to database.');
    } else {
      console.log('\n✅ Columns exist in database');
    }
    
    // Test query
    console.log('\n=== TEST QUERY ===');
    const test = await prisma.request.findFirst({
      select: { id: true, acceptedAt: true, acceptedBy: true }
    });
    console.log('Query result:', test);
    console.log('\n✅ Query successful!');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
