import { initTRPC } from '@trpc/server';
import { cache } from 'react';
import { headers } from 'next/headers';
import { db } from '~/db';
import { transformer } from '~/lib/transformer';

/**
 * Type definition for tRPC context
 */
export type TRPCContext = {
  db: typeof db;
  clientIP: string;
};

/**
 * Creates the tRPC context that will be available in all procedures.
 *
 * This function is cached using React's cache() to prevent multiple database
 * connections during server-side rendering. The context provides shared
 * resources like database connection and client IP to all tRPC procedures.
 *
 * @returns {Promise<TRPCContext>} Context object containing:
 *   - db: Database connection instance from Drizzle ORM
 *   - clientIP: Client IP address for rate limiting and security
 *
 * @example
 * ```typescript
 * // Used internally by tRPC to create context for each request
 * const context = await createTRPCContext();
 * console.log(context.db); // Drizzle database instance
 * console.log(context.clientIP); // Client IP address
 * ```
 */
export const createTRPCContext = cache(async (): Promise<TRPCContext> => {
  const headersList = await headers();

  // Get client IP from various possible headers
  const clientIP =
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headersList.get('x-real-ip') ||
    headersList.get('cf-connecting-ip') || // Cloudflare
    headersList.get('x-client-ip') ||
    '127.0.0.1'; // fallback for development

  return {
    db,
    clientIP,
  };
});

/**
 * tRPC instance configured with SuperJSON transformer for handling
 * complex data types during serialization/deserialization.
 */
const t = initTRPC.context<TRPCContext>().create({
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
 *   getById: publicProcedure
 *     .input(z.object({ id: z.string() }))
 *     .query(({ input, ctx }) => {
 *       return ctx.db.select().from(users).where(eq(users.id, input.id));
 *     }),
 * });
 * ```
 */
export const createTRPCRouter = t.router;

/**
 * Public procedure that can be used by anyone.
 *
 * This is the base procedure that all other procedures should extend.
 * It includes the context with database access.
 *
 * @example
 * ```typescript
 * export const getUsers = publicProcedure
 *   .query(({ ctx }) => {
 *     return ctx.db.select().from(users);
 *   });
 * ```
 */
export const publicProcedure = t.procedure;

/**
 * Creates a server-side caller factory for the given router.
 * This allows you to call tRPC procedures directly on the server.
 *
 * @param router - The tRPC router to create a caller for
 * @returns A factory function that creates a caller with the given context
 *
 * @example
 * ```typescript
 * const createCaller = createCallerFactory(appRouter);
 * const caller = createCaller(await createTRPCContext());
 * const users = await caller.user.getAll();
 * ```
 */
export const createCallerFactory = t.createCallerFactory;
