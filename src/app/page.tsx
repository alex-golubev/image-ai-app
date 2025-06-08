import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import type { JSX } from 'react';
import { caller, getQueryClient } from '~/api/server';

export default async function Home(): Promise<JSX.Element> {
  const queryClient = getQueryClient();
  // void queryClient.prefetchQuery(trpc.home.queryOptions({ title: 'image' }));
  // const title = await caller.home({ title: 'image' });

  const users = await caller.user.getUsers();
  console.log('users', users);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <main className="flex justify-center items-center min-h-screen" data-testid="main-content">
        <h1 className="text-4xl" data-testid="main-heading">
          image AI
        </h1>
      </main>
    </HydrationBoundary>
  );
}
