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

// Типизация для TypeScript с использованием Zod (опционально)
export const insertImageSchema = createInsertSchema(images);
export const selectImageSchema = createSelectSchema(images);

// Дополнительные типы для более строгой валидации (опционально)
export const insertImageSchemaWithValidation = insertImageSchema.extend({
  url: z.string().url(),
  title: z.string().min(3).max(255),
});

// Типы для использования в коде
export type Image = z.infer<typeof selectImageSchema>;
export type NewImage = z.infer<typeof insertImageSchema>;
export type NewImageWithValidation = z.infer<typeof insertImageSchemaWithValidation>;
