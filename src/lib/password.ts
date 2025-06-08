import bcrypt from 'bcrypt';

/**
 * Number of salt rounds for bcrypt hashing
 * Higher values provide better security but slower performance
 */
const SALT_ROUNDS = 12;

/**
 * Hashes a plain text password using bcrypt
 * @param password - Plain text password to hash
 * @returns Promise resolving to the hashed password
 * @throws Error if hashing fails
 * @example
 * ```ts
 * const hashedPassword = await hashPassword("mySecretPassword");
 * ```
 */
export const hashPassword = async (password: string): Promise<string> => {
  try {
    return await bcrypt.hash(password, SALT_ROUNDS);
  } catch (error) {
    throw new Error(
      `Failed to hash password: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
};

/**
 * Compares a plain text password with a hashed password
 * @param password - Plain text password to verify
 * @param hashedPassword - Hashed password to compare against
 * @returns Promise resolving to true if passwords match, false otherwise
 * @throws Error if comparison fails
 * @example
 * ```ts
 * const isValid = await verifyPassword("mySecretPassword", hashedPassword);
 * if (isValid) {
 *   console.log("Password is correct");
 * }
 * ```
 */
export const verifyPassword = async (
  password: string,
  hashedPassword: string,
): Promise<boolean> => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    throw new Error(
      `Failed to verify password: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
};
