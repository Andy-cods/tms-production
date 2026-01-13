import { PrismaClient } from '@prisma/client'
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended'

// Create deep mock of PrismaClient with full type safety
const prismaMock = mockDeep<PrismaClient>()

// Reset all mocks before each test to ensure clean state
beforeEach(() => {
  mockReset(prismaMock)
})

// Export the mock for use in tests
export { prismaMock }

// Export the type for TypeScript support
export type PrismaMock = DeepMockProxy<PrismaClient>
