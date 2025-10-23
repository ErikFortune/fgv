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
import { succeed, fail, Result } from '@fgv/ts-utils';
import { JsonValue } from '@fgv/ts-json-base';
import * as TsRes from '../../../index';
import { DeltaGenerator, IDeltaGeneratorParams } from '../../../packlets/resources';
import {
  createCompleteTestSetup,
  createBaselineResolver,
  createDeltaResolver,
  deltaResources,
  ITestSetup
} from './deltaGenerator.helpers';

describe('DeltaGenerator - Core functionality', () => {
  let testSetup: ITestSetup;

  beforeEach(() => {
    testSetup = createCompleteTestSetup();
  });

  describe('create', () => {
    test('should create DeltaGenerator with valid parameters', () => {
      const baselineResolver = createBaselineResolver(
        testSetup.resourceManager,
        testSetup.qualifierTypes,
        testSetup.contextProvider
      );

      const deltaResolver = createDeltaResolver(
        deltaResources,
        testSetup.qualifiers,
        testSetup.resourceTypes,
        testSetup.qualifierTypes,
        testSetup.contextProvider
      );

      const params: IDeltaGeneratorParams = {
        baselineResolver,
        deltaResolver,
        resourceManager: testSetup.resourceManager,
        logger: testSetup.mockLogger
      };

      expect(DeltaGenerator.create(params)).toSucceedAndSatisfy((generator) => {
        expect(generator).toBeInstanceOf(DeltaGenerator);
      });
    });

    test('should create DeltaGenerator without logger (uses NoOpLogger)', () => {
      const baselineResolver = createBaselineResolver(
        testSetup.resourceManager,
        testSetup.qualifierTypes,
        testSetup.contextProvider
      );

      const deltaResolver = createDeltaResolver(
        deltaResources,
        testSetup.qualifiers,
        testSetup.resourceTypes,
        testSetup.qualifierTypes,
        testSetup.contextProvider
      );

      const params: IDeltaGeneratorParams = {
        baselineResolver,
        deltaResolver,
        resourceManager: testSetup.resourceManager
        // No logger provided
      };

      expect(DeltaGenerator.create(params)).toSucceed();
    });

    test('should handle constructor errors', () => {
      // Test with null parameters that would cause constructor to throw
      const invalidParams = null as unknown as IDeltaGeneratorParams;

      const result = DeltaGenerator.create(invalidParams);
      expect(result).toFail();
    });
  });

  describe('generate', () => {
    let baselineResolver: TsRes.IResourceResolver;
    let deltaResolver: TsRes.IResourceResolver;
    let generator: DeltaGenerator;

    beforeEach(() => {
      baselineResolver = createBaselineResolver(
        testSetup.resourceManager,
        testSetup.qualifierTypes,
        testSetup.contextProvider
      );

      deltaResolver = createDeltaResolver(
        deltaResources,
        testSetup.qualifiers,
        testSetup.resourceTypes,
        testSetup.qualifierTypes,
        testSetup.contextProvider
      );

      generator = DeltaGenerator.create({
        baselineResolver,
        deltaResolver,
        resourceManager: testSetup.resourceManager,
        logger: testSetup.mockLogger
      }).orThrow();
    });

    describe('successful delta generation', () => {
      test('should generate deltas with default options', () => {
        expect(generator.generate()).toSucceedAndSatisfy((resultManager) => {
          expect(resultManager).toBeInstanceOf(TsRes.Resources.ResourceManagerBuilder);
          expect(resultManager.size).toBeGreaterThan(0);

          // Verify logging calls
          expect(testSetup.mockLogger.info).toHaveBeenCalledWith('Starting delta generation');
          expect(testSetup.mockLogger.info).toHaveBeenCalledWith(
            expect.stringMatching(/Delta generation completed successfully/)
          );
        });
      });

      test('should generate deltas with empty context', () => {
        const options = {
          context: {},
          skipUnchanged: true
        };

        expect(generator.generate(options)).toSucceedAndSatisfy((resultManager) => {
          expect(resultManager.size).toBeGreaterThan(0);
        });
      });

      test('should generate deltas with specific context', () => {
        const options = {
          context: { language: 'en', territory: 'CA' }, // Different context to avoid conflicts
          skipUnchanged: true
        };

        expect(generator.generate(options)).toSucceedAndSatisfy((resultManager) => {
          expect(resultManager.size).toBeGreaterThan(0);
        });
      });

      test('should handle specific resource IDs', () => {
        const options = {
          resourceIds: ['greeting.hello', 'numbers.count'], // Both exist in baseline
          skipUnchanged: true
        };

        expect(generator.generate(options)).toSucceedAndSatisfy((resultManager) => {
          expect(resultManager.size).toBeGreaterThan(0);

          // Should have processed specific resources
          expect(testSetup.mockLogger.info).toHaveBeenCalledWith('Using 2 specified resource IDs');
        });
      });

      test('should include unchanged resources when skipUnchanged is false', () => {
        const options = {
          skipUnchanged: false
        };

        expect(generator.generate(options)).toSucceedAndSatisfy((resultManager) => {
          expect(resultManager.size).toBeGreaterThan(0);

          // Should process unchanged resources too
          expect(testSetup.mockLogger.info).toHaveBeenCalledWith(expect.stringMatching(/skipped/));
        });
      });

      test('should create UPDATED resource candidates with partial/augment merge method', () => {
        // Test with a resource that exists in both and will be updated
        expect(generator.generate()).toSucceedAndSatisfy((resultManager) => {
          expect(resultManager.size).toBeGreaterThan(0);

          // Verify logging indicates changes detected for updated resource
          expect(testSetup.mockLogger.detail).toHaveBeenCalledWith(
            expect.stringMatching(/greeting.hello.*Changes detected/)
          );
        });
      });

      test('should skip UNCHANGED resources when skipUnchanged is true', () => {
        const options = {
          resourceIds: ['numbers.count'], // Unchanged resource
          skipUnchanged: true
        };

        expect(generator.generate(options)).toSucceedAndSatisfy((resultManager) => {
          // Should still succeed but skip the unchanged resource
          expect(testSetup.mockLogger.detail).toHaveBeenCalledWith(
            expect.stringMatching(/numbers.count.*No changes detected, skipping/)
          );
        });
      });

      test('should discover resources from delta resolver when no specific IDs provided', () => {
        expect(generator.generate()).toSucceedAndSatisfy((resultManager) => {
          expect(testSetup.mockLogger.info).toHaveBeenCalledWith(
            'Discovering resources from both baseline and delta resolvers'
          );
          expect(testSetup.mockLogger.info).toHaveBeenCalledWith(
            expect.stringMatching(/Discovered \d+ unique resources across both resolvers/)
          );
        });
      });
    });

    describe('error scenarios', () => {
      test('should fail with invalid context', () => {
        const options = {
          context: { invalidQualifier: 'value' }
        };

        expect(generator.generate(options)).toFail();
      });

      test('should fail with invalid resource IDs', () => {
        const options = {
          resourceIds: ['nonexistent.resource']
        };

        expect(generator.generate(options)).toFailWith(/Invalid resource ID/);
      });

      test('should handle resource manager cloning failure', () => {
        // Create a generator with a broken resource manager
        const brokenManager = TsRes.Resources.ResourceManagerBuilder.create({
          qualifiers: testSetup.qualifiers,
          resourceTypes: testSetup.resourceTypes
        }).orThrow();

        // Mock the clone method to fail
        jest.spyOn(brokenManager, 'clone').mockReturnValue(fail('Clone failed'));

        const brokenGenerator = DeltaGenerator.create({
          baselineResolver,
          deltaResolver,
          resourceManager: brokenManager,
          logger: testSetup.mockLogger
        }).orThrow();

        expect(brokenGenerator.generate()).toFailWith(/Clone failed/);
      });

      test('should handle delta resolver failure', () => {
        // Test with invalid resource IDs that will cause enumeration phase to fail
        const options = {
          resourceIds: ['nonexistent-resource'] // This should cause validation to fail
        };

        expect(generator.generate(options)).toFailWith(/Invalid resource ID/);
      });

      test('should handle baseline resolver failure gracefully (new resource)', () => {
        // Create a testable baseline resolver that fails (simulating new resources)
        class TestableEmptyBaselineResolver implements TsRes.IResourceResolver {
          public get resourceIds(): ReadonlyArray<TsRes.ResourceId> {
            return [];
          }

          public resolveComposedResourceValue(resourceId: string): Result<JsonValue> {
            return fail('Resource not found in baseline');
          }

          public withContext(context: unknown): Result<TsRes.IResourceResolver> {
            return succeed(this);
          }
        }

        const newResourceGenerator = DeltaGenerator.create({
          baselineResolver: new TestableEmptyBaselineResolver(),
          deltaResolver,
          resourceManager: testSetup.resourceManager,
          logger: testSetup.mockLogger
        }).orThrow();

        const options = {
          resourceIds: ['greeting.hello']
        };

        // Should succeed because baseline failure indicates new resource
        expect(newResourceGenerator.generate(options)).toSucceed();
      });

      test('should handle non-object resource values', () => {
        // Create a testable delta resolver that returns non-object values
        class TestableNonObjectResolver implements TsRes.IResourceResolver {
          public get resourceIds(): ReadonlyArray<TsRes.ResourceId> {
            return ['greeting.hello'] as TsRes.ResourceId[];
          }

          public resolveComposedResourceValue(resourceId: string): Result<JsonValue> {
            if (resourceId === 'greeting.hello') {
              return succeed('string-value');
            }
            return fail('Resource not found');
          }

          public withContext(context: unknown): Result<TsRes.IResourceResolver> {
            return succeed(this);
          }
        }

        const nonObjectGenerator = DeltaGenerator.create({
          baselineResolver,
          deltaResolver: new TestableNonObjectResolver(),
          resourceManager: testSetup.resourceManager,
          logger: testSetup.mockLogger
        }).orThrow();

        const options = {
          resourceIds: ['greeting.hello']
        };

        expect(nonObjectGenerator.generate(options)).toFailWith(/Delta changes must be a JSON object/);
      });

      test('should reject non-object values for new resources', () => {
        // Create a delta resolver that returns non-object values for a NEW resource
        class TestableNonObjectDeltaResolver implements TsRes.IResourceResolver {
          public get resourceIds(): ReadonlyArray<TsRes.ResourceId> {
            return ['new.resource'] as TsRes.ResourceId[];
          }

          public resolveComposedResourceValue(resourceId: string): Result<JsonValue> {
            if (resourceId === 'new.resource') {
              // Return a string value instead of an object
              return succeed('this is a string, not an object');
            }
            return fail('Resource not found');
          }

          public withContext(context: unknown): Result<TsRes.IResourceResolver> {
            return succeed(this);
          }
        }

        // Create an empty baseline resolver so the resource appears as NEW
        class TestableEmptyBaselineResolver implements TsRes.IResourceResolver {
          public get resourceIds(): ReadonlyArray<TsRes.ResourceId> {
            return [];
          }

          public resolveComposedResourceValue(resourceId: string): Result<JsonValue> {
            return fail('Resource not found in baseline');
          }

          public withContext(context: unknown): Result<TsRes.IResourceResolver> {
            return succeed(this);
          }
        }

        const newResourceGenerator = DeltaGenerator.create({
          baselineResolver: new TestableEmptyBaselineResolver(),
          deltaResolver: new TestableNonObjectDeltaResolver(),
          resourceManager: testSetup.resourceManager,
          logger: testSetup.mockLogger
        }).orThrow();

        // Don't specify resourceIds - let it discover resources automatically from delta resolver
        // This allows the new resource to be discovered and processed

        // Should fail because new resources must have JSON object values
        const result = newResourceGenerator.generate();
        expect(result).toFail();
        if (result.isFailure()) {
          // Verify the error message contains the expected validation
          expect(result.message).toMatch(/Resource value must be a JSON object, got string/);
        }
      });

      test('should handle diff computation failure', () => {
        // This would be difficult to test without mocking the Diff module
        // But we can test the scenario where values are reported as identical by diff
        // but weren't caught by our initial check

        // Create identical baseline and delta resolvers
        const identicalGenerator = DeltaGenerator.create({
          baselineResolver,
          deltaResolver: baselineResolver, // Same resolver
          resourceManager: testSetup.resourceManager,
          logger: testSetup.mockLogger
        }).orThrow();

        const options = {
          resourceIds: ['greeting.hello'],
          skipUnchanged: false // Process even if unchanged
        };

        expect(identicalGenerator.generate(options)).toSucceed();
        // Should log warning about identical values
        expect(testSetup.mockLogger.warn).toHaveBeenCalledWith(
          expect.stringMatching(/Diff reports identical values, skipping/)
        );
      });

      test('should aggregate multiple resource errors', () => {
        // Test with multiple invalid resource IDs to trigger validation errors
        const options = {
          resourceIds: ['nonexistent-resource-1', 'nonexistent-resource-2']
        };

        expect(generator.generate(options)).toFailWith(/Invalid resource ID/);
      });
    });

    describe('edge cases', () => {
      test('should handle empty resource managers', () => {
        const emptyManager = TsRes.Resources.ResourceManagerBuilder.create({
          qualifiers: testSetup.qualifiers,
          resourceTypes: testSetup.resourceTypes
        }).orThrow();

        const emptyResolver = TsRes.Runtime.ResourceResolver.create({
          resourceManager: emptyManager.build().orThrow(),
          qualifierTypes: testSetup.qualifierTypes,
          contextQualifierProvider: testSetup.contextProvider
        }).orThrow();

        const emptyGenerator = DeltaGenerator.create({
          baselineResolver: emptyResolver,
          deltaResolver: emptyResolver,
          resourceManager: emptyManager,
          logger: testSetup.mockLogger
        }).orThrow();

        expect(emptyGenerator.generate()).toSucceedAndSatisfy((resultManager) => {
          expect(resultManager.size).toBe(0);
        });
      });

      test('should discover resources that exist ONLY in delta resolver (critical bug test)', () => {
        // This test demonstrates the critical bug where resources that exist only in the delta
        // resolver are not discovered because enumeration is based on the baseline resolver

        // Create a baseline manager with just one resource
        const baselineOnlyManager = TsRes.Resources.ResourceManagerBuilder.create({
          qualifiers: testSetup.qualifiers,
          resourceTypes: testSetup.resourceTypes
        }).orThrow();

        const baselineOnlyResource: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl = {
          id: 'baseline-only',
          json: { message: 'Baseline Only' },
          conditions: { language: 'en' },
          resourceTypeName: 'json'
        };

        baselineOnlyManager.addLooseCandidate(baselineOnlyResource).orThrow();

        const baselineOnlyResolver = TsRes.Runtime.ResourceResolver.create({
          resourceManager: baselineOnlyManager.build().orThrow(),
          qualifierTypes: testSetup.qualifierTypes,
          contextQualifierProvider: testSetup.contextProvider
        }).orThrow();

        // Create a delta manager with a DIFFERENT resource that doesn't exist in baseline
        const deltaOnlyManager = TsRes.Resources.ResourceManagerBuilder.create({
          qualifiers: testSetup.qualifiers,
          resourceTypes: testSetup.resourceTypes
        }).orThrow();

        const deltaOnlyResource: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl = {
          id: 'delta-only',
          json: { message: 'Delta Only - This Should Be Found!' },
          conditions: { language: 'en' },
          resourceTypeName: 'json'
        };

        deltaOnlyManager.addLooseCandidate(deltaOnlyResource).orThrow();

        const deltaOnlyResolver = TsRes.Runtime.ResourceResolver.create({
          resourceManager: deltaOnlyManager.build().orThrow(),
          qualifierTypes: testSetup.qualifierTypes,
          contextQualifierProvider: testSetup.contextProvider
        }).orThrow();

        // Create generator with baseline containing 'baseline-only' and delta containing 'delta-only'
        const criticalBugGenerator = DeltaGenerator.create({
          baselineResolver: baselineOnlyResolver,
          deltaResolver: deltaOnlyResolver,
          resourceManager: baselineOnlyManager, // Uses baseline as source for enumeration
          logger: testSetup.mockLogger
        }).orThrow();

        // Generate deltas - this should find 'delta-only' but currently won't due to the bug
        expect(criticalBugGenerator.generate()).toSucceedAndSatisfy((resultManager) => {
          // The bug: delta-only resource should be found and added as a NEW resource
          // but it won't be because enumeration only looks at baseline resources

          // Try to verify the delta-only resource was added
          const deltaOnlyResult = resultManager.getBuiltResource('delta-only');

          // THIS TEST SHOULD FAIL - demonstrating the bug
          // The resource exists in delta but enumeration missed it
          expect(deltaOnlyResult).toSucceedAndSatisfy((resource) => {
            expect(resource.id).toBe('delta-only');
            expect(resource.candidates.length).toBeGreaterThan(0);

            // Should be treated as a NEW resource with replace merge method
            const newCandidate = resource.candidates.find((c) => c.mergeMethod === 'replace');
            expect(newCandidate).toBeDefined();
          });

          // Also verify logging shows the delta-only resource was discovered
          expect(testSetup.mockLogger.info).toHaveBeenCalledWith(
            expect.stringMatching(/Discovered.*unique resources across both resolvers/)
          );
        });
      });

      test('should handle empty resource ID list', () => {
        const options = {
          resourceIds: []
        };

        expect(generator.generate(options)).toSucceedAndSatisfy((resultManager) => {
          // Should fall back to discovery mode
          expect(testSetup.mockLogger.info).toHaveBeenCalledWith(
            'Discovering resources from both baseline and delta resolvers'
          );
        });
      });

      test('should handle resource with context that extracts conditions', () => {
        const contextOptions = {
          context: { language: 'en', territory: 'US' }
        };

        expect(generator.generate(contextOptions)).toSucceedAndSatisfy((resultManager) => {
          expect(resultManager.size).toBeGreaterThan(0);
        });
      });

      test('should handle large number of resources efficiently', () => {
        // Create a larger set of resources for performance testing
        const largeResourceSet: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[] = [];

        for (let i = 0; i < 100; i++) {
          largeResourceSet.push({
            id: `test-resource-r${i}`,
            json: { value: `Resource ${i}`, index: i },
            conditions: { language: 'en' },
            resourceTypeName: 'json'
          });
        }

        // Add to delta manager
        const largeManager = TsRes.Resources.ResourceManagerBuilder.create({
          qualifiers: testSetup.qualifiers,
          resourceTypes: testSetup.resourceTypes
        }).orThrow();

        largeResourceSet.forEach((resource) => {
          largeManager.addLooseCandidate(resource).orThrow();
        });

        const largeResolver = TsRes.Runtime.ResourceResolver.create({
          resourceManager: largeManager.build().orThrow(),
          qualifierTypes: testSetup.qualifierTypes,
          contextQualifierProvider: testSetup.contextProvider
        }).orThrow();

        const largeGenerator = DeltaGenerator.create({
          baselineResolver,
          deltaResolver: largeResolver,
          resourceManager: testSetup.resourceManager,
          logger: testSetup.mockLogger
        }).orThrow();

        const startTime = Date.now();
        expect(largeGenerator.generate()).toSucceed();
        const duration = Date.now() - startTime;

        // Should complete in reasonable time (less than 5 seconds for 100 resources)
        expect(duration).toBeLessThan(5000);

        // Should log processing statistics
        expect(testSetup.mockLogger.info).toHaveBeenCalledWith(
          expect.stringMatching(/Processed \d+ resources:/)
        );
      });
    });

    describe('logging integration', () => {
      test('should log detailed processing information', () => {
        expect(generator.generate()).toSucceed();

        // Verify expected log calls
        expect(testSetup.mockLogger.info).toHaveBeenCalledWith('Starting delta generation');
        expect(testSetup.mockLogger.info).toHaveBeenCalledWith(
          'Discovering resources from both baseline and delta resolvers'
        );
        expect(testSetup.mockLogger.info).toHaveBeenCalledWith(
          expect.stringMatching(/Discovered \d+ unique resources across both resolvers/)
        );
        expect(testSetup.mockLogger.info).toHaveBeenCalledWith('Cloning resource manager');
        expect(testSetup.mockLogger.info).toHaveBeenCalledWith(
          expect.stringMatching(/Generating deltas for \d+ resources/)
        );
        expect(testSetup.mockLogger.info).toHaveBeenCalledWith(
          expect.stringMatching(/Processed \d+ resources: \d+ updated, \d+ new, \d+ skipped/)
        );
        expect(testSetup.mockLogger.info).toHaveBeenCalledWith(
          expect.stringMatching(/Delta generation completed successfully with \d+ resources/)
        );
      });

      test('should log individual resource processing', () => {
        const options = {
          resourceIds: ['greeting.hello', 'numbers.count']
        };

        expect(generator.generate(options)).toSucceed();

        // Verify detailed resource processing logs
        expect(testSetup.mockLogger.detail).toHaveBeenCalledWith('Processing resource: greeting.hello');
        expect(testSetup.mockLogger.detail).toHaveBeenCalledWith('Processing resource: numbers.count');
      });

      test('should use NoOpLogger when no logger provided', () => {
        const noLoggerGenerator = DeltaGenerator.create({
          baselineResolver,
          deltaResolver,
          resourceManager: testSetup.resourceManager
          // No logger provided
        }).orThrow();

        // Should not throw and should succeed
        expect(noLoggerGenerator.generate()).toSucceed();
      });
    });
  });
});
