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
import { BundleBuilder, BundleLoader, Convert } from '../../../packlets/bundle';
import { ResourceManagerBuilder } from '../../../packlets/resources';

describe('Bundle Integration', () => {
  describe('Complete bundle workflow', () => {
    test('should create, serialize, deserialize, and load a bundle', () => {
      // Step 1: Create a resource manager with test data
      const originalManager = ResourceManagerBuilder.createPredefined('default').orThrow();

      originalManager
        .addResource({
          id: 'app.title',
          resourceTypeName: 'json',
          candidates: [
            {
              json: { text: 'Hello World' },
              conditions: [{ qualifierName: 'language', value: 'en' }]
            },
            {
              json: { text: 'Bonjour le monde' },
              conditions: [{ qualifierName: 'language', value: 'fr' }]
            }
          ]
        })
        .orThrow();

      originalManager
        .addResource({
          id: 'app.subtitle',
          resourceTypeName: 'json',
          candidates: [
            {
              json: { text: 'Welcome to our application' },
              conditions: [{ qualifierName: 'language', value: 'en' }]
            }
          ]
        })
        .orThrow();

      // Step 2: Create a bundle
      const bundle = BundleBuilder.createFromPredefined(originalManager, 'default', {
        version: '1.0.0',
        description: 'Integration test bundle'
      }).orThrow();

      // Step 3: Serialize the bundle to JSON
      const serializedBundle = JSON.stringify(bundle);
      expect(serializedBundle).toContain('Hello World');
      expect(serializedBundle).toContain('Bonjour le monde');

      // Step 4: Deserialize the bundle from JSON
      const deserializedJson = JSON.parse(serializedBundle);
      const deserializedBundle = Convert.bundle.convert(deserializedJson).orThrow();

      // Step 5: Load the bundle into a new resource manager
      const loadedManager = BundleLoader.createManagerFromBundle({ bundle: deserializedBundle }).orThrow();

      // Step 6: Verify the loaded manager has the same resources
      expect(loadedManager.numResources).toBe(originalManager.numResources);
      expect(loadedManager.numCandidates).toBe(originalManager.numCandidates);

      // Step 7: Test resource resolution
      expect(loadedManager.getBuiltResource('app.title')).toSucceedAndSatisfy((resource) => {
        expect(resource.id).toBe('app.title');
        expect(resource.candidates).toHaveLength(2);
        // Note: candidate order may vary, so we check both candidates exist
        const candidateValues = resource.candidates.map((c) => c.json);
        expect(candidateValues).toContainEqual({ text: 'Hello World' });
        expect(candidateValues).toContainEqual({ text: 'Bonjour le monde' });
      });

      expect(loadedManager.getBuiltResource('app.subtitle')).toSucceedAndSatisfy((resource) => {
        expect(resource.id).toBe('app.subtitle');
        expect(resource.candidates).toHaveLength(1);
        expect(resource.candidates[0].json).toEqual({ text: 'Welcome to our application' });
      });

      // Step 8: Test context validation
      expect(loadedManager.validateContext({ language: 'en' })).toSucceed();
      expect(loadedManager.validateContext({ language: 'fr' })).toSucceed();
      expect(loadedManager.validateContext({ language: 'invalid' })).toFail();
    });

    test('should preserve metadata through serialization', () => {
      const manager = ResourceManagerBuilder.createPredefined('default').orThrow();
      const originalBundle = BundleBuilder.createFromPredefined(manager, 'default', {
        version: '2.0.0',
        description: 'Metadata test bundle'
      }).orThrow();

      const serialized = JSON.stringify(originalBundle);
      const deserialized = Convert.bundle.convert(JSON.parse(serialized)).orThrow();

      expect(deserialized.metadata.version).toBe('2.0.0');
      expect(deserialized.metadata.description).toBe('Metadata test bundle');
      expect(deserialized.metadata.checksum).toBe(originalBundle.metadata.checksum);
      expect(deserialized.metadata.dateBuilt).toBe(originalBundle.metadata.dateBuilt);
    });

    test('should handle complex resource structures', () => {
      const manager = ResourceManagerBuilder.createPredefined('default').orThrow();

      manager
        .addResource({
          id: 'complex.resource',
          resourceTypeName: 'json',
          candidates: [
            {
              json: {
                nested: {
                  value: 'EN-US complex',
                  array: [1, 2, 3],
                  boolean: true
                }
              },
              conditions: [{ qualifierName: 'language', value: 'en-US' }]
            },
            {
              json: {
                nested: {
                  value: 'EN default',
                  array: [4, 5, 6],
                  boolean: false
                }
              },
              conditions: [{ qualifierName: 'language', value: 'en' }]
            }
          ]
        })
        .orThrow();

      const bundle = BundleBuilder.createFromPredefined(manager, 'default').orThrow();
      const serialized = JSON.stringify(bundle);
      const deserialized = Convert.bundle.convert(JSON.parse(serialized)).orThrow();
      const loadedManager = BundleLoader.createManagerFromBundle({ bundle: deserialized }).orThrow();

      expect(loadedManager.getBuiltResource('complex.resource')).toSucceedAndSatisfy((resource) => {
        expect(resource.candidates).toHaveLength(2);
        // Note: candidate order may vary, so we check both candidates exist
        const candidateValues = resource.candidates.map((c) => c.json);
        expect(candidateValues).toContainEqual({
          nested: {
            value: 'EN-US complex',
            array: [1, 2, 3],
            boolean: true
          }
        });
        expect(candidateValues).toContainEqual({
          nested: {
            value: 'EN default',
            array: [4, 5, 6],
            boolean: false
          }
        });
      });
    });

    test('should handle bundle with partial resources', () => {
      const manager = ResourceManagerBuilder.createPredefined('default').orThrow();

      manager
        .addResource({
          id: 'partial.test',
          resourceTypeName: 'json',
          candidates: [
            {
              json: { base: 'value', partial: 'data' },
              isPartial: true,
              mergeMethod: 'augment',
              conditions: [{ qualifierName: 'language', value: 'en' }]
            },
            {
              json: { complete: 'resource' },
              isPartial: false,
              mergeMethod: 'replace',
              conditions: [{ qualifierName: 'language', value: 'fr' }]
            }
          ]
        })
        .orThrow();

      const bundle = BundleBuilder.createFromPredefined(manager, 'default').orThrow();
      const serialized = JSON.stringify(bundle);
      const deserialized = Convert.bundle.convert(JSON.parse(serialized)).orThrow();
      const loadedManager = BundleLoader.createManagerFromBundle({ bundle: deserialized }).orThrow();

      expect(loadedManager.getBuiltResource('partial.test')).toSucceedAndSatisfy((resource) => {
        expect(resource.candidates).toHaveLength(2);

        // Check that we have one partial and one complete candidate
        const partialCandidates = resource.candidates.filter((c) => c.isPartial);
        const completeCandidates = resource.candidates.filter((c) => !c.isPartial);

        expect(partialCandidates).toHaveLength(1);
        expect(completeCandidates).toHaveLength(1);
        expect(partialCandidates[0].mergeMethod).toBe('augment');
        expect(completeCandidates[0].mergeMethod).toBe('replace');
      });
    });

    test('should detect tampering through checksum verification', () => {
      const manager = ResourceManagerBuilder.createPredefined('default').orThrow();
      manager
        .addResource({
          id: 'test.resource',
          resourceTypeName: 'json',
          candidates: [{ json: { value: 'original' } }]
        })
        .orThrow();

      const bundle = BundleBuilder.createFromPredefined(manager, 'default').orThrow();

      // Tamper with the compiled collection - need to type cast since we're testing tampering
      const tamperedBundle = {
        ...bundle,
        compiledCollection: {
          ...bundle.compiledCollection,
          resources: [
            {
              ...bundle.compiledCollection.resources[0],
              id: 'tampered.resource' as unknown as (typeof bundle.compiledCollection.resources)[0]['id']
            }
          ]
        }
      } as typeof bundle;

      // Should fail integrity check
      expect(BundleLoader.createManagerFromBundle({ bundle: tamperedBundle })).toFailWith(
        /integrity verification failed/i
      );

      // Should succeed with verification skipped
      expect(
        BundleLoader.createManagerFromBundle({
          bundle: tamperedBundle,
          skipChecksumVerification: true
        })
      ).toSucceed();
    });
  });
});
