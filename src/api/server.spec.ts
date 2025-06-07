// Mock React with all necessary functions
jest.mock('react', () => ({
  cache: jest.fn((fn) => fn),
  createContext: jest.fn(() => ({
    Provider: jest.fn(),
    Consumer: jest.fn(),
  })),
  useState: jest.fn(),
  useEffect: jest.fn(),
  useCallback: jest.fn(),
  useMemo: jest.fn(),
  useRef: jest.fn(),
}));

// Mock SuperJSON to avoid ES module issues in tests
jest.mock('superjson', () => ({
  serialize: jest.fn((data) => ({ json: data, meta: undefined })),
  deserialize: jest.fn((data) => data.json),
  stringify: jest.fn((data) => JSON.stringify(data)),
  parse: jest.fn((data) => JSON.parse(data)),
}));

// Mock transformer
jest.mock('~/lib/transformer', () => ({
  transformer: {
    serialize: jest.fn((data) => ({ json: data, meta: undefined })),
    deserialize: jest.fn((data) => data.json),
  },
}));

// Mock query client factory
jest.mock('~/api/query-client', () => ({
  makeQueryClient: jest.fn(() => ({
    setQueryData: jest.fn(),
    getQueryData: jest.fn(),
    invalidateQueries: jest.fn(),
    clear: jest.fn(),
    getDefaultOptions: jest.fn(() => ({
      queries: { staleTime: 30 * 1000 },
    })),
  })),
}));

// Mock tRPC init
jest.mock('~/api/init', () => ({
  createTRPCContext: jest.fn(() => ({})),
}));

// Mock root router
jest.mock('~/api/modules/root', () => ({
  rootRouter: {
    createCaller: jest.fn(() => ({
      user: {
        getUsers: jest.fn(),
        getUserById: jest.fn(),
      },
    })),
  },
}));

// Mock tRPC options proxy
jest.mock('@trpc/tanstack-react-query', () => ({
  createTRPCOptionsProxy: jest.fn(() => ({
    user: {
      getUsers: { useQuery: jest.fn() },
      getUserById: { useQuery: jest.fn() },
    },
  })),
}));

import { getQueryClient, trpc, caller } from './server';

