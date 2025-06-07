import { publicProcedure, createTRPCRouter } from '~/api/init';
import {
  createUser,
  deleteUser,
  getUserById,
  getUsers,
  updateUser,
} from '~/api/modules/user/user.service';
import { createUserSchema, updateUserSchema } from '~/api/modules/user/user.schema';
import { uuidParamSchema } from '~/lib/base-schemas';

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
 *
 * @example
 * ```ts
 * // Usage in client code:
 * const users = await trpc.user.getUsers.query();
 * const user = await trpc.user.getUserById.query({ id: "user-uuid" });
 * const newUser = await trpc.user.createUser.mutate({
 *   name: "John Doe",
 *   email: "john@example.com",
 *   password: "hashedPassword"
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
});

// Alternative approach using handleErrors utility:
// import { baseProcedure, createTRPCRouter, handleErrors } from '~/api/init';
//
// export const userRoute = createTRPCRouter({
//   createUser: baseProcedure.input(createUserSchema).mutation(async ({ input }) => {
//     return await handleErrors(
//       () => createUser(input),
//       { 'duplicate email': 'CONFLICT' } // Custom error mapping
//     );
//   }),
// });
