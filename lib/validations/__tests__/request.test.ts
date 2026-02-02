import { z } from 'zod';
import { createRequestSchema, GDRIVE_REGEX } from '../request';

describe('lib/validations/request', () => {
  describe('createRequestSchema', () => {
    it('should validate complete valid request data', () => {
      // Arrange
      const validData = {
        title: 'Valid Request Title',
        description: 'This is a valid description with at least 20 characters to meet minimum requirements.',
        priority: 'MEDIUM' as const,
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
      };

      // Act
      const result = createRequestSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe(validData.title);
        expect(result.data.description).toBe(validData.description);
        expect(result.data.priority).toBe(validData.priority);
      }
    });

    it('should reject title shorter than 5 characters', () => {
      // Arrange
      const invalidData = {
        title: 'Abcd', // Only 4 chars
        description: 'Valid description with more than 20 characters here.',
        priority: 'MEDIUM' as const,
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
      };

      // Act
      const result = createRequestSchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('title');
        expect(result.error.issues[0].message).toMatch(/5/);
      }
    });

    it('should reject title longer than 200 characters', () => {
      // Arrange
      const invalidData = {
        title: 'A'.repeat(201), // 201 chars
        description: 'Valid description with more than 20 characters here.',
        priority: 'MEDIUM' as const,
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
      };

      // Act
      const result = createRequestSchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('title');
        expect(result.error.issues[0].message).toMatch(/200/);
      }
    });

    it('should reject description shorter than 20 characters', () => {
      // Arrange
      const invalidData = {
        title: 'Valid Title',
        description: 'Too short', // Less than 20 chars
        priority: 'MEDIUM' as const,
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
      };

      // Act
      const result = createRequestSchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('description');
      }
    });

    it('should reject description longer than 5000 characters', () => {
      // Arrange
      const invalidData = {
        title: 'Valid Title',
        description: 'A'.repeat(5001), // 5001 chars
        priority: 'MEDIUM' as const,
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
      };

      // Act
      const result = createRequestSchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('description');
      }
    });

    it('should reject invalid priority enum value', () => {
      // Arrange
      const invalidData = {
        title: 'Valid Title',
        description: 'Valid description with more than 20 characters here.',
        priority: 'SUPER_URGENT', // Invalid enum
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
      };

      // Act
      const result = createRequestSchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('priority');
      }
    });

    it('should accept all valid priority enum values', () => {
      // Arrange
      const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

      priorities.forEach(priority => {
        const validData = {
          title: 'Valid Title',
          description: 'Valid description with more than 20 characters here.',
          priority,
          categoryId: '123e4567-e89b-12d3-a456-426614174000',
        };

        // Act
        const result = createRequestSchema.safeParse(validData);

        // Assert
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid categoryId (not a UUID)', () => {
      // Arrange
      const invalidData = {
        title: 'Valid Title',
        description: 'Valid description with more than 20 characters here.',
        priority: 'MEDIUM' as const,
        categoryId: 'invalid-category-id',
      };

      // Act
      const result = createRequestSchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('categoryId');
      }
    });

    it('should reject empty categoryId', () => {
      // Arrange
      const invalidData = {
        title: 'Valid Title',
        description: 'Valid description with more than 20 characters here.',
        priority: 'MEDIUM' as const,
        categoryId: '',
      };

      // Act
      const result = createRequestSchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('categoryId');
      }
    });

    it('should reject deadline in the past', () => {
      // Arrange
      const invalidData = {
        title: 'Valid Title',
        description: 'Valid description with more than 20 characters here.',
        priority: 'MEDIUM' as const,
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
        deadline: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      };

      // Act
      const result = createRequestSchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('deadline');
      }
    });

    it('should accept deadline exactly today', () => {
      // Arrange
      const boundaryData = {
        title: 'Valid Title',
        description: 'Valid description with more than 20 characters here.',
        priority: 'MEDIUM' as const,
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
        deadline: new Date().toISOString(), // Today
      };

      // Act
      const result = createRequestSchema.safeParse(boundaryData);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should accept deadline in the future', () => {
      // Arrange
      const validData = {
        title: 'Valid Title',
        description: 'Valid description with more than 20 characters here.',
        priority: 'MEDIUM' as const,
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
        deadline: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      };

      // Act
      const result = createRequestSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.deadline).toBe(validData.deadline);
      }
    });

    it('should accept valid data without deadline (optional)', () => {
      // Arrange
      const minimalData = {
        title: 'Valid Title',
        description: 'Valid description with more than 20 characters here.',
        priority: 'MEDIUM' as const,
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
      };

      // Act
      const result = createRequestSchema.safeParse(minimalData);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.deadline).toBeUndefined();
      }
    });

    it('should reject when title is missing', () => {
      // Arrange
      const invalidData = {
        description: 'Valid description with more than 20 characters here.',
        priority: 'MEDIUM' as const,
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
      };

      // Act
      const result = createRequestSchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('title'))).toBe(true);
      }
    });

    it('should reject when description is missing', () => {
      // Arrange
      const invalidData = {
        title: 'Valid Title',
        priority: 'MEDIUM' as const,
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
      };

      // Act
      const result = createRequestSchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('description'))).toBe(true);
      }
    });

    it('should reject when priority is missing', () => {
      // Arrange
      const invalidData = {
        title: 'Valid Title',
        description: 'Valid description with more than 20 characters here.',
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
      };

      // Act
      const result = createRequestSchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('priority'))).toBe(true);
      }
    });

    it('should accept when categoryId is missing (optional unless template is used)', () => {
      // Arrange
      const validData = {
        title: 'Valid Title',
        description: 'Valid description with more than 20 characters here.',
        priority: 'MEDIUM' as const,
      };

      // Act
      const result = createRequestSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should validate with valid attachments', () => {
      // Arrange
      const validData = {
        title: 'Valid Title',
        description: 'Valid description with more than 20 characters here.',
        priority: 'MEDIUM' as const,
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
        attachments: [
          {
            fileName: 'document.pdf',
            fileUrl: 'https://drive.google.com/file/d/1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p/view',
          },
        ],
      };

      // Act
      const result = createRequestSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.attachments).toBeDefined();
        expect(result.data.attachments?.length).toBe(1);
      }
    });

    it('should reject attachments exceeding 5 files', () => {
      // Arrange
      const validData = {
        title: 'Valid Title',
        description: 'Valid description with more than 20 characters here.',
        priority: 'MEDIUM' as const,
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
        attachments: Array.from({ length: 6 }, (_, i) => ({
          fileName: `document${i}.pdf`,
          fileUrl: `https://drive.google.com/file/d/1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p${i}/view`,
        })),
      };

      // Act
      const result = createRequestSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('attachments');
      }
    });

    it('should reject invalid Google Drive URL', () => {
      // Arrange
      const validData = {
        title: 'Valid Title',
        description: 'Valid description with more than 20 characters here.',
        priority: 'MEDIUM' as const,
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
        attachments: [
          {
            fileName: 'document.pdf',
            fileUrl: 'https://invalid-url.com/file.pdf',
          },
        ],
      };

      // Act
      const result = createRequestSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('fileUrl');
      }
    });

    it('should accept various Google Drive URL formats', () => {
      // Arrange
      const validUrls = [
        'https://drive.google.com/file/d/1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p/view',
        'https://drive.google.com/open?id=1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p',
        'drive.google.com/file/d/1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p',
      ];

      validUrls.forEach(url => {
        const validData = {
          title: 'Valid Title',
          description: 'Valid description with more than 20 characters here.',
          priority: 'MEDIUM' as const,
          categoryId: '123e4567-e89b-12d3-a456-426614174000',
          attachments: [
            {
              fileName: 'document.pdf',
              fileUrl: url,
            },
          ],
        };

        // Act
        const result = createRequestSchema.safeParse(validData);

        // Assert
        expect(result.success).toBe(true);
      });
    });

    it('should validate tags array', () => {
      // Arrange
      const validData = {
        title: 'Valid Title',
        description: 'Valid description with more than 20 characters here.',
        priority: 'MEDIUM' as const,
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
        tags: ['tag1', 'tag2', 'tag3'],
      };

      // Act
      const result = createRequestSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tags).toBeDefined();
        expect(result.data.tags?.length).toBe(3);
      }
    });

    it('should reject tags exceeding 10 items', () => {
      // Arrange
      const validData = {
        title: 'Valid Title',
        description: 'Valid description with more than 20 characters here.',
        priority: 'MEDIUM' as const,
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
        tags: Array.from({ length: 11 }, (_, i) => `tag${i}`),
      };

      // Act
      const result = createRequestSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('tags');
      }
    });

    it('should reject empty tags', () => {
      // Arrange
      const validData = {
        title: 'Valid Title',
        description: 'Valid description with more than 20 characters here.',
        priority: 'MEDIUM' as const,
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
        tags: ['tag1', '', 'tag3'],
      };

      // Act
      const result = createRequestSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('tags');
      }
    });

    it('should validate urgencyScore range', () => {
      // Arrange
      const testCases = [
        { urgencyScore: 0, shouldPass: false },
        { urgencyScore: 1, shouldPass: true },
        { urgencyScore: 5, shouldPass: true },
        { urgencyScore: 6, shouldPass: false },
      ];

      testCases.forEach(({ urgencyScore, shouldPass }) => {
        const validData = {
          title: 'Valid Title',
          description: 'Valid description with more than 20 characters here.',
          priority: 'MEDIUM' as const,
          categoryId: '123e4567-e89b-12d3-a456-426614174000',
          urgencyScore,
        };

        // Act
        const result = createRequestSchema.safeParse(validData);

        // Assert
        expect(result.success).toBe(shouldPass);
      });
    });

    it('should reject non-integer urgencyScore', () => {
      // Arrange
      const validData = {
        title: 'Valid Title',
        description: 'Valid description with more than 20 characters here.',
        priority: 'MEDIUM' as const,
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
        urgencyScore: 3.5,
      };

      // Act
      const result = createRequestSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('urgencyScore');
      }
    });

    it('should validate isUrgent boolean coercion', () => {
      // Arrange
      const testCases = [
        { isUrgent: true, expected: true },
        { isUrgent: false, expected: false },
        { isUrgent: 'true', expected: true },
        { isUrgent: 1, expected: true },
      ];

      testCases.forEach(({ isUrgent, expected }) => {
        const validData = {
          title: 'Valid Title',
          description: 'Valid description with more than 20 characters here.',
          priority: 'MEDIUM' as const,
          categoryId: '123e4567-e89b-12d3-a456-426614174000',
          isUrgent,
        };

        // Act
        const result = createRequestSchema.safeParse(validData);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.isUrgent).toBe(expected);
        }
      });
    });

    it('should default isUrgent to false when not provided', () => {
      // Arrange
      const validData = {
        title: 'Valid Title',
        description: 'Valid description with more than 20 characters here.',
        priority: 'MEDIUM' as const,
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
      };

      // Act
      const result = createRequestSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isUrgent).toBe(false);
      }
    });

    it('should validate requesterType enum', () => {
      // Arrange
      const testCases = ['CUSTOMER', 'INTERNAL'];

      testCases.forEach(requesterType => {
        const validData = {
          title: 'Valid Title',
          description: 'Valid description with more than 20 characters here.',
          priority: 'MEDIUM' as const,
          categoryId: '123e4567-e89b-12d3-a456-426614174000',
          requesterType,
        };

        // Act
        const result = createRequestSchema.safeParse(validData);

        // Assert
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid requesterType', () => {
      // Arrange
      const validData = {
        title: 'Valid Title',
        description: 'Valid description with more than 20 characters here.',
        priority: 'MEDIUM' as const,
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
        requesterType: 'INVALID',
      };

      // Act
      const result = createRequestSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('requesterType');
      }
    });

    it('should default requesterType to INTERNAL when not provided', () => {
      // Arrange
      const validData = {
        title: 'Valid Title',
        description: 'Valid description with more than 20 characters here.',
        priority: 'MEDIUM' as const,
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
      };

      // Act
      const result = createRequestSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.requesterType).toBe('INTERNAL');
      }
    });

    it('should validate customScores record', () => {
      // Arrange
      const validData = {
        title: 'Valid Title',
        description: 'Valid description with more than 20 characters here.',
        priority: 'MEDIUM' as const,
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
        customScores: {
          'custom1': 3,
          'custom2': 5,
        },
      };

      // Act
      const result = createRequestSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.customScores).toBeDefined();
        expect(result.data.customScores?.custom1).toBe(3);
        expect(result.data.customScores?.custom2).toBe(5);
      }
    });

    it('should reject customScores with invalid values', () => {
      // Arrange
      const validData = {
        title: 'Valid Title',
        description: 'Valid description with more than 20 characters here.',
        priority: 'MEDIUM' as const,
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
        customScores: {
          'custom1': 6, // Out of range
        },
      };

      // Act
      const result = createRequestSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('customScores');
      }
    });

    it('should validate complete request with all optional fields', () => {
      // Arrange
      const completeData = {
        title: 'Complete Request Title',
        description: 'This is a complete description with all possible fields filled in to test comprehensive validation logic.',
        priority: 'URGENT' as const,
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
        deadline: new Date(Date.now() + 86400000).toISOString(),
        attachments: [
          {
            fileName: 'document.pdf',
            fileUrl: 'https://drive.google.com/file/d/1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p/view',
          },
        ],
        tags: ['important', 'urgent', 'priority'],
        isUrgent: true,
        urgencyScore: 5,
        impactScore: 4,
        riskScore: 3,
        customScores: {
          'business_value': 5,
        },
        requesterType: 'CUSTOMER' as const,
      };

      // Act
      const result = createRequestSchema.safeParse(completeData);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe(completeData.title);
        expect(result.data.attachments).toHaveLength(1);
        expect(result.data.tags).toHaveLength(3);
        expect(result.data.isUrgent).toBe(true);
        expect(result.data.urgencyScore).toBe(5);
        expect(result.data.impactScore).toBe(4);
        expect(result.data.riskScore).toBe(3);
        expect(result.data.customScores).toBeDefined();
        expect(result.data.requesterType).toBe('CUSTOMER');
      }
    });
  });

  describe('GDRIVE_REGEX', () => {
    it('should match Google Drive file URLs', () => {
      const validUrls = [
        'https://drive.google.com/file/d/1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p/view',
        'https://drive.google.com/open?id=1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p',
        'drive.google.com/file/d/1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p',
      ];

      validUrls.forEach(url => {
        expect(GDRIVE_REGEX.test(url)).toBe(true);
      });
    });

    it('should not match invalid URLs', () => {
      const invalidUrls = [
        'https://example.com/file.pdf',
        'https://drive.google.com/invalid-path',
        'not-a-url',
      ];

      invalidUrls.forEach(url => {
        expect(GDRIVE_REGEX.test(url)).toBe(false);
      });
    });
  });
});