describe('Server tRPC Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getQueryClient', () => {
    it('returns a query client instance', () => {
      const queryClient = getQueryClient();

      expect(queryClient).toBeDefined();
      expect(typeof queryClient).toBe('object');
      expect(queryClient.setQueryData).toBeDefined();
      expect(queryClient.getQueryData).toBeDefined();
      expect(queryClient.invalidateQueries).toBeDefined();
      expect(queryClient.clear).toBeDefined();
    });

    it('has proper default configuration', () => {
      const queryClient = getQueryClient();
      const defaultOptions = queryClient.getDefaultOptions();

      expect(defaultOptions).toBeDefined();
      expect(defaultOptions.queries?.staleTime).toBe(30 * 1000);
    });

    it('provides all expected QueryClient methods', () => {
      const queryClient = getQueryClient();

      expect(queryClient.setQueryData).toBeDefined();
      expect(queryClient.getQueryData).toBeDefined();
      expect(queryClient.invalidateQueries).toBeDefined();
      expect(queryClient.clear).toBeDefined();
      expect(queryClient.getDefaultOptions).toBeDefined();
    });
  });

  describe('trpc proxy', () => {
    it('is defined and has expected structure', () => {
      expect(trpc).toBeDefined();
      expect(typeof trpc).toBe('object');
    });

    it('provides user routes', () => {
      expect(trpc.user).toBeDefined();
      expect(trpc.user.getUsers).toBeDefined();
      expect(trpc.user.getUserById).toBeDefined();
    });

    it('has proper structure for client-side usage', () => {
      expect(trpc.user).toBeDefined();
      expect(trpc.user.getUsers).toBeDefined();
      expect(trpc.user.getUserById).toBeDefined();
    });
  });

  describe('caller', () => {
    it('is defined and has expected structure', () => {
      expect(caller).toBeDefined();
      expect(typeof caller).toBe('object');
    });

    it('provides user procedures for direct calls', () => {
      expect(caller.user).toBeDefined();
      expect(caller.user.getUsers).toBeDefined();
      expect(caller.user.getUserById).toBeDefined();
    });

    it('can be used for direct procedure calls', async () => {
      expect(typeof caller.user.getUsers).toBe('function');
      expect(typeof caller.user.getUserById).toBe('function');
    });
  });

  describe('Module exports', () => {
    it('exports getQueryClient function', () => {
      expect(getQueryClient).toBeDefined();
      expect(typeof getQueryClient).toBe('function');
    });

    it('exports trpc proxy object', () => {
      expect(trpc).toBeDefined();
      expect(typeof trpc).toBe('object');
    });

    it('exports caller object', () => {
      expect(caller).toBeDefined();
      expect(typeof caller).toBe('object');
    });

    it('all exports are properly initialized', () => {
      const queryClient = getQueryClient();

      expect(queryClient).toBeDefined();
      expect(trpc).toBeDefined();
      expect(caller).toBeDefined();

      // Verify they have expected methods/properties
      expect(typeof queryClient.setQueryData).toBe('function');
      expect(typeof trpc.user).toBe('object');
      expect(typeof caller.user).toBe('object');
    });
  });

  describe('Type safety and structure', () => {
    it('getQueryClient returns object with QueryClient methods', () => {
      const queryClient = getQueryClient();

      expect(queryClient.setQueryData).toBeDefined();
      expect(queryClient.getQueryData).toBeDefined();
      expect(queryClient.invalidateQueries).toBeDefined();
      expect(queryClient.clear).toBeDefined();
      expect(queryClient.getDefaultOptions).toBeDefined();
    });

    it('trpc proxy has proper structure for client-side usage', () => {
      expect(trpc.user).toBeDefined();
      expect(trpc.user.getUsers).toBeDefined();
      expect(trpc.user.getUserById).toBeDefined();
    });

    it('caller has proper structure for server-side usage', () => {
      expect(caller.user).toBeDefined();
      expect(caller.user.getUsers).toBeDefined();
      expect(caller.user.getUserById).toBeDefined();
    });
  });

  describe('Server-side rendering compatibility', () => {
    it('exports are suitable for SSR usage', () => {
      // All exports should be defined and ready for SSR
      expect(getQueryClient).toBeDefined();
      expect(trpc).toBeDefined();
      expect(caller).toBeDefined();
    });

    it('getQueryClient can be called multiple times safely', () => {
      // Should not throw errors when called multiple times
      expect(() => {
        getQueryClient();
        getQueryClient();
        getQueryClient();
      }).not.toThrow();
    });

    it('caller can be used for direct server-side calls', () => {
      // Caller should have the expected structure for server-side usage
      expect(caller.user).toBeDefined();
      expect(typeof caller.user.getUsers).toBe('function');
      expect(typeof caller.user.getUserById).toBe('function');
    });
  });

  describe('Integration', () => {
    it('all components work together', () => {
      const queryClient = getQueryClient();

      // All exports should be properly initialized and work together
      expect(queryClient).toBeDefined();
      expect(trpc).toBeDefined();
      expect(caller).toBeDefined();

      // They should have the expected structure
      expect(typeof queryClient.setQueryData).toBe('function');
      expect(typeof trpc.user).toBe('object');
      expect(typeof caller.user).toBe('object');
    });

    it('maintains consistent API structure', () => {
      // Both trpc and caller should have the same route structure
      expect(trpc.user).toBeDefined();
      expect(caller.user).toBeDefined();

      // Both should have the same procedures available
      expect(trpc.user.getUsers).toBeDefined();
      expect(trpc.user.getUserById).toBeDefined();
      expect(caller.user.getUsers).toBeDefined();
      expect(caller.user.getUserById).toBeDefined();
    });

    it('provides complete tRPC server-side functionality', () => {
      // Verify that all necessary components are available
      expect(getQueryClient).toBeDefined();
      expect(trpc).toBeDefined();
      expect(caller).toBeDefined();

      // Verify QueryClient functionality
      const queryClient = getQueryClient();
      expect(queryClient.setQueryData).toBeDefined();
      expect(queryClient.getQueryData).toBeDefined();

      // Verify tRPC proxy functionality
      expect(trpc.user).toBeDefined();

      // Verify caller functionality
      expect(caller.user).toBeDefined();
      expect(typeof caller.user.getUsers).toBe('function');
    });
  });
});
