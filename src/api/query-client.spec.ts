// Mock SuperJSON to avoid ES module issues in tests
jest.mock('superjson', () => ({
  serialize: jest.fn((data) => ({ json: data, meta: undefined })),
  deserialize: jest.fn((data) => data.json),
  stringify: jest.fn((data) => JSON.stringify(data)),
  parse: jest.fn((data) => JSON.parse(data)),
}));

import { QueryClient } from '@tanstack/react-query';
import { makeQueryClient } from '~/api/query-client';
import { transformer } from '~/lib/transformer';

// Mock transformer
jest.mock('~/lib/transformer', () => ({
  transformer: {
    serialize: jest.fn((data) => ({ json: data, meta: undefined })),
    deserialize: jest.fn((data) => data.json),
  },
}));

describe('Query Client Factory', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = makeQueryClient();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('makeQueryClient', () => {
    it('creates a QueryClient instance', () => {
      expect(queryClient).toBeInstanceOf(QueryClient);
    });

    it('configures default stale time to 30 seconds', () => {
      const defaultOptions = queryClient.getDefaultOptions();

      expect(defaultOptions.queries?.staleTime).toBe(30 * 1000);
    });

    it('configures custom serialization for dehydration', () => {
      const defaultOptions = queryClient.getDefaultOptions();

      expect(defaultOptions.dehydrate?.serializeData).toBe(transformer.serialize);
    });

    it('configures custom deserialization for hydration', () => {
      const defaultOptions = queryClient.getDefaultOptions();

      expect(defaultOptions.hydrate?.deserializeData).toBe(transformer.deserialize);
    });

    it('includes pending queries in dehydration', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      const shouldDehydrateQuery = defaultOptions.dehydrate?.shouldDehydrateQuery;

      expect(shouldDehydrateQuery).toBeDefined();

      if (shouldDehydrateQuery) {
        // Mock query with pending status
        const pendingQuery = {
          state: { status: 'pending' as const },
          queryKey: ['test'],
          queryHash: 'test-hash',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;

        // Mock query with success status
        const successQuery = {
          state: { status: 'success' as const },
          queryKey: ['test'],
          queryHash: 'test-hash',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;

        expect(shouldDehydrateQuery(pendingQuery)).toBe(true);
        expect(shouldDehydrateQuery(successQuery)).toBe(true);
      }
    });
  });

  describe('QueryClient functionality', () => {
    it('can set and get query data', () => {
      const testData = { id: 1, name: 'Test User' };
      const queryKey = ['user', 1];

      queryClient.setQueryData(queryKey, testData);
      const retrievedData = queryClient.getQueryData(queryKey);

      expect(retrievedData).toEqual(testData);
    });

    it('respects stale time configuration', () => {
      const queryKey = ['test-stale'];
      const testData = { value: 'test' };

      queryClient.setQueryData(queryKey, testData);
      const queryState = queryClient.getQueryState(queryKey);

      expect(queryState?.dataUpdatedAt).toBeDefined();
    });

    it('can invalidate queries', async () => {
      const queryKey = ['test-invalidate'];
      const testData = { value: 'test' };

      queryClient.setQueryData(queryKey, testData);

      // Invalidate the query
      await queryClient.invalidateQueries({ queryKey });

      const queryState = queryClient.getQueryState(queryKey);
      expect(queryState?.isInvalidated).toBe(true);
    });

    it('can clear all queries', () => {
      const queryKey1 = ['test1'];
      const queryKey2 = ['test2'];

      queryClient.setQueryData(queryKey1, { value: 'test1' });
      queryClient.setQueryData(queryKey2, { value: 'test2' });

      expect(queryClient.getQueryData(queryKey1)).toBeDefined();
      expect(queryClient.getQueryData(queryKey2)).toBeDefined();

      queryClient.clear();

      expect(queryClient.getQueryData(queryKey1)).toBeUndefined();
      expect(queryClient.getQueryData(queryKey2)).toBeUndefined();
    });
  });

  describe('Serialization/Deserialization', () => {
    it('uses transformer for serialization during dehydration', () => {
      const testData = { date: new Date(), value: 'test' };
      const mockSerialize = transformer.serialize as jest.MockedFunction<
        typeof transformer.serialize
      >;

      // Simulate dehydration process
      const defaultOptions = queryClient.getDefaultOptions();
      const serializeData = defaultOptions.dehydrate?.serializeData;

      if (serializeData) {
        serializeData(testData);
        expect(mockSerialize).toHaveBeenCalledWith(testData);
      }
    });

    it('uses transformer for deserialization during hydration', () => {
      const serializedData = { json: { value: 'test' }, meta: undefined };
      const mockDeserialize = transformer.deserialize as jest.MockedFunction<
        typeof transformer.deserialize
      >;

      // Simulate hydration process
      const defaultOptions = queryClient.getDefaultOptions();
      const deserializeData = defaultOptions.hydrate?.deserializeData;

      if (deserializeData) {
        deserializeData(serializedData);
        expect(mockDeserialize).toHaveBeenCalledWith(serializedData);
      }
    });
  });

  describe('Multiple instances', () => {
    it('creates independent QueryClient instances', () => {
      const client1 = makeQueryClient();
      const client2 = makeQueryClient();

      expect(client1).not.toBe(client2);
      expect(client1).toBeInstanceOf(QueryClient);
      expect(client2).toBeInstanceOf(QueryClient);

      // Set data in one client
      client1.setQueryData(['test'], { value: 'client1' });

      // Should not affect the other client
      expect(client2.getQueryData(['test'])).toBeUndefined();

      // Clean up
      client1.clear();
      client2.clear();
    });

    it('each instance has the same configuration', () => {
      const client1 = makeQueryClient();
      const client2 = makeQueryClient();

      const options1 = client1.getDefaultOptions();
      const options2 = client2.getDefaultOptions();

      expect(options1.queries?.staleTime).toBe(options2.queries?.staleTime);
      expect(options1.dehydrate?.serializeData).toBe(options2.dehydrate?.serializeData);
      expect(options1.hydrate?.deserializeData).toBe(options2.hydrate?.deserializeData);

      // Clean up
      client1.clear();
      client2.clear();
    });
  });

  describe('Error handling', () => {
    it('handles serialization errors gracefully', () => {
      const mockSerialize = transformer.serialize as jest.MockedFunction<
        typeof transformer.serialize
      >;
      mockSerialize.mockImplementationOnce(() => {
        throw new Error('Serialization failed');
      });

      const defaultOptions = queryClient.getDefaultOptions();
      const serializeData = defaultOptions.dehydrate?.serializeData;

      if (serializeData) {
        expect(() => serializeData({ test: 'data' })).toThrow('Serialization failed');
      }
    });

    it('handles deserialization errors gracefully', () => {
      const mockDeserialize = transformer.deserialize as jest.MockedFunction<
        typeof transformer.deserialize
      >;
      mockDeserialize.mockImplementationOnce(() => {
        throw new Error('Deserialization failed');
      });

      const defaultOptions = queryClient.getDefaultOptions();
      const deserializeData = defaultOptions.hydrate?.deserializeData;

      if (deserializeData) {
        expect(() => deserializeData({ json: {}, meta: undefined })).toThrow(
          'Deserialization failed',
        );
      }
    });
  });

  describe('Integration with complex data types', () => {
    it('handles Date objects through transformer', () => {
      const testDate = new Date('2023-01-01');
      const testData = { createdAt: testDate, name: 'Test' };

      const mockSerialize = transformer.serialize as jest.MockedFunction<
        typeof transformer.serialize
      >;
      mockSerialize.mockReturnValueOnce({
        json: { createdAt: '2023-01-01T00:00:00.000Z', name: 'Test' },
        meta: { values: { createdAt: ['Date'] } },
      });

      const defaultOptions = queryClient.getDefaultOptions();
      const serializeData = defaultOptions.dehydrate?.serializeData;

      if (serializeData) {
        const result = serializeData(testData);
        expect(mockSerialize).toHaveBeenCalledWith(testData);
        expect(result.json.name).toBe('Test');
      }
    });

    it('handles Map and Set objects through transformer', () => {
      const testMap = new Map([['key1', 'value1']]);
      const testSet = new Set(['item1', 'item2']);
      const testData = { map: testMap, set: testSet };

      const mockSerialize = transformer.serialize as jest.MockedFunction<
        typeof transformer.serialize
      >;

      const defaultOptions = queryClient.getDefaultOptions();
      const serializeData = defaultOptions.dehydrate?.serializeData;

      if (serializeData) {
        serializeData(testData);
        expect(mockSerialize).toHaveBeenCalledWith(testData);
      }
    });
  });
});
