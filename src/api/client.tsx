'use client';

import { createTRPCContext } from '@trpc/tanstack-react-query';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { ReactNode } from 'react';
import { useState } from 'react';
import type { RootRouter } from '~/api/modules/root';
import { makeQueryClient } from '~/api/query-client';
import { transformer } from '~/lib/transformer';

/**
 * tRPC context with React Query integration
 * Provides TRPCProvider and useTRPC hook for the application
 */
export const { TRPCProvider, useTRPC } = createTRPCContext<RootRouter>();

let browserQueryClient: QueryClient;

/**
 * Gets or creates a QueryClient instance
 * Creates a new instance on server-side (SSR) and reuses singleton on client-side
 * @param isServer - Optional parameter to force server-side behavior for testing
 * @returns QueryClient instance
 */
export const getQueryClient = (isServer?: boolean) => {
  const isServerSide = isServer ?? typeof window === 'undefined';
  return isServerSide ? makeQueryClient() : (browserQueryClient ??= makeQueryClient());
};

/**
 * Generates the base URL based on environment
 * @param isServer - Optional parameter to force server-side behavior for testing
 * @returns The base URL for the application
 */
export const getBaseUrl = (isServer?: boolean) => {
  const isServerSide = isServer ?? typeof window === 'undefined';
  if (!isServerSide) return '';
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
};

/**
 * Generates the appropriate tRPC endpoint URL based on environment
 * @param isServer - Optional parameter to force server-side behavior for testing
 * @returns The complete tRPC API endpoint URL
 */
export const getUrl = (isServer?: boolean) => {
  return `${getBaseUrl(isServer)}/api/trpc`;
};

/**
 * React provider component that sets up tRPC and React Query
 * Wraps the application with necessary providers for tRPC functionality
 * @param props - Component props
 * @param props.children - Child components to wrap
 * @returns JSX element with tRPC and QueryClient providers
 */
export function TRPCReactProvider({ children }: Readonly<{ children: ReactNode }>) {
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    createTRPCClient<RootRouter>({
      links: [httpBatchLink({ transformer, url: getUrl() })],
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}
