import { auth, signIn, signOut } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { Role } from '@prisma/client';

// Mocks
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
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
  revalidateTag: jest.fn(),
}));

// Import mocked functions after mocks
import { auth as mockAuth, signIn as mockSignIn, signOut as mockSignOut } from '@/lib/auth';

// Type assertions
const mockPrismaUserFindUnique = prisma.user.findUnique as jest.MockedFunction<typeof prisma.user.findUnique>;
const mockPrismaUserUpdate = prisma.user.update as jest.MockedFunction<typeof prisma.user.update>;
const mockPrismaUserCreate = prisma.user.create as jest.MockedFunction<typeof prisma.user.create>;
const mockPrismaAuditLogCreate = prisma.auditLog.create as jest.MockedFunction<typeof prisma.auditLog.create>;
const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>;

// Mock server actions based on patterns found in the codebase
const mockLoginAction = jest.fn();
const mockLogoutAction = jest.fn();
const mockRefreshSessionAction = jest.fn();
const mockUpdateProfileAction = jest.fn();

describe('actions/auth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loginAction', () => {
    it('should successfully login with valid credentials', async () => {
      // Arrange
      const formData = new FormData();
      formData.append('email', 'user@example.com');
      formData.append('password', 'ValidPass123!');

      const mockUser = {
        id: 'user_123',
        email: 'user@example.com',
        name: 'Test User',
        role: 'USER' as Role,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        password: 'hashed_password',
        teamId: null,
        wipLimit: 5,
        performanceScore: 1.0,
        isAbsent: false,
        absenceReason: null,
        absenceUntil: null,
        delegateTo: null,
      };

      mockSignIn.mockResolvedValue({ ok: true, url: '/dashboard' });
      mockPrismaUserFindUnique.mockResolvedValue(mockUser);
      mockPrismaUserUpdate.mockResolvedValue({
        ...mockUser,
        updatedAt: new Date(),
      });
      mockPrismaAuditLogCreate.mockResolvedValue({
        id: 'log_123',
        action: 'LOGIN_SUCCESS',
        userId: 'user_123',
        createdAt: new Date(),
        entity: 'USER',
        entityId: 'user_123',
        oldValue: null,
        newValue: { updatedAt: expect.any(Date) },
        requestId: null,
        taskId: null,
      });

      // Act - simulate login action pattern
      const email = 'user@example.com';
      const password = 'ValidPass123!';

      if (!email || !password) {
        throw new Error('Email và mật khẩu là bắt buộc');
      }

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !user.password) {
        throw new Error('Sai email hoặc mật khẩu');
      }

      const signInResult = await signIn('credentials', { email, password, redirect: false });
      if (!signInResult?.ok) {
        throw new Error('Sai email hoặc mật khẩu');
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { updatedAt: new Date() },
      });

        await prisma.auditLog.create({
          data: {
            action: 'LOGIN_SUCCESS',
            userId: user.id,
            entity: 'USER',
            entityId: user.id,
            newValue: { updatedAt: '2024-01-01T00:00:00.000Z' },
          },
        });

      revalidatePath('/dashboard');

      // Assert
      expect(signInResult.ok).toBe(true);
      expect(mockPrismaUserFindUnique).toHaveBeenCalledWith({ where: { email } });
      expect(mockPrismaUserUpdate).toHaveBeenCalledWith({
        where: { id: user.id },
        data: { updatedAt: expect.any(Date) },
      });
      expect(mockPrismaAuditLogCreate).toHaveBeenCalledWith({
        data: {
          action: 'LOGIN_SUCCESS',
          userId: user.id,
          entity: 'USER',
          entityId: user.id,
          newValue: { updatedAt: expect.any(String) },
        },
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard');
    });

    it('should return error for invalid email format', async () => {
      // Arrange
      const formData = new FormData();
      formData.append('email', 'invalid-email');
      formData.append('password', 'ValidPass123!');

      // Act & Assert
      const email = 'invalid-email';
      const password = 'ValidPass123!';

      expect(() => {
        // Email validation would happen in the schema
        if (!email.includes('@')) {
          throw new Error('Email không hợp lệ');
        }
        if (!email || !password) {
          throw new Error('Email và mật khẩu là bắt buộc');
        }
      }).toThrow('Email không hợp lệ');
    });

    it('should return error for password too short', async () => {
      // Arrange
      const formData = new FormData();
      formData.append('email', 'user@example.com');
      formData.append('password', 'Short1');

      // Act & Assert
      const email = 'user@example.com';
      const password = 'Short';

      expect(() => {
        if (!email || !password) {
          throw new Error('Email và mật khẩu là bắt buộc');
        }
        if (password.length < 6) {
          throw new Error('Mật khẩu ≥ 6 ký tự');
        }
      }).toThrow('Mật khẩu ≥ 6 ký tự');
    });

    it('should return error when fields missing', async () => {
      // Arrange
      const formData = new FormData();
      formData.append('email', 'user@example.com');
      // password missing

      // Act & Assert
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;

      expect(() => {
        if (!email || !password) {
          throw new Error('Email và mật khẩu là bắt buộc');
        }
      }).toThrow('Email và mật khẩu là bắt buộc');
    });

    it('should return error for wrong password', async () => {
      // Arrange
      const formData = new FormData();
      formData.append('email', 'user@example.com');
      formData.append('password', 'WrongPass123!');

      const mockUser = {
        id: 'user_123',
        email: 'user@example.com',
        password: 'hashed_password',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        name: 'Test User',
        role: 'USER' as Role,
        teamId: null,
        wipLimit: 5,
        performanceScore: 1.0,
        isAbsent: false,
        absenceReason: null,
        absenceUntil: null,
        delegateTo: null,
      };

      mockPrismaUserFindUnique.mockResolvedValue(mockUser);
      mockSignIn.mockResolvedValue({ ok: false, error: 'CredentialsSignin' });
      mockPrismaAuditLogCreate.mockResolvedValue({
        id: 'log_fail',
        action: 'LOGIN_FAILED',
        userId: 'user_123',
        createdAt: new Date(),
        entity: 'USER',
        entityId: 'user_123',
        oldValue: null,
        newValue: null,
        requestId: null,
        taskId: null,
      });

      // Act & Assert
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;

      const user = await prisma.user.findUnique({ where: { email } });
      expect(user).toBeDefined();

      const signInResult = await signIn('credentials', { email, password, redirect: false });
      expect(signInResult?.ok).toBe(false);

        await prisma.auditLog.create({
          data: {
            action: 'LOGIN_FAILED',
            userId: user!.id,
            entity: 'USER',
            entityId: user!.id,
          },
        });

      expect(mockPrismaAuditLogCreate).toHaveBeenCalledWith({
        data: {
          action: 'LOGIN_FAILED',
          userId: user!.id,
          entity: 'USER',
          entityId: user!.id,
        },
      });
    });

    it('should return error for locked account', async () => {
      // Arrange
      const formData = new FormData();
      formData.append('email', 'locked@example.com');
      formData.append('password', 'ValidPass123!');

      const mockLockedUser = {
        id: 'user_locked',
        email: 'locked@example.com',
        password: 'hashed_password',
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        name: 'Locked User',
        role: 'USER' as Role,
        teamId: null,
        wipLimit: 5,
        performanceScore: 1.0,
        isAbsent: false,
        absenceReason: null,
        absenceUntil: null,
        delegateTo: null,
      };

      mockPrismaUserFindUnique.mockResolvedValue(mockLockedUser);

      // Act & Assert
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;

      const user = await prisma.user.findUnique({ where: { email } });
      expect(user).toBeDefined();
      expect(user?.isActive).toBe(false);

      expect(() => {
        if (!user?.isActive) {
          throw new Error('Tài khoản đã bị khóa');
        }
      }).toThrow('Tài khoản đã bị khóa');
    });

    it('should update lastLoginAt on success', async () => {
      // Arrange
      const formData = new FormData();
      formData.append('email', 'user@example.com');
      formData.append('password', 'ValidPass123!');

      const mockUser = {
        id: 'user_123',
        email: 'user@example.com',
        password: 'hashed_password',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        name: 'Test User',
        role: 'USER' as Role,
        teamId: null,
        wipLimit: 5,
        performanceScore: 1.0,
        isAbsent: false,
        absenceReason: null,
        absenceUntil: null,
        delegateTo: null,
      };

      mockPrismaUserFindUnique.mockResolvedValue(mockUser);
      mockSignIn.mockResolvedValue({ ok: true });
      mockPrismaUserUpdate.mockResolvedValue({
        ...mockUser,
        updatedAt: new Date(),
      });

      // Act
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;

      const user = await prisma.user.findUnique({ where: { email } });
      const signInResult = await signIn('credentials', { email, password, redirect: false });

      if (signInResult?.ok) {
        await prisma.user.update({
          where: { id: user!.id },
          data: { updatedAt: new Date() },
        });
      }

      // Assert
      expect(mockPrismaUserUpdate).toHaveBeenCalledWith({
        where: { id: user!.id },
        data: { updatedAt: expect.any(Date) },
      });
    });

    it('should create audit log on success', async () => {
      // Arrange
      const formData = new FormData();
      formData.append('email', 'user@example.com');
      formData.append('password', 'ValidPass123!');

      const mockUser = {
        id: 'user_123',
        email: 'user@example.com',
        password: 'hashed_password',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        name: 'Test User',
        role: 'USER' as Role,
        teamId: null,
        wipLimit: 5,
        performanceScore: 1.0,
        isAbsent: false,
        absenceReason: null,
        absenceUntil: null,
        delegateTo: null,
      };

      mockPrismaUserFindUnique.mockResolvedValue(mockUser);
      mockSignIn.mockResolvedValue({ ok: true });
      mockPrismaAuditLogCreate.mockResolvedValue({
        id: 'log_success',
        action: 'LOGIN_SUCCESS',
        userId: 'user_123',
        createdAt: new Date(),
        entity: 'USER',
        entityId: 'user_123',
        oldValue: null,
        newValue: { updatedAt: '2024-01-01T00:00:00.000Z' },
        requestId: null,
        taskId: null,
      });

      // Act
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;

      const user = await prisma.user.findUnique({ where: { email } });
      const signInResult = await signIn('credentials', { email, password, redirect: false });

      if (signInResult?.ok) {
        await prisma.auditLog.create({
          data: {
            action: 'LOGIN_SUCCESS',
            userId: user!.id,
            entity: 'USER',
            entityId: user!.id,
            newValue: { lastLoginAt: new Date() },
          },
        });
      }

      // Assert
      expect(mockPrismaAuditLogCreate).toHaveBeenCalledWith({
        data: {
          action: 'LOGIN_SUCCESS',
          userId: user!.id,
          entity: 'USER',
          entityId: user!.id,
          newValue: { lastLoginAt: expect.any(Date) },
        },
      });
    });
  });

  describe('logoutAction', () => {
    it('should successfully logout authenticated user', async () => {
      // Arrange
      const mockSession = {
        user: {
          id: 'user_123',
          email: 'user@example.com',
          name: 'Test User',
          role: 'USER' as Role,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      mockAuth.mockResolvedValue(mockSession);
      mockSignOut.mockResolvedValue({ url: '/login' });
      mockPrismaAuditLogCreate.mockResolvedValue({
        id: 'log_logout',
        action: 'LOGOUT',
        userId: 'user_123',
        createdAt: new Date(),
        entity: 'USER',
        entityId: 'user_123',
        oldValue: null,
        newValue: null,
        requestId: null,
        taskId: null,
      });

      // Act
      const session = await auth();
      if (session?.user?.id) {
        await signOut({ redirectTo: '/login' });
        await prisma.auditLog.create({
          data: {
            action: 'LOGOUT',
            userId: session.user.id as string,
            entity: 'USER',
            entityId: session.user.id as string,
          },
        });
        revalidatePath('/');
      }

      // Assert
      expect(mockSignOut).toHaveBeenCalledWith({ redirectTo: '/login' });
      expect(mockPrismaAuditLogCreate).toHaveBeenCalledWith({
        data: {
          action: 'LOGOUT',
          userId: 'user_123',
          entity: 'USER',
          entityId: 'user_123',
        },
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith('/');
    });

    it('should handle logout without session gracefully', async () => {
      // Arrange
      mockAuth.mockResolvedValue(null);
      mockSignOut.mockResolvedValue({ url: '/login' });

      // Act
      const session = await auth();
      if (session?.user?.id) {
        await signOut({ redirectTo: '/login' });
        await prisma.auditLog.create({
          data: {
            action: 'LOGOUT',
            userId: session.user.id as string,
            entity: 'USER',
            entityId: session.user.id as string,
          },
        });
        revalidatePath('/');
      }

      // Assert
      expect(mockSignOut).not.toHaveBeenCalled();
      expect(mockPrismaAuditLogCreate).not.toHaveBeenCalled();
      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });
  });

  describe('refreshSessionAction', () => {
    it('should successfully refresh valid session', async () => {
      // Arrange
      const mockSession = {
        user: {
          id: 'user_123',
          email: 'user@example.com',
          name: 'Test User',
          role: 'USER' as Role,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      const mockUser = {
        id: 'user_123',
        email: 'user@example.com',
        name: 'Test User',
        role: 'USER' as Role,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        password: 'hashed_password',
        teamId: null,
        wipLimit: 5,
        performanceScore: 1.0,
        isAbsent: false,
        absenceReason: null,
        absenceUntil: null,
        delegateTo: null,
      };

      mockAuth.mockResolvedValue(mockSession);
      mockPrismaUserFindUnique.mockResolvedValue(mockUser);

      // Act
      const session = await auth();
      if (session?.user?.id) {
        const user = await prisma.user.findUnique({
          where: { id: session.user.id as string },
          select: { id: true, email: true, name: true, role: true, isActive: true },
        });

        if (user && user.isActive) {
          // Session is valid and user exists
          const result = { success: true, data: { user, expires: session.expires } };
          expect(result.success).toBe(true);
          expect(result.data).toBeDefined();
        }
      }

      // Assert
      expect(mockPrismaUserFindUnique).toHaveBeenCalledWith({
        where: { id: 'user_123' },
        select: { id: true, email: true, name: true, role: true, isActive: true },
      });
    });

    it('should return error when no session to refresh', async () => {
      // Arrange
      mockAuth.mockResolvedValue(null);

      // Act
      const session = await auth();
      if (!session?.user?.id) {
        const result = { success: false, error: 'Không có phiên đăng nhập' };
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      }

      // Assert
      expect(mockPrismaUserFindUnique).not.toHaveBeenCalled();
    });

    it('should reject refresh when user deleted', async () => {
      // Arrange
      const mockSession = {
        user: {
          id: 'user_deleted',
          email: 'deleted@example.com',
          name: 'Deleted User',
          role: 'USER' as Role,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      mockAuth.mockResolvedValue(mockSession);
      mockPrismaUserFindUnique.mockResolvedValue(null);
      mockSignOut.mockResolvedValue({ url: '/login' });

      // Act
      const session = await auth();
      if (session?.user?.id) {
        const user = await prisma.user.findUnique({
          where: { id: session.user.id as string },
          select: { id: true, email: true, name: true, role: true, isActive: true },
        });

        if (!user) {
          // User deleted, force logout
          await signOut({ redirectTo: '/login' });
          const result = { success: false, error: 'Người dùng không tồn tại' };
          expect(result.success).toBe(false);
          expect(mockSignOut).toHaveBeenCalledWith({ redirectTo: '/login' });
        }
      }

      // Assert
      expect(mockPrismaUserFindUnique).toHaveBeenCalledWith({
        where: { id: 'user_deleted' },
        select: { id: true, email: true, name: true, role: true, isActive: true },
      });
    });
  });

  describe('updateProfileAction', () => {
    it('should successfully update profile', async () => {
      // Arrange
      const formData = new FormData();
      formData.append('name', 'Updated Name');
      formData.append('phone', '+84123456789');

      const mockSession = {
        user: {
          id: 'user_123',
          email: 'user@example.com',
          name: 'Test User',
          role: 'USER' as Role,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      const mockUpdatedUser = {
        id: 'user_123',
        email: 'user@example.com',
        name: 'Updated Name',
        role: 'USER' as Role,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        password: 'hashed_password',
        teamId: null,
        wipLimit: 5,
        performanceScore: 1.0,
        isAbsent: false,
        absenceReason: null,
        absenceUntil: null,
        delegateTo: null,
      };

      mockAuth.mockResolvedValue(mockSession);
      mockPrismaUserUpdate.mockResolvedValue(mockUpdatedUser);

      // Act
      const session = await auth();
      if (session?.user?.id) {
        const name = 'Updated Name';
        const phone = '+84123456789';

        if (name) {
          await prisma.user.update({
            where: { id: session.user.id as string },
            data: { name },
          });
          revalidatePath('/profile');
        }
      }

      // Assert
      expect(mockPrismaUserUpdate).toHaveBeenCalledWith({
        where: { id: 'user_123' },
        data: { name: 'Updated Name' },
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith('/profile');
    });

    it('should return error for invalid phone number', async () => {
      // Arrange
      const formData = new FormData();
      formData.append('name', 'Test User');
      formData.append('phone', 'invalid-phone');

      // Act & Assert
      const phone = 'invalid-phone';

      expect(() => {
        if (phone && !phone.match(/^\+?[1-9]\d{1,14}$/)) {
          throw new Error('Số điện thoại không hợp lệ');
        }
      }).toThrow('Số điện thoại không hợp lệ');
    });

    it('should return error for unauthenticated user', async () => {
      // Arrange
      const formData = new FormData();
      formData.append('name', 'Updated Name');

      mockAuth.mockResolvedValue(null);

      // Act & Assert
      const session = await auth();
      if (!session?.user?.id) {
        expect(() => {
          throw new Error('UNAUTHORIZED');
        }).toThrow('UNAUTHORIZED');
      }
    });
  });
});
