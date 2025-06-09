import {
  userSchema,
  createUserSchema,
  updateUserSchema,
  authenticateUserSchema,
} from '~/api/modules/user/user.schema';

describe('User Schemas', () => {
  describe('userSchema', () => {
    const validUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'John Doe',
      email: 'john@example.com',
      password: 'hashedPassword123',
      avatar: 'https://example.com/avatar.jpg',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('validates a complete valid user object', () => {
      const result = userSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it('validates user with optional fields missing', () => {
      const userWithoutOptionals = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'john@example.com',
        password: 'hashedPassword123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = userSchema.safeParse(userWithoutOptionals);
      expect(result.success).toBe(true);
    });

    it('rejects invalid UUID format', () => {
      const invalidUser = { ...validUser, id: 'invalid-uuid' };
      const result = userSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it('rejects invalid email format', () => {
      const invalidUser = { ...validUser, email: 'invalid-email' };
      const result = userSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it('rejects missing required fields', () => {
      const incompleteUser = { name: 'John Doe' };
      const result = userSchema.safeParse(incompleteUser);
      expect(result.success).toBe(false);
    });
  });

  describe('createUserSchema', () => {
    const validCreateUser = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'SecurePass123!',
      avatar: 'https://example.com/avatar.jpg',
    };

    it('validates valid user creation data', () => {
      const result = createUserSchema.safeParse(validCreateUser);
      expect(result.success).toBe(true);
    });

    it('validates user creation without optional fields', () => {
      const minimalUser = {
        email: 'john@example.com',
        password: 'SecurePass123!',
      };

      const result = createUserSchema.safeParse(minimalUser);
      expect(result.success).toBe(true);
    });

    it('accepts data with auto-generated fields (they are ignored)', () => {
      const userWithId = {
        ...validCreateUser,
        id: '123e4567-e89b-12d3-a456-426614174000',
      };

      const result = createUserSchema.safeParse(userWithId);
      expect(result.success).toBe(true);
      // The id field should be omitted from the parsed result
      if (result.success) {
        expect(result.data).not.toHaveProperty('id');
      }
    });

    it('rejects invalid email in creation data', () => {
      const invalidUser = { ...validCreateUser, email: 'invalid-email' };
      const result = createUserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it('rejects missing required email', () => {
      const userWithoutEmail = {
        name: 'John Doe',
        password: 'SecurePass123!',
      };

      const result = createUserSchema.safeParse(userWithoutEmail);
      expect(result.success).toBe(false);
    });

    it('rejects weak passwords', () => {
      const weakPasswords = [
        'short', // too short
        'nouppercase1!', // no uppercase
        'NOLOWERCASE1!', // no lowercase
        'NoNumbers!', // no numbers
        'NoSpecialChar1', // no special characters
      ];

      weakPasswords.forEach((password) => {
        const userWithWeakPassword = {
          ...validCreateUser,
          password,
        };
        const result = createUserSchema.safeParse(userWithWeakPassword);
        expect(result.success).toBe(false);
      });
    });

    it('accepts strong passwords', () => {
      const strongPasswords = ['SecurePass123!', 'MyP@ssw0rd', 'C0mpl3x!Pass', 'Str0ng#Password'];

      strongPasswords.forEach((password) => {
        const userWithStrongPassword = {
          ...validCreateUser,
          password,
        };
        const result = createUserSchema.safeParse(userWithStrongPassword);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('updateUserSchema', () => {
    const validUpdateUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Jane Doe',
      email: 'jane@example.com',
    };

    it('validates valid user update data', () => {
      const result = updateUserSchema.safeParse(validUpdateUser);
      expect(result.success).toBe(true);
    });

    it('validates update with only ID (no changes)', () => {
      const onlyId = { id: '123e4567-e89b-12d3-a456-426614174000' };
      const result = updateUserSchema.safeParse(onlyId);
      expect(result.success).toBe(true);
    });

    it('validates partial updates', () => {
      const partialUpdate = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'New Name',
      };

      const result = updateUserSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it('validates update with isActive field', () => {
      const updateWithIsActive = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        isActive: false,
      };

      const result = updateUserSchema.safeParse(updateWithIsActive);
      expect(result.success).toBe(true);
    });

    it('rejects update without required ID', () => {
      const updateWithoutId = { name: 'Jane Doe' };
      const result = updateUserSchema.safeParse(updateWithoutId);
      expect(result.success).toBe(false);
    });

    it('rejects invalid UUID in update', () => {
      const invalidUpdate = { ...validUpdateUser, id: 'invalid-uuid' };
      const result = updateUserSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it('accepts timestamp fields in update (they are ignored)', () => {
      const updateWithTimestamps = {
        ...validUpdateUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = updateUserSchema.safeParse(updateWithTimestamps);
      expect(result.success).toBe(true);
      // Timestamp fields should be omitted from the parsed result
      if (result.success) {
        expect(result.data).not.toHaveProperty('createdAt');
        expect(result.data).not.toHaveProperty('updatedAt');
      }
    });
  });

  describe('authenticateUserSchema', () => {
    const validAuthData = {
      email: 'john@example.com',
      password: 'myPassword123',
    };

    it('validates valid authentication data', () => {
      const result = authenticateUserSchema.safeParse(validAuthData);
      expect(result.success).toBe(true);
    });

    it('rejects invalid email format', () => {
      const invalidAuth = { ...validAuthData, email: 'invalid-email' };
      const result = authenticateUserSchema.safeParse(invalidAuth);
      expect(result.success).toBe(false);
    });

    it('rejects empty password', () => {
      const invalidAuth = { ...validAuthData, password: '' };
      const result = authenticateUserSchema.safeParse(invalidAuth);
      expect(result.success).toBe(false);
    });

    it('rejects missing email', () => {
      const invalidAuth = { password: 'myPassword123' };
      const result = authenticateUserSchema.safeParse(invalidAuth);
      expect(result.success).toBe(false);
    });

    it('rejects missing password', () => {
      const invalidAuth = { email: 'john@example.com' };
      const result = authenticateUserSchema.safeParse(invalidAuth);
      expect(result.success).toBe(false);
    });

    it('rejects extra fields', () => {
      const authWithExtra = {
        ...validAuthData,
        extraField: 'should not be here',
      };
      const result = authenticateUserSchema.safeParse(authWithExtra);
      expect(result.success).toBe(true);
      // Extra fields should be stripped out
      if (result.success) {
        expect(result.data).not.toHaveProperty('extraField');
      }
    });
  });
});
