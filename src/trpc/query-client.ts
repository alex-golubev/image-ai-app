import { defaultShouldDehydrateQuery, QueryClient } from '@tanstack/react-query';
import { transformer } from '~/lib/transformer';

/**
 * Creates and configures a new QueryClient instance optimized for tRPC usage.
 *
 * This factory function sets up a QueryClient with custom serialization/deserialization
 * using SuperJSON transformer to handle complex data types (Date, Map, Set, etc.)
 * during server-side rendering and hydration.
 *
 * @returns {QueryClient} A configured QueryClient instance with:
 *   - 30-second stale time for queries
 *   - Custom serialization for SSR dehydration
 *   - Custom deserialization for client hydration
 *   - Enhanced dehydration that includes pending queries
 *
 * @example
 * ```typescript
 * // Create a new query client instance
 * const queryClient = makeQueryClient();
 *
 * // Use with QueryClientProvider
 * <QueryClientProvider client={queryClient}>
 *   <App />
 * </QueryClientProvider>
 * ```
 */
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30 * 1000 },
      dehydrate: {
        serializeData: transformer.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === 'pending',
      },
      hydrate: { deserializeData: transformer.deserialize },
    },
  });
}
