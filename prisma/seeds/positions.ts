// @ts-nocheck
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function seedPositions() {
  console.log('🌱 Seeding positions...')

  const positions = [
    { name: 'Junior Developer', level: 1, description: 'Entry level developer' },
    { name: 'Mid Developer', level: 2, description: 'Mid level developer' },
    { name: 'Senior Developer', level: 3, description: 'Senior developer' },
    { name: 'Tech Lead', level: 4, description: 'Technical team lead' },
    { name: 'Engineering Manager', level: 5, description: 'Engineering manager' },
    { name: 'Junior Designer', level: 1, description: 'Entry level designer' },
    { name: 'Senior Designer', level: 3, description: 'Senior designer' },
    { name: 'Product Manager', level: 4, description: 'Product manager' },
    { name: 'QA Engineer', level: 2, description: 'Quality assurance engineer' },
    { name: 'DevOps Engineer', level: 3, description: 'DevOps engineer' },
  ]

  for (const pos of positions) {
    await prisma.position.upsert({
      where: { name: pos.name },
      update: {},
      create: pos,
    })
  }

  console.log('✅ Positions seeded!')
}

