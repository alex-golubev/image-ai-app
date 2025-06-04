import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { images } from './images';
import { relations } from 'drizzle-orm';
import { z } from 'zod';

/**
 * Schema for users table
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  avatar: text('avatar_url'),
});

/**
 * Define relationships between users and images
 */
export const usersRelations = relations(users, ({ many }) => ({
  images: many(images),
}));

/**
 * Define the reverse relationship from images to users
 */
export const imagesRelations = relations(images, ({ one }) => ({
  user: one(users, {
    fields: [images.id],
    references: [users.id],
  }),
}));

// Schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

// Enhanced validation schema
export const insertUserSchemaWithValidation = z.object({
  name: z.string().min(2).max(255),
  email: z.string().email(),
  avatar: z.string().optional(),
});

// Types for use in code
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type NewUserWithValidation = z.infer<typeof insertUserSchemaWithValidation>;
