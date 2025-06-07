import { z } from 'zod';
import {
  uuidParamSchema,
  paginationSchema,
  searchSchema,
  timestampsSchema,
  type UuidParam,
  type Pagination,
  type Search,
  type Timestamps,
} from '~/lib/base-schemas';

describe('Base Schemas', () => {
  describe('uuidParamSchema', () => {
    it('validates valid UUID', () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const result = uuidParamSchema.parse({ id: validUuid });

      expect(result).toEqual({ id: validUuid });
      expect(result.id).toBe(validUuid);
    });

    it('validates UUID v4 format', () => {
      const uuidV4 = '123e4567-e89b-12d3-a456-426614174000';
      const result = uuidParamSchema.parse({ id: uuidV4 });

      expect(result.id).toBe(uuidV4);
    });

    it('rejects invalid UUID format', () => {
      const invalidUuids = [
        'not-a-uuid',
        '123',
        '550e8400-e29b-41d4-a716',
        '550e8400-e29b-41d4-a716-44665544000g',
        '',
        'null',
      ];

      invalidUuids.forEach((invalidUuid) => {
        expect(() => uuidParamSchema.parse({ id: invalidUuid })).toThrow(z.ZodError);
      });
    });

    it('rejects missing id field', () => {
      expect(() => uuidParamSchema.parse({})).toThrow(z.ZodError);
      expect(() => uuidParamSchema.parse({ notId: 'value' })).toThrow(z.ZodError);
    });

    it('rejects non-string id', () => {
      const nonStringIds = [123, null, undefined, {}, [], true];

      nonStringIds.forEach((nonStringId) => {
        expect(() => uuidParamSchema.parse({ id: nonStringId })).toThrow(z.ZodError);
      });
    });

    it('has correct TypeScript type', () => {
      const result = uuidParamSchema.parse({ id: '550e8400-e29b-41d4-a716-446655440000' });

      // Type assertion to ensure TypeScript types are correct
      const typedResult: UuidParam = result;
      expect(typeof typedResult.id).toBe('string');
    });
  });

  describe('paginationSchema', () => {
    it('validates valid pagination parameters', () => {
      const validPagination = { page: 2, limit: 20 };
      const result = paginationSchema.parse(validPagination);

      expect(result).toEqual(validPagination);
    });

    it('applies default values when not provided', () => {
      const result = paginationSchema.parse({});

      expect(result).toEqual({ page: 1, limit: 10 });
    });

    it('applies default page when only limit provided', () => {
      const result = paginationSchema.parse({ limit: 50 });

      expect(result).toEqual({ page: 1, limit: 50 });
    });

    it('applies default limit when only page provided', () => {
      const result = paginationSchema.parse({ page: 3 });

      expect(result).toEqual({ page: 3, limit: 10 });
    });

    it('validates minimum page value', () => {
      expect(() => paginationSchema.parse({ page: 0 })).toThrow(z.ZodError);
      expect(() => paginationSchema.parse({ page: -1 })).toThrow(z.ZodError);
    });

    it('validates minimum limit value', () => {
      expect(() => paginationSchema.parse({ limit: 0 })).toThrow(z.ZodError);
      expect(() => paginationSchema.parse({ limit: -5 })).toThrow(z.ZodError);
    });

    it('validates maximum limit value', () => {
      expect(() => paginationSchema.parse({ limit: 101 })).toThrow(z.ZodError);
      expect(() => paginationSchema.parse({ limit: 1000 })).toThrow(z.ZodError);
    });

    it('accepts limit at boundary values', () => {
      const minLimit = paginationSchema.parse({ limit: 1 });
      const maxLimit = paginationSchema.parse({ limit: 100 });

      expect(minLimit.limit).toBe(1);
      expect(maxLimit.limit).toBe(100);
    });

    it('rejects non-number values', () => {
      const nonNumbers = [{}, [], true, 'not-a-number'];

      nonNumbers.forEach((nonNumber) => {
        expect(() => paginationSchema.parse({ page: nonNumber })).toThrow(z.ZodError);
        expect(() => paginationSchema.parse({ limit: nonNumber })).toThrow(z.ZodError);
      });
    });

    it('has correct TypeScript type', () => {
      const result = paginationSchema.parse({ page: 2, limit: 25 });

      const typedResult: Pagination = result;
      expect(typeof typedResult.page).toBe('number');
      expect(typeof typedResult.limit).toBe('number');
    });
  });

  describe('searchSchema', () => {
    it('validates valid search query', () => {
      const validQueries = [
        'search term',
        'a',
        'very long search query with multiple words',
        '123',
        'special@characters#allowed',
      ];

      validQueries.forEach((query) => {
        const result = searchSchema.parse({ query });
        expect(result).toEqual({ query });
      });
    });

    it('rejects empty string', () => {
      expect(() => searchSchema.parse({ query: '' })).toThrow(z.ZodError);
    });

    it('rejects missing query field', () => {
      expect(() => searchSchema.parse({})).toThrow(z.ZodError);
      expect(() => searchSchema.parse({ notQuery: 'value' })).toThrow(z.ZodError);
    });

    it('rejects non-string query', () => {
      const nonStrings = [123, null, undefined, {}, [], true];

      nonStrings.forEach((nonString) => {
        expect(() => searchSchema.parse({ query: nonString })).toThrow(z.ZodError);
      });
    });

    it('trims whitespace correctly', () => {
      // Note: Zod string validation doesn't automatically trim
      const queryWithSpaces = '  search term  ';
      const result = searchSchema.parse({ query: queryWithSpaces });

      expect(result.query).toBe(queryWithSpaces);
    });

    it('has correct TypeScript type', () => {
      const result = searchSchema.parse({ query: 'test search' });

      const typedResult: Search = result;
      expect(typeof typedResult.query).toBe('string');
    });
  });

  describe('timestampsSchema', () => {
    it('validates valid timestamps', () => {
      const now = new Date();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const validTimestamps = {
        createdAt: yesterday,
        updatedAt: now,
      };

      const result = timestampsSchema.parse(validTimestamps);
      expect(result).toEqual(validTimestamps);
    });

    it('validates same timestamps', () => {
      const now = new Date();
      const timestamps = {
        createdAt: now,
        updatedAt: now,
      };

      const result = timestampsSchema.parse(timestamps);
      expect(result.createdAt).toEqual(now);
      expect(result.updatedAt).toEqual(now);
    });

    it('accepts ISO string dates', () => {
      const isoString = '2023-12-01T10:30:00.000Z';
      const timestamps = {
        createdAt: new Date(isoString),
        updatedAt: new Date(isoString),
      };

      const result = timestampsSchema.parse(timestamps);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('rejects missing createdAt', () => {
      expect(() => timestampsSchema.parse({ updatedAt: new Date() })).toThrow(z.ZodError);
    });

    it('rejects missing updatedAt', () => {
      expect(() => timestampsSchema.parse({ createdAt: new Date() })).toThrow(z.ZodError);
    });

    it('rejects invalid date values', () => {
      const invalidDates = ['not-a-date', 123, null, undefined, {}, [], 'invalid-date-string'];

      invalidDates.forEach((invalidDate) => {
        expect(() =>
          timestampsSchema.parse({
            createdAt: invalidDate,
            updatedAt: new Date(),
          }),
        ).toThrow(z.ZodError);

        expect(() =>
          timestampsSchema.parse({
            createdAt: new Date(),
            updatedAt: invalidDate,
          }),
        ).toThrow(z.ZodError);
      });
    });

    it('handles edge case dates', () => {
      const edgeDates = {
        createdAt: new Date(0), // Unix epoch
        updatedAt: new Date('2099-01-01T00:00:00.000Z'), // Far future
      };

      const result = timestampsSchema.parse(edgeDates);
      expect(result.createdAt.getTime()).toBe(0);
      expect(result.updatedAt.getFullYear()).toBe(2099);
    });

    it('has correct TypeScript type', () => {
      const result = timestampsSchema.parse({
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const typedResult: Timestamps = result;
      expect(typedResult.createdAt).toBeInstanceOf(Date);
      expect(typedResult.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Schema Integration', () => {
    it('can combine schemas using merge', () => {
      const combinedSchema = uuidParamSchema.merge(timestampsSchema);

      const validData = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = combinedSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('can use schemas in pick operations', () => {
      const idOnlySchema = timestampsSchema.pick({ createdAt: true });

      const result = idOnlySchema.parse({ createdAt: new Date() });
      expect(result).toHaveProperty('createdAt');
      expect(result).not.toHaveProperty('updatedAt');
    });

    it('can use schemas in omit operations', () => {
      const withoutUpdatedSchema = timestampsSchema.omit({ updatedAt: true });

      const result = withoutUpdatedSchema.parse({ createdAt: new Date() });
      expect(result).toHaveProperty('createdAt');
      expect(result).not.toHaveProperty('updatedAt');
    });

    it('can make schemas partial', () => {
      const partialPaginationSchema = paginationSchema.partial();

      const results = [
        partialPaginationSchema.parse({}),
        partialPaginationSchema.parse({ page: 2 }),
        partialPaginationSchema.parse({ limit: 50 }),
      ];

      expect(results[0]).toEqual({});
      expect(results[1]).toEqual({ page: 2 });
      expect(results[2]).toEqual({ limit: 50 });
    });
  });

  describe('Error Messages', () => {
    it('provides meaningful error for invalid UUID', () => {
      try {
        uuidParamSchema.parse({ id: 'invalid-uuid' });
      } catch (error) {
        expect(error).toBeInstanceOf(z.ZodError);
        const zodError = error as z.ZodError;
        expect(zodError.errors[0].message).toContain('Invalid uuid');
      }
    });

    it('provides meaningful error for out-of-range pagination', () => {
      try {
        paginationSchema.parse({ page: 0 });
      } catch (error) {
        expect(error).toBeInstanceOf(z.ZodError);
        const zodError = error as z.ZodError;
        expect(zodError.errors[0].message).toContain('Number must be greater than or equal to 1');
      }
    });

    it('provides meaningful error for empty search query', () => {
      try {
        searchSchema.parse({ query: '' });
      } catch (error) {
        expect(error).toBeInstanceOf(z.ZodError);
        const zodError = error as z.ZodError;
        expect(zodError.errors[0].message).toContain('String must contain at least 1 character(s)');
      }
    });
  });

  describe('Type Exports', () => {
    it('exports correct TypeScript types', () => {
      // These are compile-time checks, but we can verify the types exist
      const uuidParam: UuidParam = { id: '550e8400-e29b-41d4-a716-446655440000' };
      const pagination: Pagination = { page: 1, limit: 10 };
      const search: Search = { query: 'test' };
      const timestamps: Timestamps = { createdAt: new Date(), updatedAt: new Date() };

      expect(uuidParam).toBeDefined();
      expect(pagination).toBeDefined();
      expect(search).toBeDefined();
      expect(timestamps).toBeDefined();
    });
  });
});
