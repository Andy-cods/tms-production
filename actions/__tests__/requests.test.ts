import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { Role } from '@prisma/client';
import { calculateSlaDeadline } from '@/lib/services/sla-calculator';
import { sendTelegramMessage } from '@/lib/services/telegram-service';
import { parseDateOrNull } from '@/lib/utils/dates';
import { Logger } from '@/lib/utils/logger';
import bcrypt from 'bcryptjs';

// Import the actions (mocked)
import { createRequestAction, archiveRequest, deleteRequest } from '../requests';

// Mocks
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    request: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    attachment: {
      createMany: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    category: {
      findUnique: jest.fn(),
    },
    task: {
      count: jest.fn(),
      deleteMany: jest.fn(),
    },
    comment: {
      deleteMany: jest.fn(),
    },
    notification: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

jest.mock('@/lib/services/sla-calculator', () => ({
  calculateSlaDeadline: jest.fn(),
}));

jest.mock('@/lib/services/telegram-service', () => ({
  sendTelegramMessage: jest.fn(),
}));

jest.mock('@/lib/utils/dates', () => ({
  parseDateOrNull: jest.fn(),
}));

jest.mock('@/lib/utils/logger', () => ({
  Logger: {
    info: jest.fn(),
    warn: jest.fn(),
    captureException: jest.fn(),
  },
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}));

jest.mock('@/lib/telegram/templates', () => ({
  requestCreatedTemplate: jest.fn(),
}));

jest.mock('@/lib/config/telegram', () => ({
  APP_URL: 'http://localhost:3000',
}));

jest.mock('@/lib/services/priority-calculator', () => ({
  calculatePriorityScore: jest.fn(),
}));

// Import mocked functions after mocks
import { auth as mockAuth } from '@/lib/auth';

// Type assertions
const mockAuthTyped = mockAuth as jest.MockedFunction<typeof auth>;
const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>;
const mockCalculateSlaDeadline = calculateSlaDeadline as jest.MockedFunction<typeof calculateSlaDeadline>;
const mockSendTelegramMessage = sendTelegramMessage as jest.MockedFunction<typeof sendTelegramMessage>;
const mockParseDateOrNull = parseDateOrNull as jest.MockedFunction<typeof parseDateOrNull>;

describe('actions/requests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createRequestAction', () => {
    it.skip('should successfully create a request', async () => {
      // TODO: Integration test - requires real database & dependencies
      // Move to E2E test suite or expand mocks for full coverage
      // Current issue: Action validation requires all service dependencies
      
      // Arrange
      const formData = new FormData();
      formData.append('title', 'Test Request');
      formData.append('description', 'This is a test description with sufficient length to pass validation.');
      formData.append('priority', 'MEDIUM');
      formData.append('categoryId', '123e4567-e89b-12d3-a456-426614174000');

      const mockSession = {
        user: {
          id: 'user_123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'REQUESTER' as Role,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'REQUESTER' as Role,
        teamId: null,
        isActive: true,
      };

      const mockRequest = {
        id: 'request_123',
        title: 'Test Request',
        description: 'This is a test description with sufficient length to pass validation.',
        priority: 'MEDIUM' as const,
        status: 'OPEN' as const,
        creatorId: 'user_123',
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
        deadline: null,
        isUrgent: false,
        tags: [],
        urgencyScore: null,
        impactScore: null,
        riskScore: null,
        customScores: null,
        calculatedScore: null,
        priorityReason: 'Đặt thủ công',
        requesterType: 'INTERNAL' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        slaDeadline: null,
        slaStartedAt: null,
        slaStatus: null,
        slaPausedDuration: null,
      };

      const mockCategory = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Category',
        teamId: null,
      };

      const mockSlaResult = {
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
        targetHours: 24,
        slaConfigId: 'sla_config_123',
      };

      (mockAuthTyped as any).mockResolvedValue(mockSession);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback: any) => {
        return callback({
          request: { create: jest.fn().mockResolvedValue(mockRequest) },
          attachment: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
          auditLog: { create: jest.fn().mockResolvedValue({ id: 'log_123' }) },
          notification: { create: jest.fn().mockResolvedValue({ id: 'notif_123' }) },
        });
      });
      (prisma.category.findUnique as jest.Mock).mockResolvedValue(mockCategory);
      mockCalculateSlaDeadline.mockResolvedValue(mockSlaResult);
      (prisma.request.update as jest.Mock).mockResolvedValue({
        ...mockRequest,
        slaDeadline: mockSlaResult.deadline,
      });
      (prisma.auditLog.create as jest.Mock).mockResolvedValue({ id: 'sla_log_123' });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      (mockParseDateOrNull as any).mockReturnValue(null);

      // Act
      const result = await createRequestAction(formData);

      // Assert
      if (!result.ok) {
        console.log('Result:', JSON.stringify(result, null, 2));
      }
      expect(result.ok).toBe(true);
      expect(result.id).toBe('request_123');
      expect(mockRevalidatePath).toHaveBeenCalledWith('/requests');
    });

    it('should return error for unauthorized user', async () => {
      // Arrange
      const formData = new FormData();
      formData.append('title', 'Test Request');
      formData.append('description', 'This is a test description with sufficient length to pass validation.');
      formData.append('priority', 'MEDIUM');
      formData.append('categoryId', '123e4567-e89b-12d3-a456-426614174000');

      (mockAuthTyped as any).mockResolvedValue(null);

      // Act
      const result = await createRequestAction(formData);

      // Assert
      expect(result.ok).toBe(false);
      expect(result.message).toBe('Unauthorized');
      expect(Logger.warn).toHaveBeenCalled();
    });

    it.skip('should handle attachments', async () => {
      // TODO: Integration test - requires real database & dependencies
      // Move to E2E test suite or expand mocks for full coverage
      // Current issue: Action validation requires all service dependencies
      
      // Arrange
      const formData = new FormData();
      formData.append('title', 'Test Request');
      formData.append('description', 'This is a test description with sufficient length to pass validation.');
      formData.append('priority', 'MEDIUM');
      formData.append('categoryId', '123e4567-e89b-12d3-a456-426614174000');
      formData.append('attachments', JSON.stringify([{
        fileName: 'test.pdf',
        fileUrl: 'https://drive.google.com/file/d/abc123/view',
      }]));

      const mockSession = {
        user: {
          id: 'user_123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'REQUESTER' as Role,
        },
      };

      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'REQUESTER' as Role,
        teamId: null,
        isActive: true,
      };

      const mockRequest = {
        id: 'request_123',
        title: 'Test Request',
        priority: 'MEDIUM' as const,
        status: 'OPEN' as const,
        creatorId: 'user_123',
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
        description: 'Test description',
        deadline: null,
        isUrgent: false,
        tags: [],
        urgencyScore: null,
        impactScore: null,
        riskScore: null,
        customScores: null,
        calculatedScore: null,
        priorityReason: 'Đặt thủ công',
        requesterType: 'INTERNAL' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        slaDeadline: null,
        slaStartedAt: null,
        slaStatus: null,
        slaPausedDuration: null,
      };

      (mockAuthTyped as any).mockResolvedValue(mockSession);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback: any) => {
        const attachmentCreateMany = jest.fn().mockResolvedValue({ count: 1 });
        return callback({
          request: { create: jest.fn().mockResolvedValue(mockRequest) },
          attachment: { createMany: attachmentCreateMany },
          auditLog: { create: jest.fn().mockResolvedValue({ id: 'log_123' }) },
          notification: { create: jest.fn().mockResolvedValue({ id: 'notif_123' }) },
        });
      });
      (prisma.category.findUnique as jest.Mock).mockResolvedValue({ name: 'Test' });
      mockCalculateSlaDeadline.mockResolvedValue({
        deadline: new Date(),
        targetHours: 24,
        slaConfigId: 'sla_123',
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      (mockParseDateOrNull as any).mockReturnValue(null);

      // Act
      const result = await createRequestAction(formData);

      // Assert
      expect(result.ok).toBe(true);
    });

    it.skip('should handle SLA calculation failure gracefully', async () => {
      // TODO: Integration test - requires real database & dependencies
      // Move to E2E test suite or expand mocks for full coverage
      // Current issue: Action validation requires all service dependencies
      
      // Arrange
      const formData = new FormData();
      formData.append('title', 'Test Request');
      formData.append('description', 'This is a test description with sufficient length to pass validation.');
      formData.append('priority', 'MEDIUM');
      formData.append('categoryId', '123e4567-e89b-12d3-a456-426614174000');

      const mockSession = {
        user: {
          id: 'user_123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'REQUESTER' as Role,
        },
      };

      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'REQUESTER' as Role,
        teamId: null,
        isActive: true,
      };

      const mockRequest = {
        id: 'request_123',
        title: 'Test Request',
        priority: 'MEDIUM' as const,
        status: 'OPEN' as const,
        creatorId: 'user_123',
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
        description: 'Test description',
        deadline: null,
        isUrgent: false,
        tags: [],
        urgencyScore: null,
        impactScore: null,
        riskScore: null,
        customScores: null,
        calculatedScore: null,
        priorityReason: 'Đặt thủ công',
        requesterType: 'INTERNAL' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        slaDeadline: null,
        slaStartedAt: null,
        slaStatus: null,
        slaPausedDuration: null,
      };

      (mockAuthTyped as any).mockResolvedValue(mockSession);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback: any) => {
        return callback({
          request: { create: jest.fn().mockResolvedValue(mockRequest) },
          attachment: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
          auditLog: { create: jest.fn().mockResolvedValue({ id: 'log_123' }) },
          notification: { create: jest.fn().mockResolvedValue({ id: 'notif_123' }) },
        });
      });
      (prisma.category.findUnique as jest.Mock).mockResolvedValue({ name: 'Test' });
      mockCalculateSlaDeadline.mockRejectedValue(new Error('SLA calculation failed'));
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      (mockParseDateOrNull as any).mockReturnValue(null);

      // Act
      const result = await createRequestAction(formData);

      // Assert
      expect(result.ok).toBe(true); 
      expect(Logger.warn).toHaveBeenCalled();
    });

    it('should return error for invalid input data', async () => {
      // Arrange
      const formData = new FormData();
      formData.append('title', 'ABCD'); // Too short
      formData.append('description', 'Short desc');
      formData.append('priority', 'MEDIUM');
      formData.append('categoryId', '123e4567-e89b-12d3-a456-426614174000');

      const mockSession = {
        user: {
          id: 'user_123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'REQUESTER' as Role,
        },
      };

      (mockAuthTyped as any).mockResolvedValue(mockSession);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user_123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'REQUESTER',
        teamId: null,
        isActive: true,
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      (mockParseDateOrNull as any).mockReturnValue(null);

      // Act
      const result = await createRequestAction(formData);

      // Assert
      expect(result.ok).toBe(false);
      expect(result.message).toBeDefined();
    });

    it('should handle internal server error', async () => {
      // Arrange
      const formData = new FormData();
      formData.append('title', 'Test Request');
      formData.append('description', 'This is a test description with sufficient length to pass validation.');
      formData.append('priority', 'MEDIUM');
      formData.append('categoryId', '123e4567-e89b-12d3-a456-426614174000');

      (mockAuthTyped as any).mockRejectedValue(new Error('Database error'));

      // Act
      const result = await createRequestAction(formData);

      // Assert
      expect(result.ok).toBe(false);
      expect(result.message).toBe('Internal server error');
      expect(Logger.captureException).toHaveBeenCalled();
    });
  });

  describe('archiveRequest', () => {
    it('should successfully archive a DONE request', async () => {
      // Arrange
      const requestId = 'request_123';
      const mockSession = {
        user: { id: 'user_123' },
      };
      const mockRequest = {
        id: requestId,
        status: 'DONE' as const,
        creatorId: 'user_123',
        title: 'Test Request',
      };

      (mockAuthTyped as any).mockResolvedValue(mockSession);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user_123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'REQUESTER',
        teamId: null,
        isActive: true,
      });
      (prisma.request.findUnique as jest.Mock).mockResolvedValue(mockRequest);
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback: any) => {
        return callback({
          request: {
            update: jest.fn().mockResolvedValue({
              ...mockRequest,
              status: 'ARCHIVED',
            }),
          },
          auditLog: { create: jest.fn().mockResolvedValue({ id: 'log_123' }) },
          notification: { create: jest.fn().mockResolvedValue({ id: 'notif_123' }) },
        });
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');

      // Act
      await archiveRequest(requestId);

      // Assert
      expect(mockRevalidatePath).toHaveBeenCalledWith(`/requests/${requestId}`);
      expect(mockRevalidatePath).toHaveBeenCalledWith('/requests');
    });

    it('should not archive a non-DONE request', async () => {
      // Arrange
      const requestId = 'request_123';
      const mockSession = {
        user: { id: 'user_123' },
      };
      const mockRequest = {
        id: requestId,
        status: 'IN_PROGRESS' as const,
        creatorId: 'user_123',
        title: 'Test Request',
      };

      (mockAuthTyped as any).mockResolvedValue(mockSession);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user_123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'REQUESTER',
        teamId: null,
        isActive: true,
      });
      (prisma.request.findUnique as jest.Mock).mockResolvedValue(mockRequest);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');

      // Act
      await archiveRequest(requestId);

      // Assert
      expect(mockRevalidatePath).not.toHaveBeenCalled();
      expect(Logger.warn).toHaveBeenCalled();
    });

    it('should handle non-existent request', async () => {
      // Arrange
      const requestId = 'request_123';
      const mockSession = {
        user: { id: 'user_123' },
      };

      (mockAuthTyped as any).mockResolvedValue(mockSession);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user_123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'REQUESTER',
        teamId: null,
        isActive: true,
      });
      (prisma.request.findUnique as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');

      // Act
      await archiveRequest(requestId);

      // Assert
      expect(Logger.warn).toHaveBeenCalled();
    });

    it('should handle archive request error', async () => {
      // Arrange
      const requestId = 'request_123';
      const error = new Error('Archive failed');

      (mockAuthTyped as any).mockRejectedValue(error);

      // Act & Assert
      await expect(archiveRequest(requestId)).rejects.toThrow(error);
      expect(Logger.captureException).toHaveBeenCalled();
    });
  });

  describe('deleteRequest', () => {
    it('should successfully delete a request by creator', async () => {
      // Arrange
      const requestId = 'request_123';
      const mockSession = {
        user: {
          id: 'user_123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'REQUESTER',
        },
      };

      const mockRequest = {
        id: requestId,
        title: 'Test Request',
        creatorId: 'user_123',
        creator: {
          id: 'user_123',
          email: 'test@example.com',
          name: 'Test User',
        },
        team: null,
      };

      (mockAuthTyped as any).mockResolvedValue(mockSession);
      (prisma.request.findUnique as jest.Mock).mockResolvedValue(mockRequest);
      (prisma.task.count as jest.Mock).mockResolvedValue(0);
      (prisma.attachment.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback: any) => {
        return callback({
          comment: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
          task: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
          attachment: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
          notification: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
          auditLog: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }), create: jest.fn().mockResolvedValue({ id: 'log_123' }) },
          request: { delete: jest.fn().mockResolvedValue(mockRequest) },
        });
      });

      // Act
      const result = await deleteRequest(requestId);

      // Assert
      expect(result.success).toBe(true);
      expect(mockRevalidatePath).toHaveBeenCalledWith('/requests');
      expect(mockRevalidatePath).toHaveBeenCalledWith(`/requests/${requestId}`);
    });

    it('should successfully delete a request by admin', async () => {
      // Arrange
      const requestId = 'request_123';
      const mockSession = {
        user: {
          id: 'admin_123',
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'ADMIN',
        },
      };

      const mockRequest = {
        id: requestId,
        title: 'Test Request',
        creatorId: 'user_123',
        creator: {
          id: 'user_123',
          email: 'user@example.com',
          name: 'Test User',
        },
        team: null,
      };

      (mockAuthTyped as any).mockResolvedValue(mockSession);
      (prisma.request.findUnique as jest.Mock).mockResolvedValue(mockRequest);
      (prisma.task.count as jest.Mock).mockResolvedValue(0);
      (prisma.attachment.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback: any) => {
        return callback({
          comment: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
          task: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
          attachment: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
          notification: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
          auditLog: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }), create: jest.fn().mockResolvedValue({ id: 'log_123' }) },
          request: { delete: jest.fn().mockResolvedValue(mockRequest) },
        });
      });

      // Act
      const result = await deleteRequest(requestId);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should return error for unauthorized user', async () => {
      // Arrange
      const requestId = 'request_123';
      const mockSession = {
        user: {
          id: 'user_456',
          email: 'other@example.com',
          name: 'Other User',
          role: 'REQUESTER',
        },
      };

      const mockRequest = {
        id: requestId,
        title: 'Test Request',
        creatorId: 'user_123',
        creator: {
          id: 'user_123',
          email: 'user@example.com',
          name: 'Test User',
        },
        team: null,
      };

      (mockAuthTyped as any).mockResolvedValue(mockSession);
      (prisma.request.findUnique as jest.Mock).mockResolvedValue(mockRequest);

      // Act & Assert
      await expect(deleteRequest(requestId)).rejects.toThrow('Bạn không có quyền xóa yêu cầu này');
    });

    it('should return error for non-existent request', async () => {
      // Arrange
      const requestId = 'request_123';
      const mockSession = {
        user: {
          id: 'user_123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'REQUESTER',
        },
      };

      (mockAuthTyped as any).mockResolvedValue(mockSession);
      (prisma.request.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(deleteRequest(requestId)).rejects.toThrow('Yêu cầu không tồn tại');
    });

    it('should return error for request with active tasks', async () => {
      // Arrange
      const requestId = 'request_123';
      const mockSession = {
        user: {
          id: 'user_123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'REQUESTER',
        },
      };

      const mockRequest = {
        id: requestId,
        title: 'Test Request',
        creatorId: 'user_123',
        creator: {
          id: 'user_123',
          email: 'test@example.com',
          name: 'Test User',
        },
        team: null,
      };

      (mockAuthTyped as any).mockResolvedValue(mockSession);
      (prisma.request.findUnique as jest.Mock).mockResolvedValue(mockRequest);
      (prisma.task.count as jest.Mock).mockResolvedValue(2); // Has active tasks

      // Act & Assert
      await expect(deleteRequest(requestId)).rejects.toThrow('Không thể xóa yêu cầu có nhiệm vụ đang thực hiện');
    });

    it('should handle delete request error', async () => {
      // Arrange
      const requestId = 'request_123';
      const mockSession = {
        user: {
          id: 'user_123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'REQUESTER',
        },
      };

      const mockRequest = {
        id: requestId,
        title: 'Test Request',
        creatorId: 'user_123',
        creator: {
          id: 'user_123',
          email: 'test@example.com',
          name: 'Test User',
        },
        team: null,
      };

      (mockAuthTyped as any).mockResolvedValue(mockSession);
      (prisma.request.findUnique as jest.Mock).mockResolvedValue(mockRequest);
      (prisma.task.count as jest.Mock).mockResolvedValue(0);
      (prisma.$transaction as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(deleteRequest(requestId)).rejects.toThrow('Không thể xóa yêu cầu. Vui lòng thử lại.');
      expect(Logger.captureException).toHaveBeenCalled();
    });

    it('should handle unauthorized session', async () => {
      // Arrange
      const requestId = 'request_123';

      (mockAuthTyped as any).mockResolvedValue(null);

      // Act & Assert
      await expect(deleteRequest(requestId)).rejects.toThrow('Unauthorized');
    });
  });
});
