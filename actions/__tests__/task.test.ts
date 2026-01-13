import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Import the actions
import {
  getMyTasks,
  updateTaskStatus,
  assignTask,
  createTaskForRequest,
} from '../task';

// Mocks
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    task: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    request: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  },
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

// Import mocked functions after mocks
import { auth as mockAuth } from '@/lib/auth';

// Type assertions
const mockAuthTyped = mockAuth as jest.MockedFunction<typeof auth>;
const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>;

describe('actions/task', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMyTasks', () => {
    it('should return tasks for current user with filters', async () => {
      // Arrange
      const filters = {
        status: 'TODO',
        priority: 'HIGH',
        search: 'test',
      };

      const mockSession = {
        user: {
          id: 'user_123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'USER',
        },
      };

      const mockTasks = [
        {
          id: 'task_1',
          title: 'Test Task 1',
          status: 'TODO',
          assigneeId: 'user_123',
          request: { id: 'req_1', title: 'Request 1', priority: 'HIGH' },
          assignee: { id: 'user_123', name: 'Test User' },
        },
        {
          id: 'task_2',
          title: 'Test Task 2',
          status: 'TODO',
          assigneeId: 'user_123',
          request: { id: 'req_2', title: 'Request 2', priority: 'HIGH' },
          assignee: { id: 'user_123', name: 'Test User' },
        },
      ];

      (mockAuthTyped as any).mockResolvedValue(mockSession);
      (prisma.task.findMany as jest.Mock).mockResolvedValue(mockTasks);

      // Act
      const result = await getMyTasks(filters);

      // Assert
      expect(result).toHaveLength(2);
      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          assigneeId: 'user_123',
          status: 'TODO',
          request: { priority: 'HIGH' },
          OR: expect.arrayContaining([
            { title: { contains: 'test', mode: 'insensitive' } },
          ]),
        }),
        include: {
          request: {
            select: {
              id: true,
              title: true,
              priority: true,
            },
          },
          assignee: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [
          { status: 'asc' },
          { deadline: 'asc' },
        ],
      });
    });

    it('should return all tasks when status is all', async () => {
      // Arrange
      const filters = {
        status: 'all',
        priority: 'all',
        search: '',
      };

      const mockSession = {
        user: { id: 'user_123' },
      };

      const mockTasks = [
        { id: 'task_1', status: 'TODO' },
        { id: 'task_2', status: 'IN_PROGRESS' },
        { id: 'task_3', status: 'DONE' },
      ];

      (mockAuthTyped as any).mockResolvedValue(mockSession);
      (prisma.task.findMany as jest.Mock).mockResolvedValue(mockTasks);

      // Act
      const result = await getMyTasks(filters);

      // Assert
      expect(result).toHaveLength(3);
      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: {
          assigneeId: 'user_123',
        },
        include: expect.any(Object),
        orderBy: expect.any(Array),
      });
    });

    it('should throw error when user not authenticated', async () => {
      // Arrange
      (mockAuthTyped as any).mockResolvedValue(null);

      const filters = {
        status: 'all',
        priority: 'all',
        search: '',
      };

      // Act & Assert
      await expect(getMyTasks(filters)).rejects.toThrow('Unauthorized');
    });
  });

  describe('updateTaskStatus', () => {
    it('should successfully update task status', async () => {
      // Arrange
      const taskId = 'task_123';
      const newStatus = 'IN_PROGRESS';

      const mockSession = {
        user: {
          id: 'user_123',
          email: 'test@example.com',
        },
      };

      const mockTask = {
        id: taskId,
        assigneeId: 'user_123',
        status: 'TODO',
        parentTaskId: null,
      };

      const mockUpdatedTask = {
        ...mockTask,
        status: newStatus,
        startedAt: new Date(),
      };

      (mockAuthTyped as any).mockResolvedValue(mockSession);
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(mockTask);
      (prisma.task.findMany as jest.Mock).mockResolvedValue([]); // No subtasks
      (prisma.task.update as jest.Mock).mockResolvedValue(mockUpdatedTask);
      (prisma.auditLog.create as jest.Mock).mockResolvedValue({ id: 'log_123' });

      // Act
      const result = await updateTaskStatus(taskId, newStatus);

      // Assert
      expect(result.status).toBe(newStatus);
      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: taskId },
        data: expect.objectContaining({
          status: newStatus,
          startedAt: expect.any(Date),
        }),
      });
      expect(prisma.auditLog.create).toHaveBeenCalled();
      expect(mockRevalidatePath).toHaveBeenCalledWith('/my-tasks');
    });

    it('should set completedAt when status is DONE', async () => {
      // Arrange
      const taskId = 'task_123';
      const newStatus = 'DONE';

      const mockSession = {
        user: { id: 'user_123' },
      };

      const mockTask = {
        id: taskId,
        assigneeId: 'user_123',
        status: 'IN_PROGRESS',
        parentTaskId: null,
      };

      (mockAuthTyped as any).mockResolvedValue(mockSession);
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(mockTask);
      (prisma.task.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.task.update as jest.Mock).mockResolvedValue({
        ...mockTask,
        status: newStatus,
        completedAt: new Date(),
      });

      // Act
      const result = await updateTaskStatus(taskId, newStatus);

      // Assert
      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: taskId },
        data: expect.objectContaining({
          status: newStatus,
          completedAt: expect.any(Date),
        }),
      });
    });

    it('should throw error when user not authorized', async () => {
      // Arrange
      const taskId = 'task_123';
      const mockSession = {
        user: { id: 'user_456' }, // Different user
      };

      const mockTask = {
        id: taskId,
        assigneeId: 'user_123',
        status: 'TODO',
        parentTaskId: null,
      };

      (mockAuthTyped as any).mockResolvedValue(mockSession);
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(mockTask);

      // Act & Assert
      await expect(updateTaskStatus(taskId, 'IN_PROGRESS')).rejects.toThrow(
        'Không có quyền cập nhật nhiệm vụ này'
      );
    });

    it('should throw error when task not found', async () => {
      // Arrange
      const taskId = 'task_not_found';
      const mockSession = {
        user: { id: 'user_123' },
      };

      (mockAuthTyped as any).mockResolvedValue(mockSession);
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(updateTaskStatus(taskId, 'IN_PROGRESS')).rejects.toThrow(
        'Không có quyền cập nhật nhiệm vụ này'
      );
    });

    it('should prevent marking parent task as DONE when subtasks incomplete', async () => {
      // Arrange
      const taskId = 'task_parent';
      const mockSession = {
        user: { id: 'user_123' },
      };

      const mockParentTask = {
        id: taskId,
        assigneeId: 'user_123',
        status: 'IN_PROGRESS',
        parentTaskId: null,
      };

      const mockSubtasks = [
        { id: 'subtask_1', status: 'TODO' },
        { id: 'subtask_2', status: 'DONE' }, // One still incomplete
      ];

      (mockAuthTyped as any).mockResolvedValue(mockSession);
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(mockParentTask);
      (prisma.task.findMany as jest.Mock).mockResolvedValue(mockSubtasks);

      // Act & Assert
      await expect(updateTaskStatus(taskId, 'DONE')).rejects.toThrow(
        'Hoàn thành các subtask trước khi đánh dấu task này là DONE'
      );
      expect(prisma.task.update).not.toHaveBeenCalled();
    });

    it('should allow marking parent task as DONE when all subtasks done', async () => {
      // Arrange
      const taskId = 'task_parent';
      const mockSession = {
        user: { id: 'user_123' },
      };

      const mockParentTask = {
        id: taskId,
        assigneeId: 'user_123',
        status: 'IN_PROGRESS',
        parentTaskId: null,
      };

      const mockSubtasks = [
        { id: 'subtask_1', status: 'DONE' },
        { id: 'subtask_2', status: 'DONE' },
      ];

      (mockAuthTyped as any).mockResolvedValue(mockSession);
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(mockParentTask);
      (prisma.task.findMany as jest.Mock).mockResolvedValue(mockSubtasks);
      (prisma.task.update as jest.Mock).mockResolvedValue({
        ...mockParentTask,
        status: 'DONE',
        completedAt: new Date(),
      });

      // Act
      await updateTaskStatus(taskId, 'DONE');

      // Assert
      expect(prisma.task.update).toHaveBeenCalled();
    });
  });

  describe('assignTask', () => {
    it('should successfully assign task to user', async () => {
      // Arrange
      const taskId = 'task_123';
      const assigneeId = 'user_456';

      const mockSession = {
        user: {
          id: 'user_leader',
          email: 'leader@example.com',
        },
      };

      const mockTask = {
        id: taskId,
        assigneeId,
        title: 'Test Task',
        requestId: 'req_123',
      };

      (mockAuthTyped as any).mockResolvedValue(mockSession);
      (prisma.task.update as jest.Mock).mockResolvedValue(mockTask);
      (prisma.auditLog.create as jest.Mock).mockResolvedValue({ id: 'log_123' });

      // Act
      const result = await assignTask(taskId, assigneeId);

      // Assert
      expect(result.assigneeId).toBe(assigneeId);
      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: taskId },
        data: { assigneeId },
      });
      expect(prisma.auditLog.create).toHaveBeenCalled();
      expect(mockRevalidatePath).toHaveBeenCalledWith('/my-tasks');
      expect(mockRevalidatePath).toHaveBeenCalledWith('/requests');
    });

    it('should create audit log when assigning task', async () => {
      // Arrange
      const taskId = 'task_123';
      const assigneeId = 'user_456';
      const mockSession = {
        user: { id: 'user_leader' },
      };

      (mockAuthTyped as any).mockResolvedValue(mockSession);
      (prisma.task.update as jest.Mock).mockResolvedValue({ id: taskId, assigneeId });
      (prisma.auditLog.create as jest.Mock).mockResolvedValue({ id: 'log_123' });

      // Act
      await assignTask(taskId, assigneeId);

      // Assert
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          entity: 'Task',
          entityId: taskId,
          action: 'UPDATE',
          userId: 'user_leader',
          newValue: { assigneeId },
          taskId: taskId,
        },
      });
    });

    it('should throw error when user not authenticated', async () => {
      // Arrange
      (mockAuthTyped as any).mockResolvedValue(null);

      // Act & Assert
      await expect(assignTask('task_123', 'user_456')).rejects.toThrow('Unauthorized');
      expect(prisma.task.update).not.toHaveBeenCalled();
    });
  });

  describe('createTaskForRequest', () => {
    it('should successfully create task for request', async () => {
      // Arrange
      const requestId = 'req_123';
      const taskData = {
        title: 'New Task',
        description: 'Task description',
        assigneeId: 'user_456',
        deadline: new Date(),
      };

      const mockSession = {
        user: {
          id: 'user_leader',
          email: 'leader@example.com',
        },
      };

      const mockCreatedTask = {
        id: 'task_new',
        requestId,
        ...taskData,
        status: 'TODO',
      };

      (mockAuthTyped as any).mockResolvedValue(mockSession);
      (prisma.task.create as jest.Mock).mockResolvedValue(mockCreatedTask);
      (prisma.auditLog.create as jest.Mock).mockResolvedValue({ id: 'log_123' });

      // Act
      const result = await createTaskForRequest(requestId, taskData);

      // Assert
      expect(result.id).toBe('task_new');
      expect(result.status).toBe('TODO');
      expect(prisma.task.create).toHaveBeenCalledWith({
        data: {
          ...taskData,
          requestId,
          status: 'TODO',
        },
      });
      expect(prisma.auditLog.create).toHaveBeenCalled();
      expect(mockRevalidatePath).toHaveBeenCalledWith('/requests');
      expect(mockRevalidatePath).toHaveBeenCalledWith('/my-tasks');
    });

    it('should create audit log with task details', async () => {
      // Arrange
      const requestId = 'req_123';
      const taskData = {
        title: 'New Task',
        description: 'Task description',
      };
      const mockSession = {
        user: { id: 'user_leader' },
      };

      (mockAuthTyped as any).mockResolvedValue(mockSession);
      (prisma.task.create as jest.Mock).mockResolvedValue({
        id: 'task_new',
        title: 'New Task',
        requestId,
      });
      (prisma.auditLog.create as jest.Mock).mockResolvedValue({ id: 'log_123' });

      // Act
      await createTaskForRequest(requestId, taskData);

      // Assert
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          entity: 'Task',
          entityId: 'task_new',
          action: 'CREATE',
          userId: 'user_leader',
          newValue: {
            title: 'New Task',
            requestId,
          },
          taskId: 'task_new',
        },
      });
    });

    it('should throw error when user not authenticated', async () => {
      // Arrange
      (mockAuthTyped as any).mockResolvedValue(null);

      const taskData = {
        title: 'New Task',
      };

      // Act & Assert
      await expect(createTaskForRequest('req_123', taskData)).rejects.toThrow('Unauthorized');
      expect(prisma.task.create).not.toHaveBeenCalled();
    });

    it('should set status to TODO by default', async () => {
      // Arrange
      const mockSession = {
        user: { id: 'user_leader' },
      };

      (mockAuthTyped as any).mockResolvedValue(mockSession);
      (prisma.task.create as jest.Mock).mockResolvedValue({
        id: 'task_123',
        status: 'TODO',
      });

      // Act
      await createTaskForRequest('req_123', { title: 'Test Task' });

      // Assert
      expect(prisma.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'TODO',
        }),
      });
    });

    it('should support optional deadline', async () => {
      // Arrange
      const deadline = new Date();
      const mockSession = {
        user: { id: 'user_leader' },
      };

      (mockAuthTyped as any).mockResolvedValue(mockSession);
      (prisma.task.create as jest.Mock).mockResolvedValue({ id: 'task_123' });

      // Act
      await createTaskForRequest('req_123', {
        title: 'Test Task',
        deadline,
      });

      // Assert
      expect(prisma.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          deadline,
        }),
      });
    });

    it('should support optional assigneeId', async () => {
      // Arrange
      const mockSession = {
        user: { id: 'user_leader' },
      };

      (mockAuthTyped as any).mockResolvedValue(mockSession);
      (prisma.task.create as jest.Mock).mockResolvedValue({ id: 'task_123' });

      // Act
      await createTaskForRequest('req_123', {
        title: 'Test Task',
        assigneeId: 'user_assignee',
      });

      // Assert
      expect(prisma.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          assigneeId: 'user_assignee',
        }),
      });
    });

    it('should support optional description', async () => {
      // Arrange
      const mockSession = {
        user: { id: 'user_leader' },
      };

      (mockAuthTyped as any).mockResolvedValue(mockSession);
      (prisma.task.create as jest.Mock).mockResolvedValue({ id: 'task_123' });

      // Act
      await createTaskForRequest('req_123', {
        title: 'Test Task',
        description: 'Task description',
      });

      // Assert
      expect(prisma.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          description: 'Task description',
        }),
      });
    });
  });
});
