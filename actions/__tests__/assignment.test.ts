import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { loadBalancerService } from '@/lib/services/load-balancer';
import { revalidatePath } from 'next/cache';

// Mocks
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    request: {
      findUnique: jest.fn(),
    },
    task: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    team: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    assignmentConfig: {
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  },
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

jest.mock('@/lib/services/load-balancer', () => ({
  loadBalancerService: {
    findBestAssignee: jest.fn(),
    calculateWorkload: jest.fn(),
    checkWIPLimit: jest.fn(),
    clearCache: jest.fn(),
  },
}));

// Import actions after mocks
import {
  autoAssignRequest,
  manualAssignWithCheck,
  reassignTask,
  getTeamWorkload,
  updateUserWIPLimit,
  updateAssignmentConfig,
  getAssignmentConfig,
} from '@/actions/assignment';
import { defaultAdvancedAssignmentSettings } from '@/lib/config/assignment-defaults';

// Type assertions
const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockPrisma = prisma as any;
const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>;
const mockLoadBalancerService = loadBalancerService as any;

const cloneAdvancedSettings = () =>
  JSON.parse(JSON.stringify(defaultAdvancedAssignmentSettings));

describe('actions/assignment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('autoAssignRequest', () => {
    it('should successfully auto-assign request to best available user', async () => {
      // Arrange
      const requestId = 'req_123';
      const assigneeId = 'user_456';

      const mockSession = {
        user: { id: 'user_leader', name: 'Leader' },
      };

      const mockRequest = {
        id: requestId,
        title: 'Fix bug',
        description: 'Test',
        teamId: 'team_123',
        categoryId: 'cat_tech',
        deadline: new Date(),
        category: { name: 'Technical' },
        team: { name: 'Dev Team' },
      };

      const mockAssignee = {
        id: assigneeId,
        name: 'John Doe',
        email: 'john@example.com',
      };

      const mockWorkload = {
        userId: assigneeId,
        activeCount: 3,
        limit: 10,
        utilization: 0.3,
        avgLeadTime: 120,
      };

      mockAuth.mockResolvedValue(mockSession as any);
      mockPrisma.request.findUnique.mockResolvedValue(mockRequest);
      mockLoadBalancerService.findBestAssignee.mockResolvedValue(assigneeId);
      mockPrisma.user.findUnique.mockResolvedValue(mockAssignee);
      mockLoadBalancerService.calculateWorkload.mockResolvedValue(mockWorkload as any);
      mockPrisma.task.create.mockResolvedValue({
        id: 'task_123',
        title: 'Fix bug',
        description: 'Test',
        requestId,
        assigneeId,
      });
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'log_123' });

      // Act
      const result = await autoAssignRequest(requestId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.assigneeId).toBe(assigneeId);
      expect(mockLoadBalancerService.findBestAssignee).toHaveBeenCalledWith(
        requestId,
        'team_123',
        'cat_tech'
      );
      expect(mockRevalidatePath).toHaveBeenCalledWith(`/requests/${requestId}`);
    });

    it('should return error when not authenticated', async () => {
      // Arrange
      mockAuth.mockResolvedValue(null);

      // Act
      const result = await autoAssignRequest('req_123');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Chưa đăng nhập');
    });

    it('should return error when request not found', async () => {
      // Arrange
      mockAuth.mockResolvedValue({ user: { id: 'user_123' } } as any);
      mockPrisma.request.findUnique.mockResolvedValue(null);

      // Act
      const result = await autoAssignRequest('invalid_request');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Request không tồn tại');
    });

    it('should return error when no team assigned to request', async () => {
      // Arrange
      mockAuth.mockResolvedValue({ user: { id: 'user_123' } } as any);
      (mockPrisma.request.findUnique as jest.Mock).mockResolvedValue({
        id: 'req_123',
        teamId: null,
      });

      // Act
      const result = await autoAssignRequest('req_123');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Request chưa được phân công cho team');
    });

    it('should return error when all team members exceed WIP limit', async () => {
      // Arrange
      const mockSession = { user: { id: 'user_leader' } };
      const mockRequest = {
        id: 'req_123',
        teamId: 'team_123',
        categoryId: 'cat_tech',
      };

      mockAuth.mockResolvedValue(mockSession as any);
      (mockPrisma.request.findUnique as jest.Mock).mockResolvedValue(mockRequest);
      mockLoadBalancerService.findBestAssignee.mockRejectedValue(
        new Error('WIP limit exceeded')
      );

      // Act
      const result = await autoAssignRequest('req_123');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('giới hạn WIP');
    });
  });

  describe('manualAssignWithCheck', () => {
    it('should successfully assign task when assignee has capacity', async () => {
      // Arrange
      const taskId = 'task_123';
      const assigneeId = 'user_456';

      const mockSession = { user: { id: 'user_leader' } };
      const mockCurrentUser = {
        id: 'user_leader',
        name: 'Leader',
        role: 'LEADER',
      };

      const mockTask = {
        id: taskId,
        title: 'Fix bug',
        request: { title: 'Test', priority: 'HIGH' },
        assignee: null,
      };

      const mockNewAssignee = {
        id: assigneeId,
        name: 'John Doe',
        email: 'john@example.com',
      };

      const mockWIPCheck = {
        exceeded: false,
        current: 3,
        limit: 10,
        utilizationPercent: 30,
      };

      mockAuth.mockResolvedValue(mockSession as any);
      (mockPrisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockCurrentUser)
        .mockResolvedValueOnce(mockNewAssignee);
      mockLoadBalancerService.checkWIPLimit.mockResolvedValue(mockWIPCheck as any);
      (mockPrisma.task.findUnique as jest.Mock).mockResolvedValue(mockTask);
      (mockPrisma.task.update as jest.Mock).mockResolvedValue({
        ...mockTask,
        assigneeId,
      });
      (mockPrisma.auditLog.create as jest.Mock).mockResolvedValue({ id: 'log_123' });

      // Act
      const result = await manualAssignWithCheck(taskId, assigneeId);

      // Assert
      expect(result.success).toBe(true);
      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        where: { id: taskId },
        data: { assigneeId },
      });
    });

    it('should return warning when assignee WIP limit exceeded', async () => {
      // Arrange
      const mockSession = { user: { id: 'user_regular' } };
      const mockCurrentUser = {
        id: 'user_regular',
        name: 'User',
        role: 'USER',
      };

      const mockWIPCheck = {
        exceeded: true,
        current: 5,
        limit: 5,
        utilizationPercent: 100,
      };

      mockAuth.mockResolvedValue(mockSession as any);
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockCurrentUser);
      mockLoadBalancerService.checkWIPLimit.mockResolvedValue(mockWIPCheck as any);
      (mockPrisma.task.findUnique as jest.Mock).mockResolvedValue({ id: 'task_123' });
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'user_overloaded',
      });

      // Act
      const result = await manualAssignWithCheck('task_123', 'user_overloaded', false);

      // Assert
      expect(result.success).toBe(false);
      expect(result.warning).toBe(true);
      expect(result.canOverride).toBe(false);
    });

    it('should allow override when leader/admin overrides WIP limit', async () => {
      // Arrange
      const mockSession = { user: { id: 'user_leader' } };
      const mockLeader = { id: 'user_leader', name: 'Leader', role: 'LEADER' };

      const mockWIPCheck = {
        exceeded: true,
        current: 5,
        limit: 5,
        utilizationPercent: 100,
      };

      const mockTask = {
        id: 'task_123',
        assignee: null,
        request: { title: 'Test' },
      };

      const mockAssignee = {
        id: 'user_overloaded',
        name: 'Overloaded',
        email: 'over@test.com',
      };

      mockAuth.mockResolvedValue(mockSession as any);
      (mockPrisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockLeader)
        .mockResolvedValueOnce(mockAssignee);
      mockLoadBalancerService.checkWIPLimit.mockResolvedValue(mockWIPCheck as any);
      (mockPrisma.task.findUnique as jest.Mock).mockResolvedValue(mockTask);
      (mockPrisma.task.update as jest.Mock).mockResolvedValue({
        ...mockTask,
        assigneeId: 'user_overloaded',
      });
      (mockPrisma.auditLog.create as jest.Mock).mockResolvedValue({ id: 'log_123' });

      // Act
      const result = await manualAssignWithCheck('task_123', 'user_overloaded', true);

      // Assert
      expect(result.success).toBe(true);
      expect(result.overrideApplied).toBe(true);
    });

    it('should return error when regular user tries to override', async () => {
      // Arrange
      const mockSession = { user: { id: 'user_regular' } };
      const mockUser = { id: 'user_regular', name: 'User', role: 'USER' };

      const mockWIPCheck = {
        exceeded: true,
        current: 5,
        limit: 5,
        utilizationPercent: 100,
      };

      mockAuth.mockResolvedValue(mockSession as any);
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      mockLoadBalancerService.checkWIPLimit.mockResolvedValue(mockWIPCheck as any);

      // Act
      const result = await manualAssignWithCheck('task_123', 'user_456', true);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Leader và Admin');
    });

    it('should return error when task not found', async () => {
      // Arrange
      mockAuth.mockResolvedValue({ user: { id: 'user_leader' } } as any);
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user_leader',
        role: 'LEADER',
      });
      mockLoadBalancerService.checkWIPLimit.mockResolvedValue({
        exceeded: false,
        current: 3,
        limit: 10,
        utilizationPercent: 30,
      } as any);
      (mockPrisma.task.findUnique as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await manualAssignWithCheck('invalid_task', 'user_456');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Task không tồn tại');
    });

    it('should return error when assignee not found', async () => {
      // Arrange
      mockAuth.mockResolvedValue({ user: { id: 'user_leader' } } as any);
      (mockPrisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce({ id: 'user_leader', role: 'LEADER' })
        .mockResolvedValueOnce(null);
      mockLoadBalancerService.checkWIPLimit.mockResolvedValue({
        exceeded: false,
        current: 3,
        limit: 10,
      } as any);
      (mockPrisma.task.findUnique as jest.Mock).mockResolvedValue({ id: 'task_123' });

      // Act
      const result = await manualAssignWithCheck('task_123', 'invalid_user');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('không tồn tại');
    });
  });

  describe('reassignTask', () => {
    it('should successfully reassign task with valid reason', async () => {
      // Arrange
      const taskId = 'task_123';
      const newAssigneeId = 'user_new';
      const reason = 'Original assignee on leave';

      const mockSession = { user: { id: 'user_leader' } };
      const mockLeader = {
        id: 'user_leader',
        name: 'Leader',
        role: 'LEADER',
      };

      const mockTask = {
        id: taskId,
        assigneeId: 'user_old',
        assignee: { id: 'user_old', name: 'Old User' },
        request: { title: 'Test', priority: 'HIGH' },
        requestId: 'req_123',
      };

      const mockNewAssignee = {
        id: newAssigneeId,
        name: 'New User',
        email: 'new@test.com',
      };

      const mockWIPCheck = {
        exceeded: false,
        current: 3,
        limit: 10,
      };

      mockAuth.mockResolvedValue(mockSession as any);
      (mockPrisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockLeader)
        .mockResolvedValueOnce(mockNewAssignee);
      (mockPrisma.task.findUnique as jest.Mock).mockResolvedValue(mockTask);
      mockLoadBalancerService.checkWIPLimit.mockResolvedValue(mockWIPCheck as any);
      (mockPrisma.task.update as jest.Mock).mockResolvedValue({
        ...mockTask,
        assigneeId: newAssigneeId,
      });
      (mockPrisma.auditLog.create as jest.Mock).mockResolvedValue({ id: 'log_123' });

      // Act
      const result = await reassignTask(taskId, newAssigneeId, reason);

      // Assert
      expect(result.success).toBe(true);
      expect(result.oldAssigneeId).toBe('user_old');
      expect(result.newAssigneeId).toBe(newAssigneeId);
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'REASSIGNED',
          entity: 'Task',
          entityId: taskId,
          oldValue: expect.objectContaining({
            assigneeId: 'user_old',
          }),
          newValue: expect.objectContaining({
            assigneeId: newAssigneeId,
            reason,
            reassignedBy: 'Leader',
          }),
        }),
      });
    });

    it('should return error when not leader or admin', async () => {
      // Arrange
      mockAuth.mockResolvedValue({ user: { id: 'user_regular' } } as any);
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user_regular',
        role: 'USER',
      });

      // Act
      const result = await reassignTask('task_123', 'user_new', 'Test reason');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Leader và Admin');
    });

    it('should return error when new assignee WIP limit exceeded', async () => {
      // Arrange
      const mockSession = { user: { id: 'user_leader' } };
      const mockLeader = { id: 'user_leader', role: 'LEADER' };

      const mockTask = {
        id: 'task_123',
        assigneeId: 'user_old',
        assignee: { id: 'user_old', name: 'Old' },
        request: { title: 'Test' },
        requestId: 'req_123',
      };

      const mockNewAssignee = { id: 'user_overloaded', name: 'Overloaded' };

      const mockWIPCheck = {
        exceeded: true,
        current: 5,
        limit: 5,
      };

      mockAuth.mockResolvedValue(mockSession as any);
      (mockPrisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockLeader)
        .mockResolvedValueOnce(mockNewAssignee);
      (mockPrisma.task.findUnique as jest.Mock).mockResolvedValue(mockTask);
      mockLoadBalancerService.checkWIPLimit.mockResolvedValue(mockWIPCheck as any);

      // Act
      const result = await reassignTask('task_123', 'user_overloaded', 'Test');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('quá tải');
    });
  });

  describe('getTeamWorkload', () => {
    it('should return team workload summary', async () => {
      // Arrange
      const teamId = 'team_123';

      const mockSession = { user: { id: 'user_leader' } };
      const mockTeam = {
        id: teamId,
        name: 'Dev Team',
        wipLimit: 50,
        members: [
          {
            id: 'user_1',
            name: 'Alice',
            email: 'alice@test.com',
            role: 'USER',
            wipLimit: 5,
            performanceScore: 85,
          },
          {
            id: 'user_2',
            name: 'Bob',
            email: 'bob@test.com',
            role: 'USER',
            wipLimit: 5,
            performanceScore: 90,
          },
        ],
      };

      mockAuth.mockResolvedValue(mockSession as any);
      (mockPrisma.team.findUnique as jest.Mock).mockResolvedValue(mockTeam);
      mockLoadBalancerService.calculateWorkload
        .mockResolvedValueOnce({
          userId: 'user_1',
          activeCount: 3,
          limit: 5,
          utilization: 0.6,
          isAtLimit: false,
          isOverloaded: false,
        } as any)
        .mockResolvedValueOnce({
          userId: 'user_2',
          activeCount: 5,
          limit: 5,
          utilization: 1.0,
          isAtLimit: true,
          isOverloaded: false,
        } as any);

      // Act
      const result = await getTeamWorkload(teamId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.summary.totalMembers).toBe(2);
      expect(result.summary.totalActiveTasks).toBe(8);
      expect(result.summary.membersAtCapacity).toBe(1);
    });

    it('should return error when not authenticated', async () => {
      // Arrange
      mockAuth.mockResolvedValue(null);

      // Act
      const result = await getTeamWorkload('team_123');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Chưa đăng nhập');
    });

    it('should return error when team not found', async () => {
      // Arrange
      mockAuth.mockResolvedValue({ user: { id: 'user_123' } } as any);
      (mockPrisma.team.findUnique as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await getTeamWorkload('invalid_team');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Team không tồn tại');
    });
  });

  describe('updateUserWIPLimit', () => {
    it('should update WIP limit when admin', async () => {
      // Arrange
      const userId = 'user_123';
      const newLimit = 10;

      const mockSession = { user: { id: 'user_admin' } };
      const mockAdmin = {
        id: 'user_admin',
        name: 'Admin',
        role: 'ADMIN',
        teamId: null,
      };

      const mockTargetUser = {
        id: userId,
        name: 'User',
        wipLimit: 5,
        teamId: 'team_123',
        team: { id: 'team_123', name: 'Team' },
        tasksAssigned: [{ id: 'task_1' }, { id: 'task_2' }],
      };

      mockAuth.mockResolvedValue(mockSession as any);
      (mockPrisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockAdmin)
        .mockResolvedValueOnce(mockTargetUser);
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({
        ...mockTargetUser,
        wipLimit: newLimit,
      });
      (mockPrisma.auditLog.create as jest.Mock).mockResolvedValue({ id: 'log_123' });

      // Act
      const result = await updateUserWIPLimit(userId, newLimit);

      // Assert
      expect(result.success).toBe(true);
      expect(result.newLimit).toBe(newLimit);
      expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/users');
    });

    it('should return error when new limit less than current active tasks', async () => {
      // Arrange
      const mockSession = { user: { id: 'user_admin' } };
      const mockAdmin = { id: 'user_admin', role: 'ADMIN', teamId: null };

      const mockTargetUser = {
        id: 'user_123',
        name: 'User',
        wipLimit: 5,
        teamId: 'team_123',
        tasksAssigned: [{ id: 't1' }, { id: 't2' }, { id: 't3' }], // 3 active
      };

      mockAuth.mockResolvedValue(mockSession as any);
      (mockPrisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockAdmin)
        .mockResolvedValueOnce(mockTargetUser);

      // Act
      const result = await updateUserWIPLimit('user_123', 2); // Limit 2, but 3 active

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Giới hạn mới phải >= số task đang làm');
    });

    it('should return error when not admin or leader', async () => {
      // Arrange
      mockAuth.mockResolvedValue({ user: { id: 'user_regular' } } as any);
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user_regular',
        role: 'USER',
        teamId: 'team_123',
      });

      // Act
      const result = await updateUserWIPLimit('user_123', 10);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Admin hoặc Team Leader');
    });
  });

  describe('updateAssignmentConfig', () => {
    it('should update assignment config when admin', async () => {
      // Arrange
      const baseAdvanced = cloneAdvancedSettings();
      const newConfig = {
        weightWorkload: 0.5,
        weightSkill: 0.25,
        weightSLA: 0.15,
        weightRandom: 0.1,
        enableAutoAssign: false,
        advancedSettings: {
          ...baseAdvanced,
          matching: {
            ...baseAdvanced.matching,
            mode: 'flexible',
            prioritizeExactMatch: false,
            fallbackStrategy: 'round_robin',
          },
          guardrails: {
            ...baseAdvanced.guardrails,
            maxAssignmentsPerUserPerDay: 18,
            cooldownMinutes: 12,
            slaGracePercent: 20,
            backlogAgingBoost: 0.18,
          },
          notifications: {
            ...baseAdvanced.notifications,
            sendWeeklyDigest: true,
          },
          automation: {
            ...baseAdvanced.automation,
            autoEscalateStalled: true,
            escalateAfterHours: 8,
            autoAssignBacklogOlderThanHours: 10,
          },
          scoreModifiers: {
            ...baseAdvanced.scoreModifiers,
            burnoutPenalty: 0.22,
          },
        },
      };

      const mockSession = { user: { id: 'user_admin' } };
      const mockAdmin = { id: 'user_admin', name: 'Admin', role: 'ADMIN' };

      const mockExistingConfig = {
        id: 'config_1',
        weightWorkload: 0.4,
        weightSkill: 0.3,
        weightSLA: 0.2,
        weightRandom: 0.1,
        enableAutoAssign: true,
        prioritizeExactMatch: true,
        allowPartialMatch: true,
        fallbackStrategy: 'smart_balance',
        skillMatchingMode: 'balanced',
        maxAssignmentsPerUserPerDay: 0,
        cooldownMinutes: 0,
        slaGracePercent: 15,
        backlogAgingBoost: 0,
        advancedSettings: cloneAdvancedSettings(),
      };

      mockAuth.mockResolvedValue(mockSession as any);
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockAdmin);
      (mockPrisma.assignmentConfig.findFirst as jest.Mock).mockResolvedValue(
        mockExistingConfig
      );
      (mockPrisma.assignmentConfig.update as jest.Mock).mockResolvedValue({
        ...mockExistingConfig,
        ...newConfig,
        prioritizeExactMatch: newConfig.advancedSettings.matching.prioritizeExactMatch,
        allowPartialMatch: newConfig.advancedSettings.matching.allowPartialMatch,
        fallbackStrategy: newConfig.advancedSettings.matching.fallbackStrategy,
        skillMatchingMode: newConfig.advancedSettings.matching.mode,
        maxAssignmentsPerUserPerDay: newConfig.advancedSettings.guardrails.maxAssignmentsPerUserPerDay,
        cooldownMinutes: newConfig.advancedSettings.guardrails.cooldownMinutes,
        slaGracePercent: newConfig.advancedSettings.guardrails.slaGracePercent,
        backlogAgingBoost: newConfig.advancedSettings.guardrails.backlogAgingBoost,
      });
      (mockPrisma.auditLog.create as jest.Mock).mockResolvedValue({ id: 'log_123' });

      // Act
      const result = await updateAssignmentConfig(newConfig);

      // Assert
      expect(result.success).toBe(true);
      expect(result.config.weightWorkload).toBe(0.5);
      expect(result.config.enableAutoAssign).toBe(false);
      expect(result.config.advancedSettings.matching.mode).toBe('flexible');
      expect(result.config.advancedSettings.guardrails.maxAssignmentsPerUserPerDay).toBe(18);
    });

    it('should return error when weights do not sum to 1.0', async () => {
      // Arrange
      const invalidConfig = {
        weightWorkload: 0.5,
        weightSkill: 0.3,
        weightSLA: 0.1,
        weightRandom: 0.05, // Sum = 0.95, not 1.0!
      };

      mockAuth.mockResolvedValue({ user: { id: 'user_admin' } } as any);
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user_admin',
        role: 'ADMIN',
      });

      // Act
      const result = await updateAssignmentConfig(invalidConfig);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('1.0');
    });

    it('should return error when not admin', async () => {
      // Arrange
      mockAuth.mockResolvedValue({ user: { id: 'user_leader' } } as any);
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user_leader',
        role: 'LEADER',
      });

      // Act
      const result = await updateAssignmentConfig({
        weightWorkload: 0.4,
        weightSkill: 0.3,
        weightSLA: 0.2,
        weightRandom: 0.1,
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Admin');
    });
  });

  describe('getAssignmentConfig', () => {
    it('should return existing config when available', async () => {
      // Arrange
      const advanced = cloneAdvancedSettings();
      advanced.guardrails.maxAssignmentsPerUserPerDay = 22;
      advanced.matching.mode = 'flexible';
      const mockConfig = {
        weightWorkload: 0.4,
        weightSkill: 0.3,
        weightSLA: 0.2,
        weightRandom: 0.1,
        enableAutoAssign: true,
        prioritizeExactMatch: advanced.matching.prioritizeExactMatch,
        allowPartialMatch: advanced.matching.allowPartialMatch,
        fallbackStrategy: advanced.matching.fallbackStrategy,
        skillMatchingMode: advanced.matching.mode,
        maxAssignmentsPerUserPerDay: advanced.guardrails.maxAssignmentsPerUserPerDay,
        cooldownMinutes: advanced.guardrails.cooldownMinutes,
        slaGracePercent: advanced.guardrails.slaGracePercent,
        backlogAgingBoost: advanced.guardrails.backlogAgingBoost,
        advancedSettings: advanced,
      };

      (mockPrisma.assignmentConfig.findFirst as jest.Mock).mockResolvedValue(mockConfig);

      // Act
      const result = await getAssignmentConfig();

      // Assert
      expect(result.success).toBe(true);
      expect(result.config).toEqual({
        weightWorkload: mockConfig.weightWorkload,
        weightSkill: mockConfig.weightSkill,
        weightSLA: mockConfig.weightSLA,
        weightRandom: mockConfig.weightRandom,
        enableAutoAssign: mockConfig.enableAutoAssign,
        advancedSettings: mockConfig.advancedSettings,
      });
      expect(result.isDefault).toBe(false);
    });

    it('should return default config when no config exists', async () => {
      // Arrange
      (mockPrisma.assignmentConfig.findFirst as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await getAssignmentConfig();

      // Assert
      expect(result.success).toBe(true);
      expect(result.config).toEqual({
        weightWorkload: 0.4,
        weightSkill: 0.3,
        weightSLA: 0.2,
        weightRandom: 0.1,
        enableAutoAssign: true,
        advancedSettings: cloneAdvancedSettings(),
      });
      expect(result.isDefault).toBe(true);
    });
  });
});
