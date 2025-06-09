import { TRPCError } from '@trpc/server';

/**
 * Database error mappings for common database constraint violations
 */
const DATABASE_ERROR_PATTERNS = {
  'unique constraint': 'already exists',
  'duplicate key': 'already exists',
  'foreign key constraint': 'referenced record not found',
  'not null constraint': 'required field is missing',
  'check constraint': 'invalid data provided',
} as const;

/**
 * Converts database errors to appropriate tRPC errors
 *
 * @param error - The original error from database operation
 * @param context - Context for error messages (e.g., 'user', 'post')
 * @param customMessages - Custom error messages for specific patterns
 * @throws TRPCError with appropriate code and message
 *
 * @example
 * ```typescript
 * try {
 *   await db.insert(users).values(userData);
 * } catch (error) {
 *   handleDatabaseError(error, 'user', {
 *     'email': 'User with this email already exists'
 *   });
 * }
 * ```
 */
export function handleDatabaseError(
  error: unknown,
  context: string = 'record',
  customMessages?: Record<string, string>,
): never {
  if (error instanceof TRPCError) {
    throw error;
  }

  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();

    // Check custom error messages first
    if (customMessages) {
      for (const [pattern, message] of Object.entries(customMessages)) {
        if (errorMessage.includes(pattern.toLowerCase())) {
          throw new TRPCError({
            code: 'CONFLICT',
            message,
            cause: error,
          });
        }
      }
    }

    // Check database error patterns
    for (const [pattern, errorType] of Object.entries(DATABASE_ERROR_PATTERNS)) {
      if (errorMessage.includes(pattern)) {
        switch (errorType) {
          case 'already exists':
            throw new TRPCError({
              code: 'CONFLICT',
              message: `${capitalize(context)} already exists`,
              cause: error,
            });
          case 'referenced record not found':
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `Referenced ${context} not found`,
              cause: error,
            });
          case 'required field is missing':
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `Required field is missing for ${context}`,
              cause: error,
            });
          case 'invalid data provided':
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `Invalid data provided for ${context}`,
              cause: error,
            });
        }
      }
    }

    // Generic database error
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Database error while processing ${context}`,
      cause: error,
    });
  }

  // Unknown error type
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: `Unknown error while processing ${context}`,
    cause: error,
  });
}

/**
 * Throws a NOT_FOUND tRPC error
 *
 * @param resource - The resource that was not found
 * @param identifier - Optional identifier for the resource
 *
 * @example
 * ```typescript
 * if (!user) {
 *   throwNotFound('User', userId);
 * }
 * ```
 */
export function throwNotFound(resource: string, identifier?: string): never {
  const message = identifier
    ? `${resource} with ID "${identifier}" not found`
    : `${resource} not found`;

  throw new TRPCError({
    code: 'NOT_FOUND',
    message,
  });
}

/**
 * Throws a BAD_REQUEST tRPC error
 *
 * @param message - The error message
 * @param cause - Optional original error
 *
 * @example
 * ```typescript
 * if (!isValidEmail(email)) {
 *   throwBadRequest('Invalid email format');
 * }
 * ```
 */
export function throwBadRequest(message: string, cause?: Error): never {
  throw new TRPCError({
    code: 'BAD_REQUEST',
    message,
    cause,
  });
}

/**
 * Throws an UNAUTHORIZED tRPC error
 *
 * @param message - The error message
 *
 * @example
 * ```typescript
 * if (!user) {
 *   throwUnauthorized('Authentication required');
 * }
 * ```
 */
export function throwUnauthorized(message: string = 'Unauthorized'): never {
  throw new TRPCError({
    code: 'UNAUTHORIZED',
    message,
  });
}

/**
 * Throws a FORBIDDEN tRPC error
 *
 * @param message - The error message
 *
 * @example
 * ```typescript
 * if (!hasPermission) {
 *   throwForbidden('Insufficient permissions');
 * }
 * ```
 */
export function throwForbidden(message: string = 'Forbidden'): never {
  throw new TRPCError({
    code: 'FORBIDDEN',
    message,
  });
}

/**
 * Throws a CONFLICT tRPC error
 *
 * @param message - The error message
 * @param cause - Optional original error
 *
 * @example
 * ```typescript
 * if (emailExists) {
 *   throwConflict('Email already exists');
 * }
 * ```
 */
export function throwConflict(message: string, cause?: Error): never {
  throw new TRPCError({
    code: 'CONFLICT',
    message,
    cause,
  });
}

/**
 * Throws an INTERNAL_SERVER_ERROR tRPC error
 *
 * @param message - The error message
 * @param cause - Optional original error
 *
 * @example
 * ```typescript
 * try {
 *   await externalApiCall();
 * } catch (error) {
 *   throwInternalError('External service unavailable', error);
 * }
 * ```
 */
export function throwInternalError(
  message: string = 'Internal server error',
  cause?: Error,
): never {
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message,
    cause,
  });
}

/**
 * Capitalizes the first letter of a string
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
