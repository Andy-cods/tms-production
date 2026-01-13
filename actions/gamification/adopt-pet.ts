"use server"

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

const PET_TYPES = ['CAT', 'DOG', 'DRAGON', 'UNICORN', 'ROBOT', 'PHOENIX'] as const

type PetType = typeof PET_TYPES[number]

export async function adoptPet(petType: PetType, petName: string) {
  try {
    // 1. Check auth
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // 2. Validate pet type
    if (!PET_TYPES.includes(petType)) {
      return { success: false, error: 'Invalid pet type' }
    }

    // 3. Validate pet name
    if (!petName || petName.trim().length === 0 || petName.length > 20) {
      return { success: false, error: 'Pet name must be 1-20 characters' }
    }

    // 4. Check if user already has pet
    const existingStats = await prisma.userStats.findUnique({
      where: { userId: session.user.id },
      select: { petType: true }
    })

    if (existingStats?.petType) {
      return { success: false, error: 'You already have a pet' }
    }

    // 5. Adopt pet
    const updatedStats = await prisma.userStats.upsert({
      where: { userId: session.user.id },
      update: {
        petType,
        petName: petName.trim(),
        petLevel: 1,
        petExperience: 0,
        petHappiness: 100,
        petLastFed: new Date(),
        petAdoptedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        petType,
        petName: petName.trim(),
        petLevel: 1,
        petExperience: 0,
        petHappiness: 100,
        petLastFed: new Date(),
        petAdoptedAt: new Date(),
      },
    })

    return { 
      success: true, 
      data: {
        petType: updatedStats.petType,
        petName: updatedStats.petName,
        petLevel: updatedStats.petLevel,
      }
    }
  } catch (error) {
    console.error('Error adopting pet:', error)
    return { success: false, error: 'Failed to adopt pet' }
  }
}

