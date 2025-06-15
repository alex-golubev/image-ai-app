import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from '~/db/schema/index';

// Create Supabase client for auth and other features
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// Create postgres connection for Drizzle ORM
// Support both POSTGRES_URL (local) and DATABASE_URL (production)
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL!;
const client = postgres(connectionString);

export const db = drizzle(client, { schema, casing: 'snake_case' });
