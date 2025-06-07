import { eq } from 'drizzle-orm';
import { db } from '~/db';
import { users } from '~/db/schema/user';
import { handleDatabaseError, throwNotFound } from '~/lib/trpc-errors';
import type { CreateUser, UpdateUser } from '~/api/modules/user/user.schema';

/**
 * Creates a new user in the database
 * @param input - User creation data (name, email, password, avatar)
 * @returns Promise resolving to the created user (without password)
 * @throws TRPCError if email already exists or database operation fails
 * @example
 * ```ts
 * const user = await createUser({
 *   name: "John Doe",
 *   email: "john@example.com",
 *   password: "hashedPassword123"
 * });
 * ```
 */
export const createUser = async (input: CreateUser) => {
  try {
    const result = await db.insert(users).values(input).returning({
      id: users.id,
      name: users.name,
      email: users.email,
      avatar: users.avatar,
    });
    return result;
  } catch (error) {
    handleDatabaseError(error, 'user', {
      email: 'User with this email already exists',
    });
  }
};

/**
 * Retrieves all users from the database
 * @returns Promise resolving to array of users (id, name, email only)
 * @throws TRPCError if database read operation fails
 */
export const getUsers = async () => {
  try {
    return await db.query.users.findMany({
      columns: {
        id: true,
        name: true,
        email: true,
      },
    });
  } catch (error) {
    handleDatabaseError(error, 'users');
  }
};

/**
 * Retrieves a specific user by their ID
 * @param id - UUID of the user to retrieve
 * @returns Promise resolving to the user data (id, name, email, avatar)
 * @throws TRPCError if user not found or database operation fails
 * @example
 * ```ts
 * const user = await getUserById("123e4567-e89b-12d3-a456-426614174000");
 * ```
 */
export const getUserById = async (id: string) => {
  try {
    const result = await db.query.users.findFirst({
      where: eq(users.id, id),
      columns: {
        id: true,
        name: true,
        email: true,
        avatar: true,
      },
    });

    if (!result) {
      throwNotFound('User', id);
    }

    return result;
  } catch (error) {
    // Re-throw tRPC errors (like NOT_FOUND from throwNotFound)
    if (error instanceof Error && error.name === 'TRPCError') {
      throw error;
    }
    handleDatabaseError(error, 'user');
  }
};

/**
 * Updates an existing user's information
 * @param input - Update data containing user ID and fields to update
 * @returns Promise resolving to the updated user data (without password)
 * @throws TRPCError if user not found, email conflict, or database operation fails
 * @example
 * ```ts
 * const updatedUser = await updateUser({
 *   id: "123e4567-e89b-12d3-a456-426614174000",
 *   name: "Jane Doe",
 *   email: "jane@example.com"
 * });
 * ```
 */
export const updateUser = async ({ id, ...input }: UpdateUser) => {
  try {
    const result = await db.update(users).set(input).where(eq(users.id, id)).returning({
      id: users.id,
      name: users.name,
      email: users.email,
      avatar: users.avatar,
    });

    if (result.length === 0) {
      throwNotFound('User', id);
    }

    return result;
  } catch (error) {
    // Re-throw tRPC errors (like NOT_FOUND from throwNotFound)
    if (error instanceof Error && error.name === 'TRPCError') {
      throw error;
    }
    handleDatabaseError(error, 'user', {
      email: 'Email is already taken by another user',
    });
  }
};

/**
 * Deletes a user from the database
 * @param id - UUID of the user to delete
 * @returns Promise resolving to the deleted user's ID
 * @throws TRPCError if user not found or database operation fails
 * @example
 * ```ts
 * const deletedUser = await deleteUser("123e4567-e89b-12d3-a456-426614174000");
 * ```
 */
export const deleteUser = async (id: string) => {
  try {
    const result = await db.delete(users).where(eq(users.id, id)).returning({ id: users.id });

    if (result.length === 0) {
      throwNotFound('User', id);
    }

    return result;
  } catch (error) {
    // Re-throw tRPC errors (like NOT_FOUND from throwNotFound)
    if (error instanceof Error && error.name === 'TRPCError') {
      throw error;
    }
    handleDatabaseError(error, 'user');
  }
};
