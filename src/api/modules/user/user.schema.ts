import { z } from 'zod';
import { timestampsSchema } from '~/lib/base-schemas';

export const userSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().optional(),
    email: z.string().email(),
    password: z.string(),
    avatar: z.string().optional(),
  })
  .merge(timestampsSchema);

export const createUserSchema = userSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateUserSchema = userSchema
  .partial()
  .omit({
    createdAt: true,
    updatedAt: true,
  })
  .required({
    id: true,
  });

export type User = z.infer<typeof userSchema>;
export type CreateUser = z.infer<typeof createUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
