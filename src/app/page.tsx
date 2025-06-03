import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import type { JSX } from 'react';
import { getQueryClient, trpc } from '~/trpc/server';
import Title from '~/app/title';

export default function Home(): JSX.Element {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(trpc.home.queryOptions({ title: 'Image' }));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <main className="flex justify-center items-center min-h-screen" data-testid="main-content">
        <Title />
      </main>
    </HydrationBoundary>
  );
}
