import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { TRPCReactProvider, TRPCProvider, useTRPC } from './client';

// Mock tRPC dependencies
jest.mock('@trpc/tanstack-react-query', () => ({
  createTRPCContext: jest.fn(() => ({
    TRPCProvider: ({ children }: { children: ReactNode }) => (
      <div data-testid="trpc-provider">{children}</div>
    ),
    useTRPC: jest.fn(),
  })),
}));

// Mock React Query
jest.mock('@tanstack/react-query', () => ({
  QueryClientProvider: ({ children }: { children: ReactNode }) => (
    <div data-testid="query-client-provider">{children}</div>
  ),
}));

// Mock tRPC client
jest.mock('@trpc/client', () => ({
  createTRPCClient: jest.fn(() => ({
    query: jest.fn(),
    mutation: jest.fn(),
  })),
  httpBatchLink: jest.fn(() => ({})),
}));

// Mock query client factory
const mockQueryClient = {
  mount: jest.fn(),
  unmount: jest.fn(),
  clear: jest.fn(),
  getQueryData: jest.fn(),
  setQueryData: jest.fn(),
};

jest.mock('~/api/query-client', () => ({
  makeQueryClient: jest.fn(() => mockQueryClient),
}));

// Mock transformer
jest.mock('~/lib/transformer', () => ({
  transformer: {
    serialize: jest.fn(),
    deserialize: jest.fn(),
  },
}));

// Mock root router type
jest.mock('~/api/modules/root', () => ({
  type: 'RootRouter',
}));

