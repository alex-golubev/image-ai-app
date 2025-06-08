import { z } from 'zod';
import { timestampsSchema } from '~/lib/base-schemas';

/**
 * Password validation schema with security requirements
 */
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

/**
 * Complete user schema with all fields including timestamps
 * Represents the full user entity as stored in the database
 */
export const userSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().optional(),
    email: z.string().email(),
    password: z.string(), // Stored password is already hashed
    avatar: z.string().optional(),
  })
  .merge(timestampsSchema);

/**
 * Schema for creating a new user
 * Omits auto-generated fields (id, createdAt, updatedAt)
 * Used for user registration and creation endpoints
 */
export const createUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email(),
  password: passwordSchema,
  avatar: z.string().optional(),
});

/**
 * Schema for updating an existing user
 * All fields are optional except for the required ID
 * Omits timestamp fields as they're managed automatically
 */
export const updateUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  password: passwordSchema.optional(),
  avatar: z.string().optional(),
});

/**
 * Schema for user authentication
 * Contains email and password for login
 */
export const authenticateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

/** TypeScript type for a complete user object */
export type User = z.infer<typeof userSchema>;

/** TypeScript type for user creation data */
export type CreateUser = z.infer<typeof createUserSchema>;

/** TypeScript type for user update data */
export type UpdateUser = z.infer<typeof updateUserSchema>;

/** TypeScript type for user authentication data */
export type AuthenticateUser = z.infer<typeof authenticateUserSchema>;
