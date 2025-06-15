// Mock SuperJSON to avoid ES module issues in tests
jest.mock('superjson', () => ({
  serialize: jest.fn((data) => ({ json: data, meta: undefined })),
  deserialize: jest.fn((data) => data.json),
  stringify: jest.fn((data) => JSON.stringify(data)),
  parse: jest.fn((data) => JSON.parse(data)),
}));

// Mock TextDecoder for Node.js environment
global.TextDecoder = class TextDecoder {
  decode(input?: BufferSource): string {
    if (!input) return '';
    return Buffer.from(input as ArrayBuffer).toString('utf-8');
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

// Mock TextEncoder for Node.js environment
global.TextEncoder = class TextEncoder {
  encode(input?: string): Uint8Array {
    if (!input) return new Uint8Array();
    return new Uint8Array(Buffer.from(input, 'utf-8'));
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

// Mock database to avoid connection issues during testing
jest.mock('~/db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    query: {
      users: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
    },
  },
}));

import { TRPCError } from '@trpc/server';
import { createCallerFactory, createTRPCContext } from '~/api/init';
import { userRoute } from '~/api/modules/user/user.route';

// Mock the user service functions
jest.mock('~/api/modules/user/user.service', () => ({
  createUser: jest.fn(),
  deleteUser: jest.fn(),
  getUserById: jest.fn(),
  getUsers: jest.fn(),
  updateUser: jest.fn(),
  authenticateUser: jest.fn(),
}));

// Mock the rate limiter
jest.mock('~/lib/rate-limiter', () => ({
  authRateLimit: {
    isLimited: jest.fn(),
    getTimeRemaining: jest.fn(),
    recordSuccess: jest.fn(),
    recordFailed: jest.fn(),
  },
}));

// Mock the tRPC context creation to avoid Next.js headers() issues in tests
jest.mock('~/api/init', () => {
  const originalModule = jest.requireActual('~/api/init');
  return {
    ...originalModule,
    createTRPCContext: jest.fn().mockResolvedValue({
      db: {},
      clientIP: '127.0.0.1',
    }),
  };
});

// Import mocked functions
import {
  createUser,
  deleteUser,
  getUserById,
  getUsers,
  updateUser,
  authenticateUser,
} from '~/api/modules/user/user.service';
import { authRateLimit } from '~/lib/rate-limiter';

const mockCreateUser = createUser as jest.MockedFunction<typeof createUser>;
const mockDeleteUser = deleteUser as jest.MockedFunction<typeof deleteUser>;
const mockGetUserById = getUserById as jest.MockedFunction<typeof getUserById>;
const mockGetUsers = getUsers as jest.MockedFunction<typeof getUsers>;
const mockUpdateUser = updateUser as jest.MockedFunction<typeof updateUser>;
const mockAuthenticateUser = authenticateUser as jest.MockedFunction<typeof authenticateUser>;

// Type the mocked rate limiter
const mockAuthRateLimit = authRateLimit as jest.Mocked<typeof authRateLimit>;

