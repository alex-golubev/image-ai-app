'use client';

import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '~/trpc/client';

export default function Title() {
  const trpc = useTRPC();
  const title = useQuery(trpc.home.queryOptions({ title: 'image' }));

  return (
    <h1 className="text-4xl" data-testid="main-heading">
      {title.data?.text}
    </h1>
  );
}
