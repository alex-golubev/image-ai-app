import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { createTRPCContext } from '~/trpc/init';
import { rootRouter } from '~/trpc/routers/root';

const handler = (req: Request) =>
  fetchRequestHandler({
    router: rootRouter,
    endpoint: '/api/trpc',
    req,
    createContext: createTRPCContext,
  });

export { handler as GET, handler as POST };
