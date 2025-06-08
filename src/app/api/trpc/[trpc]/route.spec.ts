// Mock fetchRequestHandler from tRPC
jest.mock('@trpc/server/adapters/fetch', () => ({
  fetchRequestHandler: jest.fn(),
}));

// Mock tRPC init
jest.mock('~/api/init', () => ({
  createTRPCContext: jest.fn(),
}));

// Mock root router
jest.mock('~/api/modules/root', () => ({
  rootRouter: {
    createCaller: jest.fn(),
    _def: {
      procedures: {
        hello: jest.fn(),
        'user.getUsers': jest.fn(),
        'user.getUserById': jest.fn(),
      },
    },
  },
}));

import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { createTRPCContext } from '~/api/init';
import { rootRouter } from '~/api/modules/root';
import { GET, POST } from './route';

// Get references to mocked functions
const mockFetchRequestHandler = fetchRequestHandler as jest.MockedFunction<
  typeof fetchRequestHandler
>;
const mockCreateTRPCContext = createTRPCContext as jest.MockedFunction<typeof createTRPCContext>;
const mockRootRouter = rootRouter;

describe('tRPC API Route Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock implementations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockCreateTRPCContext.mockResolvedValue({ db: {} as any, clientIP: '127.0.0.1' });
    mockFetchRequestHandler.mockResolvedValue(new Response('OK', { status: 200 }));
  });

  describe('Handler Configuration', () => {
    it('configures fetchRequestHandler with correct parameters', async () => {
      const mockRequest = new Request('http://localhost:3000/api/trpc/hello', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 1 }),
      });

      await GET(mockRequest);

      expect(mockFetchRequestHandler).toHaveBeenCalledWith({
        router: mockRootRouter,
        endpoint: '/api/trpc',
        req: mockRequest,
        createContext: mockCreateTRPCContext,
        onError: expect.any(Function),
      });
    });

    it('uses the correct router', async () => {
      const mockRequest = new Request('http://localhost:3000/api/trpc/hello');

      await GET(mockRequest);

      const callArgs = mockFetchRequestHandler.mock.calls[0][0];
      expect(callArgs.router).toBe(mockRootRouter);
    });

    it('uses the correct endpoint', async () => {
      const mockRequest = new Request('http://localhost:3000/api/trpc/hello');

      await GET(mockRequest);

      const callArgs = mockFetchRequestHandler.mock.calls[0][0];
      expect(callArgs.endpoint).toBe('/api/trpc');
    });

    it('uses the correct context creator', async () => {
      const mockRequest = new Request('http://localhost:3000/api/trpc/hello');

      await GET(mockRequest);

      const callArgs = mockFetchRequestHandler.mock.calls[0][0];
      expect(callArgs.createContext).toBe(mockCreateTRPCContext);
    });

    it('includes onError handler', async () => {
      const mockRequest = new Request('http://localhost:3000/api/trpc/hello');

      await GET(mockRequest);

      const callArgs = mockFetchRequestHandler.mock.calls[0][0];
      expect(callArgs.onError).toBeDefined();
      expect(typeof callArgs.onError).toBe('function');
    });
  });

  describe('GET Handler', () => {
    it('is defined and callable', () => {
      expect(GET).toBeDefined();
      expect(typeof GET).toBe('function');
    });

    it('handles GET requests correctly', async () => {
      const mockRequest = new Request('http://localhost:3000/api/trpc/user/getUsers', {
        method: 'GET',
      });

      const response = await GET(mockRequest);

      expect(mockFetchRequestHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          req: mockRequest,
          router: mockRootRouter,
          endpoint: '/api/trpc',
          createContext: mockCreateTRPCContext,
        }),
      );
      expect(response).toBeInstanceOf(Response);
    });

    it('passes the request object correctly', async () => {
      const mockRequest = new Request('http://localhost:3000/api/trpc/hello');

      await GET(mockRequest);

      const callArgs = mockFetchRequestHandler.mock.calls[0][0];
      expect(callArgs.req).toBe(mockRequest);
    });
  });

  describe('POST Handler', () => {
    it('is defined and callable', () => {
      expect(POST).toBeDefined();
      expect(typeof POST).toBe('function');
    });

    it('handles POST requests correctly', async () => {
      const mockRequest = new Request('http://localhost:3000/api/trpc/user/createUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test User', email: 'test@example.com' }),
      });

      const response = await POST(mockRequest);

      expect(mockFetchRequestHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          req: mockRequest,
          router: mockRootRouter,
          endpoint: '/api/trpc',
          createContext: mockCreateTRPCContext,
        }),
      );
      expect(response).toBeInstanceOf(Response);
    });

    it('handles mutations correctly', async () => {
      const mockRequest = new Request('http://localhost:3000/api/trpc/user/updateUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: '1', name: 'Updated User' }),
      });

      await POST(mockRequest);

      expect(mockFetchRequestHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          req: mockRequest,
          router: mockRootRouter,
          endpoint: '/api/trpc',
          createContext: mockCreateTRPCContext,
        }),
      );
    });
  });

  describe('Error Handling', () => {
    it('includes onError callback in configuration', async () => {
      const mockRequest = new Request('http://localhost:3000/api/trpc/hello');

      await GET(mockRequest);

      const callArgs = mockFetchRequestHandler.mock.calls[0][0];
      expect(callArgs.onError).toBeDefined();
      expect(typeof callArgs.onError).toBe('function');
    });

    it('onError callback handles errors correctly', async () => {
      const mockRequest = new Request('http://localhost:3000/api/trpc/hello');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await GET(mockRequest);

      const callArgs = mockFetchRequestHandler.mock.calls[0][0];
      const onError = callArgs.onError;

      // Simulate an error
      const mockError = {
        code: 'BAD_REQUEST' as const,
        message: 'Test error',
        name: 'TRPCError',
      };

      onError!({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        error: mockError as any,
        type: 'query',
        path: 'user.getUsers',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        req: {} as any,
        input: undefined,
        ctx: undefined,
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        '❌ tRPC failed on user.getUsers (query):',
        mockError,
      );

      consoleSpy.mockRestore();
    });

    it('onError callback handles unknown path', async () => {
      const mockRequest = new Request('http://localhost:3000/api/trpc/hello');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await GET(mockRequest);

      const callArgs = mockFetchRequestHandler.mock.calls[0][0];
      const onError = callArgs.onError;

      // Simulate an error without path
      const mockError = {
        code: 'INTERNAL_SERVER_ERROR' as const,
        message: 'Internal error',
        name: 'TRPCError',
      };

      onError!({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        error: mockError as any,
        type: 'mutation',
        path: undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        req: {} as any,
        input: undefined,
        ctx: undefined,
      });

      expect(consoleSpy).toHaveBeenCalledWith('❌ tRPC failed on unknown (mutation):', mockError);

      consoleSpy.mockRestore();
    });

    it('onError callback logs internal server errors', async () => {
      const mockRequest = new Request('http://localhost:3000/api/trpc/hello');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await GET(mockRequest);

      const callArgs = mockFetchRequestHandler.mock.calls[0][0];
      const onError = callArgs.onError;

      // Simulate an internal server error
      const mockError = {
        code: 'INTERNAL_SERVER_ERROR' as const,
        message: 'Database connection failed',
        name: 'TRPCError',
      };

      onError!({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        error: mockError as any,
        type: 'query',
        path: 'user.getUsers',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        req: {} as any,
        input: undefined,
        ctx: undefined,
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        '❌ tRPC failed on user.getUsers (query):',
        mockError,
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Request Handling', () => {
    it('handles different tRPC procedure paths', async () => {
      const procedures = [
        'hello',
        'user.getUsers',
        'user.getUserById',
        'user.createUser',
        'user.updateUser',
        'user.deleteUser',
      ];

      for (const procedure of procedures) {
        const mockRequest = new Request(`http://localhost:3000/api/trpc/${procedure}`, {
          method: 'POST',
        });

        await POST(mockRequest);

        expect(mockFetchRequestHandler).toHaveBeenCalledWith(
          expect.objectContaining({
            req: mockRequest,
            router: mockRootRouter,
            endpoint: '/api/trpc',
          }),
        );
      }
    });

    it('handles requests with different content types', async () => {
      const contentTypes = ['application/json', 'application/x-www-form-urlencoded', 'text/plain'];

      for (const contentType of contentTypes) {
        const mockRequest = new Request('http://localhost:3000/api/trpc/hello', {
          method: 'POST',
          headers: { 'Content-Type': contentType },
          body: contentType === 'application/json' ? JSON.stringify({}) : 'test',
        });

        await POST(mockRequest);

        expect(mockFetchRequestHandler).toHaveBeenCalledWith(
          expect.objectContaining({
            req: mockRequest,
          }),
        );
      }
    });

    it('handles requests with query parameters', async () => {
      const mockRequest = new Request(
        'http://localhost:3000/api/trpc/user/getUsers?limit=10&offset=0',
      );

      await GET(mockRequest);

      expect(mockFetchRequestHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          req: mockRequest,
        }),
      );
    });
  });

  describe('Response Handling', () => {
    it('returns response from fetchRequestHandler', async () => {
      const mockResponse = new Response(JSON.stringify({ result: 'success' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

      mockFetchRequestHandler.mockResolvedValue(mockResponse);

      const mockRequest = new Request('http://localhost:3000/api/trpc/hello');
      const response = await GET(mockRequest);

      expect(response).toBe(mockResponse);
    });

    it('handles error responses', async () => {
      const mockErrorResponse = new Response(JSON.stringify({ error: { message: 'Not found' } }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });

      mockFetchRequestHandler.mockResolvedValue(mockErrorResponse);

      const mockRequest = new Request('http://localhost:3000/api/trpc/nonexistent');
      const response = await POST(mockRequest);

      expect(response).toBe(mockErrorResponse);
      expect(response.status).toBe(404);
    });
  });

  describe('Integration', () => {
    it('GET and POST handlers use the same configuration', async () => {
      const mockRequest = new Request('http://localhost:3000/api/trpc/hello');

      await GET(mockRequest);
      const getCallArgs = mockFetchRequestHandler.mock.calls[0][0];

      jest.clearAllMocks();

      await POST(mockRequest);
      const postCallArgs = mockFetchRequestHandler.mock.calls[0][0];

      // Compare configurations (excluding req which will be different instances)
      expect(getCallArgs.router).toBe(postCallArgs.router);
      expect(getCallArgs.endpoint).toBe(postCallArgs.endpoint);
      expect(getCallArgs.createContext).toBe(postCallArgs.createContext);
      expect(typeof getCallArgs.onError).toBe(typeof postCallArgs.onError);
    });

    it('works with tRPC context creation', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockContext = { user: { id: '1' }, db: {} as any, clientIP: '127.0.0.1' };
      mockCreateTRPCContext.mockResolvedValue(mockContext);

      const mockRequest = new Request('http://localhost:3000/api/trpc/hello');

      await GET(mockRequest);

      const callArgs = mockFetchRequestHandler.mock.calls[0][0];
      expect(callArgs.createContext).toBe(mockCreateTRPCContext);
    });

    it('integrates with root router', async () => {
      const mockRequest = new Request('http://localhost:3000/api/trpc/user/getUsers');

      await POST(mockRequest);

      const callArgs = mockFetchRequestHandler.mock.calls[0][0];
      expect(callArgs.router).toBe(mockRootRouter);
    });
  });
});