describe('User Route', () => {
  const callerFactory = createCallerFactory(userRoute);
  let caller: ReturnType<typeof callerFactory>;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Reset rate limiter mocks to default behavior
    mockAuthRateLimit.isLimited.mockReturnValue(false);
    mockAuthRateLimit.getTimeRemaining.mockReturnValue(0);

    const context = await createTRPCContext();
    caller = callerFactory(context);
  });

  describe('getUsers', () => {
    const mockUsersData = [
      { id: '1', name: 'John Doe', email: 'john@example.com' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
    ];

    it('returns all users successfully', async () => {
      mockGetUsers.mockResolvedValue(mockUsersData);

      const result = await caller.getUsers();

      expect(mockGetUsers).toHaveBeenCalledWith();
      expect(result).toEqual(mockUsersData);
    });

    it('throws TRPCError when service throws error', async () => {
      const error = new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Database error while processing users',
      });
      mockGetUsers.mockRejectedValue(error);

      await expect(caller.getUsers()).rejects.toThrow(error);
    });
  });

  describe('getUserById', () => {
    const userId = '123e4567-e89b-12d3-a456-426614174000';
    const mockUserData = {
      id: userId,
      name: 'John Doe',
      email: 'john@example.com',
      avatar: null,
    };

    it('returns user by ID successfully', async () => {
      mockGetUserById.mockResolvedValue(mockUserData);

      const result = await caller.getUserById({ id: userId });

      expect(mockGetUserById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUserData);
    });

    it('throws TRPCError when user not found', async () => {
      const error = new TRPCError({
        code: 'NOT_FOUND',
        message: `User with ID "${userId}" not found`,
      });
      mockGetUserById.mockRejectedValue(error);

      await expect(caller.getUserById({ id: userId })).rejects.toThrow(error);
    });

    it('validates input schema - rejects invalid UUID', async () => {
      await expect(caller.getUserById({ id: 'invalid-uuid' })).rejects.toThrow();
    });
  });

  describe('createUser', () => {
    const mockCreateInput = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'SecurePass123!',
    };

    const mockCreatedUser = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        email: 'john@example.com',
        avatar: null,
      },
    ];

    it('creates user successfully', async () => {
      mockCreateUser.mockResolvedValue(mockCreatedUser);

      const result = await caller.createUser(mockCreateInput);

      expect(mockCreateUser).toHaveBeenCalledWith(mockCreateInput);
      expect(result).toEqual(mockCreatedUser);
    });

    it('throws TRPCError for duplicate email', async () => {
      const error = new TRPCError({
        code: 'CONFLICT',
        message: 'User with this email already exists',
      });
      mockCreateUser.mockRejectedValue(error);

      await expect(caller.createUser(mockCreateInput)).rejects.toThrow(error);
    });

    it('validates input schema - rejects invalid email', async () => {
      await expect(
        caller.createUser({
          name: 'John Doe',
          email: 'invalid-email',
          password: 'password123',
        }),
      ).rejects.toThrow();
    });
  });

  describe('updateUser', () => {
    const mockUpdateInput = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Jane Doe',
      email: 'jane@example.com',
    };

    const mockUpdatedUser = [
      {
        id: mockUpdateInput.id,
        name: 'Jane Doe',
        email: 'jane@example.com',
        avatar: null,
      },
    ];

    it('updates user successfully', async () => {
      mockUpdateUser.mockResolvedValue(mockUpdatedUser);

      const result = await caller.updateUser(mockUpdateInput);

      expect(mockUpdateUser).toHaveBeenCalledWith(mockUpdateInput);
      expect(result).toEqual(mockUpdatedUser);
    });

    it('throws TRPCError when user not found', async () => {
      const error = new TRPCError({
        code: 'NOT_FOUND',
        message: `User with ID "${mockUpdateInput.id}" not found`,
      });
      mockUpdateUser.mockRejectedValue(error);

      await expect(caller.updateUser(mockUpdateInput)).rejects.toThrow(error);
    });

    it('throws TRPCError for duplicate email', async () => {
      const error = new TRPCError({
        code: 'CONFLICT',
        message: 'Email is already taken by another user',
      });
      mockUpdateUser.mockRejectedValue(error);

      await expect(caller.updateUser(mockUpdateInput)).rejects.toThrow(error);
    });

    it('validates input schema - rejects invalid UUID', async () => {
      await expect(
        caller.updateUser({
          id: 'invalid-uuid',
          name: 'Jane Doe',
        }),
      ).rejects.toThrow();
    });

    it('validates input schema - rejects invalid email', async () => {
      await expect(
        caller.updateUser({
          id: mockUpdateInput.id,
          email: 'invalid-email',
        }),
      ).rejects.toThrow();
    });
  });

  describe('deleteUser', () => {
    const userId = '123e4567-e89b-12d3-a456-426614174000';
    const mockDeletedUser = [{ id: userId }];

    it('deletes user successfully', async () => {
      mockDeleteUser.mockResolvedValue(mockDeletedUser);

      const result = await caller.deleteUser({ id: userId });

      expect(mockDeleteUser).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockDeletedUser);
    });

    it('throws TRPCError when user not found', async () => {
      const error = new TRPCError({
        code: 'NOT_FOUND',
        message: `User with ID "${userId}" not found`,
      });
      mockDeleteUser.mockRejectedValue(error);

      await expect(caller.deleteUser({ id: userId })).rejects.toThrow(error);
    });

    it('validates input schema - rejects invalid UUID', async () => {
      await expect(caller.deleteUser({ id: 'invalid-uuid' })).rejects.toThrow();
    });
  });

  describe('authenticate', () => {
    const mockAuthInput = {
      email: 'john@example.com',
      password: 'plainPassword123',
    };

    const mockAuthenticatedUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'John Doe',
      email: 'john@example.com',
      avatar: null,
    };

    it('authenticates user successfully', async () => {
      mockAuthenticateUser.mockResolvedValue(mockAuthenticatedUser);

      const result = await caller.authenticate(mockAuthInput);

      expect(mockAuthenticateUser).toHaveBeenCalledWith(
        mockAuthInput.email,
        mockAuthInput.password,
      );
      expect(result).toEqual(mockAuthenticatedUser);
    });

    it('throws UNAUTHORIZED error when user not found', async () => {
      const error = new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid email or password',
      });
      mockAuthenticateUser.mockRejectedValue(error);

      await expect(caller.authenticate(mockAuthInput)).rejects.toThrow(error);
    });

    it('throws UNAUTHORIZED error for invalid password', async () => {
      const error = new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid email or password',
      });
      mockAuthenticateUser.mockRejectedValue(error);

      await expect(caller.authenticate(mockAuthInput)).rejects.toThrow(error);
    });

    it('validates input schema - rejects invalid email', async () => {
      await expect(
        caller.authenticate({
          email: 'invalid-email',
          password: 'password123',
        }),
      ).rejects.toThrow();
    });

    it('validates input schema - rejects empty password', async () => {
      await expect(
        caller.authenticate({
          email: 'john@example.com',
          password: '',
        }),
      ).rejects.toThrow();
    });

    it('throws TOO_MANY_REQUESTS when rate limited', async () => {
      mockAuthRateLimit.isLimited.mockReturnValue(true);
      mockAuthRateLimit.getTimeRemaining.mockReturnValue(15 * 60 * 1000); // 15 minutes

      await expect(caller.authenticate(mockAuthInput)).rejects.toThrow(
        new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Too many failed login attempts. Please try again in 15 minutes.',
        }),
      );

      expect(mockAuthRateLimit.isLimited).toHaveBeenCalledWith('127.0.0.1');
      expect(mockAuthRateLimit.getTimeRemaining).toHaveBeenCalledWith('127.0.0.1');
      expect(mockAuthenticateUser).not.toHaveBeenCalled();
    });

    it('records successful attempt on successful authentication', async () => {
      mockAuthRateLimit.isLimited.mockReturnValue(false);
      mockAuthenticateUser.mockResolvedValue(mockAuthenticatedUser);

      const result = await caller.authenticate(mockAuthInput);

      expect(mockAuthRateLimit.recordSuccess).toHaveBeenCalledWith('127.0.0.1');
      expect(result).toEqual(mockAuthenticatedUser);
    });

    it('records failed attempt on authentication failure', async () => {
      mockAuthRateLimit.isLimited.mockReturnValue(false);
      const error = new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid email or password',
      });
      mockAuthenticateUser.mockRejectedValue(error);

      await expect(caller.authenticate(mockAuthInput)).rejects.toThrow(error);

      expect(mockAuthRateLimit.recordFailed).toHaveBeenCalledWith('127.0.0.1');
    });
  });
});