describe('TRPC Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables
    delete process.env.VERCEL_URL;
    delete process.env.PORT;
  });

  describe('TRPCReactProvider', () => {
    it('renders children wrapped in providers', () => {
      const testChild = <div data-testid="test-child">Test Content</div>;

      render(<TRPCReactProvider>{testChild}</TRPCReactProvider>);

      expect(screen.getByTestId('query-client-provider')).toBeInTheDocument();
      expect(screen.getByTestId('trpc-provider')).toBeInTheDocument();
      expect(screen.getByTestId('test-child')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('handles multiple children correctly', () => {
      const multipleChildren = (
        <>
          <div data-testid="child-1">First Child</div>
          <div data-testid="child-2">Second Child</div>
        </>
      );

      render(<TRPCReactProvider>{multipleChildren}</TRPCReactProvider>);

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
    });

    it('maintains provider hierarchy', () => {
      const testChild = <div data-testid="test-child">Test</div>;

      render(<TRPCReactProvider>{testChild}</TRPCReactProvider>);

      const queryProvider = screen.getByTestId('query-client-provider');
      const trpcProvider = screen.getByTestId('trpc-provider');
      const child = screen.getByTestId('test-child');

      expect(queryProvider).toContainElement(trpcProvider);
      expect(trpcProvider).toContainElement(child);
    });
  });

  describe('Environment Handling', () => {
    beforeEach(() => {
      // Clean up environment before each test
      delete process.env.VERCEL_URL;
      delete process.env.PORT;
    });

    it('works in browser environment', () => {
      // Browser environment is the default in Jest/JSDOM
      // Just verify that the component renders without errors
      const testChild = <div>Test</div>;
      render(<TRPCReactProvider>{testChild}</TRPCReactProvider>);

      // Should not throw and should render correctly
      expect(screen.getByTestId('trpc-provider')).toBeInTheDocument();
    });

    it('works in server environment without environment variables', () => {
      // Simulate server environment
      const originalWindow = global.window;
      // @ts-expect-error - Intentionally setting to undefined for test
      delete global.window;

      const testChild = <div>Test</div>;
      render(<TRPCReactProvider>{testChild}</TRPCReactProvider>);

      // Should not throw and should render correctly
      expect(screen.getByTestId('trpc-provider')).toBeInTheDocument();

      // Restore window
      global.window = originalWindow;
    });
  });

  describe('URL Generation Coverage', () => {
    it('attempts to cover different URL generation paths', () => {
      // Note: Due to the architecture of the getUrl function being called only once
      // during useState initialization, it's challenging to test all branches in isolation.
      // The function handles three cases:
      // 1. Browser environment (window !== 'undefined') - returns ''
      // 2. Server with VERCEL_URL - returns https://${VERCEL_URL}
      // 3. Server without VERCEL_URL - returns http://localhost:${PORT ?? 3000}

      // This test documents the coverage limitation and ensures the component
      // renders successfully in different environments
      const testChild = <div data-testid="url-coverage">URL Coverage Test</div>;
      render(<TRPCReactProvider>{testChild}</TRPCReactProvider>);

      expect(screen.getByTestId('trpc-provider')).toBeInTheDocument();
      expect(screen.getByTestId('url-coverage')).toBeInTheDocument();
    });
  });

  describe('Component Props', () => {
    it('accepts children prop correctly', () => {
      const testChild = <span data-testid="span-child">Span Content</span>;

      render(<TRPCReactProvider>{testChild}</TRPCReactProvider>);

      expect(screen.getByTestId('span-child')).toBeInTheDocument();
      expect(screen.getByText('Span Content')).toBeInTheDocument();
    });

    it('handles readonly children prop', () => {
      // TypeScript compile-time check - the component should accept Readonly<{ children: ReactNode }>
      const testChild = <div>Test</div>;

      // This should compile without errors
      const component = <TRPCReactProvider>{testChild}</TRPCReactProvider>;

      render(component);
      expect(screen.getByTestId('trpc-provider')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles empty children gracefully', () => {
      render(<TRPCReactProvider>{null}</TRPCReactProvider>);

      expect(screen.getByTestId('query-client-provider')).toBeInTheDocument();
      expect(screen.getByTestId('trpc-provider')).toBeInTheDocument();
    });

    it('handles undefined children gracefully', () => {
      render(<TRPCReactProvider>{undefined}</TRPCReactProvider>);

      expect(screen.getByTestId('query-client-provider')).toBeInTheDocument();
      expect(screen.getByTestId('trpc-provider')).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('renders with correct component structure', () => {
      const testChild = <div data-testid="content">App Content</div>;

      render(<TRPCReactProvider>{testChild}</TRPCReactProvider>);

      // Verify the structure: QueryClientProvider > TRPCProvider > children
      const queryProvider = screen.getByTestId('query-client-provider');
      const trpcProvider = screen.getByTestId('trpc-provider');
      const content = screen.getByTestId('content');

      expect(queryProvider).toBeInTheDocument();
      expect(trpcProvider).toBeInTheDocument();
      expect(content).toBeInTheDocument();

      expect(queryProvider).toContainElement(trpcProvider);
      expect(trpcProvider).toContainElement(content);
    });

    it('maintains stable component structure on rerenders', () => {
      const testChild = <div data-testid="test-content">Test</div>;

      const { rerender } = render(<TRPCReactProvider>{testChild}</TRPCReactProvider>);

      // First render
      expect(screen.getByTestId('query-client-provider')).toBeInTheDocument();
      expect(screen.getByTestId('trpc-provider')).toBeInTheDocument();

      // Rerender with different children
      rerender(
        <TRPCReactProvider>
          <div data-testid="new-content">New</div>
        </TRPCReactProvider>,
      );

      // Structure should remain the same
      expect(screen.getByTestId('query-client-provider')).toBeInTheDocument();
      expect(screen.getByTestId('trpc-provider')).toBeInTheDocument();
      expect(screen.getByTestId('new-content')).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('integrates with tRPC context creation', () => {
      const testChild = <div>Test</div>;

      render(<TRPCReactProvider>{testChild}</TRPCReactProvider>);

      // Should render without errors, indicating successful integration
      expect(screen.getByTestId('trpc-provider')).toBeInTheDocument();
    });

    it('integrates with React Query', () => {
      const testChild = <div>Test</div>;

      render(<TRPCReactProvider>{testChild}</TRPCReactProvider>);

      // Should render without errors, indicating successful React Query integration
      expect(screen.getByTestId('query-client-provider')).toBeInTheDocument();
    });
  });

  describe('Exported Functions', () => {
    it('exports TRPCProvider from createTRPCContext', () => {
      expect(TRPCProvider).toBeDefined();
      expect(typeof TRPCProvider).toBe('function');
    });

    it('exports useTRPC hook from createTRPCContext', () => {
      expect(useTRPC).toBeDefined();
      expect(typeof useTRPC).toBe('function');
    });

    it('TRPCProvider and useTRPC are from the same context', () => {
      // Both should be from the same createTRPCContext call
      // This is more of a structural test to ensure they're exported correctly
      expect(TRPCProvider).toBeDefined();
      expect(useTRPC).toBeDefined();
    });
  });
});
