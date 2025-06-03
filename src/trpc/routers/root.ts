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
   * Home procedure for retrieving application title
   *
   * Takes a base title and appends 'AI' suffix to create full application title.
   * Used for displaying dynamic page titles and headers.
   *
   * @example
   * ```ts
   * // Client-side usage
   * const { data } = api.home.useQuery({ title: 'Image' });
   * // Returns: { text: 'Image AI' }
   * ```
   *
   * @param input - Input parameters object
   * @param input.title - Base title string to be suffixed
   * @returns Object containing formatted title text
   */
  home: baseProcedure.input(z.object({ title: z.string() })).query(({ input }) => {
    return {
      text: `${input.title} AI`,
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
