import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

/**
 * Schema for images table
 */
export const images = pgTable('images', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  url: text('url').notNull(),
  prompt: text('prompt'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertImageSchema = createInsertSchema(images);
export const selectImageSchema = createSelectSchema(images);

export const insertImageSchemaWithValidation = z.object({
  title: z.string().min(3).max(255),
  description: z.string().optional(),
  url: z.string().url(),
  prompt: z.string().optional(),
});

export type Image = typeof images.$inferSelect;
export type NewImage = typeof images.$inferInsert;
export type NewImageWithValidation = z.infer<typeof insertImageSchemaWithValidation>;
