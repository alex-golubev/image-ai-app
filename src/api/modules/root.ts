import { createTRPCRouter } from '~/api/init';
import { userRoute } from '~/api/modules/user/user.route';

/**
 * Root tRPC router containing all application procedures.
 *
 * This is the main router that exports all available tRPC procedures.
 * All feature-specific routers should be merged into this root router.
 *
 * @example
 * ```typescript
 * // Usage on client side
 * const { data } = api.user.getUsers.useQuery();
 *
 * // Usage on server side
 * const caller = createCaller(context);
 * const users = await caller.user.getUsers();
 * ```
 */
export const rootRouter = createTRPCRouter({
  /**
   * User management procedures
   *
   * Contains all user-related tRPC procedures including:
   * - getUsers: Retrieve all users
   * - getUserById: Get a specific user by ID
   * - createUser: Create a new user
   * - updateUser: Update an existing user
   * - deleteUser: Delete a user
   *
   * @example
   * ```ts
   * // Get all users
   * const { data: users } = api.user.getUsers.useQuery();
   *
   * // Get user by ID
   * const { data: user } = api.user.getUserById.useQuery({ id: 'user-id' });
   *
   * // Create new user
   * const createMutation = api.user.createUser.useMutation();
   * await createMutation.mutateAsync({
   *   name: 'John Doe',
   *   email: 'john@example.com'
   * });
   * ```
   */
  user: userRoute,
});

/**
 * Type definition for the root router.
 *
 * This type is used for client-side type inference and ensures
 * type safety when calling tRPC procedures from React components.
 * Export this type to use with tRPC client setup.
 *
 * @example
 * ```typescript
 * import type { RootRouter } from '~/api/modules/root';
 *
 * // Used in tRPC client configuration
 * const api = createTRPCNext<RootRouter>({
 *   config() {
 *     return { ... };
 *   },
 * });
 * ```
 */
export type RootRouter = typeof rootRouter;
