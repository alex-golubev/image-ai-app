import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';
import { cache } from 'react';
import { makeQueryClient } from '~/api/query-client';
import { createTRPCContext } from '~/api/init';
import { rootRouter } from '~/api/modules/root';

/**
 * Cached QueryClient factory for server-side rendering
 * Uses React's cache function to ensure single instance per request
 * @returns QueryClient instance optimized for server-side usage
 */
export const getQueryClient = cache(makeQueryClient);

/**
 * Server-side tRPC proxy for React Server Components
 * Provides server-side tRPC functionality with automatic context creation
 * and query client integration for SSR scenarios
 * @example
 * ```ts
 * const posts = await trpc.posts.getAll();
 * ```
 */
export const trpc = createTRPCOptionsProxy({
  ctx: createTRPCContext,
  router: rootRouter,
  queryClient: getQueryClient,
});

/**
 * Direct tRPC caller for server-side usage without React Query
 * Creates a type-safe caller instance with automatic context creation
 * Useful for direct procedure calls in server-side code
 * @example
 * ```ts
 * const result = await caller.posts.getAll();
 * ```
 */
export const caller = rootRouter.createCaller(createTRPCContext);
