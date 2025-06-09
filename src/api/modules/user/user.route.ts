import { TRPCError } from '@trpc/server';
import { publicProcedure, createTRPCRouter } from '~/api/init';
import {
  createUser,
  deleteUser,
  getUserById,
  getUsers,
  updateUser,
  authenticateUser,
} from '~/api/modules/user/user.service';
import {
  createUserSchema,
  updateUserSchema,
  authenticateUserSchema,
} from '~/api/modules/user/user.schema';
import { uuidParamSchema } from '~/lib/base-schemas';
import { authRateLimit } from '~/lib/rate-limiter';

/**
 * tRPC router for user-related operations
 * Provides CRUD operations for user management with proper validation and error handling
 *
 * Available procedures:
 * - getUsers: Retrieves all users
 * - getUserById: Retrieves a specific user by ID
 * - createUser: Creates a new user
 * - updateUser: Updates an existing user
 * - deleteUser: Deletes a user by ID
 * - authenticate: Authenticates a user by email and password (with rate limiting)
 *
 * @example
 * ```ts
 * // Usage in client code:
 * const users = await trpc.user.getUsers.query();
 * const user = await trpc.user.getUserById.query({ id: "user-uuid" });
 * const newUser = await trpc.user.createUser.mutate({
 *   name: "John Doe",
 *   email: "john@example.com",
 *   password: "plainTextPassword"
 * });
 * const authenticatedUser = await trpc.user.authenticate.mutate({
 *   email: "john@example.com",
 *   password: "plainTextPassword"
 * });
 * ```
 */
export const userRoute = createTRPCRouter({
  /** Retrieves all users from the database */
  getUsers: publicProcedure.query(() => getUsers()),

  /** Retrieves a specific user by their UUID */
  getUserById: publicProcedure.input(uuidParamSchema).query(({ input }) => getUserById(input.id)),

  /** Creates a new user with the provided data */
  createUser: publicProcedure.input(createUserSchema).mutation(({ input }) => createUser(input)),

  /** Updates an existing user's information */
  updateUser: publicProcedure.input(updateUserSchema).mutation(({ input }) => updateUser(input)),

  /** Deletes a user by their UUID */
  deleteUser: publicProcedure.input(uuidParamSchema).mutation(({ input }) => deleteUser(input.id)),

  /** Authenticates a user by email and password with rate limiting */
  authenticate: publicProcedure.input(authenticateUserSchema).mutation(async ({ input, ctx }) => {
    const { clientIP } = ctx;

    // Check rate limiting
    if (authRateLimit.isLimited(clientIP)) {
      const timeUntilUnblocked = authRateLimit.getTimeRemaining(clientIP);
      const minutesRemaining = Math.ceil(timeUntilUnblocked / (1000 * 60));

      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: `Too many failed login attempts. Please try again in ${minutesRemaining} minutes.`,
      });
    }

    try {
      const user = await authenticateUser(input.email, input.password);

      // Record successful attempt
      authRateLimit.recordSuccess(clientIP);

      return user;
    } catch (error) {
      // Record failed attempt for rate limiting
      authRateLimit.recordFailed(clientIP);

      // Re-throw the original error
      throw error;
    }
  }),
});
