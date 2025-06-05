/**
 * Database error handler utility
 *
 * Provides consistent error handling for database operations
 * with automatic error type detection and meaningful error messages.
 */

type DatabaseErrorMap = Record<string, string>;

/**
 * Default error mappings for common database errors
 */
const DEFAULT_ERROR_MAP: DatabaseErrorMap = {
  'unique constraint': 'already exists',
  'duplicate key': 'already exists',
  'foreign key constraint': 'referenced record not found',
  'not null constraint': 'required field is missing',
  'check constraint': 'invalid data provided',
};

/**
 * Handles database operations with automatic error conversion
 *
 * @param operation - Async database operation to execute
 * @param context - Context for error messages (e.g., 'user', 'post')
 * @param customErrorMap - Custom error mappings to override defaults
 * @returns Promise with the result or throws meaningful error
 *
 * @example
 * ```typescript
 * export const createUser = async (input: CreateUser) => {
 *   return await handleDbOperation(
 *     () => db.insert(users).values(input).returning(),
 *     'user',
 *     { 'email_unique': 'User with this email already exists' }
 *   );
 * };
 * ```
 */
export const handleDbOperation = async <T>(
  operation: () => Promise<T>,
  context: string = 'record',
  customErrorMap?: DatabaseErrorMap,
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      // Check custom error mappings first
      if (customErrorMap) {
        for (const [errorPattern, message] of Object.entries(customErrorMap)) {
          if (errorMessage.includes(errorPattern.toLowerCase())) {
            throw new Error(message);
          }
        }
      }

      // Check default error mappings
      for (const [errorPattern, errorType] of Object.entries(DEFAULT_ERROR_MAP)) {
        if (errorMessage.includes(errorPattern)) {
          switch (errorType) {
            case 'already exists':
              throw new Error(`${capitalize(context)} already exists`);
            case 'referenced record not found':
              throw new Error(`Referenced ${context} not found`);
            case 'required field is missing':
              throw new Error(`Required field is missing for ${context}`);
            case 'invalid data provided':
              throw new Error(`Invalid data provided for ${context}`);
          }
        }
      }

      // Generic database error
      throw new Error(`Database error while processing ${context}: ${error.message}`);
    }

    // Unknown error type
    throw new Error(`Unknown error while processing ${context}`);
  }
};

/**
 * Simplified version for read operations
 *
 * @param operation - Async read operation to execute
 * @param context - Context for error messages
 * @returns Promise with the result or throws meaningful error
 */
export const handleDbRead = async <T>(
  operation: () => Promise<T>,
  context: string = 'records',
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error fetching ${context}: ${error.message}`);
    }
    throw new Error(`Unknown error while fetching ${context}`);
  }
};

/**
 * Utility function to capitalize first letter
 */
const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Handles database transactions with automatic error handling
 *
 * @param operations - Array of database operations to execute in transaction
 * @param context - Context for error messages
 * @returns Promise with the results or throws meaningful error
 *
 * @example
 * ```typescript
 * export const createUserWithProfile = async (userData: CreateUser, profileData: CreateProfile) => {
 *   return await handleDbTransaction([
 *     () => db.insert(users).values(userData).returning(),
 *     (userResult) => db.insert(profiles).values({ ...profileData, userId: userResult[0].id }).returning()
 *   ], 'user and profile');
 * };
 * ```
 */
export const handleDbTransaction = async <T>(
  operations: Array<(previousResult?: unknown) => Promise<T>>,
  context: string = 'transaction',
): Promise<T[]> => {
  try {
    const results: T[] = [];
    let previousResult: unknown;

    for (const operation of operations) {
      const result = await operation(previousResult);
      results.push(result);
      previousResult = result;
    }

    return results;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Transaction failed for ${context}: ${error.message}`);
    }
    throw new Error(`Unknown error in transaction for ${context}`);
  }
};

/**
 * Creates a reusable error handler for specific entity types
 *
 * @param entityName - Name of the entity (e.g., 'user', 'post')
 * @param customErrorMap - Custom error mappings for this entity
 * @returns Configured error handler functions
 *
 * @example
 * ```typescript
 * const { handleOperation, handleRead } = createEntityErrorHandler('user', {
 *   'email_unique': 'User with this email already exists'
 * });
 *
 * export const createUser = (input: CreateUser) =>
 *   handleOperation(() => db.insert(users).values(input).returning());
 * ```
 */
export const createEntityErrorHandler = (entityName: string, customErrorMap?: DatabaseErrorMap) => {
  return {
    handleOperation: <T>(operation: () => Promise<T>) =>
      handleDbOperation(operation, entityName, customErrorMap),

    handleRead: <T>(operation: () => Promise<T>) => handleDbRead(operation, entityName),

    handleTransaction: <T>(operations: Array<(previousResult?: unknown) => Promise<T>>) =>
      handleDbTransaction(operations, entityName),
  };
};
