import { initTRPC, TRPCError } from '@trpc/server';
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
 * Error handling middleware that automatically converts service errors
 * to appropriate tRPC errors with proper HTTP status codes.
 */
const errorHandlingMiddleware = t.middleware(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error instanceof TRPCError) {
      // Re-throw tRPC errors as-is
      throw error;
    }

    if (error instanceof Error) {
      // Map specific error messages to HTTP codes
      if (error.message.includes('already exists')) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: error.message,
        });
      }

      if (error.message.includes('not found')) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: error.message,
        });
      }

      if (error.message.includes('unauthorized') || error.message.includes('forbidden')) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: error.message,
        });
      }

      if (error.message.includes('validation') || error.message.includes('invalid')) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.message,
        });
      }

      // Default to internal server error
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message,
      });
    }

    // Unknown error type
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Unknown error occurred',
    });
  }
});

/**
 * Procedure with automatic error handling.
 *
 * Use this instead of baseProcedure when you want automatic
 * error handling that converts service errors to tRPC errors.
 */
export const safeProcedure = baseProcedure.use(errorHandlingMiddleware);

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

/**
 * Utility function for manual error handling in procedures.
 *
 * Use this when you need more control over error handling
 * or want to add custom logic before error conversion.
 *
 * @param fn - Async function to execute
 * @param customErrorMap - Optional custom error mapping
 * @returns Promise with the result or throws tRPC error
 *
 * @example
 * ```typescript
 * export const customProcedure = baseProcedure
 *   .mutation(async ({ input }) => {
 *     return await handleErrors(async () => {
 *       // Your logic here
 *       return await someService(input);
 *     }, {
 *       'custom error': 'BAD_REQUEST'
 *     });
 *   });
 * ```
 */
export const handleErrors = async <T>(
  fn: () => Promise<T>,
  customErrorMap?: Record<
    string,
    | 'BAD_REQUEST'
    | 'UNAUTHORIZED'
    | 'FORBIDDEN'
    | 'NOT_FOUND'
    | 'CONFLICT'
    | 'INTERNAL_SERVER_ERROR'
  >,
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof TRPCError) {
      throw error;
    }

    if (error instanceof Error) {
      // Check custom error mappings first
      if (customErrorMap) {
        for (const [errorText, code] of Object.entries(customErrorMap)) {
          if (error.message.includes(errorText)) {
            throw new TRPCError({
              code,
              message: error.message,
            });
          }
        }
      }

      // Default mappings
      if (error.message.includes('already exists')) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: error.message,
        });
      }

      if (error.message.includes('not found')) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: error.message,
        });
      }

      if (error.message.includes('unauthorized') || error.message.includes('forbidden')) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: error.message,
        });
      }

      if (error.message.includes('validation') || error.message.includes('invalid')) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.message,
        });
      }

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message,
      });
    }

    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Unknown error occurred',
    });
  }
};
