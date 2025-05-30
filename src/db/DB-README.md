# Database in the Project

This project uses Drizzle ORM to work with Neon Serverless Postgres database. Below is information on setup and usage.

## Project Structure

```
src/
  ├─ db/
  │   ├─ index.ts     # Database connection
  │   ├─ schema.ts    # Database schema
  │   └─ config.ts    # Drizzle configuration
  └─ app/
      └─ api/
          └─ images/
              └─ route.ts  # API endpoints for working with images
```

## Environment Variables Setup

1. Create a `.env.local` file in the project root:

```
DATABASE_URL="postgresql://user:password@db.your-instance.neon.tech/dbname?sslmode=require"
```

2. For production environment, add the same `DATABASE_URL` variable in Vercel settings.

## Database Schema

The project defines the following database schema (`src/db/schema.ts`):

```typescript
import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const images = pgTable('images', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  url: text('url').notNull(),
  prompt: text('prompt'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

## Drizzle Commands

The project has the following commands configured for working with Drizzle:

### Generate Migrations

```
npm run drizzle:generate
```

This command generates SQL migrations based on your schema. Migrations are saved in the `drizzle` folder.

### Apply Migrations to the Database

```
npm run drizzle:push
```

This command applies your schema changes directly to the database.

### View Data (Drizzle Studio)

```
npm run drizzle:studio
```

This command launches Drizzle Studio, a web interface for viewing and editing data in your database.

## Working with the Database in Code

### Database Connection

```typescript
// src/db/index.ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

import * as schema from './schema';

// Using environment variable for database connection
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

### Query Examples

#### Get All Records

```typescript
import { db } from '@/db';
import { images } from '@/db/schema';

// Get all records
const allImages = await db.select().from(images);
```

#### Add a Record

```typescript
import { db } from '@/db';
import { images } from '@/db/schema';

// Add a new record
const result = await db
  .insert(images)
  .values({
    title: 'Image title',
    description: 'Image description',
    url: 'https://example.com/image.jpg',
    prompt: 'Prompt used for generation',
  })
  .returning();
```

#### Get a Record by ID

```typescript
import { db } from '@/db';
import { images } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Get a record by ID
const image = await db.select().from(images).where(eq(images.id, 'uuid-string'));
```

#### Update a Record

```typescript
import { db } from '@/db';
import { images } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Update a record
await db.update(images).set({ title: 'New title' }).where(eq(images.id, 'uuid-string'));
```

#### Delete a Record

```typescript
import { db } from '@/db';
import { images } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Delete a record
await db.delete(images).where(eq(images.id, 'uuid-string'));
```

## API Endpoints

### GET /api/images

Returns a list of all images.

### POST /api/images

Creates a new image.

Request body example:

```json
{
  "title": "Image title",
  "description": "Image description",
  "url": "https://example.com/image.jpg",
  "prompt": "Prompt used for generation"
}
```

### PUT /api/images

Updates an existing image.

Request body example:

```json
{
  "id": "uuid-string",
  "title": "New title",
  "description": "New description",
  "url": "https://example.com/new-image.jpg",
  "prompt": "New prompt"
}
```

### DELETE /api/images?id=uuid-string

Deletes an image by the specified ID.

## Neon Serverless Postgres Features

Neon Serverless Postgres provides a serverless solution for PostgreSQL that automatically scales to your workload. Features:

1. **Automatic Scaling**: Database resources scale automatically.
2. **Pay-Per-Use**: You only pay for the resources you actually use.
3. **Serverless Architecture**: Ideal for applications deployed on Vercel, Netlify, and other serverless platforms.
4. **PostgreSQL Compatibility**: Full compatibility with PostgreSQL, including all extensions.

## Useful Links

- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)
- [Drizzle Kit](https://orm.drizzle.team/docs/kit-overview)
- [Neon Serverless Postgres](https://neon.tech/docs)
- [Vercel Integration with Neon](https://vercel.com/docs/storage/vercel-postgres)
