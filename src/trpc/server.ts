import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';
import { cache } from 'react';
import { makeQueryClient } from '~/trpc/query-client';
import { createTRPCContext } from '~/trpc/init';
import { rootRouter } from '~/trpc/routers/root';

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
