import { initTRPC } from '@trpc/server';
import { cache } from 'react';
import { db } from '~/db';
import { transformer } from '~/lib/transformer';

/**
 * Creates the tRPC context that will be available in all procedures.
 *
 * This function is cached using React's cache() to prevent multiple database
 * connections during server-side rendering. The context provides shared
 * resources like database connection to all tRPC procedures.
 *
 * @returns {Promise<{db: typeof db}>} Context object containing:
 *   - db: Database connection instance from Drizzle ORM
 *
 * @example
 * ```typescript
 * // Used internally by tRPC to create context for each request
 * const context = await createTRPCContext();
 * console.log(context.db); // Drizzle database instance
 * ```
 */
export const createTRPCContext = cache(async () => {
  return {
    db,
  };
});

/**
 * tRPC instance configured with SuperJSON transformer for handling
 * complex data types during serialization/deserialization.
 */
const t = initTRPC.create({
  transformer,
});

/**
 * Reusable router factory function.
 *
 * Use this to create new tRPC routers. All routers should be created
 * using this factory to ensure consistent configuration.
 *
 * @example
 * ```typescript
 * export const userRouter = createTRPCRouter({
 *   getById: baseProcedure
 *     .input(z.object({ id: z.string() }))
 *     .query(({ input, ctx }) => {
 *       return ctx.db.select().from(users).where(eq(users.id, input.id));
 *     }),
 * });
 * ```
 */
export const createTRPCRouter = t.router;

/**
 * Base procedure that all other procedures should extend.
 *
 * This is the foundation for all tRPC procedures and includes
 * the context with database access. You can extend this to add
 * middleware for authentication, validation, etc.
 *
 * @example
 * ```typescript
 * // Public procedure (no auth required)
 * export const publicProcedure = baseProcedure;
 *
 * // Protected procedure (with auth middleware)
 * export const protectedProcedure = baseProcedure.use(authMiddleware);
 * ```
 */
export const baseProcedure = t.procedure;

/**
 * Factory for creating server-side callers.
 *
 * This allows you to call tRPC procedures directly on the server
 * without going through HTTP. Useful for server components,
 * API routes, and server actions.
 *
 * @example
 * ```typescript
 * const createCaller = createCallerFactory(appRouter);
 * const caller = createCaller(await createTRPCContext());
 * const result = await caller.user.getById({ id: '123' });
 * ```
 */
export const createCallerFactory = t.createCallerFactory;
