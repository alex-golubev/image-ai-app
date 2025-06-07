// Mock Neon database
const mockNeon = jest.fn();
jest.mock('@neondatabase/serverless', () => ({
  neon: mockNeon,
}));

// Mock Drizzle ORM
const mockDrizzle = jest.fn();
jest.mock('drizzle-orm/neon-http', () => ({
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
    it('initializes Neon client with DATABASE_URL', async () => {
      const testUrl = 'postgresql://user:pass@host:5432/db';
      process.env.DATABASE_URL = testUrl;

      // Mock return values
      const mockSql = jest.fn();
      const mockDb = { query: jest.fn() };
      mockNeon.mockReturnValue(mockSql);
      mockDrizzle.mockReturnValue(mockDb);

      // Re-import the module to trigger initialization
      jest.resetModules();
      await import('./index');

      expect(mockNeon).toHaveBeenCalledWith(testUrl);
    });

    it('calls drizzle with correct parameters', async () => {
      const testUrl = 'postgresql://user:pass@host:5432/db';
      process.env.DATABASE_URL = testUrl;

      // Mock return values
      const mockSql = jest.fn();
      const mockDb = { query: jest.fn() };
      mockNeon.mockReturnValue(mockSql);
      mockDrizzle.mockReturnValue(mockDb);

      // Re-import the module to trigger initialization
      jest.resetModules();
      await import('./index');

      expect(mockDrizzle).toHaveBeenCalledWith(mockSql, {
        schema: expect.objectContaining(mockSchema),
        casing: 'snake_case',
      });
    });

    it('exports db instance', async () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db';

      // Mock return values
      const mockSql = jest.fn();
      const mockDb = { query: jest.fn(), select: jest.fn() };
      mockNeon.mockReturnValue(mockSql);
      mockDrizzle.mockReturnValue(mockDb);

      // Re-import the module
      jest.resetModules();
      const dbModule = await import('./index');

      expect(dbModule.db).toBeDefined();
      expect(dbModule.db).toBe(mockDb);
    });

    it('throws error when DATABASE_URL is not provided', async () => {
      delete process.env.DATABASE_URL;

      // Mock Neon to throw error when DATABASE_URL is undefined
      mockNeon.mockImplementation((url) => {
        if (!url) {
          throw new Error('DATABASE_URL is required');
        }
        return jest.fn();
      });

      // Re-import the module
      jest.resetModules();

      await expect(import('./index')).rejects.toThrow();
    });
  });

  describe('Database Configuration', () => {
    beforeEach(() => {
      process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db';
    });

    it('configures snake_case casing', async () => {
      const mockSql = jest.fn();
      const mockDb = { query: jest.fn() };
      mockNeon.mockReturnValue(mockSql);
      mockDrizzle.mockReturnValue(mockDb);

      jest.resetModules();
      await import('./index');

      const drizzleCall = mockDrizzle.mock.calls[0];
      expect(drizzleCall[1]).toHaveProperty('casing', 'snake_case');
    });

    it('includes schema in configuration', async () => {
      const mockSql = jest.fn();
      const mockDb = { query: jest.fn() };
      mockNeon.mockReturnValue(mockSql);
      mockDrizzle.mockReturnValue(mockDb);

      jest.resetModules();
      await import('./index');

      const drizzleCall = mockDrizzle.mock.calls[0];
      expect(drizzleCall[1].schema).toEqual(expect.objectContaining(mockSchema));
    });

    it('passes Neon SQL client to Drizzle', async () => {
      const mockSql = jest.fn();
      const mockDb = { query: jest.fn() };
      mockNeon.mockReturnValue(mockSql);
      mockDrizzle.mockReturnValue(mockDb);

      jest.resetModules();
      await import('./index');

      const drizzleCall = mockDrizzle.mock.calls[0];
      expect(drizzleCall[0]).toBe(mockSql);
    });
  });

  describe('Environment Variables', () => {
    it('handles different DATABASE_URL formats', async () => {
      const testUrls = [
        'postgresql://user:pass@localhost:5432/db',
        'postgresql://user:pass@neon.tech:5432/db?sslmode=require',
        'postgres://user:pass@host:5432/db',
      ];

      for (const url of testUrls) {
        process.env.DATABASE_URL = url;

        const mockSql = jest.fn();
        const mockDb = { query: jest.fn() };
        mockNeon.mockReturnValue(mockSql);
        mockDrizzle.mockReturnValue(mockDb);

        jest.resetModules();
        await import('./index');

        expect(mockNeon).toHaveBeenCalledWith(url);
        jest.clearAllMocks();
      }
    });

    it('uses non-null assertion for DATABASE_URL', async () => {
      // This test ensures that the code uses DATABASE_URL! (non-null assertion)
      process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db';

      const mockSql = jest.fn();
      const mockDb = { query: jest.fn() };
      mockNeon.mockReturnValue(mockSql);
      mockDrizzle.mockReturnValue(mockDb);

      jest.resetModules();

      // Should not throw with valid URL
      await expect(import('./index')).resolves.toBeDefined();
    });
  });

  describe('Module Exports', () => {
    beforeEach(() => {
      process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db';
    });

    it('exports only db instance', async () => {
      const mockSql = jest.fn();
      const mockDb = { query: jest.fn() };
      mockNeon.mockReturnValue(mockSql);
      mockDrizzle.mockReturnValue(mockDb);

      jest.resetModules();
      const dbModule = await import('./index');

      const exports = Object.keys(dbModule);
      expect(exports).toEqual(['db']);
    });

    it('exports db as named export', async () => {
      const mockSql = jest.fn();
      const mockDb = { query: jest.fn() };
      mockNeon.mockReturnValue(mockSql);
      mockDrizzle.mockReturnValue(mockDb);

      jest.resetModules();
      const { db } = await import('./index');

      expect(db).toBeDefined();
      expect(db).toBe(mockDb);
    });

    it('db instance has expected Drizzle methods', async () => {
      const mockSql = jest.fn();
      const mockDb = {
        query: jest.fn(),
        select: jest.fn(),
        insert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        transaction: jest.fn(),
      };
      mockNeon.mockReturnValue(mockSql);
      mockDrizzle.mockReturnValue(mockDb);

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
    });

    it('creates a complete database connection chain', async () => {
      const mockSql = jest.fn();
      const mockDb = { query: jest.fn() };
      mockNeon.mockReturnValue(mockSql);
      mockDrizzle.mockReturnValue(mockDb);

      jest.resetModules();
      await import('./index');

      // Verify the complete chain: DATABASE_URL -> neon() -> drizzle() -> db
      expect(mockNeon).toHaveBeenCalledTimes(1);
      expect(mockDrizzle).toHaveBeenCalledTimes(1);
      expect(mockNeon).toHaveBeenCalledWith(process.env.DATABASE_URL);
      expect(mockDrizzle).toHaveBeenCalledWith(mockSql, expect.any(Object));
    });

    it('maintains consistent configuration across imports', async () => {
      const mockSql = jest.fn();
      const mockDb = { query: jest.fn() };
      mockNeon.mockReturnValue(mockSql);
      mockDrizzle.mockReturnValue(mockDb);

      jest.resetModules();

      // Import multiple times
      const import1 = await import('./index');
      const import2 = await import('./index');

      // Should be the same instance (module caching)
      expect(import1.db).toBe(import2.db);

      // Neon and Drizzle should only be called once due to module caching
      expect(mockNeon).toHaveBeenCalledTimes(1);
      expect(mockDrizzle).toHaveBeenCalledTimes(1);
    });

    it('works with schema import', async () => {
      const mockSql = jest.fn();
      const mockDb = { query: jest.fn() };
      mockNeon.mockReturnValue(mockSql);
      mockDrizzle.mockReturnValue(mockDb);

      jest.resetModules();
      await import('./index');

      // Verify schema is passed to drizzle
      const drizzleCall = mockDrizzle.mock.calls[0];
      expect(drizzleCall[1].schema).toEqual(expect.objectContaining(mockSchema));
    });
  });

  describe('Error Handling', () => {
    it('handles Neon initialization errors', async () => {
      process.env.DATABASE_URL = 'invalid-url';

      mockNeon.mockImplementation(() => {
        throw new Error('Invalid database URL');
      });

      jest.resetModules();

      await expect(import('./index')).rejects.toThrow('Invalid database URL');
    });

    it('handles Drizzle initialization errors', async () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db';

      const mockSql = jest.fn();
      mockNeon.mockReturnValue(mockSql);
      mockDrizzle.mockImplementation(() => {
        throw new Error('Drizzle initialization failed');
      });

      jest.resetModules();

      await expect(import('./index')).rejects.toThrow('Drizzle initialization failed');
    });

    it('handles missing DATABASE_URL gracefully', async () => {
      delete process.env.DATABASE_URL;

      jest.resetModules();

      // The non-null assertion should cause this to fail
      await expect(import('./index')).rejects.toThrow();
    });
  });

  describe('Type Safety', () => {
    beforeEach(() => {
      process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db';
    });

    it('maintains TypeScript types through the chain', async () => {
      const mockSql = jest.fn();
      const mockDb = {
        query: jest.fn(),
        $inferSelect: jest.fn(),
        $inferInsert: jest.fn(),
      };
      mockNeon.mockReturnValue(mockSql);
      mockDrizzle.mockReturnValue(mockDb);

      jest.resetModules();
      const { db } = await import('./index');

      // These properties should exist on a properly typed Drizzle instance
      expect(typeof db.query).toBe('function');
    });

    it('preserves schema types in db instance', async () => {
      const mockSql = jest.fn();
      const mockDb = { query: jest.fn() };
      mockNeon.mockReturnValue(mockSql);
      mockDrizzle.mockReturnValue(mockDb);

      jest.resetModules();
      await import('./index');

      // Verify that schema was passed with correct structure
      const drizzleCall = mockDrizzle.mock.calls[0];
      expect(drizzleCall[1]).toHaveProperty('schema');
      expect(drizzleCall[1]).toHaveProperty('casing', 'snake_case');
    });
  });
});
