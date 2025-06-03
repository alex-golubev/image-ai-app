import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import type { JSX } from 'react';
import { caller, getQueryClient, trpc } from '~/trpc/server';
// import Title from '~/app/title';

export default async function Home(): Promise<JSX.Element> {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(trpc.home.queryOptions({ title: 'image' }));
  const title = await caller.home({ title: 'image' });

  console.log('title', title);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <main className="flex justify-center items-center min-h-screen" data-testid="main-content">
        <h1 className="text-4xl" data-testid="main-heading">
          {title.text}
        </h1>
        {/* <Title /> */}
      </main>
    </HydrationBoundary>
  );
}
