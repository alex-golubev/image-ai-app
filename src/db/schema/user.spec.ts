import { users } from './user';

describe('User Schema', () => {
  describe('users table', () => {
    it('should export users table', () => {
      expect(users).toBeDefined();
      expect(typeof users).toBe('object');
    });

    it('should have all required columns', () => {
      expect(users.id).toBeDefined();
      expect(users.createdAt).toBeDefined();
      expect(users.updatedAt).toBeDefined();
      expect(users.name).toBeDefined();
      expect(users.email).toBeDefined();
      expect(users.password).toBeDefined();
      expect(users.avatar).toBeDefined();
      expect(users.isActive).toBeDefined();
    });

    it('should have correct column names', () => {
      expect(users.id.name).toBe('id');
      expect(users.createdAt.name).toBe('created_at');
      expect(users.updatedAt.name).toBe('updated_at');
      expect(users.name.name).toBe('name');
      expect(users.email.name).toBe('email');
      expect(users.password.name).toBe('password');
      expect(users.avatar.name).toBe('avatar_url');
      expect(users.isActive.name).toBe('is_active');
    });

    it('should have correct column types', () => {
      expect(users.id.columnType).toBe('PgUUID');
      expect(users.createdAt.columnType).toBe('PgTimestamp');
      expect(users.updatedAt.columnType).toBe('PgTimestamp');
      expect(users.name.columnType).toBe('PgVarchar');
      expect(users.email.columnType).toBe('PgVarchar');
      expect(users.password.columnType).toBe('PgVarchar');
      expect(users.avatar.columnType).toBe('PgText');
      expect(users.isActive.columnType).toBe('PgBoolean');
    });

    it('should have correct not null constraints', () => {
      expect(users.id.notNull).toBe(true);
      expect(users.createdAt.notNull).toBe(true);
      expect(users.updatedAt.notNull).toBe(true);
      expect(users.email.notNull).toBe(true);
      expect(users.password.notNull).toBe(true);
      expect(users.isActive.notNull).toBe(true);

      // Nullable fields
      expect(users.name.notNull).toBe(false);
      expect(users.avatar.notNull).toBe(false);
    });

    it('should have primary key on id', () => {
      expect(users.id.primary).toBe(true);
    });

    it('should have unique constraint on email', () => {
      expect(users.email.isUnique).toBe(true);
    });

    it('should have default values', () => {
      expect(users.id.hasDefault).toBe(true);
      expect(users.createdAt.hasDefault).toBe(true);
      expect(users.updatedAt.hasDefault).toBe(true);
      expect(users.isActive.hasDefault).toBe(true);
    });

    it('should have onUpdate function for updatedAt', () => {
      expect(users.updatedAt.onUpdateFn).toBeDefined();

      // Test the onUpdate function returns a Date
      if (users.updatedAt.onUpdateFn) {
        const result = users.updatedAt.onUpdateFn();
        expect(result).toBeInstanceOf(Date);
      }
    });
  });
});
