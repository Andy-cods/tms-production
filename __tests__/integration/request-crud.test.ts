import { prismaMock } from '@/lib/__mocks__/prisma'
import { createRequestAction, updateRequest, deleteRequest } from '@/actions/requests'

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: prismaMock,
}))

// Mock auth
jest.mock('@/lib/auth', () => ({
  auth: jest.fn().mockResolvedValue({
    user: { email: 'test@example.com', id: 'user-1' }
  })
}))

// Mock Logger
jest.mock('@/lib/utils/logger', () => ({
  Logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    captureException: jest.fn(),
  }
}))

// Mock revalidatePath
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

describe('Request CRUD Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createRequest', () => {
    it('creates request successfully with valid data', async () => {
      const mockRequest = {
        id: 'req-1',
        title: 'Test Request',
        description: 'Test description that is long enough to meet validation requirements',
        priority: 'HIGH' as const,
        status: 'OPEN' as const,
        categoryId: 'cat-1',
        creatorId: 'user-1',
        teamId: null,
        deadline: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null,
        isUrgent: false,
        tags: [],
        calculatedScore: null,
        customScores: null,
        impactScore: null,
        priorityReason: null,
        requesterType: 'INTERNAL' as const,
        riskScore: null,
      }

      // Mock user lookup
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      })

      // Mock category lookup
      prismaMock.category.findUnique.mockResolvedValue({
        id: 'cat-1',
        name: 'Test Category',
      })

      // Mock request creation
      prismaMock.request.create.mockResolvedValue(mockRequest)

      // Create FormData
      const formData = new FormData()
      formData.append('title', 'Test Request')
      formData.append('description', 'Test description that is long enough to meet validation requirements')
      formData.append('priority', 'HIGH')
      formData.append('categoryId', 'cat-1')

      const result = await createRequestAction(formData)

      expect(result.ok).toBe(true)
      expect(result.id).toBe('req-1')
      expect(prismaMock.request.create).toHaveBeenCalledTimes(1)
    })

    it('returns error for invalid title (too short)', async () => {
      // Create FormData with invalid title
      const formData = new FormData()
      formData.append('title', 'abc') // Too short (< 5 chars)
      formData.append('description', 'Test description that is long enough')
      formData.append('priority', 'HIGH')
      formData.append('categoryId', 'cat-1')

      const result = await createRequestAction(formData)

      expect(result.ok).toBe(false)
      expect(result.message).toContain('Tiêu đề phải có ít nhất 5 ký tự')
      expect(prismaMock.request.create).not.toHaveBeenCalled()
    })

    it('returns error for invalid description (too short)', async () => {
      // Create FormData with invalid description
      const formData = new FormData()
      formData.append('title', 'Valid Title')
      formData.append('description', 'Short') // Too short (< 20 chars)
      formData.append('priority', 'HIGH')
      formData.append('categoryId', 'cat-1')

      const result = await createRequestAction(formData)

      expect(result.ok).toBe(false)
      expect(result.message).toContain('Mô tả phải có ít nhất 20 ký tự')
      expect(prismaMock.request.create).not.toHaveBeenCalled()
    })
  })

  // Tests will be added next
})
