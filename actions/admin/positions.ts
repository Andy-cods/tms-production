'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { Role } from '@prisma/client';

export async function getPositions() {
  const session = await auth();
  
  // Allow authenticated users to view positions
  if (!session?.user) {
    throw new Error('Unauthorized');
  }
  
  const positions = await prisma.position.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      description: true,
      level: true,
    },
    orderBy: [
      { level: 'asc' },
      { name: 'asc' },
    ],
  });
  
  return positions;
}

