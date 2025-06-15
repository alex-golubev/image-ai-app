// Mock Supabase client
const mockCreateClient = jest.fn();
jest.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient,
}));

// Mock postgres client
const mockPostgres = jest.fn();
jest.mock('postgres', () => mockPostgres);

// Mock Drizzle ORM
const mockDrizzle = jest.fn();
jest.mock('drizzle-orm/postgres-js', () => ({
  drizzle: mockDrizzle,
}));

// Mock schema
const mockSchema = {
  users: 'mockUsersTable',
  // Add other schema exports as needed
};
jest.mock('~/db/schema/index', () => ({
  ...mockSchema,
  default: mockSchema,
}));

describe('Database Index', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset process.env
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Database Initialization', () => {
    it('initializes postgres client with DATABASE_URL', async () => {
      const testUrl = 'postgresql://user:pass@host:5432/db';
      process.env.DATABASE_URL = testUrl;
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

      // Mock return values
      const mockClient = jest.fn();
      const mockDb = { query: jest.fn() };
      const mockSupabase = { auth: jest.fn() };
      mockPostgres.mockReturnValue(mockClient);
      mockDrizzle.mockReturnValue(mockDb);
      mockCreateClient.mockReturnValue(mockSupabase);

      // Re-import the module to trigger initialization
      jest.resetModules();
      await import('~/db/index');

      expect(mockPostgres).toHaveBeenCalledWith(testUrl);
      expect(mockCreateClient).toHaveBeenCalledWith('https://test.supabase.co', 'test-anon-key');
    });

    it('calls drizzle with correct parameters', async () => {
      const testUrl = 'postgresql://user:pass@host:5432/db';
      process.env.DATABASE_URL = testUrl;
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

      // Mock return values
      const mockClient = jest.fn();
      const mockDb = { query: jest.fn() };
      const mockSupabase = { auth: jest.fn() };
      mockPostgres.mockReturnValue(mockClient);
      mockDrizzle.mockReturnValue(mockDb);
      mockCreateClient.mockReturnValue(mockSupabase);

      // Re-import the module to trigger initialization
      jest.resetModules();
      await import('~/db/index');

      expect(mockDrizzle).toHaveBeenCalledWith(mockClient, {
        schema: expect.objectContaining(mockSchema),
        casing: 'snake_case',
      });
    });

    it('exports db and supabase instances', async () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

      // Mock return values
      const mockClient = jest.fn();
      const mockDb = { query: jest.fn(), select: jest.fn() };
      const mockSupabase = { auth: jest.fn() };
      mockPostgres.mockReturnValue(mockClient);
      mockDrizzle.mockReturnValue(mockDb);
      mockCreateClient.mockReturnValue(mockSupabase);

      // Re-import the module
      jest.resetModules();
      const dbModule = await import('~/db/index');

      expect(dbModule.db).toBeDefined();
      expect(dbModule.db).toBe(mockDb);
      expect(dbModule.supabase).toBeDefined();
      expect(dbModule.supabase).toBe(mockSupabase);
    });

    it('throws error when DATABASE_URL is not provided', async () => {
      delete process.env.DATABASE_URL;
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

      // Mock postgres to throw error when DATABASE_URL is undefined
      mockPostgres.mockImplementation((url: string) => {
        if (!url) {
          throw new Error('DATABASE_URL is required');
        }
        return jest.fn();
      });

      // Re-import the module
      jest.resetModules();

      await expect(import('~/db/index')).rejects.toThrow();
    });

    it('throws error when Supabase environment variables are not provided', async () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db';
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      // Mock createClient to throw error when env vars are undefined
      mockCreateClient.mockImplementation((url: string, key: string) => {
        if (!url || !key) {
          throw new Error('Supabase environment variables are required');
        }
        return { auth: jest.fn() };
      });

      // Re-import the module
      jest.resetModules();

      await expect(import('~/db/index')).rejects.toThrow();
    });
  });

  describe('Database Configuration', () => {
    beforeEach(() => {
      process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    });

    it('configures snake_case casing', async () => {
      const mockClient = jest.fn();
      const mockDb = { query: jest.fn() };
      const mockSupabase = { auth: jest.fn() };
      mockPostgres.mockReturnValue(mockClient);
      mockDrizzle.mockReturnValue(mockDb);
      mockCreateClient.mockReturnValue(mockSupabase);

      jest.resetModules();
      await import('~/db/index');

      const drizzleCall = mockDrizzle.mock.calls[0];
      expect(drizzleCall[1]).toHaveProperty('casing', 'snake_case');
    });

    it('includes schema in configuration', async () => {
      const mockClient = jest.fn();
      const mockDb = { query: jest.fn() };
      const mockSupabase = { auth: jest.fn() };
      mockPostgres.mockReturnValue(mockClient);
      mockDrizzle.mockReturnValue(mockDb);
      mockCreateClient.mockReturnValue(mockSupabase);

      jest.resetModules();
      await import('~/db/index');

      const drizzleCall = mockDrizzle.mock.calls[0];
      expect(drizzleCall[1].schema).toEqual(expect.objectContaining(mockSchema));
    });

    it('passes postgres client to Drizzle', async () => {
      const mockClient = jest.fn();
      const mockDb = { query: jest.fn() };
      const mockSupabase = { auth: jest.fn() };
      mockPostgres.mockReturnValue(mockClient);
      mockDrizzle.mockReturnValue(mockDb);
      mockCreateClient.mockReturnValue(mockSupabase);

      jest.resetModules();
      await import('~/db/index');

      const drizzleCall = mockDrizzle.mock.calls[0];
      expect(drizzleCall[0]).toBe(mockClient);
    });
  });

  describe('Environment Variables', () => {
    it('handles different DATABASE_URL formats', async () => {
      const testUrls = [
        'postgresql://user:pass@localhost:5432/db',
        'postgresql://user:pass@db.supabase.co:5432/db?sslmode=require',
        'postgres://user:pass@host:5432/db',
      ];

      for (const url of testUrls) {
        process.env.DATABASE_URL = url;
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

        const mockClient = jest.fn();
        const mockDb = { query: jest.fn() };
        const mockSupabase = { auth: jest.fn() };
        mockPostgres.mockReturnValue(mockClient);
        mockDrizzle.mockReturnValue(mockDb);
        mockCreateClient.mockReturnValue(mockSupabase);

        jest.resetModules();
        await import('~/db/index');

        expect(mockPostgres).toHaveBeenCalledWith(url);
        jest.clearAllMocks();
      }
    });

    it('uses non-null assertion for environment variables', async () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

      const mockClient = jest.fn();
      const mockDb = { query: jest.fn() };
      const mockSupabase = { auth: jest.fn() };
      mockPostgres.mockReturnValue(mockClient);
      mockDrizzle.mockReturnValue(mockDb);
      mockCreateClient.mockReturnValue(mockSupabase);

      jest.resetModules();

      // Should not throw with valid environment variables
      await expect(import('~/db/index')).resolves.toBeDefined();
    });
  });

  describe('Module Exports', () => {
    beforeEach(() => {
      process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    });

    it('exports db and supabase instances', async () => {
      const mockClient = jest.fn();
      const mockDb = { query: jest.fn() };
      const mockSupabase = { auth: jest.fn() };
      mockPostgres.mockReturnValue(mockClient);
      mockDrizzle.mockReturnValue(mockDb);
      mockCreateClient.mockReturnValue(mockSupabase);

      jest.resetModules();
      const dbModule = await import('~/db/index');

      const exports = Object.keys(dbModule);
      expect(exports).toContain('db');
      expect(exports).toContain('supabase');
    });

    it('exports db as named export', async () => {
      const mockClient = jest.fn();
      const mockDb = { query: jest.fn() };
      const mockSupabase = { auth: jest.fn() };
      mockPostgres.mockReturnValue(mockClient);
      mockDrizzle.mockReturnValue(mockDb);
      mockCreateClient.mockReturnValue(mockSupabase);

      jest.resetModules();
      const { db } = await import('~/db/index');

      expect(db).toBeDefined();
      expect(db).toBe(mockDb);
    });

    it('exports supabase as named export', async () => {
      const mockClient = jest.fn();
      const mockDb = { query: jest.fn() };
      const mockSupabase = { auth: jest.fn() };
      mockPostgres.mockReturnValue(mockClient);
      mockDrizzle.mockReturnValue(mockDb);
      mockCreateClient.mockReturnValue(mockSupabase);

      jest.resetModules();
      const { supabase } = await import('~/db/index');

      expect(supabase).toBeDefined();
      expect(supabase).toBe(mockSupabase);
    });

    it('db instance has expected Drizzle methods', async () => {
      const mockClient = jest.fn();
      const mockDb = {
        query: jest.fn(),
        select: jest.fn(),
        insert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        transaction: jest.fn(),
      };
      const mockSupabase = { auth: jest.fn() };
      mockPostgres.mockReturnValue(mockClient);
      mockDrizzle.mockReturnValue(mockDb);
      mockCreateClient.mockReturnValue(mockSupabase);

      jest.resetModules();
      const { db } = await import('./index');

      // Check that db has typical Drizzle ORM methods
      expect(db).toHaveProperty('query');
      expect(db).toHaveProperty('select');
      expect(db).toHaveProperty('insert');
      expect(db).toHaveProperty('update');
      expect(db).toHaveProperty('delete');
      expect(db).toHaveProperty('transaction');
    });
  });

  describe('Integration', () => {
    beforeEach(() => {
      process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    });

    it('creates a complete database connection chain', async () => {
      const mockClient = jest.fn();
      const mockDb = { query: jest.fn() };
      const mockSupabase = { auth: jest.fn() };
      mockPostgres.mockReturnValue(mockClient);
      mockDrizzle.mockReturnValue(mockDb);
      mockCreateClient.mockReturnValue(mockSupabase);

      jest.resetModules();
      await import('./index');

      // Verify the complete chain: DATABASE_URL -> postgres() -> drizzle() -> db
      expect(mockPostgres).toHaveBeenCalledTimes(1);
      expect(mockDrizzle).toHaveBeenCalledTimes(1);
      expect(mockCreateClient).toHaveBeenCalledTimes(1);
      expect(mockPostgres).toHaveBeenCalledWith(process.env.DATABASE_URL);
      expect(mockDrizzle).toHaveBeenCalledWith(mockClient, expect.any(Object));
      expect(mockCreateClient).toHaveBeenCalledWith(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      );
    });

    it('maintains consistent configuration across imports', async () => {
      const mockClient = jest.fn();
      const mockDb = { query: jest.fn() };
      const mockSupabase = { auth: jest.fn() };
      mockPostgres.mockReturnValue(mockClient);
      mockDrizzle.mockReturnValue(mockDb);
      mockCreateClient.mockReturnValue(mockSupabase);

      jest.resetModules();

      // Import multiple times
      const import1 = await import('./index');
      const import2 = await import('./index');

      // Should be the same instance (module caching)
      expect(import1.db).toBe(import2.db);
      expect(import1.supabase).toBe(import2.supabase);

      // Postgres, Drizzle, and Supabase should only be called once due to module caching
      expect(mockPostgres).toHaveBeenCalledTimes(1);
      expect(mockDrizzle).toHaveBeenCalledTimes(1);
      expect(mockCreateClient).toHaveBeenCalledTimes(1);
    });

    it('works with schema import', async () => {
      const mockClient = jest.fn();
      const mockDb = { query: jest.fn() };
      const mockSupabase = { auth: jest.fn() };
      mockPostgres.mockReturnValue(mockClient);
      mockDrizzle.mockReturnValue(mockDb);
      mockCreateClient.mockReturnValue(mockSupabase);

      jest.resetModules();
      await import('./index');

      // Verify schema is passed to drizzle
      const drizzleCall = mockDrizzle.mock.calls[0];
      expect(drizzleCall[1].schema).toEqual(expect.objectContaining(mockSchema));
    });
  });

  describe('Error Handling', () => {
    it('handles postgres initialization errors', async () => {
      process.env.DATABASE_URL = 'invalid-url';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

      mockPostgres.mockImplementation(() => {
        throw new Error('Invalid database URL');
      });

      jest.resetModules();

      await expect(import('./index')).rejects.toThrow('Invalid database URL');
    });

    it('handles Drizzle initialization errors', async () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

      const mockClient = jest.fn();
      const mockSupabase = { auth: jest.fn() };
      mockPostgres.mockReturnValue(mockClient);
      mockCreateClient.mockReturnValue(mockSupabase);
      mockDrizzle.mockImplementation(() => {
        throw new Error('Drizzle initialization failed');
      });

      jest.resetModules();

      await expect(import('./index')).rejects.toThrow('Drizzle initialization failed');
    });

    it('handles Supabase initialization errors', async () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

      const mockClient = jest.fn();
      mockPostgres.mockReturnValue(mockClient);
      mockCreateClient.mockImplementation(() => {
        throw new Error('Supabase initialization failed');
      });

      jest.resetModules();

      await expect(import('./index')).rejects.toThrow('Supabase initialization failed');
    });

    it('handles missing DATABASE_URL gracefully', async () => {
      delete process.env.DATABASE_URL;
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

      jest.resetModules();

      // The non-null assertion should cause this to fail
      await expect(import('./index')).rejects.toThrow();
    });

    it('handles missing Supabase environment variables gracefully', async () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db';
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      jest.resetModules();

      // The non-null assertion should cause this to fail
      await expect(import('./index')).rejects.toThrow();
    });
  });

  describe('Type Safety', () => {
    beforeEach(() => {
      process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    });

    it('maintains TypeScript types through the chain', async () => {
      const mockClient = jest.fn();
      const mockDb = {
        query: jest.fn(),
        $inferSelect: jest.fn(),
        $inferInsert: jest.fn(),
      };
      const mockSupabase = { auth: jest.fn() };
      mockPostgres.mockReturnValue(mockClient);
      mockDrizzle.mockReturnValue(mockDb);
      mockCreateClient.mockReturnValue(mockSupabase);

      jest.resetModules();
      const { db } = await import('./index');

      // These properties should exist on a properly typed Drizzle instance
      expect(typeof db.query).toBe('function');
    });

    it('preserves schema types in db instance', async () => {
      const mockClient = jest.fn();
      const mockDb = { query: jest.fn() };
      const mockSupabase = { auth: jest.fn() };
      mockPostgres.mockReturnValue(mockClient);
      mockDrizzle.mockReturnValue(mockDb);
      mockCreateClient.mockReturnValue(mockSupabase);

      jest.resetModules();
      await import('./index');

      // Verify that schema was passed with correct structure
      const drizzleCall = mockDrizzle.mock.calls[0];
      expect(drizzleCall[1]).toHaveProperty('schema');
      expect(drizzleCall[1]).toHaveProperty('casing', 'snake_case');
    });
  });
});
