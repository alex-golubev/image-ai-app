import { TRPCError } from '@trpc/server';
import {
  handleDatabaseError,
  throwNotFound,
  throwBadRequest,
  throwUnauthorized,
  throwForbidden,
  throwConflict,
  throwInternalError,
} from '~/lib/trpc-errors';

describe('tRPC Error Utilities', () => {
  describe('handleDatabaseError', () => {
    it('re-throws TRPCError as-is', () => {
      const originalError = new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Original tRPC error',
      });

      expect(() => handleDatabaseError(originalError, 'user')).toThrow(originalError);
    });

    it('converts unique constraint error to CONFLICT with custom message', () => {
      const dbError = new Error(
        'duplicate key value violates unique constraint "users_email_unique"',
      );
      const customMessages = { email: 'User with this email already exists' };

      expect(() => handleDatabaseError(dbError, 'user', customMessages)).toThrow(
        new TRPCError({
          code: 'CONFLICT',
          message: 'User with this email already exists',
          cause: dbError,
        }),
      );
    });

    it('converts unique constraint error to CONFLICT with default message', () => {
      const dbError = new Error('duplicate key value violates unique constraint');

      expect(() => handleDatabaseError(dbError, 'user')).toThrow(
        new TRPCError({
          code: 'CONFLICT',
          message: 'User already exists',
          cause: dbError,
        }),
      );
    });

    it('converts foreign key constraint error to BAD_REQUEST', () => {
      const dbError = new Error('foreign key constraint violation');

      expect(() => handleDatabaseError(dbError, 'user')).toThrow(
        new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Referenced user not found',
          cause: dbError,
        }),
      );
    });

    it('converts not null constraint error to BAD_REQUEST', () => {
      const dbError = new Error('not null constraint violation');

      expect(() => handleDatabaseError(dbError, 'user')).toThrow(
        new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Required field is missing for user',
          cause: dbError,
        }),
      );
    });

    it('converts check constraint error to BAD_REQUEST', () => {
      const dbError = new Error('check constraint violation');

      expect(() => handleDatabaseError(dbError, 'user')).toThrow(
        new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid data provided for user',
          cause: dbError,
        }),
      );
    });

    it('converts unknown Error to INTERNAL_SERVER_ERROR', () => {
      const dbError = new Error('Connection timeout');

      expect(() => handleDatabaseError(dbError, 'user')).toThrow(
        new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database error while processing user',
          cause: dbError,
        }),
      );
    });

    it('converts unknown error type to INTERNAL_SERVER_ERROR', () => {
      const unknownError = 'String error';

      expect(() => handleDatabaseError(unknownError, 'user')).toThrow(
        new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Unknown error while processing user',
          cause: unknownError,
        }),
      );
    });

    it('uses default context when not provided', () => {
      const dbError = new Error('Some database error');

      expect(() => handleDatabaseError(dbError)).toThrow(
        new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database error while processing record',
          cause: dbError,
        }),
      );
    });

    it('custom messages take precedence over default patterns', () => {
      const dbError = new Error('duplicate key value violates unique constraint');
      const customMessages = { duplicate: 'Custom duplicate message' };

      expect(() => handleDatabaseError(dbError, 'user', customMessages)).toThrow(
        new TRPCError({
          code: 'CONFLICT',
          message: 'Custom duplicate message',
          cause: dbError,
        }),
      );
    });
  });

  describe('throwNotFound', () => {
    it('throws NOT_FOUND error with resource name only', () => {
      expect(() => throwNotFound('User')).toThrow(
        new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        }),
      );
    });

    it('throws NOT_FOUND error with resource name and identifier', () => {
      expect(() => throwNotFound('User', '123')).toThrow(
        new TRPCError({
          code: 'NOT_FOUND',
          message: 'User with ID "123" not found',
        }),
      );
    });
  });

  describe('throwBadRequest', () => {
    it('throws BAD_REQUEST error with message', () => {
      expect(() => throwBadRequest('Invalid input')).toThrow(
        new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid input',
        }),
      );
    });

    it('throws BAD_REQUEST error with message and cause', () => {
      const cause = new Error('Validation failed');
      expect(() => throwBadRequest('Invalid input', cause)).toThrow(
        new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid input',
          cause,
        }),
      );
    });
  });

  describe('throwUnauthorized', () => {
    it('throws UNAUTHORIZED error with default message', () => {
      expect(() => throwUnauthorized()).toThrow(
        new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Unauthorized',
        }),
      );
    });

    it('throws UNAUTHORIZED error with custom message', () => {
      expect(() => throwUnauthorized('Authentication required')).toThrow(
        new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        }),
      );
    });
  });

  describe('throwForbidden', () => {
    it('throws FORBIDDEN error with default message', () => {
      expect(() => throwForbidden()).toThrow(
        new TRPCError({
          code: 'FORBIDDEN',
          message: 'Forbidden',
        }),
      );
    });

    it('throws FORBIDDEN error with custom message', () => {
      expect(() => throwForbidden('Insufficient permissions')).toThrow(
        new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        }),
      );
    });
  });

  describe('throwConflict', () => {
    it('throws CONFLICT error with message', () => {
      expect(() => throwConflict('Resource already exists')).toThrow(
        new TRPCError({
          code: 'CONFLICT',
          message: 'Resource already exists',
        }),
      );
    });

    it('throws CONFLICT error with message and cause', () => {
      const cause = new Error('Duplicate key');
      expect(() => throwConflict('Resource already exists', cause)).toThrow(
        new TRPCError({
          code: 'CONFLICT',
          message: 'Resource already exists',
          cause,
        }),
      );
    });
  });

  describe('throwInternalError', () => {
    it('throws INTERNAL_SERVER_ERROR with default message', () => {
      expect(() => throwInternalError()).toThrow(
        new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error',
        }),
      );
    });

    it('throws INTERNAL_SERVER_ERROR with custom message', () => {
      expect(() => throwInternalError('Service unavailable')).toThrow(
        new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Service unavailable',
        }),
      );
    });

    it('throws INTERNAL_SERVER_ERROR with message and cause', () => {
      const cause = new Error('Database connection failed');
      expect(() => throwInternalError('Service unavailable', cause)).toThrow(
        new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Service unavailable',
          cause,
        }),
      );
    });
  });
});
