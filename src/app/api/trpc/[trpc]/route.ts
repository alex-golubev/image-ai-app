import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { createTRPCContext } from '~/trpc/init';
import { rootRouter } from '~/trpc/routers/root';

/**
 * tRPC API route handler for Next.js App Router.
 *
 * This handler processes all tRPC requests coming to the `/api/trpc/[trpc]` endpoint.
 * It uses the fetch adapter to handle HTTP requests and responses, making it compatible
 * with Next.js App Router's API routes.
 *
 * The dynamic route segment `[trpc]` captures the procedure path, allowing tRPC
 * to route requests to the appropriate procedures in the router.
 *
 * @param req - The incoming HTTP request from Next.js
 * @returns Promise that resolves to the HTTP response
 *
 * @example
 * ```typescript
 * // This handler automatically processes requests like:
 * // POST /api/trpc/hello
 * // POST /api/trpc/images.getAll
 * // POST /api/trpc/images.create
 * ```
 */
const handler = (req: Request) =>
  fetchRequestHandler({
    router: rootRouter,
    endpoint: '/api/trpc',
    req,
    createContext: createTRPCContext,
  });

/**
 * Export handler for GET requests.
 *
 * Handles tRPC queries (read operations) sent via GET method.
 * Next.js App Router requires explicit named exports for each HTTP method.
 */
export { handler as GET };

/**
 * Export handler for POST requests.
 *
 * Handles tRPC mutations (write operations) and queries sent via POST method.
 * Most tRPC operations use POST for better payload handling and security.
 */
export { handler as POST };
