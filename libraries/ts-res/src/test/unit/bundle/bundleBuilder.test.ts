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
import { Hash } from '@fgv/ts-utils';
import { Hash as ExtrasHash } from '@fgv/ts-extras';
import { BundleBuilder } from '../../../packlets/bundle';
import { ResourceManagerBuilder } from '../../../packlets/resources';

describe('BundleBuilder', () => {
  let resourceManager: ResourceManagerBuilder;

  beforeEach(() => {
    resourceManager = ResourceManagerBuilder.createPredefined('default').orThrow();
  });

  describe('create', () => {
    test('should create a bundle with minimal parameters', () => {
      expect(BundleBuilder.createFromPredefined(resourceManager, 'default')).toSucceedAndSatisfy((bundle) => {
        expect(bundle.metadata).toBeDefined();
        expect(bundle.metadata.dateBuilt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        expect(bundle.metadata.checksum).toMatch(/^[a-f0-9]{8}$/);
        expect(bundle.metadata.version).toBeUndefined();
        expect(bundle.metadata.description).toBeUndefined();
        expect(bundle.config).toBeDefined();
        expect(bundle.compiledCollection).toBeDefined();
      });
    });

    test('should create a bundle with custom parameters', () => {
      const params = {
        version: '1.0.0',
        description: 'Test bundle',
        dateBuilt: '2025-01-01T00:00:00.000Z'
      };

      expect(BundleBuilder.createFromPredefined(resourceManager, 'default', params)).toSucceedAndSatisfy(
        (bundle) => {
          expect(bundle.metadata.dateBuilt).toBe('2025-01-01T00:00:00.000Z');
          expect(bundle.metadata.version).toBe('1.0.0');
          expect(bundle.metadata.description).toBe('Test bundle');
          expect(bundle.metadata.checksum).toMatch(/^[a-f0-9]{8}$/);
        }
      );
    });

    test('should create a bundle with system configuration extracted from builder', () => {
      expect(BundleBuilder.createFromPredefined(resourceManager, 'default')).toSucceedAndSatisfy((bundle) => {
        expect(bundle.config.qualifierTypes).toBeDefined();
        expect(bundle.config.qualifiers).toBeDefined();
        expect(bundle.config.resourceTypes).toBeDefined();
        expect(Array.isArray(bundle.config.qualifierTypes)).toBe(true);
        expect(Array.isArray(bundle.config.qualifiers)).toBe(true);
        expect(Array.isArray(bundle.config.resourceTypes)).toBe(true);
      });
    });

    test('should create a bundle with compiled resource collection', () => {
      expect(BundleBuilder.createFromPredefined(resourceManager, 'default')).toSucceedAndSatisfy((bundle) => {
        expect(bundle.compiledCollection.qualifierTypes).toBeDefined();
        expect(bundle.compiledCollection.qualifiers).toBeDefined();
        expect(bundle.compiledCollection.resourceTypes).toBeDefined();
        expect(bundle.compiledCollection.conditions).toBeDefined();
        expect(bundle.compiledCollection.conditionSets).toBeDefined();
        expect(bundle.compiledCollection.decisions).toBeDefined();
        expect(bundle.compiledCollection.resources).toBeDefined();
      });
    });

    test('should generate correct checksum for compiled collection', () => {
      expect(BundleBuilder.createFromPredefined(resourceManager, 'default')).toSucceedAndSatisfy((bundle) => {
        const hashNormalizer = new Hash.Crc32Normalizer();
        const expectedChecksum = hashNormalizer.computeHash(bundle.compiledCollection).orThrow();

        expect(bundle.metadata.checksum).toBe(expectedChecksum);
      });
    });

    test('should handle bundle creation with resources', () => {
      const resourceDecl = {
        id: 'test.resource',
        resourceTypeName: 'json',
        candidates: [
          {
            json: { value: 'test' }
          }
        ]
      };

      resourceManager.addResource(resourceDecl).orThrow();

      expect(BundleBuilder.createFromPredefined(resourceManager, 'default')).toSucceedAndSatisfy((bundle) => {
        expect(bundle.compiledCollection.resources).toHaveLength(1);
        expect(bundle.compiledCollection.resources[0].id).toBe('test.resource');
      });
    });

    test('should preserve different checksums for different content', () => {
      // Create first bundle with no resources
      expect(BundleBuilder.createFromPredefined(resourceManager, 'default')).toSucceedAndSatisfy(
        (bundle1) => {
          // Create second manager with a resource
          const manager2 = ResourceManagerBuilder.createPredefined('default').orThrow();
          manager2
            .addResource({
              id: 'test.resource',
              resourceTypeName: 'json',
              candidates: [{ json: { value: 'test' } }]
            })
            .orThrow();

          expect(BundleBuilder.createFromPredefined(manager2, 'default')).toSucceedAndSatisfy((bundle2) => {
            expect(bundle1.metadata.checksum).not.toBe(bundle2.metadata.checksum);
          });
        }
      );
    });

    test('should handle empty resource manager', () => {
      const emptyManager = ResourceManagerBuilder.createPredefined('default').orThrow();

      expect(BundleBuilder.createFromPredefined(emptyManager, 'default')).toSucceedAndSatisfy((bundle) => {
        expect(bundle.compiledCollection.resources).toHaveLength(0);
        expect(bundle.metadata.checksum).toMatch(/^[a-f0-9]{8}$/);
      });
    });

    test('should support injectable hash normalizer from ts-extras', () => {
      const md5Normalizer = new ExtrasHash.Md5Normalizer();
      const params = {
        version: '1.0.0',
        description: 'MD5 hash test bundle',
        hashNormalizer: md5Normalizer
      };

      expect(BundleBuilder.createFromPredefined(resourceManager, 'default', params)).toSucceedAndSatisfy(
        (bundle) => {
          expect(bundle.metadata.version).toBe('1.0.0');
          expect(bundle.metadata.description).toBe('MD5 hash test bundle');
          // MD5 produces 32-character hex strings
          expect(bundle.metadata.checksum).toMatch(/^[a-f0-9]{32}$/);

          // Verify the checksum was generated using the MD5 normalizer
          const expectedChecksum = md5Normalizer.computeHash(bundle.compiledCollection).orThrow();
          expect(bundle.metadata.checksum).toBe(expectedChecksum);
        }
      );
    });
  });
});
