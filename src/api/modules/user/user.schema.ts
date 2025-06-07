import { z } from 'zod';
import { timestampsSchema } from '~/lib/base-schemas';

/**
 * Complete user schema with all fields including timestamps
 * Represents the full user entity as stored in the database
 */
export const userSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().optional(),
    email: z.string().email(),
    password: z.string(),
    avatar: z.string().optional(),
  })
  .merge(timestampsSchema);

/**
 * Schema for creating a new user
 * Omits auto-generated fields (id, createdAt, updatedAt)
 * Used for user registration and creation endpoints
 */
export const createUserSchema = userSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

/**
 * Schema for updating an existing user
 * All fields are optional except for the required ID
 * Omits timestamp fields as they're managed automatically
 */
export const updateUserSchema = userSchema
  .partial()
  .omit({
    createdAt: true,
    updatedAt: true,
  })
  .required({
    id: true,
  });

/** TypeScript type for a complete user object */
export type User = z.infer<typeof userSchema>;

/** TypeScript type for user creation data */
export type CreateUser = z.infer<typeof createUserSchema>;

/** TypeScript type for user update data */
export type UpdateUser = z.infer<typeof updateUserSchema>;
