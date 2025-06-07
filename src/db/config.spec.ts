// Mock dotenv config function
const mockConfig = jest.fn();
jest.mock('dotenv', () => ({
  config: mockConfig,
}));

describe('Database Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset process.env to a clean state
    process.env = { ...originalEnv };
    // Reset mock implementation
    mockConfig.mockImplementation(() => {});
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Environment Variable Loading', () => {
    it('loads environment variables from .env.local', async () => {
      // Set DATABASE_URL to prevent error
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

      // Re-require the module to trigger dotenv.config
      jest.resetModules();
      await import('./config');

      expect(mockConfig).toHaveBeenCalledWith({ path: '.env.local' });
    });

    it('throws error when DATABASE_URL is not provided', async () => {
      // Remove DATABASE_URL
      delete process.env.DATABASE_URL;

      // Re-require the module to trigger the check
      jest.resetModules();

      await expect(import('./config')).rejects.toThrow(
        'DATABASE_URL environment variable is required',
      );
    });

    it('throws error when DATABASE_URL is empty string', async () => {
      // Set empty DATABASE_URL
      process.env.DATABASE_URL = '';

      // Re-require the module to trigger the check
      jest.resetModules();

      await expect(import('./config')).rejects.toThrow(
        'DATABASE_URL environment variable is required',
      );
    });

    it('does not throw error when DATABASE_URL is provided', async () => {
      // Set valid DATABASE_URL
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/dbname';

      // Re-require the module
      jest.resetModules();

      await expect(import('./config')).resolves.toBeDefined();
    });
  });

  describe('Configuration Object', () => {
    beforeEach(() => {
      // Set valid DATABASE_URL for these tests
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/dbname';
      jest.resetModules();
    });

    it('exports correct schema path', async () => {
      const config = (await import('./config')).default;

      expect(config.schema).toBe('./src/db/schema/index.ts');
    });

    it('exports correct output directory', async () => {
      const config = (await import('./config')).default;

      expect(config.out).toBe('./drizzle');
    });

    it('exports correct dialect', async () => {
      const config = (await import('./config')).default;

      expect(config.dialect).toBe('postgresql');
    });

    it('exports correct database credentials', async () => {
      const testUrl = 'postgresql://testuser:testpass@testhost:5432/testdb';
      process.env.DATABASE_URL = testUrl;
      jest.resetModules();

      const config = (await import('./config')).default;

      expect(config.dbCredentials).toEqual({
        url: testUrl,
      });
    });

    it('uses DATABASE_URL from environment', async () => {
      const customUrl = 'postgresql://custom:custom@custom.host:5432/custom_db';
      process.env.DATABASE_URL = customUrl;
      jest.resetModules();

      const config = (await import('./config')).default;

      expect(config.dbCredentials.url).toBe(customUrl);
    });
  });

  describe('Configuration Structure', () => {
    beforeEach(() => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/dbname';
      jest.resetModules();
    });

    it('exports an object with all required properties', async () => {
      const config = (await import('./config')).default;

      expect(config).toHaveProperty('schema');
      expect(config).toHaveProperty('out');
      expect(config).toHaveProperty('dialect');
      expect(config).toHaveProperty('dbCredentials');
    });

    it('has dbCredentials with url property', async () => {
      const config = (await import('./config')).default;

      expect(config.dbCredentials).toHaveProperty('url');
      expect(typeof config.dbCredentials.url).toBe('string');
    });

    it('satisfies Drizzle Config type structure', async () => {
      const config = (await import('./config')).default;

      // Check that all required properties exist and have correct types
      expect(typeof config.schema).toBe('string');
      expect(typeof config.out).toBe('string');
      expect(typeof config.dialect).toBe('string');
      expect(typeof config.dbCredentials).toBe('object');
      expect(typeof config.dbCredentials.url).toBe('string');
    });
  });

  describe('Different DATABASE_URL Formats', () => {
    const testCases = [
      {
        name: 'standard PostgreSQL URL',
        url: 'postgresql://user:password@localhost:5432/database',
      },
      {
        name: 'PostgreSQL URL with special characters in password',
        url: 'postgresql://user:p%40ssw0rd@localhost:5432/database',
      },
      {
        name: 'PostgreSQL URL with SSL parameters',
        url: 'postgresql://user:password@localhost:5432/database?sslmode=require',
      },
      {
        name: 'PostgreSQL URL with multiple parameters',
        url: 'postgresql://user:password@localhost:5432/database?sslmode=require&connect_timeout=10',
      },
      {
        name: 'Neon database URL format',
        url: 'postgresql://user:password@ep-example-123456.us-east-1.aws.neon.tech/database?sslmode=require',
      },
      {
        name: 'Supabase database URL format',
        url: 'postgresql://postgres:password@db.example.supabase.co:5432/postgres',
      },
    ];

    testCases.forEach(({ name, url }) => {
      it(`handles ${name}`, async () => {
        process.env.DATABASE_URL = url;
        jest.resetModules();

        const config = (await import('./config')).default;

        expect(config.dbCredentials.url).toBe(url);
      });
    });
  });

  describe('Environment Loading Edge Cases', () => {
    it('calls dotenv config exactly once', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      jest.resetModules();

      await import('./config');

      expect(mockConfig).toHaveBeenCalledTimes(1);
    });

    it('loads .env.local specifically', async () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
      jest.resetModules();

      await import('./config');

      expect(mockConfig).toHaveBeenCalledWith({ path: '.env.local' });
      expect(mockConfig).not.toHaveBeenCalledWith({ path: '.env' });
    });
  });

  describe('Integration with Drizzle Kit', () => {
    beforeEach(() => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/dbname';
      jest.resetModules();
    });

    it('provides all required fields for Drizzle Kit', async () => {
      const config = (await import('./config')).default;

      // These are the minimum required fields for Drizzle Kit
      expect(config).toHaveProperty('schema');
      expect(config).toHaveProperty('out');
      expect(config).toHaveProperty('dialect');
      expect(config).toHaveProperty('dbCredentials');

      // Verify types
      expect(typeof config.schema).toBe('string');
      expect(typeof config.out).toBe('string');
      expect(config.dialect).toBe('postgresql');
      expect(config.dbCredentials).toHaveProperty('url');
    });

    it('schema path points to correct location', async () => {
      const config = (await import('./config')).default;

      expect(config.schema).toBe('./src/db/schema/index.ts');
      // This should be a relative path from project root
      expect(config.schema.startsWith('./')).toBe(true);
    });

    it('output directory is correctly configured', async () => {
      const config = (await import('./config')).default;

      expect(config.out).toBe('./drizzle');
      // Should be relative path for migrations output
      expect(config.out.startsWith('./')).toBe(true);
    });
  });
});
