import type { Config } from 'drizzle-kit';
import { config } from 'dotenv';

// Try to load environment variables from multiple possible files
config({ path: '.env.local' });

// Support both POSTGRES_URL (local) and DATABASE_URL (production)
const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('POSTGRES_URL or DATABASE_URL environment variable is required');
}

export default {
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
  verbose: true,
  strict: true,
} satisfies Config;
