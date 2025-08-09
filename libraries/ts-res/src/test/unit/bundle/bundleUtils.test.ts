/*
 * Copyright (c) 2025 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import '@fgv/ts-utils-jest';
import { BundleUtils } from '../../../packlets/bundle';

describe('BundleUtils', () => {
  // Test data - valid minimal bundle structure
  const validBundle = {
    metadata: {
      dateBuilt: '2025-01-01T00:00:00.000Z',
      checksum: 'abc123def456'
    },
    config: {
      qualifierTypes: [],
      qualifiers: [],
      resourceTypes: []
    },
    compiledCollection: {
      qualifierTypes: [],
      qualifiers: [],
      resourceTypes: [],
      conditions: [],
      conditionSets: [],
      decisions: [],
      resources: []
    }
  };

  const validBundleWithOptionalFields = {
    ...validBundle,
    metadata: {
      ...validBundle.metadata,
      version: '1.0.0',
      description: 'Test bundle'
    },
    exportMetadata: {
      exportedAt: '2025-01-02T00:00:00.000Z',
      exportedFrom: 'test-suite',
      type: 'ts-res-bundle'
    }
  };

  describe('isBundleFile', () => {
    test('should return true for valid bundle with minimal fields', () => {
      expect(BundleUtils.isBundleFile(validBundle)).toBe(true);
    });

    test('should return true for valid bundle with optional fields', () => {
      expect(BundleUtils.isBundleFile(validBundleWithOptionalFields)).toBe(true);
    });

    test('should return false for null', () => {
      expect(BundleUtils.isBundleFile(null)).toBe(false);
    });

    test('should return false for undefined', () => {
      expect(BundleUtils.isBundleFile(undefined)).toBe(false);
    });

    test('should return false for non-object types', () => {
      expect(BundleUtils.isBundleFile('not a bundle')).toBe(false);
      expect(BundleUtils.isBundleFile(123)).toBe(false);
      expect(BundleUtils.isBundleFile(true)).toBe(false);
      expect(BundleUtils.isBundleFile([])).toBe(false);
    });

    test('should return false for object missing metadata', () => {
      const invalidBundle = {
        config: validBundle.config,
        compiledCollection: validBundle.compiledCollection
      };
      expect(BundleUtils.isBundleFile(invalidBundle)).toBe(false);
    });

    test('should return false for object missing config', () => {
      const invalidBundle = {
        metadata: validBundle.metadata,
        compiledCollection: validBundle.compiledCollection
      };
      expect(BundleUtils.isBundleFile(invalidBundle)).toBe(false);
    });

    test('should return false for object missing compiledCollection', () => {
      const invalidBundle = {
        metadata: validBundle.metadata,
        config: validBundle.config
      };
      expect(BundleUtils.isBundleFile(invalidBundle)).toBe(false);
    });

    test('should return false for object with invalid metadata', () => {
      const invalidBundle = {
        ...validBundle,
        metadata: {
          checksum: 'abc123def456'
          // missing dateBuilt
        }
      };
      expect(BundleUtils.isBundleFile(invalidBundle)).toBe(false);
    });
  });

  describe('extractBundleComponents', () => {
    test('should extract components from valid bundle', () => {
      expect(BundleUtils.extractBundleComponents(validBundle)).toSucceedAndSatisfy((components) => {
        expect(components.systemConfiguration).toBeDefined();
        expect(components.compiledCollection).toStrictEqual(validBundle.compiledCollection);
        expect(components.metadata).toStrictEqual(validBundle.metadata);
      });
    });

    test('should extract components from valid bundle with optional fields', () => {
      expect(BundleUtils.extractBundleComponents(validBundleWithOptionalFields)).toSucceedAndSatisfy(
        (components) => {
          expect(components.systemConfiguration).toBeDefined();
          expect(components.compiledCollection).toStrictEqual(
            validBundleWithOptionalFields.compiledCollection
          );
          expect(components.metadata).toStrictEqual(validBundleWithOptionalFields.metadata);
        }
      );
    });

    test('should fail for invalid bundle structure', () => {
      expect(BundleUtils.extractBundleComponents(null)).toFailWith(/invalid bundle structure/i);
    });

    test('should fail for object missing metadata', () => {
      const invalidBundle = {
        config: validBundle.config,
        compiledCollection: validBundle.compiledCollection
      };
      expect(BundleUtils.extractBundleComponents(invalidBundle)).toFailWith(/invalid bundle structure/i);
    });

    test('should fail for object missing config', () => {
      const invalidBundle = {
        metadata: validBundle.metadata,
        compiledCollection: validBundle.compiledCollection
      };
      expect(BundleUtils.extractBundleComponents(invalidBundle)).toFailWith(/invalid bundle structure/i);
    });

    test('should fail for invalid system configuration', () => {
      const invalidBundle = {
        ...validBundle,
        config: {
          qualifierTypes: 'invalid'
        }
      };
      expect(BundleUtils.extractBundleComponents(invalidBundle)).toFailWith(/invalid bundle structure/i);
    });
  });

  describe('extractBundleMetadata', () => {
    test('should extract metadata from valid bundle', () => {
      expect(BundleUtils.extractBundleMetadata(validBundle)).toSucceedWith(validBundle.metadata);
    });

    test('should extract metadata from valid bundle with optional fields', () => {
      expect(BundleUtils.extractBundleMetadata(validBundleWithOptionalFields)).toSucceedWith(
        validBundleWithOptionalFields.metadata
      );
    });

    test('should fail for non-bundle data', () => {
      expect(BundleUtils.extractBundleMetadata(null)).toFailWith(/not a bundle file/i);
    });

    test('should fail for invalid bundle structure', () => {
      const invalidBundle = {
        metadata: {
          checksum: 'abc123def456'
          // missing dateBuilt
        },
        config: validBundle.config,
        compiledCollection: validBundle.compiledCollection
      };
      expect(BundleUtils.extractBundleMetadata(invalidBundle)).toFailWith(/not a bundle file/i);
    });
  });

  describe('parseBundleFromJson', () => {
    test('should parse valid JSON bundle', () => {
      const jsonString = JSON.stringify(validBundle);
      expect(BundleUtils.parseBundleFromJson(jsonString)).toSucceedAndSatisfy((components) => {
        expect(components.systemConfiguration).toBeDefined();
        expect(components.compiledCollection).toStrictEqual(validBundle.compiledCollection);
        expect(components.metadata).toStrictEqual(validBundle.metadata);
      });
    });

    test('should parse valid JSON bundle with optional fields', () => {
      const jsonString = JSON.stringify(validBundleWithOptionalFields);
      expect(BundleUtils.parseBundleFromJson(jsonString)).toSucceedAndSatisfy((components) => {
        expect(components.systemConfiguration).toBeDefined();
        expect(components.compiledCollection).toStrictEqual(validBundleWithOptionalFields.compiledCollection);
        expect(components.metadata).toStrictEqual(validBundleWithOptionalFields.metadata);
      });
    });

    test('should fail for invalid JSON', () => {
      expect(BundleUtils.parseBundleFromJson('{ invalid json')).toFailWith(/failed to parse json/i);
    });

    test('should fail for valid JSON that is not a bundle', () => {
      const invalidData = { notABundle: true };
      const jsonString = JSON.stringify(invalidData);
      expect(BundleUtils.parseBundleFromJson(jsonString)).toFailWith(/invalid bundle structure/i);
    });

    test('should fail for empty string', () => {
      expect(BundleUtils.parseBundleFromJson('')).toFailWith(/failed to parse json/i);
    });

    test('should handle JSON parsing errors gracefully', () => {
      expect(BundleUtils.parseBundleFromJson('[}')).toFailWith(/failed to parse json/i);
    });
  });

  describe('isBundleFileName', () => {
    describe('positive cases', () => {
      test('should return true for .bundle.json extension', () => {
        expect(BundleUtils.isBundleFileName('resources.bundle.json')).toBe(true);
        expect(BundleUtils.isBundleFileName('my-app.bundle.json')).toBe(true);
      });

      test('should return true for -bundle.json extension', () => {
        expect(BundleUtils.isBundleFileName('resources-bundle.json')).toBe(true);
        expect(BundleUtils.isBundleFileName('my-app-bundle.json')).toBe(true);
      });

      test('should return true for _bundle.json extension', () => {
        expect(BundleUtils.isBundleFileName('resources_bundle.json')).toBe(true);
        expect(BundleUtils.isBundleFileName('my_app_bundle.json')).toBe(true);
      });

      test('should return true for files containing "bundle" and ending with .json', () => {
        expect(BundleUtils.isBundleFileName('mybundle.json')).toBe(true);
        expect(BundleUtils.isBundleFileName('bundle-file.json')).toBe(true);
        expect(BundleUtils.isBundleFileName('resource-bundle-v1.json')).toBe(true);
      });

      test('should be case insensitive', () => {
        expect(BundleUtils.isBundleFileName('RESOURCES.BUNDLE.JSON')).toBe(true);
        expect(BundleUtils.isBundleFileName('Resources-Bundle.Json')).toBe(true);
        expect(BundleUtils.isBundleFileName('MyBundle.json')).toBe(true);
      });
    });

    describe('negative cases', () => {
      test('should return false for non-json files', () => {
        expect(BundleUtils.isBundleFileName('bundle.txt')).toBe(false);
        expect(BundleUtils.isBundleFileName('resources.bundle.xml')).toBe(false);
        expect(BundleUtils.isBundleFileName('bundle')).toBe(false);
      });

      test('should return false for files without "bundle" in name', () => {
        expect(BundleUtils.isBundleFileName('resources.json')).toBe(false);
        expect(BundleUtils.isBundleFileName('config.json')).toBe(false);
        expect(BundleUtils.isBundleFileName('data.json')).toBe(false);
      });

      test('should return false for empty string', () => {
        expect(BundleUtils.isBundleFileName('')).toBe(false);
      });

      test('should return false for files with bundle not followed by .json', () => {
        expect(BundleUtils.isBundleFileName('bundle.config.json')).toBe(true); // contains bundle + .json
        expect(BundleUtils.isBundleFileName('bundle-data.xml')).toBe(false); // contains bundle but not .json
      });
    });
  });
});
