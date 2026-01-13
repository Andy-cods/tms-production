import { z } from 'zod';
import {
  CreateTaskSchema,
  AssignTaskSchema,
  UpdateTaskStatusSchema,
  TaskStatusEnum,
} from '../task';

describe('lib/validations/task', () => {
  describe('CreateTaskSchema', () => {
    it('should validate complete valid task data', () => {
      // Arrange
      const validData = {
        requestId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Valid Task Title',
        description: 'Task description here',
        deadline: '2024-12-31',
      };

      // Act
      const result = CreateTaskSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe(validData.title);
        expect(result.data.requestId).toBe(validData.requestId);
        expect(result.data.description).toBe(validData.description);
      }
    });

    it('should validate minimal valid task data', () => {
      // Arrange
      const minimalData = {
        requestId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Valid Title',
      };

      // Act
      const result = CreateTaskSchema.safeParse(minimalData);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe(minimalData.title);
        expect(result.data.description).toBe('');
      }
    });

    it('should reject title shorter than 3 characters', () => {
      // Arrange
      const invalidData = {
        requestId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Ab', // Only 2 chars
      };

      // Act
      const result = CreateTaskSchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('title');
      }
    });

    it('should reject title longer than 120 characters', () => {
      // Arrange
      const invalidData = {
        requestId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'A'.repeat(121), // 121 chars
      };

      // Act
      const result = CreateTaskSchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('title');
      }
    });

    it('should reject invalid requestId format (not UUID)', () => {
      // Arrange
      const invalidData = {
        requestId: 'invalid-request-id',
        title: 'Valid Task Title',
      };

      // Act
      const result = CreateTaskSchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('requestId');
      }
    });

    it('should reject missing requestId', () => {
      // Arrange
      const invalidData = {
        title: 'Valid Task Title',
      };

      // Act
      const result = CreateTaskSchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('requestId'))).toBe(true);
      }
    });

    it('should reject missing title', () => {
      // Arrange
      const invalidData = {
        requestId: '123e4567-e89b-12d3-a456-426614174000',
      };

      // Act
      const result = CreateTaskSchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('title'))).toBe(true);
      }
    });

    it('should reject description longer than 2000 characters', () => {
      // Arrange
      const invalidData = {
        requestId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Valid Task Title',
        description: 'A'.repeat(2001), // 2001 chars
      };

      // Act
      const result = CreateTaskSchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('description');
      }
    });

    it('should accept valid deadline format', () => {
      // Arrange
      const validData = {
        requestId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Valid Task Title',
        deadline: '2024-12-31',
      };

      // Act
      const result = CreateTaskSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.deadline).toBe('2024-12-31');
      }
    });

    it('should accept task without description', () => {
      // Arrange
      const validData = {
        requestId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Valid Task Title',
      };

      // Act
      const result = CreateTaskSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe('');
      }
    });

    it('should accept task without deadline', () => {
      // Arrange
      const validData = {
        requestId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Valid Task Title',
      };

      // Act
      const result = CreateTaskSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.deadline).toBeUndefined();
      }
    });

    it('should validate task with all optional fields', () => {
      // Arrange
      const completeData = {
        requestId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Complete Task Title',
        description: 'This is a complete task description with all optional fields provided.',
        deadline: '2024-12-31',
      };

      // Act
      const result = CreateTaskSchema.safeParse(completeData);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe(completeData.title);
        expect(result.data.description).toBe(completeData.description);
        expect(result.data.deadline).toBe(completeData.deadline);
      }
    });

    it('should handle empty description gracefully', () => {
      // Arrange
      const validData = {
        requestId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Valid Task Title',
        description: '',
      };

      // Act
      const result = CreateTaskSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe('');
      }
    });

    it('should validate title at minimum length boundary', () => {
      // Arrange
      const boundaryData = {
        requestId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'ABC', // Exactly 3 chars
      };

      // Act
      const result = CreateTaskSchema.safeParse(boundaryData);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should validate title at maximum length boundary', () => {
      // Arrange
      const boundaryData = {
        requestId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'A'.repeat(120), // Exactly 120 chars
      };

      // Act
      const result = CreateTaskSchema.safeParse(boundaryData);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should validate description at maximum length boundary', () => {
      // Arrange
      const boundaryData = {
        requestId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Valid Task Title',
        description: 'A'.repeat(2000), // Exactly 2000 chars
      };

      // Act
      const result = CreateTaskSchema.safeParse(boundaryData);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('AssignTaskSchema', () => {
    it('should validate task assignment with valid assignee', () => {
      // Arrange
      const validData = {
        taskId: '123e4567-e89b-12d3-a456-426614174000',
        assigneeId: '456e4567-e89b-12d3-a456-426614174001',
      };

      // Act
      const result = AssignTaskSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.taskId).toBe(validData.taskId);
        expect(result.data.assigneeId).toBe(validData.assigneeId);
      }
    });

    it('should validate task unassignment with empty string', () => {
      // Arrange
      const validData = {
        taskId: '123e4567-e89b-12d3-a456-426614174000',
        assigneeId: '',
      };

      // Act
      const result = AssignTaskSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.assigneeId).toBe('');
      }
    });

    it('should validate assignment without assigneeId (optional)', () => {
      // Arrange
      const validData = {
        taskId: '123e4567-e89b-12d3-a456-426614174000',
      };

      // Act
      const result = AssignTaskSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.assigneeId).toBeUndefined();
      }
    });

    it('should reject invalid taskId format', () => {
      // Arrange
      const invalidData = {
        taskId: 'invalid-task-id',
        assigneeId: '456e4567-e89b-12d3-a456-426614174001',
      };

      // Act
      const result = AssignTaskSchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('taskId');
      }
    });

    it('should reject missing taskId', () => {
      // Arrange
      const invalidData = {
        assigneeId: '456e4567-e89b-12d3-a456-426614174001',
      };

      // Act
      const result = AssignTaskSchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('taskId'))).toBe(true);
      }
    });

    it('should reject invalid assigneeId format', () => {
      // Arrange
      const invalidData = {
        taskId: '123e4567-e89b-12d3-a456-426614174000',
        assigneeId: 'invalid-user-id',
      };

      // Act
      const result = AssignTaskSchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('assigneeId');
      }
    });

    it('should accept null assigneeId as unassignment', () => {
      // Arrange
      const validData = {
        taskId: '123e4567-e89b-12d3-a456-426614174000',
        assigneeId: null as any,
      };

      // Act
      const result = AssignTaskSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(false); // null is not in union
    });

    it('should validate multiple assignment scenarios', () => {
      // Arrange
      const scenarios = [
        {
          taskId: '123e4567-e89b-12d3-a456-426614174000',
          assigneeId: '456e4567-e89b-12d3-a456-426614174001',
        },
        {
          taskId: '123e4567-e89b-12d3-a456-426614174000',
          assigneeId: '',
        },
        {
          taskId: '123e4567-e89b-12d3-a456-426614174000',
        },
      ];

      // Act & Assert
      scenarios.forEach(data => {
        const result = AssignTaskSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('UpdateTaskStatusSchema', () => {
    it('should validate status update with valid status', () => {
      // Arrange
      const validData = {
        taskId: '123e4567-e89b-12d3-a456-426614174000',
        status: 'IN_PROGRESS',
      };

      // Act
      const result = UpdateTaskStatusSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('IN_PROGRESS');
        expect(result.data.taskId).toBe(validData.taskId);
      }
    });

    it('should validate all valid status enum values', () => {
      // Arrange
      const validStatuses = ['TODO', 'IN_PROGRESS', 'BLOCKED', 'IN_REVIEW', 'REWORK', 'DONE'];

      // Act & Assert
      validStatuses.forEach(status => {
        const validData = {
          taskId: '123e4567-e89b-12d3-a456-426614174000',
          status,
        };

        const result = UpdateTaskStatusSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid status value', () => {
      // Arrange
      const invalidData = {
        taskId: '123e4567-e89b-12d3-a456-426614174000',
        status: 'INVALID_STATUS',
      };

      // Act
      const result = UpdateTaskStatusSchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('status');
      }
    });

    it('should reject invalid taskId format', () => {
      // Arrange
      const invalidData = {
        taskId: 'invalid-task-id',
        status: 'TODO',
      };

      // Act
      const result = UpdateTaskStatusSchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('taskId');
      }
    });

    it('should reject missing taskId', () => {
      // Arrange
      const invalidData = {
        status: 'TODO',
      };

      // Act
      const result = UpdateTaskStatusSchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('taskId'))).toBe(true);
      }
    });

    it('should reject missing status', () => {
      // Arrange
      const invalidData = {
        taskId: '123e4567-e89b-12d3-a456-426614174000',
      };

      // Act
      const result = UpdateTaskStatusSchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('status'))).toBe(true);
      }
    });

    it('should validate status transition from TODO to IN_PROGRESS', () => {
      // Arrange
      const validData = {
        taskId: '123e4567-e89b-12d3-a456-426614174000',
        status: 'IN_PROGRESS',
      };

      // Act
      const result = UpdateTaskStatusSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('IN_PROGRESS');
      }
    });

    it('should validate status transition to DONE', () => {
      // Arrange
      const validData = {
        taskId: '123e4567-e89b-12d3-a456-426614174000',
        status: 'DONE',
      };

      // Act
      const result = UpdateTaskStatusSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('DONE');
      }
    });

    it('should validate status transition to BLOCKED', () => {
      // Arrange
      const validData = {
        taskId: '123e4567-e89b-12d3-a456-426614174000',
        status: 'BLOCKED',
      };

      // Act
      const result = UpdateTaskStatusSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('BLOCKED');
      }
    });

    it('should validate status transition to IN_REVIEW', () => {
      // Arrange
      const validData = {
        taskId: '123e4567-e89b-12d3-a456-426614174000',
        status: 'IN_REVIEW',
      };

      // Act
      const result = UpdateTaskStatusSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('IN_REVIEW');
      }
    });

    it('should validate status transition to REWORK', () => {
      // Arrange
      const validData = {
        taskId: '123e4567-e89b-12d3-a456-426614174000',
        status: 'REWORK',
      };

      // Act
      const result = UpdateTaskStatusSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('REWORK');
      }
    });

    it('should validate status transition to TODO (backward)', () => {
      // Arrange
      const validData = {
        taskId: '123e4567-e89b-12d3-a456-426614174000',
        status: 'TODO',
      };

      // Act
      const result = UpdateTaskStatusSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('TODO');
      }
    });
  });

  describe('TaskStatusEnum', () => {
    it('should validate all enum values independently', () => {
      // Arrange
      const validStatuses = ['TODO', 'IN_PROGRESS', 'BLOCKED', 'IN_REVIEW', 'REWORK', 'DONE'];

      // Act & Assert
      validStatuses.forEach(status => {
        const result = TaskStatusEnum.safeParse(status);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(status);
        }
      });
    });

    it('should reject statuses not in enum', () => {
      // Arrange
      const invalidStatuses = ['PENDING', 'ARCHIVED', 'CANCELLED', ''];

      // Act & Assert
      invalidStatuses.forEach(status => {
        const result = TaskStatusEnum.safeParse(status);
        expect(result.success).toBe(false);
      });
    });

    it('should be case-sensitive', () => {
      // Arrange
      const invalidStatuses = ['todo', 'in_progress', 'Todo', 'In_Progress'];

      // Act & Assert
      invalidStatuses.forEach(status => {
        const result = TaskStatusEnum.safeParse(status);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in title', () => {
      // Arrange
      const validData = {
        requestId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Task! @#$%^&*() Title 123',
      };

      // Act
      const result = CreateTaskSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should handle Unicode characters in title', () => {
      // Arrange
      const validData = {
        requestId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Công việc Tiếng Việt 任务',
      };

      // Act
      const result = CreateTaskSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should handle very long description at boundary', () => {
      // Arrange
      const validData = {
        requestId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Valid Task Title',
        description: 'A'.repeat(1999) + 'X', // Just under 2000 chars boundary
      };

      // Act
      const result = CreateTaskSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should handle concurrent status updates', () => {
      // Arrange
      const scenarios = [
        { taskId: '123e4567-e89b-12d3-a456-426614174000', status: 'TODO' },
        { taskId: '123e4567-e89b-12d3-a456-426614174000', status: 'IN_PROGRESS' },
        { taskId: '123e4567-e89b-12d3-a456-426614174000', status: 'DONE' },
      ];

      // Act & Assert
      scenarios.forEach(data => {
        const result = UpdateTaskStatusSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should validate UUID format for requestId in boundary cases', () => {
      // Arrange
      const testCases = [
        { requestId: '00000000-0000-0000-0000-000000000000', shouldPass: true },
        { requestId: 'ffffffff-ffff-ffff-ffff-ffffffffffff', shouldPass: true },
        { requestId: 'invalid', shouldPass: false },
        { requestId: '123e4567-e89b-12d3-a456-42661417400', shouldPass: false }, // Too short
      ];

      testCases.forEach(({ requestId, shouldPass }) => {
        const validData = {
          requestId,
          title: 'Valid Task Title',
        };

        // Act
        const result = CreateTaskSchema.safeParse(validData);

        // Assert
        expect(result.success).toBe(shouldPass);
      });
    });

    it('should handle empty string for optional assigneeId', () => {
      // Arrange
      const validData = {
        taskId: '123e4567-e89b-12d3-a456-426614174000',
        assigneeId: '' as const,
      };

      // Act
      const result = AssignTaskSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.assigneeId).toBe('');
      }
    });

    it('should handle deadline with different formats', () => {
      // Arrange
      const testCases = [
        { deadline: '2024-12-31', shouldPass: true },
        { deadline: '2024-01-01', shouldPass: true },
        { deadline: '2025-06-15', shouldPass: true },
      ];

      testCases.forEach(({ deadline, shouldPass }) => {
        const validData = {
          requestId: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Valid Task Title',
          deadline,
        };

        // Act
        const result = CreateTaskSchema.safeParse(validData);

        // Assert
        expect(result.success).toBe(shouldPass);
      });
    });
  });

  describe('Type Safety', () => {
    it('should infer correct types for CreateTaskInput', () => {
      // Arrange
      const validData: z.infer<typeof CreateTaskSchema> = {
        requestId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Type Test',
        description: 'Description',
        deadline: '2024-12-31',
      };

      // Act
      const result = CreateTaskSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should infer correct types for AssignTaskInput', () => {
      // Arrange
      const validData: z.infer<typeof AssignTaskSchema> = {
        taskId: '123e4567-e89b-12d3-a456-426614174000',
        assigneeId: '456e4567-e89b-12d3-a456-426614174001',
      };

      // Act
      const result = AssignTaskSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should infer correct types for UpdateTaskStatusInput', () => {
      // Arrange
      const validData: z.infer<typeof UpdateTaskStatusSchema> = {
        taskId: '123e4567-e89b-12d3-a456-426614174000',
        status: 'IN_PROGRESS',
      };

      // Act
      const result = UpdateTaskStatusSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(true);
    });
  });
});
