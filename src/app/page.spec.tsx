import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import Home from '~/app/page';

// Mock console.log to avoid noise in tests
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

// Mock the server API caller
jest.mock('~/api/server', () => ({
  caller: {
    user: {
      getUsers: jest.fn(),
    },
  },
  getQueryClient: jest.fn(() => new (jest.requireActual('@tanstack/react-query').QueryClient)()),
}));

// Get the mocked function after the mock is set up
import { caller } from '~/api/server';
const mockGetUsers = caller.user.getUsers as jest.MockedFunction<typeof caller.user.getUsers>;

// Mock HydrationBoundary to simplify testing
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  dehydrate: jest.fn(() => ({ queries: [], mutations: [] })),
  HydrationBoundary: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="hydration-boundary">{children}</div>
  ),
}));

// Helper function to render async component
const renderAsyncComponent = async (component: Promise<ReactElement>) => {
  const resolvedComponent = await component;
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>{resolvedComponent}</QueryClientProvider>,
  );
};

describe('Home Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleLog.mockClear();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
  });

  it('renders the main content container', async () => {
    const mockUsers = [
      { id: '1', name: 'John Doe', email: 'john@example.com' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
    ];
    mockGetUsers.mockResolvedValue(mockUsers);

    await renderAsyncComponent(Home());

    const mainContent = screen.getByTestId('main-content');
    expect(mainContent).toBeInTheDocument();
    expect(mainContent).toHaveClass('flex', 'justify-center', 'items-center', 'min-h-screen');
  });

  it('renders the main heading with correct text', async () => {
    const mockUsers = [{ id: '1', name: 'John Doe', email: 'john@example.com' }];
    mockGetUsers.mockResolvedValue(mockUsers);

    await renderAsyncComponent(Home());

    const heading = screen.getByTestId('main-heading');
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('image AI');
    expect(heading).toHaveClass('text-4xl');
    expect(heading.tagName).toBe('H1');
  });

  it('calls getUsers API on server side', async () => {
    const mockUsers = [{ id: '1', name: 'Test User', email: 'test@example.com' }];
    mockGetUsers.mockResolvedValue(mockUsers);

    await renderAsyncComponent(Home());

    expect(mockGetUsers).toHaveBeenCalledTimes(1);
    expect(mockGetUsers).toHaveBeenCalledWith();
  });

  it('logs users to console', async () => {
    const mockUsers = [{ id: '1', name: 'Test User', email: 'test@example.com' }];
    mockGetUsers.mockResolvedValue(mockUsers);

    await renderAsyncComponent(Home());

    expect(mockConsoleLog).toHaveBeenCalledWith('users', mockUsers);
  });

  it('renders HydrationBoundary wrapper', async () => {
    mockGetUsers.mockResolvedValue([]);

    await renderAsyncComponent(Home());

    const hydrationBoundary = screen.getByTestId('hydration-boundary');
    expect(hydrationBoundary).toBeInTheDocument();
  });

  it('handles empty users array', async () => {
    mockGetUsers.mockResolvedValue([]);

    await renderAsyncComponent(Home());

    // Should still render the page even with empty users
    expect(screen.getByTestId('main-content')).toBeInTheDocument();
    expect(screen.getByTestId('main-heading')).toBeInTheDocument();
    expect(mockConsoleLog).toHaveBeenCalledWith('users', []);
  });

  it('handles API error gracefully', async () => {
    mockGetUsers.mockRejectedValue(new Error('API Error'));

    // The component should handle the error (or let it bubble up)
    await expect(renderAsyncComponent(Home())).rejects.toThrow('API Error');
  });

  describe('Component Structure', () => {
    beforeEach(async () => {
      mockGetUsers.mockResolvedValue([]);
      await renderAsyncComponent(Home());
    });

    it('has correct semantic structure', () => {
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('image AI');
    });

    it('has proper accessibility attributes', () => {
      const mainContent = screen.getByTestId('main-content');
      const heading = screen.getByTestId('main-heading');

      expect(mainContent).toHaveAttribute('data-testid', 'main-content');
      expect(heading).toHaveAttribute('data-testid', 'main-heading');
    });

    it('uses proper CSS classes for layout', () => {
      const mainContent = screen.getByTestId('main-content');
      const heading = screen.getByTestId('main-heading');

      expect(mainContent).toHaveClass('flex', 'justify-center', 'items-center', 'min-h-screen');
      expect(heading).toHaveClass('text-4xl');
    });
  });
});
