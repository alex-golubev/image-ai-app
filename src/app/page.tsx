import type { JSX } from 'react';

export default function Home(): JSX.Element {
  return (
    <main className="flex justify-center items-center min-h-screen" data-test="main-content">
      <h1 className="text-4xl" data-test="main-heading">
        image AI
      </h1>
    </main>
  );
}
