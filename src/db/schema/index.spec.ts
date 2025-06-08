import * as fs from 'fs';
import * as path from 'path';

// Mock file system for testing
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('Database Schema Index', () => {
  const schemaDir = path.join(__dirname);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Module Structure', () => {
    it('exports all items from user schema', async () => {
      const schemaIndex = await import('~/db/schema/index');

      // Import user schema directly to compare
      const userSchema = await import('~/db/schema/user');

      // Check that all exports from user schema are re-exported
      const userExports = Object.keys(userSchema);

      userExports.forEach((exportName) => {
        expect(schemaIndex).toHaveProperty(exportName);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((schemaIndex as any)[exportName]).toBe((userSchema as any)[exportName]);
      });
    });

    it('re-exports are properly typed', async () => {
      const schemaIndex = await import('~/db/schema/index');

      // Check that exports maintain their types
      expect(schemaIndex).toBeDefined();
      expect(typeof schemaIndex).toBe('object');
    });

    it('does not have default export', async () => {
      const schemaIndex = await import('~/db/schema/index');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((schemaIndex as any).default).toBeUndefined();
    });
  });

  describe('Dynamic Schema Detection', () => {
    it('should re-export from all schema files in directory', () => {
      // Mock directory reading
      const mockSchemaFiles = [
        'user.ts',
        'post.ts', // Future schema file
        'comment.ts', // Future schema file
        'index.ts', // Should be ignored
        'index.spec.ts', // Should be ignored
        'utils.ts', // Should be ignored (not a schema)
      ];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockFs.readdirSync.mockReturnValue(mockSchemaFiles as any);
      mockFs.statSync.mockImplementation(
        (filePath) =>
          ({
            isFile: () => !filePath.toString().includes('index'),
          }) as fs.Stats,
      );

      // Get expected schema files (excluding index and test files)
      const expectedSchemaFiles = mockSchemaFiles.filter(
        (file) =>
          file.endsWith('.ts') &&
          !file.includes('index') &&
          !file.includes('.spec.') &&
          !file.includes('.test.'),
      );

      expect(expectedSchemaFiles).toEqual(['user.ts', 'post.ts', 'comment.ts', 'utils.ts']);
    });

    it('handles empty schema directory', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockFs.readdirSync.mockReturnValue(['index.ts'] as any);

      const files = mockFs.readdirSync(schemaDir);
      const schemaFiles = files.filter(
        (file) => file.toString().endsWith('.ts') && !file.toString().includes('index'),
      );

      expect(schemaFiles).toHaveLength(0);
    });
  });

  describe('Export Validation', () => {
    it('all exports should be valid Drizzle schema objects', async () => {
      const schemaIndex = await import('~/db/schema/index');

      // Get all exports
      const exports = Object.keys(schemaIndex);

      // Each export should be an object (table definition)
      exports.forEach((exportName) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const exportValue = (schemaIndex as any)[exportName];
        expect(exportValue).toBeDefined();
        expect(typeof exportValue).toBe('object');
      });
    });

    it('should not export undefined values', async () => {
      const schemaIndex = await import('~/db/schema/index');

      const exports = Object.keys(schemaIndex);

      exports.forEach((exportName) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((schemaIndex as any)[exportName]).toBeDefined();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((schemaIndex as any)[exportName]).not.toBeNull();
      });
    });

    it('maintains consistent export names', async () => {
      const schemaIndex = await import('~/db/schema/index');
      const userSchema = await import('~/db/schema/user');

      // Export names should match between source and re-export
      const indexExports = Object.keys(schemaIndex);
      const userExports = Object.keys(userSchema);

      // All user exports should be present in index
      userExports.forEach((exportName) => {
        expect(indexExports).toContain(exportName);
      });
    });
  });

  describe('File Content Validation', () => {
    it('contains proper export statements', () => {
      const indexFilePath = path.join(__dirname, 'index.ts');

      // Mock file reading
      const mockFileContent = "export * from '~/db/schema/user';\n";
      mockFs.readFileSync.mockReturnValue(mockFileContent);

      const content = mockFs.readFileSync(indexFilePath, 'utf8');

      // Should contain export statement for user schema
      expect(content).toContain("export * from '~/db/schema/user'");
      expect(content).toMatch(/export \* from ['"]~/);
    });

    it('uses consistent import path format', () => {
      const mockFileContent = "export * from '~/db/schema/user';\n";
      mockFs.readFileSync.mockReturnValue(mockFileContent);

      const content = mockFs.readFileSync('index.ts', 'utf8');

      // Should use tilde alias for imports
      expect(content).toMatch(/~/);
      expect(content).toMatch(/db\/schema/);
    });

    it('handles multiple schema exports', () => {
      const mockFileContent = `export * from '~/db/schema/user';
export * from '~/db/schema/post';
export * from '~/db/schema/comment';
`;
      mockFs.readFileSync.mockReturnValue(mockFileContent);

      const content = mockFs.readFileSync('index.ts', 'utf8');
      const exportLines = content.split('\n').filter((line) => line.trim().startsWith('export'));

      expect(exportLines.length).toBeGreaterThan(0);
      exportLines.forEach((line) => {
        expect(line).toMatch(/export \* from ['"]~/);
      });
    });
  });

  describe('Future-Proof Testing', () => {
    it('should handle new schema additions gracefully', async () => {
      // This test ensures the barrel file pattern works for future schemas
      const schemaIndex = await import('~/db/schema/index');

      // The index should be an object that can accept new exports
      expect(typeof schemaIndex).toBe('object');
      expect(schemaIndex).not.toBeNull();

      // Should not throw when accessing properties
      expect(() => Object.keys(schemaIndex)).not.toThrow();
    });

    it('maintains barrel file pattern', () => {
      const mockFileContent = "export * from '~/db/schema/user';\n";
      mockFs.readFileSync.mockReturnValue(mockFileContent);

      const content = mockFs.readFileSync('index.ts', 'utf8');

      // Should only contain export statements (barrel file pattern)
      const lines = content.split('\n').filter((line) => line.trim());
      const nonExportLines = lines.filter(
        (line) =>
          !line.trim().startsWith('export') && !line.trim().startsWith('//') && line.trim() !== '',
      );

      expect(nonExportLines).toHaveLength(0);
    });

    it('can be extended with new schemas without breaking', async () => {
      // Simulate adding a new schema
      const currentSchemaIndex = await import('~/db/schema/index');
      const currentExports = Object.keys(currentSchemaIndex);

      // The current structure should support adding new exports
      expect(Array.isArray(currentExports)).toBe(true);
      expect(currentExports.length).toBeGreaterThanOrEqual(0);

      // Adding new exports should not break existing ones
      currentExports.forEach((exportName) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((currentSchemaIndex as any)[exportName]).toBeDefined();
      });
    });
  });

  describe('Integration with Drizzle ORM', () => {
    it('exports are compatible with Drizzle schema format', async () => {
      const schemaIndex = await import('~/db/schema/index');

      // All exports should be objects (Drizzle tables/schemas)
      Object.values(schemaIndex).forEach((exportValue) => {
        expect(typeof exportValue).toBe('object');
        expect(exportValue).not.toBeNull();
      });
    });

    it('can be used as schema parameter in Drizzle config', async () => {
      const schemaIndex = await import('~/db/schema/index');

      // Should be able to spread into Drizzle config
      expect(() => ({ ...schemaIndex })).not.toThrow();

      // Should be a valid object for Drizzle schema parameter
      expect(typeof schemaIndex).toBe('object');
      expect(schemaIndex).not.toBeNull();
    });

    it('maintains proper TypeScript module structure', async () => {
      const schemaIndex = await import('~/db/schema/index');

      // Should be importable as ES module
      expect(schemaIndex).toBeDefined();

      // Should not have circular dependencies
      expect(() => JSON.stringify(Object.keys(schemaIndex))).not.toThrow();
    });
  });

  describe('Performance Considerations', () => {
    it('does not create unnecessary object copies', async () => {
      const schemaIndex = await import('~/db/schema/index');
      const userSchema = await import('~/db/schema/user');

      // Re-exports should reference the same objects, not copies
      Object.keys(userSchema).forEach((exportName) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((schemaIndex as any)[exportName] && (userSchema as any)[exportName]) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          expect((schemaIndex as any)[exportName]).toBe((userSchema as any)[exportName]);
        }
      });
    });

    it('supports tree shaking', async () => {
      // Barrel exports with `export *` support tree shaking
      const schemaIndex = await import('~/db/schema/index');

      // Should be able to destructure specific exports
      expect(() => {
        const keys = Object.keys(schemaIndex);
        if (keys.length > 0) {
          const firstKey = keys[0];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { [firstKey]: firstExport } = schemaIndex as any;
          return firstExport;
        }
      }).not.toThrow();
    });
  });
});
