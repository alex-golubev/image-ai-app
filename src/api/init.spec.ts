// Mock SuperJSON to avoid ES module issues in tests
jest.mock('superjson', () => ({
  serialize: jest.fn((data) => ({ json: data, meta: undefined })),
  deserialize: jest.fn((data) => data.json),
  stringify: jest.fn((data) => JSON.stringify(data)),
  parse: jest.fn((data) => JSON.parse(data)),
}));

// Mock database
jest.mock('~/db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

import { z } from 'zod';
import {
  createTRPCContext,
  createTRPCRouter,
  publicProcedure,
  createCallerFactory,
} from '~/api/init';

describe('tRPC Init Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTRPCContext', () => {
    it('creates context with database connection', async () => {
      const context = await createTRPCContext();

      expect(context).toHaveProperty('db');
      expect(context.db).toBeDefined();
    });

    it('creates new context on each call', async () => {
      const context1 = await createTRPCContext();
      const context2 = await createTRPCContext();

      expect(context1).toHaveProperty('db');
      expect(context2).toHaveProperty('db');
      expect(context1.db).toBeDefined();
      expect(context2.db).toBeDefined();
    });
  });

  describe('createTRPCRouter', () => {
    it('creates a router with procedures', () => {
      const testRouter = createTRPCRouter({
        hello: publicProcedure.query(() => 'Hello World'),
        echo: publicProcedure.input(z.string()).query(({ input }) => input),
      });

      expect(testRouter).toBeDefined();
      expect(typeof testRouter).toBe('object');
    });
  });

  describe('publicProcedure', () => {
    it('creates a procedure that can be called', async () => {
      const testRouter = createTRPCRouter({
        test: publicProcedure.query(() => 'test result'),
      });

      const callerFactory = createCallerFactory(testRouter);
      const context = await createTRPCContext();
      const caller = callerFactory(context);

      const result = await caller.test();
      expect(result).toBe('test result');
    });

    it('provides context to procedures', async () => {
      const testRouter = createTRPCRouter({
        contextTest: publicProcedure.query(({ ctx }) => {
          expect(ctx).toHaveProperty('db');
          return 'context available';
        }),
      });

      const callerFactory = createCallerFactory(testRouter);
      const context = await createTRPCContext();
      const caller = callerFactory(context);

      const result = await caller.contextTest();
      expect(result).toBe('context available');
    });

    it('handles input validation', async () => {
      const testRouter = createTRPCRouter({
        withInput: publicProcedure
          .input(z.object({ name: z.string() }))
          .query(({ input }) => `Hello ${input.name}`),
      });

      const callerFactory = createCallerFactory(testRouter);
      const context = await createTRPCContext();
      const caller = callerFactory(context);

      const result = await caller.withInput({ name: 'World' });
      expect(result).toBe('Hello World');
    });

    it('throws validation error for invalid input', async () => {
      const testRouter = createTRPCRouter({
        withInput: publicProcedure
          .input(z.object({ name: z.string() }))
          .query(({ input }) => `Hello ${input.name}`),
      });

      const callerFactory = createCallerFactory(testRouter);
      const context = await createTRPCContext();
      const caller = callerFactory(context);

      await expect(
        // @ts-expect-error - intentionally passing invalid input
        caller.withInput({ name: 123 }),
      ).rejects.toThrow();
    });
  });

  describe('createCallerFactory', () => {
    it('creates a caller factory that can create callers', async () => {
      const testRouter = createTRPCRouter({
        test: publicProcedure.query(() => 'factory test'),
      });

      const callerFactory = createCallerFactory(testRouter);
      expect(typeof callerFactory).toBe('function');

      const context = await createTRPCContext();
      const caller = callerFactory(context);
      expect(typeof caller).toBe('function');

      const result = await caller.test();
      expect(result).toBe('factory test');
    });

    it('allows multiple callers with different contexts', async () => {
      const testRouter = createTRPCRouter({
        getContext: publicProcedure.query(({ ctx }) => ctx),
      });

      const callerFactory = createCallerFactory(testRouter);

      const context1 = await createTRPCContext();
      const context2 = await createTRPCContext();

      const caller1 = callerFactory(context1);
      const caller2 = callerFactory(context2);

      const result1 = await caller1.getContext();
      const result2 = await caller2.getContext();

      expect(result1).toHaveProperty('db');
      expect(result2).toHaveProperty('db');
    });
  });

  describe('Integration Tests', () => {
    it('creates complete working router with context', async () => {
      const testRouter = createTRPCRouter({
        getUser: publicProcedure.input(z.object({ id: z.string() })).query(({ input, ctx }) => {
          expect(ctx).toHaveProperty('db');
          return { id: input.id, name: 'Test User' };
        }),
        createUser: publicProcedure
          .input(z.object({ name: z.string() }))
          .mutation(({ input, ctx }) => {
            expect(ctx).toHaveProperty('db');
            return { id: '123', name: input.name };
          }),
      });

      const callerFactory = createCallerFactory(testRouter);
      const context = await createTRPCContext();
      const caller = callerFactory(context);

      const user = await caller.getUser({ id: '123' });
      expect(user).toEqual({ id: '123', name: 'Test User' });

      const newUser = await caller.createUser({ name: 'New User' });
      expect(newUser).toEqual({ id: '123', name: 'New User' });
    });

    it('handles nested routers', async () => {
      const userRouter = createTRPCRouter({
        getById: publicProcedure
          .input(z.object({ id: z.string() }))
          .query(({ input }) => ({ id: input.id, name: 'User' })),
      });

      const postRouter = createTRPCRouter({
        getById: publicProcedure
          .input(z.object({ id: z.string() }))
          .query(({ input }) => ({ id: input.id, title: 'Post' })),
      });

      const appRouter = createTRPCRouter({
        user: userRouter,
        post: postRouter,
      });

      const callerFactory = createCallerFactory(appRouter);
      const context = await createTRPCContext();
      const caller = callerFactory(context);

      const user = await caller.user.getById({ id: '1' });
      const post = await caller.post.getById({ id: '1' });

      expect(user).toEqual({ id: '1', name: 'User' });
      expect(post).toEqual({ id: '1', title: 'Post' });
    });
  });
});
