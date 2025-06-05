import { z } from 'zod';

/**
 * Common schema for UUID parameters
 * Используется для всех эндпоинтов, где нужно передать ID сущности
 */
export const uuidParamSchema = z.object({
  id: z.string().uuid(),
});

/**
 * Common schema for pagination parameters
 */
export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});

/**
 * Common schema for search parameters
 */
export const searchSchema = z.object({
  query: z.string().min(1),
});

/**
 * Base timestamps schema for entities
 * Включает createdAt и updatedAt поля
 */
export const timestampsSchema = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Export types
export type UuidParam = z.infer<typeof uuidParamSchema>;
export type Pagination = z.infer<typeof paginationSchema>;
export type Search = z.infer<typeof searchSchema>;
export type Timestamps = z.infer<typeof timestampsSchema>;
