import { z } from 'zod';
import { baseProcedure, createTRPCRouter } from '~/trpc/init';

/**
 * Root tRPC router containing base application procedures.
 *
 * This is the main router that exports all available tRPC procedures.
 * Currently includes a simple "hello" procedure for testing and demonstration.
 * Additional routers should be merged into this root router.
 *
 * @example
 * ```typescript
 * // Usage on client side
 * const { data } = api.hello.useQuery({ name: 'World' });
 * // Returns: { message: 'Hello, World!' }
 *
 * // Usage on server side
 * const caller = createCaller(context);
 * const result = await caller.hello({ name: 'Server' });
 * ```
 */
export const rootRouter = createTRPCRouter({
  /**
   * Simple hello procedure for testing tRPC setup.
   *
   * Takes a name input and returns a personalized greeting message.
   * This procedure demonstrates basic input validation and response formatting.
   *
   * @param input - Object containing the name to greet
   * @param input.name - The name to include in the greeting (required string)
   * @returns Object with personalized greeting message
   */
  hello: baseProcedure.input(z.object({ name: z.string() })).query(({ input }) => {
    return {
      message: `Hello, ${input.name}!`,
    };
  }),
});

/**
 * Type definition for the root router.
 *
 * This type is used for client-side type inference and ensures
 * type safety when calling tRPC procedures from React components.
 * Export this type to use with tRPC client setup.
 */
export type RootRouter = typeof rootRouter;
