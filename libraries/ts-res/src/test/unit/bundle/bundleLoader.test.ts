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
import { BundleBuilder, BundleLoader } from '../../../packlets/bundle';
import { ResourceManagerBuilder } from '../../../packlets/resources';
import type { IBundle } from '../../../packlets/bundle';

describe('BundleLoader', () => {
  let resourceManager: ResourceManagerBuilder;
  let testBundle: IBundle;

  beforeEach(() => {
    resourceManager = ResourceManagerBuilder.createPredefined('default').orThrow();

    // Add a test resource
    resourceManager
      .addResource({
        id: 'test.resource',
        resourceTypeName: 'json',
        candidates: [
          {
            json: { value: 'test' }
          }
        ]
      })
      .orThrow();

    testBundle = BundleBuilder.createFromPredefined(resourceManager, 'default').orThrow();
  });

  describe('create', () => {
    test('should load a valid bundle successfully', () => {
      expect(BundleLoader.createManagerFromBundle({ bundle: testBundle })).toSucceedAndSatisfy((manager) => {
        expect(manager.numResources).toBe(1);
        expect(manager.getBuiltResource('test.resource')).toSucceed();
      });
    });

    test('should fail if bundle checksum is invalid', () => {
      const corruptedBundle: IBundle = {
        ...testBundle,
        metadata: {
          ...testBundle.metadata,
          checksum: 'invalid_checksum'
        }
      };

      expect(BundleLoader.createManagerFromBundle({ bundle: corruptedBundle })).toFailWith(
        /integrity verification failed/i
      );
    });

    test('should skip checksum verification when requested', () => {
      const corruptedBundle: IBundle = {
        ...testBundle,
        metadata: {
          ...testBundle.metadata,
          checksum: 'invalid_checksum'
        }
      };

      expect(
        BundleLoader.createManagerFromBundle({
          bundle: corruptedBundle,
          skipChecksumVerification: true
        })
      ).toSucceedAndSatisfy((manager) => {
        expect(manager.numResources).toBe(1);
      });
    });

    test('should create resource manager with same resources as original', () => {
      expect(BundleLoader.createManagerFromBundle({ bundle: testBundle })).toSucceedAndSatisfy(
        (loadedManager) => {
          expect(loadedManager.numResources).toBe(resourceManager.numResources);
          expect(loadedManager.numCandidates).toBe(resourceManager.numCandidates);

          expect(loadedManager.getBuiltResource('test.resource')).toSucceedAndSatisfy((resource) => {
            expect(resource.id).toBe('test.resource');
            expect(resource.candidates).toHaveLength(1);
            expect(resource.candidates[0].json).toEqual({ value: 'test' });
          });
        }
      );
    });

    test('should create resource manager with same qualifiers', () => {
      expect(BundleLoader.createManagerFromBundle({ bundle: testBundle })).toSucceedAndSatisfy(
        (loadedManager) => {
          expect(loadedManager.conditions.size).toBe(resourceManager.conditions.size);
          expect(loadedManager.conditionSets.size).toBe(resourceManager.conditionSets.size);
          expect(loadedManager.decisions.size).toBe(resourceManager.decisions.size);
        }
      );
    });

    test('should validate context correctly', () => {
      const context = {
        language: 'en'
      };

      expect(BundleLoader.createManagerFromBundle({ bundle: testBundle })).toSucceedAndSatisfy(
        (loadedManager) => {
          expect(loadedManager.validateContext(context)).toSucceed();
        }
      );
    });

    test('should handle empty bundle', () => {
      const emptyManager = ResourceManagerBuilder.createPredefined('default').orThrow();
      const emptyBundle = BundleBuilder.createFromPredefined(emptyManager, 'default').orThrow();

      expect(BundleLoader.createManagerFromBundle({ bundle: emptyBundle })).toSucceedAndSatisfy(
        (loadedManager) => {
          expect(loadedManager.numResources).toBe(0);
          expect(loadedManager.numCandidates).toBe(0);
        }
      );
    });

    test('should handle bundle with multiple resources', () => {
      // Create a fresh manager for this test
      const multiManager = ResourceManagerBuilder.createPredefined('default').orThrow();

      multiManager
        .addResource({
          id: 'test.resource',
          resourceTypeName: 'json',
          candidates: [
            {
              json: { value: 'test' }
            }
          ]
        })
        .orThrow();

      multiManager
        .addResource({
          id: 'test.resource2',
          resourceTypeName: 'json',
          candidates: [
            {
              json: { value: 'test2' }
            }
          ]
        })
        .orThrow();

      const multiResourceBundle = BundleBuilder.createFromPredefined(multiManager, 'default').orThrow();

      expect(BundleLoader.createManagerFromBundle({ bundle: multiResourceBundle })).toSucceedAndSatisfy(
        (loadedManager) => {
          expect(loadedManager.numResources).toBe(2);
          expect(loadedManager.getBuiltResource('test.resource')).toSucceed();
          expect(loadedManager.getBuiltResource('test.resource2')).toSucceed();
        }
      );
    });

    test('should preserve resource properties correctly', () => {
      // Create a fresh manager for this test
      const partialManager = ResourceManagerBuilder.createPredefined('default').orThrow();

      partialManager
        .addResource({
          id: 'test.partial',
          resourceTypeName: 'json',
          candidates: [
            {
              json: { base: 'value' },
              isPartial: true,
              mergeMethod: 'augment'
            }
          ]
        })
        .orThrow();

      const bundleWithPartial = BundleBuilder.createFromPredefined(partialManager, 'default').orThrow();

      expect(BundleLoader.createManagerFromBundle({ bundle: bundleWithPartial })).toSucceedAndSatisfy(
        (loadedManager) => {
          expect(loadedManager.getBuiltResource('test.partial')).toSucceedAndSatisfy((resource) => {
            expect(resource.candidates).toHaveLength(1);
            expect(resource.candidates[0].isPartial).toBe(true);
            expect(resource.candidates[0].mergeMethod).toBe('augment');
          });
        }
      );
    });

    test('should handle round-trip bundle creation and loading', () => {
      const originalBundle = BundleBuilder.createFromPredefined(resourceManager, 'default').orThrow();

      expect(BundleLoader.createManagerFromBundle({ bundle: originalBundle })).toSucceedAndSatisfy(
        (loadedManager) => {
          const reBundle = BundleBuilder.createFromPredefined(resourceManager, 'default').orThrow();
          expect(reBundle.metadata.checksum).toBe(originalBundle.metadata.checksum);
        }
      );
    });
  });
});
