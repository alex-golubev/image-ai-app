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

// Mock database and schema
jest.mock('~/db', () => ({
  db: {
    insert: jest.fn(),
    query: {
      users: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
    },
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('~/db/schema/user', () => ({
  users: {
    id: 'id',
    name: 'name',
    email: 'email',
    avatar: 'avatar',
  },
}));

import { TRPCError } from '@trpc/server';
import { db } from '~/db';
import { users } from '~/db/schema/user';

// Import after mocking
import { createUser, deleteUser, getUserById, getUsers, updateUser } from './user.service';

// Get mocked instances - using any to avoid complex Drizzle types in tests
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDb = db as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockUsers = users as any;

describe('User Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    const mockUserInput = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'hashedPassword123',
    };

    const mockUserOutput = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'John Doe',
      email: 'john@example.com',
      avatar: null,
    };

    it('creates a user successfully', async () => {
      const mockInsert = {
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([mockUserOutput]),
      };
      mockDb.insert.mockReturnValue(mockInsert);

      const result = await createUser(mockUserInput);

      expect(mockDb.insert).toHaveBeenCalledWith(mockUsers);
      expect(mockInsert.values).toHaveBeenCalledWith(mockUserInput);
      expect(mockInsert.returning).toHaveBeenCalledWith({
        id: mockUsers.id,
        name: mockUsers.name,
        email: mockUsers.email,
        avatar: mockUsers.avatar,
      });
      expect(result).toEqual([mockUserOutput]);
    });

    it('throws CONFLICT error for duplicate email', async () => {
      const mockInsert = {
        values: jest.fn().mockReturnThis(),
        returning: jest
          .fn()
          .mockRejectedValue(
            new Error('duplicate key value violates unique constraint "users_email_unique"'),
          ),
      };
      mockDb.insert.mockReturnValue(mockInsert);

      await expect(createUser(mockUserInput)).rejects.toThrow(TRPCError);
      await expect(createUser(mockUserInput)).rejects.toThrow(
        'User with this email already exists',
      );
    });

    it('throws INTERNAL_SERVER_ERROR for database errors', async () => {
      const mockInsert = {
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockRejectedValue(new Error('Database connection failed')),
      };
      mockDb.insert.mockReturnValue(mockInsert);

      await expect(createUser(mockUserInput)).rejects.toThrow(TRPCError);
      await expect(createUser(mockUserInput)).rejects.toThrow(
        'Database error while processing user',
      );
    });
  });

  describe('getUsers', () => {
    const mockUsersOutput = [
      { id: '1', name: 'John Doe', email: 'john@example.com' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
    ];

    it('retrieves all users successfully', async () => {
      mockDb.query.users.findMany.mockResolvedValue(mockUsersOutput);

      const result = await getUsers();

      expect(mockDb.query.users.findMany).toHaveBeenCalledWith({
        columns: {
          id: true,
          name: true,
          email: true,
        },
      });
      expect(result).toEqual(mockUsersOutput);
    });

    it('throws INTERNAL_SERVER_ERROR for database errors', async () => {
      mockDb.query.users.findMany.mockRejectedValue(new Error('Database connection failed'));

      await expect(getUsers()).rejects.toThrow(TRPCError);
      await expect(getUsers()).rejects.toThrow('Database error while processing users');
    });
  });

  describe('getUserById', () => {
    const userId = '123e4567-e89b-12d3-a456-426614174000';
    const mockUserOutput = {
      id: userId,
      name: 'John Doe',
      email: 'john@example.com',
      avatar: null,
    };

    it('retrieves user by ID successfully', async () => {
      mockDb.query.users.findFirst.mockResolvedValue(mockUserOutput);

      const result = await getUserById(userId);

      expect(mockDb.query.users.findFirst).toHaveBeenCalledWith({
        where: expect.any(Object), // eq(users.id, userId)
        columns: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      });
      expect(result).toEqual(mockUserOutput);
    });

    it('throws NOT_FOUND error when user does not exist', async () => {
      mockDb.query.users.findFirst.mockResolvedValue(null);

      await expect(getUserById(userId)).rejects.toThrow(TRPCError);
      await expect(getUserById(userId)).rejects.toThrow(`User with ID "${userId}" not found`);
    });

    it('throws INTERNAL_SERVER_ERROR for database errors', async () => {
      mockDb.query.users.findFirst.mockRejectedValue(new Error('Database connection failed'));

      await expect(getUserById(userId)).rejects.toThrow(TRPCError);
      await expect(getUserById(userId)).rejects.toThrow('Database error while processing user');
    });
  });

  describe('updateUser', () => {
    const mockUpdateInput = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Jane Doe',
      email: 'jane@example.com',
    };

    const mockUserOutput = {
      id: mockUpdateInput.id,
      name: 'Jane Doe',
      email: 'jane@example.com',
      avatar: null,
    };

    it('updates user successfully', async () => {
      const mockUpdate = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([mockUserOutput]),
      };
      mockDb.update.mockReturnValue(mockUpdate);

      const result = await updateUser(mockUpdateInput);

      expect(mockDb.update).toHaveBeenCalledWith(mockUsers);
      expect(mockUpdate.set).toHaveBeenCalledWith({
        name: mockUpdateInput.name,
        email: mockUpdateInput.email,
      });
      expect(mockUpdate.where).toHaveBeenCalledWith(expect.any(Object)); // eq(users.id, id)
      expect(mockUpdate.returning).toHaveBeenCalledWith({
        id: mockUsers.id,
        name: mockUsers.name,
        email: mockUsers.email,
        avatar: mockUsers.avatar,
      });
      expect(result).toEqual([mockUserOutput]);
    });

    it('throws NOT_FOUND error when user does not exist', async () => {
      const mockUpdate = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([]), // Empty array means no rows affected
      };
      mockDb.update.mockReturnValue(mockUpdate);

      await expect(updateUser(mockUpdateInput)).rejects.toThrow(TRPCError);
      await expect(updateUser(mockUpdateInput)).rejects.toThrow(
        `User with ID "${mockUpdateInput.id}" not found`,
      );
    });

    it('throws CONFLICT error for duplicate email', async () => {
      const mockUpdate = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest
          .fn()
          .mockRejectedValue(
            new Error('duplicate key value violates unique constraint "users_email_unique"'),
          ),
      };
      mockDb.update.mockReturnValue(mockUpdate);

      await expect(updateUser(mockUpdateInput)).rejects.toThrow(TRPCError);
      await expect(updateUser(mockUpdateInput)).rejects.toThrow(
        'Email is already taken by another user',
      );
    });

    it('throws INTERNAL_SERVER_ERROR for database errors', async () => {
      const mockUpdate = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockRejectedValue(new Error('Database connection failed')),
      };
      mockDb.update.mockReturnValue(mockUpdate);

      await expect(updateUser(mockUpdateInput)).rejects.toThrow(TRPCError);
      await expect(updateUser(mockUpdateInput)).rejects.toThrow(
        'Database error while processing user',
      );
    });
  });

  describe('deleteUser', () => {
    const userId = '123e4567-e89b-12d3-a456-426614174000';
    const mockDeleteOutput = { id: userId };

    it('deletes user successfully', async () => {
      const mockDelete = {
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([mockDeleteOutput]),
      };
      mockDb.delete.mockReturnValue(mockDelete);

      const result = await deleteUser(userId);

      expect(mockDb.delete).toHaveBeenCalledWith(mockUsers);
      expect(mockDelete.where).toHaveBeenCalledWith(expect.any(Object)); // eq(users.id, id)
      expect(mockDelete.returning).toHaveBeenCalledWith({ id: mockUsers.id });
      expect(result).toEqual([mockDeleteOutput]);
    });

    it('throws NOT_FOUND error when user does not exist', async () => {
      const mockDelete = {
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([]), // Empty array means no rows affected
      };
      mockDb.delete.mockReturnValue(mockDelete);

      await expect(deleteUser(userId)).rejects.toThrow(TRPCError);
      await expect(deleteUser(userId)).rejects.toThrow(`User with ID "${userId}" not found`);
    });

    it('throws INTERNAL_SERVER_ERROR for database errors', async () => {
      const mockDelete = {
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockRejectedValue(new Error('Database connection failed')),
      };
      mockDb.delete.mockReturnValue(mockDelete);

      await expect(deleteUser(userId)).rejects.toThrow(TRPCError);
      await expect(deleteUser(userId)).rejects.toThrow('Database error while processing user');
    });
  });
});
