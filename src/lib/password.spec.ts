import { hashPassword, verifyPassword } from '~/lib/password';

// Mock bcrypt for error testing
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

import bcrypt from 'bcrypt';

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('Password utilities', () => {
  const plainPassword = 'testPassword123';

  beforeEach(() => {
    jest.clearAllMocks();
    // Set up default successful behavior
    // @ts-expect-error - mocking for testing
    mockBcrypt.hash.mockImplementation((password: string) =>
      Promise.resolve(`$2b$12$hashedversion.of.${password}.${Math.random()}`),
    );
    // @ts-expect-error - mocking for testing
    mockBcrypt.compare.mockImplementation((password: string, hash: string) =>
      Promise.resolve(password !== '' && hash.includes(password)),
    );
  });

  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      const hashedPassword = await hashPassword(plainPassword);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(plainPassword);
      expect(hashedPassword.length).toBeGreaterThan(0);
      expect(hashedPassword).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash format
    });

    it('should generate different hashes for the same password', async () => {
      const hash1 = await hashPassword(plainPassword);
      const hash2 = await hashPassword(plainPassword);

      expect(hash1).not.toBe(hash2);
    });

    it('should hash empty password (bcrypt allows this)', async () => {
      const hashedPassword = await hashPassword('');
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).toMatch(/^\$2[aby]\$\d+\$/);
    });
  });

  describe('verifyPassword', () => {
    let hashedPassword: string;

    beforeEach(async () => {
      hashedPassword = await hashPassword(plainPassword);
    });

    it('should verify correct password', async () => {
      const isValid = await verifyPassword(plainPassword, hashedPassword);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const isValid = await verifyPassword('wrongPassword', hashedPassword);
      expect(isValid).toBe(false);
    });

    it('should reject empty password', async () => {
      const isValid = await verifyPassword('', hashedPassword);
      expect(isValid).toBe(false);
    });

    it('should return false for invalid hash format', async () => {
      const isValid = await verifyPassword(plainPassword, 'invalidHash');
      expect(isValid).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should throw error when bcrypt.hash fails', async () => {
      const error = new Error('Bcrypt hash failed');
      // @ts-expect-error - mocking for error testing
      mockBcrypt.hash.mockRejectedValueOnce(error);

      await expect(hashPassword('test')).rejects.toThrow(
        'Failed to hash password: Bcrypt hash failed',
      );
    });

    it('should throw error when bcrypt.hash fails with unknown error', async () => {
      // @ts-expect-error - mocking for error testing
      mockBcrypt.hash.mockRejectedValueOnce('Unknown error');

      await expect(hashPassword('test')).rejects.toThrow('Failed to hash password: Unknown error');
    });

    it('should throw error when bcrypt.compare fails', async () => {
      const error = new Error('Bcrypt compare failed');
      // @ts-expect-error - mocking for error testing
      mockBcrypt.compare.mockRejectedValueOnce(error);

      await expect(verifyPassword('test', 'hash')).rejects.toThrow(
        'Failed to verify password: Bcrypt compare failed',
      );
    });

    it('should throw error when bcrypt.compare fails with unknown error', async () => {
      // @ts-expect-error - mocking for error testing
      mockBcrypt.compare.mockRejectedValueOnce('Unknown error');

      await expect(verifyPassword('test', 'hash')).rejects.toThrow(
        'Failed to verify password: Unknown error',
      );
    });
  });
});
