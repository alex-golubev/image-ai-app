import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { images } from './images';
import { relations } from 'drizzle-orm';

/**
 * Schema for users table
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  avatar: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
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
export const insertUserSchemaWithValidation = insertUserSchema.extend({
  email: z.string().email(),
  name: z.string().min(2).max(255),
});

// Types for use in code
export type User = z.infer<typeof selectUserSchema>;
export type NewUser = z.infer<typeof insertUserSchema>;
export type NewUserWithValidation = z.infer<typeof insertUserSchemaWithValidation>;
