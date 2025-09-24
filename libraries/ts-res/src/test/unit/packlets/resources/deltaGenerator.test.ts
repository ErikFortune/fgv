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
import { succeed, fail, Logging } from '@fgv/ts-utils';
import { JsonObject } from '@fgv/ts-json-base';
import * as TsRes from '../../../../index';
import { DeltaGenerator, IDeltaGeneratorParams } from '../../../../packlets/resources/deltaGenerator';

describe('DeltaGenerator', () => {
  let qualifierTypes: TsRes.QualifierTypes.QualifierTypeCollector;
  let qualifiers: TsRes.Qualifiers.QualifierCollector;
  let resourceTypes: TsRes.ResourceTypes.ResourceTypeCollector;
  let resourceManager: TsRes.Resources.ResourceManagerBuilder;
  let contextProvider: TsRes.Runtime.Context.IContextQualifierProvider;

  // Mock logger to track logging calls
  let mockLogger: jest.Mocked<Logging.ILogger>;

  // Test resource candidates for baseline and delta scenarios
  const baselineResources: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[] = [
    {
      id: 'greeting.hello',
      json: { message: 'Hello', casual: 'Hi' },
      conditions: { language: 'en' },
      resourceTypeName: 'json'
    },
    {
      id: 'greeting.goodbye',
      json: { message: 'Goodbye', casual: 'Bye' },
      conditions: { language: 'en' },
      resourceTypeName: 'json'
    },
    {
      id: 'numbers.count',
      json: { one: 'one', two: 'two', three: 'three' },
      conditions: { language: 'en' },
      resourceTypeName: 'json'
    }
  ];

  const deltaResources: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[] = [
    // Updated resource - some changes
    {
      id: 'greeting.hello',
      json: { message: 'Hello World', casual: 'Hi there' },
      conditions: { language: 'en' },
      resourceTypeName: 'json'
    },
    // New resource - not in baseline
    {
      id: 'greeting.welcome',
      json: { message: 'Welcome', casual: 'Hey' },
      conditions: { language: 'en' },
      resourceTypeName: 'json'
    },
    // Unchanged resource - identical to baseline
    {
      id: 'numbers.count',
      json: { one: 'one', two: 'two', three: 'three' },
      conditions: { language: 'en' },
      resourceTypeName: 'json'
    }
  ];

  beforeAll(() => {
    // Set up qualifier types
    qualifierTypes = TsRes.QualifierTypes.QualifierTypeCollector.create({
      qualifierTypes: [
        TsRes.QualifierTypes.LanguageQualifierType.create().orThrow(),
        TsRes.QualifierTypes.TerritoryQualifierType.create().orThrow()
      ]
    }).orThrow();

    // Set up qualifiers
    qualifiers = TsRes.Qualifiers.QualifierCollector.create({
      qualifierTypes,
      qualifiers: [
        { name: 'language', typeName: 'language', defaultPriority: 100 },
        { name: 'territory', typeName: 'territory', defaultPriority: 90 }
      ]
    }).orThrow();

    // Set up resource types
    resourceTypes = TsRes.ResourceTypes.ResourceTypeCollector.create({
      resourceTypes: [TsRes.ResourceTypes.JsonResourceType.create().orThrow()]
    }).orThrow();

    // Set up context provider
    contextProvider = TsRes.Runtime.ValidatingSimpleContextQualifierProvider.create({
      qualifiers,
      qualifierValues: {
        language: 'en',
        territory: 'US'
      }
    }).orThrow();
  });

  beforeEach(() => {
    // Create mock logger
    mockLogger = {
      logLevel: 'detail' as const,
      log: jest.fn(),
      detail: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };

    // Create resource manager with baseline resources
    resourceManager = TsRes.Resources.ResourceManagerBuilder.create({
      qualifiers,
      resourceTypes
    }).orThrow();

    // Add baseline resources
    baselineResources.forEach((resource) => {
      resourceManager.addLooseCandidate(resource).orThrow();
    });
  });

  describe('create', () => {
    test('should create DeltaGenerator with valid parameters', () => {
      const baselineResolver = TsRes.Runtime.ResourceResolver.create({
        resourceManager,
        qualifierTypes,
        contextQualifierProvider: contextProvider
      }).orThrow();

      const deltaManager = TsRes.Resources.ResourceManagerBuilder.create({
        qualifiers,
        resourceTypes
      }).orThrow();

      deltaResources.forEach((resource) => {
        deltaManager.addLooseCandidate(resource).orThrow();
      });

      const deltaResolver = TsRes.Runtime.ResourceResolver.create({
        resourceManager: deltaManager,
        qualifierTypes,
        contextQualifierProvider: contextProvider
      }).orThrow();

      const params: IDeltaGeneratorParams = {
        baselineResolver,
        deltaResolver,
        resourceManager,
        logger: mockLogger
      };

      expect(DeltaGenerator.create(params)).toSucceedAndSatisfy((generator) => {
        expect(generator).toBeInstanceOf(DeltaGenerator);
      });
    });

    test('should create DeltaGenerator without logger (uses NoOpLogger)', () => {
      const baselineResolver = TsRes.Runtime.ResourceResolver.create({
        resourceManager,
        qualifierTypes,
        contextQualifierProvider: contextProvider
      }).orThrow();

      const deltaManager = TsRes.Resources.ResourceManagerBuilder.create({
        qualifiers,
        resourceTypes
      }).orThrow();

      const deltaResolver = TsRes.Runtime.ResourceResolver.create({
        resourceManager: deltaManager,
        qualifierTypes,
        contextQualifierProvider: contextProvider
      }).orThrow();

      const params: IDeltaGeneratorParams = {
        baselineResolver,
        deltaResolver,
        resourceManager
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
      // Set up baseline resolver
      baselineResolver = TsRes.Runtime.ResourceResolver.create({
        resourceManager,
        qualifierTypes,
        contextQualifierProvider: contextProvider
      }).orThrow();

      // Set up delta resolver
      const deltaManager = TsRes.Resources.ResourceManagerBuilder.create({
        qualifiers,
        resourceTypes
      }).orThrow();

      deltaResources.forEach((resource) => {
        deltaManager.addLooseCandidate(resource).orThrow();
      });

      deltaResolver = TsRes.Runtime.ResourceResolver.create({
        resourceManager: deltaManager,
        qualifierTypes,
        contextQualifierProvider: contextProvider
      }).orThrow();

      // Create generator
      generator = DeltaGenerator.create({
        baselineResolver,
        deltaResolver,
        resourceManager,
        logger: mockLogger
      }).orThrow();
    });

    describe('successful delta generation', () => {
      test('should generate deltas with default options', () => {
        expect(generator.generate()).toSucceedAndSatisfy((resultManager) => {
          expect(resultManager).toBeInstanceOf(TsRes.Resources.ResourceManagerBuilder);
          expect(resultManager.size).toBeGreaterThan(0);

          // Verify logging calls
          expect(mockLogger.info).toHaveBeenCalledWith('Starting delta generation');
          expect(mockLogger.info).toHaveBeenCalledWith(
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
          expect(mockLogger.info).toHaveBeenCalledWith('Using 2 specified resource IDs');
        });
      });

      test('should include unchanged resources when skipUnchanged is false', () => {
        const options = {
          skipUnchanged: false
        };

        expect(generator.generate(options)).toSucceedAndSatisfy((resultManager) => {
          expect(resultManager.size).toBeGreaterThan(0);

          // Should process unchanged resources too
          expect(mockLogger.info).toHaveBeenCalledWith(expect.stringMatching(/skipped/));
        });
      });

      test('should create UPDATED resource candidates with partial/augment merge method', () => {
        // Test with a resource that exists in both and will be updated
        expect(generator.generate()).toSucceedAndSatisfy((resultManager) => {
          expect(resultManager.size).toBeGreaterThan(0);

          // Verify logging indicates changes detected for updated resource
          expect(mockLogger.detail).toHaveBeenCalledWith(
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
          expect(mockLogger.detail).toHaveBeenCalledWith(
            expect.stringMatching(/numbers.count.*No changes detected, skipping/)
          );
        });
      });

      test('should discover resources from delta resolver when no specific IDs provided', () => {
        expect(generator.generate()).toSucceedAndSatisfy((resultManager) => {
          expect(mockLogger.info).toHaveBeenCalledWith('Discovering resources from delta resolver');
          expect(mockLogger.info).toHaveBeenCalledWith(
            expect.stringMatching(/Discovered \d+ resources in delta resolver/)
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
          qualifiers,
          resourceTypes
        }).orThrow();

        // Mock the clone method to fail
        jest.spyOn(brokenManager, 'clone').mockReturnValue(fail('Clone failed'));

        const brokenGenerator = DeltaGenerator.create({
          baselineResolver,
          deltaResolver,
          resourceManager: brokenManager,
          logger: mockLogger
        }).orThrow();

        expect(brokenGenerator.generate()).toFailWith(/Clone failed/);
      });

      test('should handle delta resolver failure', () => {
        // Create a mock resolver that fails
        const failingResolver: TsRes.IResourceResolver = {
          resolveComposedResourceValue: jest.fn().mockReturnValue(fail('Resolution failed')),
          withContext: jest.fn().mockReturnValue(succeed({} as TsRes.IResourceResolver))
        };

        const failingGenerator = DeltaGenerator.create({
          baselineResolver,
          deltaResolver: failingResolver,
          resourceManager,
          logger: mockLogger
        }).orThrow();

        const options = {
          resourceIds: ['greeting.hello']
        };

        expect(failingGenerator.generate(options)).toFailWith(/Delta generation failed with errors/);
      });

      test('should handle baseline resolver failure gracefully (new resource)', () => {
        // Create a mock baseline resolver that fails (simulating new resources)
        const failingBaselineResolver: TsRes.IResourceResolver = {
          resolveComposedResourceValue: jest.fn().mockReturnValue(fail('Resource not found')),
          withContext: jest.fn().mockReturnValue(succeed({} as TsRes.IResourceResolver))
        };

        const newResourceGenerator = DeltaGenerator.create({
          baselineResolver: failingBaselineResolver,
          deltaResolver,
          resourceManager,
          logger: mockLogger
        }).orThrow();

        const options = {
          resourceIds: ['greeting.hello']
        };

        // Should succeed because baseline failure indicates new resource
        expect(newResourceGenerator.generate(options)).toSucceed();
      });

      test('should handle non-object resource values', () => {
        // Create a delta resolver that returns non-object values
        const nonObjectResolver: TsRes.IResourceResolver = {
          resolveComposedResourceValue: jest.fn().mockReturnValue(succeed('string-value')),
          withContext: jest.fn().mockReturnValue(succeed({} as TsRes.IResourceResolver))
        };

        const nonObjectGenerator = DeltaGenerator.create({
          baselineResolver,
          deltaResolver: nonObjectResolver,
          resourceManager,
          logger: mockLogger
        }).orThrow();

        const options = {
          resourceIds: ['greeting.hello']
        };

        expect(nonObjectGenerator.generate(options)).toFailWith(/Delta changes must be a JSON object/);
      });

      test('should handle diff computation failure', () => {
        // This would be difficult to test without mocking the Diff module
        // But we can test the scenario where values are reported as identical by diff
        // but weren't caught by our initial check

        // Create identical baseline and delta resolvers
        const identicalGenerator = DeltaGenerator.create({
          baselineResolver,
          deltaResolver: baselineResolver, // Same resolver
          resourceManager,
          logger: mockLogger
        }).orThrow();

        const options = {
          resourceIds: ['greeting.hello'],
          skipUnchanged: false // Process even if unchanged
        };

        expect(identicalGenerator.generate(options)).toSucceed();
        // Should log warning about identical values
        expect(mockLogger.warn).toHaveBeenCalledWith(
          expect.stringMatching(/Diff reports identical values, skipping/)
        );
      });

      test('should aggregate multiple resource errors', () => {
        // Create resolvers that will fail for multiple resources
        const partiallyFailingResolver: TsRes.IResourceResolver = {
          resolveComposedResourceValue: jest
            .fn()
            .mockReturnValueOnce(fail('First resource failed'))
            .mockReturnValueOnce(fail('Second resource failed')),
          withContext: jest.fn().mockReturnValue(succeed({} as TsRes.IResourceResolver))
        };

        const multiErrorGenerator = DeltaGenerator.create({
          baselineResolver,
          deltaResolver: partiallyFailingResolver,
          resourceManager,
          logger: mockLogger
        }).orThrow();

        const options = {
          resourceIds: ['greeting.hello', 'numbers.count']
        };

        expect(multiErrorGenerator.generate(options)).toFailWith(/Delta generation failed with errors/);
      });
    });

    describe('edge cases', () => {
      test('should handle empty resource managers', () => {
        const emptyManager = TsRes.Resources.ResourceManagerBuilder.create({
          qualifiers,
          resourceTypes
        }).orThrow();

        const emptyResolver = TsRes.Runtime.ResourceResolver.create({
          resourceManager: emptyManager,
          qualifierTypes,
          contextQualifierProvider: contextProvider
        }).orThrow();

        const emptyGenerator = DeltaGenerator.create({
          baselineResolver: emptyResolver,
          deltaResolver: emptyResolver,
          resourceManager: emptyManager,
          logger: mockLogger
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
          qualifiers,
          resourceTypes
        }).orThrow();

        const baselineOnlyResource: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl = {
          id: 'baseline.only',
          json: { message: 'Baseline Only' },
          conditions: { language: 'en' },
          resourceTypeName: 'json'
        };

        baselineOnlyManager.addLooseCandidate(baselineOnlyResource).orThrow();

        const baselineOnlyResolver = TsRes.Runtime.ResourceResolver.create({
          resourceManager: baselineOnlyManager,
          qualifierTypes,
          contextQualifierProvider: contextProvider
        }).orThrow();

        // Create a delta manager with a DIFFERENT resource that doesn't exist in baseline
        const deltaOnlyManager = TsRes.Resources.ResourceManagerBuilder.create({
          qualifiers,
          resourceTypes
        }).orThrow();

        const deltaOnlyResource: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl = {
          id: 'delta.only',
          json: { message: 'Delta Only - This Should Be Found!' },
          conditions: { language: 'en' },
          resourceTypeName: 'json'
        };

        deltaOnlyManager.addLooseCandidate(deltaOnlyResource).orThrow();

        const deltaOnlyResolver = TsRes.Runtime.ResourceResolver.create({
          resourceManager: deltaOnlyManager,
          qualifierTypes,
          contextQualifierProvider: contextProvider
        }).orThrow();

        // Create generator with baseline containing 'baseline.only' and delta containing 'delta.only'
        const criticalBugGenerator = DeltaGenerator.create({
          baselineResolver: baselineOnlyResolver,
          deltaResolver: deltaOnlyResolver,
          resourceManager: baselineOnlyManager, // Uses baseline as source for enumeration
          logger: mockLogger
        }).orThrow();

        // Generate deltas - this should find 'delta.only' but currently won't due to the bug
        expect(criticalBugGenerator.generate()).toSucceedAndSatisfy((resultManager) => {
          // The bug: delta.only resource should be found and added as a NEW resource
          // but it won't be because enumeration only looks at baseline resources

          // Try to verify the delta-only resource was added
          const deltaOnlyResult = resultManager.getBuiltResource('delta.only');

          // THIS TEST SHOULD FAIL - demonstrating the bug
          // The resource exists in delta but enumeration missed it
          expect(deltaOnlyResult).toSucceedAndSatisfy((resource) => {
            expect(resource.id).toBe('delta.only');
            expect(resource.candidates.length).toBeGreaterThan(0);

            // Should be treated as a NEW resource with replace merge method
            const newCandidate = resource.candidates.find((c) => c.mergeMethod === 'replace');
            expect(newCandidate).toBeDefined();
          });

          // Also verify logging shows the delta-only resource was discovered
          expect(mockLogger.info).toHaveBeenCalledWith(
            expect.stringMatching(/Discovered.*resources in delta resolver/)
          );
        });
      });

      test('should handle empty resource ID list', () => {
        const options = {
          resourceIds: []
        };

        expect(generator.generate(options)).toSucceedAndSatisfy((resultManager) => {
          // Should fall back to discovery mode
          expect(mockLogger.info).toHaveBeenCalledWith('Discovering resources from delta resolver');
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
            id: `test.resource.r${i}`,
            json: { value: `Resource ${i}`, index: i },
            conditions: { language: 'en' },
            resourceTypeName: 'json'
          });
        }

        // Add to delta manager
        const largeManager = TsRes.Resources.ResourceManagerBuilder.create({
          qualifiers,
          resourceTypes
        }).orThrow();

        largeResourceSet.forEach((resource) => {
          largeManager.addLooseCandidate(resource).orThrow();
        });

        const largeResolver = TsRes.Runtime.ResourceResolver.create({
          resourceManager: largeManager,
          qualifierTypes,
          contextQualifierProvider: contextProvider
        }).orThrow();

        const largeGenerator = DeltaGenerator.create({
          baselineResolver,
          deltaResolver: largeResolver,
          resourceManager,
          logger: mockLogger
        }).orThrow();

        const startTime = Date.now();
        expect(largeGenerator.generate()).toSucceed();
        const duration = Date.now() - startTime;

        // Should complete in reasonable time (less than 5 seconds for 100 resources)
        expect(duration).toBeLessThan(5000);

        // Should log processing statistics
        expect(mockLogger.info).toHaveBeenCalledWith(expect.stringMatching(/Processed \d+ resources:/));
      });
    });

    describe('logging integration', () => {
      test('should log detailed processing information', () => {
        expect(generator.generate()).toSucceed();

        // Verify expected log calls
        expect(mockLogger.info).toHaveBeenCalledWith('Starting delta generation');
        expect(mockLogger.info).toHaveBeenCalledWith('Discovering resources from delta resolver');
        expect(mockLogger.info).toHaveBeenCalledWith(
          expect.stringMatching(/Discovered \d+ resources in delta resolver/)
        );
        expect(mockLogger.info).toHaveBeenCalledWith('Cloning resource manager');
        expect(mockLogger.info).toHaveBeenCalledWith(
          expect.stringMatching(/Generating deltas for \d+ resources/)
        );
        expect(mockLogger.info).toHaveBeenCalledWith(
          expect.stringMatching(/Processed \d+ resources: \d+ updated, \d+ new, \d+ skipped/)
        );
        expect(mockLogger.info).toHaveBeenCalledWith(
          expect.stringMatching(/Delta generation completed successfully with \d+ resources/)
        );
      });

      test('should log individual resource processing', () => {
        const options = {
          resourceIds: ['greeting.hello', 'numbers.count']
        };

        expect(generator.generate(options)).toSucceed();

        // Verify detailed resource processing logs
        expect(mockLogger.detail).toHaveBeenCalledWith('Processing resource: greeting.hello');
        expect(mockLogger.detail).toHaveBeenCalledWith('Processing resource: numbers.count');
      });

      test('should use NoOpLogger when no logger provided', () => {
        const noLoggerGenerator = DeltaGenerator.create({
          baselineResolver,
          deltaResolver,
          resourceManager
          // No logger provided
        }).orThrow();

        // Should not throw and should succeed
        expect(noLoggerGenerator.generate()).toSucceed();
      });
    });

    describe('DeltaGenerator idempotency tests', () => {
      test('should produce a resource manager that can be used consistently', () => {
        // Generate delta using the existing simple test data
        expect(generator.generate()).toSucceedAndSatisfy((generatedManager) => {
          // Basic idempotency test: generated manager should be usable
          expect(generatedManager.size).toBeGreaterThan(0);

          // Should have basic structure preserved
          expect(generatedManager.qualifiers.size).toBe(qualifiers.size);
          expect(generatedManager.resourceTypes.size).toBe(resourceTypes.size);

          // Should be able to create a resolver from it
          expect(
            TsRes.Runtime.ResourceResolver.create({
              resourceManager: generatedManager,
              qualifierTypes,
              contextQualifierProvider: contextProvider
            })
          ).toSucceedAndSatisfy((resolver) => {
            // The resolver should be functional - this is the core idempotency test
            expect(resolver).toBeDefined();
            expect(typeof resolver.resolveComposedResourceValue).toBe('function');
          });
        });
      });

      test('should generate deltas that maintain resource structure consistency', () => {
        // Use existing test data which has working baseline and delta resolvers
        expect(generator.generate()).toSucceedAndSatisfy((generatedManager) => {
          // The generated manager should maintain structural consistency
          expect(generatedManager.size).toBeGreaterThan(0);

          // Create a resolver to test basic functionality
          expect(
            TsRes.Runtime.ResourceResolver.create({
              resourceManager: generatedManager,
              qualifierTypes,
              contextQualifierProvider: contextProvider
            })
          ).toSucceedAndSatisfy((resolver) => {
            // Test that it can resolve at least some resources
            // Using existing test resource IDs that we know exist
            expect(resolver.resolveComposedResourceValue('greeting.hello')).toSucceedAndSatisfy(
              (greeting) => {
                // Basic structural verification - should be an object with expected properties
                expect(greeting).toBeDefined();
                if (typeof greeting === 'object' && greeting !== null) {
                  const obj = greeting as JsonObject;
                  // The greeting resource should have message property
                  expect(obj.message).toBeDefined();
                }
              }
            );
          });
        });
      });

      test('should produce deterministic results across multiple generations', () => {
        // Test that generating deltas multiple times produces consistent results
        expect(generator.generate()).toSucceedAndSatisfy((firstGeneration) => {
          expect(generator.generate()).toSucceedAndSatisfy((secondGeneration) => {
            // Both generations should have the same basic structure
            expect(firstGeneration.size).toBe(secondGeneration.size);
            expect(firstGeneration.qualifiers.size).toBe(secondGeneration.qualifiers.size);
            expect(firstGeneration.resourceTypes.size).toBe(secondGeneration.resourceTypes.size);

            // Both should be able to create functional resolvers
            expect(
              TsRes.Runtime.ResourceResolver.create({
                resourceManager: firstGeneration,
                qualifierTypes,
                contextQualifierProvider: contextProvider
              })
            ).toSucceed();

            expect(
              TsRes.Runtime.ResourceResolver.create({
                resourceManager: secondGeneration,
                qualifierTypes,
                contextQualifierProvider: contextProvider
              })
            ).toSucceed();
          });
        });
      });

      test('should demonstrate basic round-trip consistency', () => {
        // Test that the generated manager can be used to create a functional resolver
        // that produces consistent results
        expect(generator.generate()).toSucceedAndSatisfy((firstGenerated) => {
          // Create resolver from first generation
          expect(
            TsRes.Runtime.ResourceResolver.create({
              resourceManager: firstGenerated,
              qualifierTypes,
              contextQualifierProvider: contextProvider
            })
          ).toSucceedAndSatisfy((firstResolver) => {
            // Generate again and create another resolver
            expect(generator.generate()).toSucceedAndSatisfy((secondGenerated) => {
              expect(
                TsRes.Runtime.ResourceResolver.create({
                  resourceManager: secondGenerated,
                  qualifierTypes,
                  contextQualifierProvider: contextProvider
                })
              ).toSucceedAndSatisfy((secondResolver) => {
                // Both resolvers should be able to resolve the same resources
                expect(firstResolver.resolveComposedResourceValue('greeting.hello')).toSucceedAndSatisfy(
                  (firstResult) => {
                    expect(secondResolver.resolveComposedResourceValue('greeting.hello')).toSucceedAndSatisfy(
                      (secondResult) => {
                        // Results should be structurally equivalent (basic idempotency)
                        expect(typeof firstResult).toBe(typeof secondResult);
                        expect(firstResult).toBeDefined();
                        expect(secondResult).toBeDefined();
                      }
                    );
                  }
                );
              });
            });
          });
        });
      });
    });
  });

  describe('Resource enumeration and discovery (TDD tests)', () => {
    /**
     * These tests define the CORRECT behavior for DeltaGenerator resource enumeration.
     * They currently FAIL due to the enumeration bug where only baseline resources
     * are enumerated, missing delta-only resources. These tests will pass once the
     * enumeration logic is fixed to discover resources from BOTH resolvers.
     */

    describe('Resource discovery scenarios', () => {
      test('should discover ALL resources: baseline-only, delta-only, and overlapping', () => {
        // This is the core test that should drive the fix
        // Setup: comprehensive scenario with all three types of resources

        // Baseline resources: A, B, C
        const baselineOnlyManager = TsRes.Resources.ResourceManagerBuilder.create({
          qualifiers,
          resourceTypes
        }).orThrow();

        const baselineResources: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[] = [
          {
            id: 'resource.A', // Will exist only in baseline (potential deletion)
            json: { message: 'Resource A - baseline only', type: 'baseline' },
            conditions: { language: 'en' },
            resourceTypeName: 'json'
          },
          {
            id: 'resource.B', // Will exist in both baseline and delta (update scenario)
            json: { message: 'Resource B - original version', version: 1 },
            conditions: { language: 'en' },
            resourceTypeName: 'json'
          },
          {
            id: 'resource.C', // Will exist in both but be identical (unchanged)
            json: { message: 'Resource C - identical', status: 'unchanged' },
            conditions: { language: 'en' },
            resourceTypeName: 'json'
          }
        ];

        baselineResources.forEach((resource) => {
          baselineOnlyManager.addLooseCandidate(resource).orThrow();
        });

        const baselineResolver = TsRes.Runtime.ResourceResolver.create({
          resourceManager: baselineOnlyManager,
          qualifierTypes,
          contextQualifierProvider: contextProvider
        }).orThrow();

        // Delta resources: B (updated), C (identical), D (new)
        const deltaOnlyManager = TsRes.Resources.ResourceManagerBuilder.create({
          qualifiers,
          resourceTypes
        }).orThrow();

        const deltaResources: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[] = [
          {
            id: 'resource.B', // Overlapping - updated version
            json: { message: 'Resource B - UPDATED version', version: 2 },
            conditions: { language: 'en' },
            resourceTypeName: 'json'
          },
          {
            id: 'resource.C', // Overlapping - identical (should be skipped if skipUnchanged=true)
            json: { message: 'Resource C - identical', status: 'unchanged' },
            conditions: { language: 'en' },
            resourceTypeName: 'json'
          },
          {
            id: 'resource.D', // Delta-only - NEW resource (critical bug case)
            json: { message: 'Resource D - NEW in delta!', type: 'new' },
            conditions: { language: 'en' },
            resourceTypeName: 'json'
          }
        ];

        deltaResources.forEach((resource) => {
          deltaOnlyManager.addLooseCandidate(resource).orThrow();
        });

        const deltaResolver = TsRes.Runtime.ResourceResolver.create({
          resourceManager: deltaOnlyManager,
          qualifierTypes,
          contextQualifierProvider: contextProvider
        }).orThrow();

        // Create generator for comprehensive scenario
        const comprehensiveGenerator = DeltaGenerator.create({
          baselineResolver,
          deltaResolver,
          resourceManager: baselineOnlyManager, // Note: uses baseline as template
          logger: mockLogger
        }).orThrow();

        // Generate deltas - should discover and process ALL resource types correctly
        expect(comprehensiveGenerator.generate({ skipUnchanged: true })).toSucceedAndSatisfy(
          (resultManager) => {
            // CRITICAL: Verify delta-only resource D was discovered and added as NEW
            // This is the key test that currently FAILS due to enumeration bug
            expect(resultManager.getBuiltResource('resource.D')).toSucceedAndSatisfy((newResource) => {
              expect(newResource.id).toBe('resource.D');
              expect(newResource.candidates.length).toBeGreaterThan(0);

              // NEW resources should use 'replace' merge method (full/replace)
              const newCandidate = newResource.candidates.find((c) => c.mergeMethod === 'replace');
              expect(newCandidate).toBeDefined();
              expect(newCandidate).toMatchObject({
                mergeMethod: 'replace',
                conditions: expect.any(Object)
              });
            });

            // Verify overlapping resource B was processed as UPDATED
            expect(resultManager.getBuiltResource('resource.B')).toSucceedAndSatisfy((updatedResource) => {
              expect(updatedResource.id).toBe('resource.B');

              // UPDATED resources should use 'augment' merge method (partial/augment)
              const updateCandidate = updatedResource.candidates.find((c) => c.mergeMethod === 'augment');
              expect(updateCandidate).toBeDefined();
            });

            // Verify unchanged resource C was handled appropriately
            // If skipUnchanged=true, it might not be in the result, which is correct
            const unchangedResult = resultManager.getBuiltResource('resource.C');
            if (unchangedResult.isSuccess()) {
              // If it exists, it should be marked appropriately
              const unchangedResource = unchangedResult.value;
              expect(unchangedResource.id).toBe('resource.C');
            }

            // Verify baseline-only resource A was processed (potential deletion scenario)
            // Currently handled as augment+null, but this tests the enumeration part
            expect(resultManager.getBuiltResource('resource.A')).toSucceedAndSatisfy((baselineResource) => {
              expect(baselineResource.id).toBe('resource.A');
              // Should have appropriate handling for baseline-only resources
            });

            // Verify logging shows ALL resources were discovered
            expect(mockLogger.info).toHaveBeenCalledWith(
              expect.stringMatching(/Discovered \d+ resources in delta resolver/)
            );

            // Should show discovery found resources from delta (including resource.D)
            expect(mockLogger.info).toHaveBeenCalledWith('Discovering resources from delta resolver');
          }
        );
      });

      test('should discover delta-only resources when baseline is empty', () => {
        // Edge case: empty baseline, delta has resources
        // This tests pure discovery from delta resolver

        const emptyManager = TsRes.Resources.ResourceManagerBuilder.create({
          qualifiers,
          resourceTypes
        }).orThrow();

        const emptyResolver = TsRes.Runtime.ResourceResolver.create({
          resourceManager: emptyManager,
          qualifierTypes,
          contextQualifierProvider: contextProvider
        }).orThrow();

        // Delta has resources that should all be discovered as NEW
        const deltaManager = TsRes.Resources.ResourceManagerBuilder.create({
          qualifiers,
          resourceTypes
        }).orThrow();

        const deltaOnlyResources: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[] = [
          {
            id: 'new.resource.1',
            json: { message: 'First new resource', order: 1 },
            conditions: { language: 'en' },
            resourceTypeName: 'json'
          },
          {
            id: 'new.resource.2',
            json: { message: 'Second new resource', order: 2 },
            conditions: { language: 'en' },
            resourceTypeName: 'json'
          }
        ];

        deltaOnlyResources.forEach((resource) => {
          deltaManager.addLooseCandidate(resource).orThrow();
        });

        const deltaResolver = TsRes.Runtime.ResourceResolver.create({
          resourceManager: deltaManager,
          qualifierTypes,
          contextQualifierProvider: contextProvider
        }).orThrow();

        const emptyBaselineGenerator = DeltaGenerator.create({
          baselineResolver: emptyResolver,
          deltaResolver,
          resourceManager: emptyManager,
          logger: mockLogger
        }).orThrow();

        // Should discover and process both delta-only resources as NEW
        expect(emptyBaselineGenerator.generate()).toSucceedAndSatisfy((resultManager) => {
          // Both resources should be discovered and added
          expect(resultManager.getBuiltResource('new.resource.1')).toSucceedAndSatisfy((resource1) => {
            expect(resource1.id).toBe('new.resource.1');
            const newCandidate = resource1.candidates.find((c) => c.mergeMethod === 'replace');
            expect(newCandidate).toBeDefined();
          });

          expect(resultManager.getBuiltResource('new.resource.2')).toSucceedAndSatisfy((resource2) => {
            expect(resource2.id).toBe('new.resource.2');
            const newCandidate = resource2.candidates.find((c) => c.mergeMethod === 'replace');
            expect(newCandidate).toBeDefined();
          });

          // Should show discovery found 2 resources
          expect(mockLogger.info).toHaveBeenCalledWith(
            expect.stringMatching(/Discovered 2 resources in delta resolver/)
          );
        });
      });

      test('should discover baseline-only resources when delta is empty', () => {
        // Edge case: baseline has resources, delta is empty
        // This tests that baseline-only resources are still processed (potential deletions)

        const baselineManager = TsRes.Resources.ResourceManagerBuilder.create({
          qualifiers,
          resourceTypes
        }).orThrow();

        const baselineOnlyResources: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[] = [
          {
            id: 'baseline.resource.1',
            json: { message: 'Baseline resource 1', status: 'exists' },
            conditions: { language: 'en' },
            resourceTypeName: 'json'
          },
          {
            id: 'baseline.resource.2',
            json: { message: 'Baseline resource 2', status: 'exists' },
            conditions: { language: 'en' },
            resourceTypeName: 'json'
          }
        ];

        baselineOnlyResources.forEach((resource) => {
          baselineManager.addLooseCandidate(resource).orThrow();
        });

        const baselineResolver = TsRes.Runtime.ResourceResolver.create({
          resourceManager: baselineManager,
          qualifierTypes,
          contextQualifierProvider: contextProvider
        }).orThrow();

        const emptyManager = TsRes.Resources.ResourceManagerBuilder.create({
          qualifiers,
          resourceTypes
        }).orThrow();

        const emptyResolver = TsRes.Runtime.ResourceResolver.create({
          resourceManager: emptyManager,
          qualifierTypes,
          contextQualifierProvider: contextProvider
        }).orThrow();

        const emptyDeltaGenerator = DeltaGenerator.create({
          baselineResolver,
          deltaResolver: emptyResolver,
          resourceManager: baselineManager,
          logger: mockLogger
        }).orThrow();

        // Should still process baseline-only resources appropriately
        expect(emptyDeltaGenerator.generate()).toSucceedAndSatisfy((resultManager) => {
          // Baseline-only resources should be handled (currently as augment+null for deletions)
          expect(resultManager.getBuiltResource('baseline.resource.1')).toSucceedAndSatisfy((resource1) => {
            expect(resource1.id).toBe('baseline.resource.1');
            // Should have some form of processing for baseline-only resources
          });

          expect(resultManager.getBuiltResource('baseline.resource.2')).toSucceedAndSatisfy((resource2) => {
            expect(resource2.id).toBe('baseline.resource.2');
            // Should have some form of processing for baseline-only resources
          });

          // NOTE: When enumeration is fixed to discover from BOTH resolvers,
          // this scenario should show discovery from both baseline AND delta
          // even though delta is empty
        });
      });

      test('should handle complex nested resource hierarchies in enumeration', () => {
        // Test enumeration with complex resource structures

        const complexBaselineManager = TsRes.Resources.ResourceManagerBuilder.create({
          qualifiers,
          resourceTypes
        }).orThrow();

        const complexBaselineResources: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[] = [
          {
            id: 'app.ui.navigation.home',
            json: {
              title: 'Home',
              icon: 'house',
              nested: { deep: { value: 'baseline-nested' } }
            },
            conditions: { language: 'en' },
            resourceTypeName: 'json'
          },
          {
            id: 'app.ui.navigation.profile',
            json: { title: 'Profile', icon: 'user' },
            conditions: { language: 'en' },
            resourceTypeName: 'json'
          }
        ];

        complexBaselineResources.forEach((resource) => {
          complexBaselineManager.addLooseCandidate(resource).orThrow();
        });

        const complexBaselineResolver = TsRes.Runtime.ResourceResolver.create({
          resourceManager: complexBaselineManager,
          qualifierTypes,
          contextQualifierProvider: contextProvider
        }).orThrow();

        const complexDeltaManager = TsRes.Resources.ResourceManagerBuilder.create({
          qualifiers,
          resourceTypes
        }).orThrow();

        const complexDeltaResources: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[] = [
          {
            id: 'app.ui.navigation.home',
            json: {
              title: 'Home Updated',
              icon: 'home-modern',
              nested: { deep: { value: 'delta-updated', extra: 'new-field' } }
            },
            conditions: { language: 'en' },
            resourceTypeName: 'json'
          },
          {
            id: 'app.ui.navigation.settings', // Delta-only - NEW complex resource
            json: {
              title: 'Settings',
              icon: 'cog',
              nested: { permissions: { admin: true, user: false } }
            },
            conditions: { language: 'en' },
            resourceTypeName: 'json'
          },
          {
            id: 'app.ui.dialogs.confirm', // Another delta-only resource
            json: {
              title: 'Confirm Action',
              buttons: { ok: 'OK', cancel: 'Cancel' }
            },
            conditions: { language: 'en' },
            resourceTypeName: 'json'
          }
        ];

        complexDeltaResources.forEach((resource) => {
          complexDeltaManager.addLooseCandidate(resource).orThrow();
        });

        const complexDeltaResolver = TsRes.Runtime.ResourceResolver.create({
          resourceManager: complexDeltaManager,
          qualifierTypes,
          contextQualifierProvider: contextProvider
        }).orThrow();

        const complexGenerator = DeltaGenerator.create({
          baselineResolver: complexBaselineResolver,
          deltaResolver: complexDeltaResolver,
          resourceManager: complexBaselineManager,
          logger: mockLogger
        }).orThrow();

        // Should discover and process all complex resources correctly
        expect(complexGenerator.generate()).toSucceedAndSatisfy((resultManager) => {
          // Updated resource: home navigation (overlapping with changes)
          expect(resultManager.getBuiltResource('app.ui.navigation.home')).toSucceedAndSatisfy(
            (homeResource) => {
              expect(homeResource.id).toBe('app.ui.navigation.home');
              const updateCandidate = homeResource.candidates.find((c) => c.mergeMethod === 'augment');
              expect(updateCandidate).toBeDefined();
            }
          );

          // NEW delta-only resources (critical bug scenarios)
          expect(resultManager.getBuiltResource('app.ui.navigation.settings')).toSucceedAndSatisfy(
            (settingsResource) => {
              expect(settingsResource.id).toBe('app.ui.navigation.settings');
              const newCandidate = settingsResource.candidates.find((c) => c.mergeMethod === 'replace');
              expect(newCandidate).toBeDefined();
            }
          );

          expect(resultManager.getBuiltResource('app.ui.dialogs.confirm')).toSucceedAndSatisfy(
            (confirmResource) => {
              expect(confirmResource.id).toBe('app.ui.dialogs.confirm');
              const newCandidate = confirmResource.candidates.find((c) => c.mergeMethod === 'replace');
              expect(newCandidate).toBeDefined();
            }
          );

          // Baseline-only resource: profile navigation (potential deletion)
          expect(resultManager.getBuiltResource('app.ui.navigation.profile')).toSucceedAndSatisfy(
            (profileResource) => {
              expect(profileResource.id).toBe('app.ui.navigation.profile');
              // Should be processed appropriately for baseline-only scenario
            }
          );

          // Verify discovery logging shows resources from delta were found
          expect(mockLogger.info).toHaveBeenCalledWith(
            expect.stringMatching(/Discovered \d+ resources in delta resolver/)
          );
        });
      });

      test('should discover resources with different conditional contexts correctly', () => {
        // Test enumeration with resources that have different condition sets

        const conditionalBaselineManager = TsRes.Resources.ResourceManagerBuilder.create({
          qualifiers,
          resourceTypes
        }).orThrow();

        const conditionalBaselineResources: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[] = [
          {
            id: 'shared.message',
            json: { text: 'English message' },
            conditions: { language: 'en' },
            resourceTypeName: 'json'
          },
          {
            id: 'regional.content',
            json: { content: 'US content' },
            conditions: { language: 'en', territory: 'US' },
            resourceTypeName: 'json'
          }
        ];

        conditionalBaselineResources.forEach((resource) => {
          conditionalBaselineManager.addLooseCandidate(resource).orThrow();
        });

        const conditionalBaselineResolver = TsRes.Runtime.ResourceResolver.create({
          resourceManager: conditionalBaselineManager,
          qualifierTypes,
          contextQualifierProvider: contextProvider
        }).orThrow();

        const conditionalDeltaManager = TsRes.Resources.ResourceManagerBuilder.create({
          qualifiers,
          resourceTypes
        }).orThrow();

        const conditionalDeltaResources: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[] = [
          {
            id: 'shared.message',
            json: { text: 'Updated English message' },
            conditions: { language: 'en' },
            resourceTypeName: 'json'
          },
          {
            id: 'new.localized', // Delta-only with different conditions
            json: { text: 'Canadian content' },
            conditions: { language: 'en', territory: 'CA' },
            resourceTypeName: 'json'
          },
          {
            id: 'delta.global', // Delta-only with minimal conditions
            json: { text: 'Global resource' },
            conditions: { language: 'en' },
            resourceTypeName: 'json'
          }
        ];

        conditionalDeltaResources.forEach((resource) => {
          conditionalDeltaManager.addLooseCandidate(resource).orThrow();
        });

        const conditionalDeltaResolver = TsRes.Runtime.ResourceResolver.create({
          resourceManager: conditionalDeltaManager,
          qualifierTypes,
          contextQualifierProvider: contextProvider
        }).orThrow();

        const conditionalGenerator = DeltaGenerator.create({
          baselineResolver: conditionalBaselineResolver,
          deltaResolver: conditionalDeltaResolver,
          resourceManager: conditionalBaselineManager,
          logger: mockLogger
        }).orThrow();

        // Should discover and correctly handle all conditional resources
        expect(conditionalGenerator.generate()).toSucceedAndSatisfy((resultManager) => {
          // Updated resource with same conditions
          expect(resultManager.getBuiltResource('shared.message')).toSucceedAndSatisfy((sharedResource) => {
            expect(sharedResource.id).toBe('shared.message');
            const updateCandidate = sharedResource.candidates.find((c) => c.mergeMethod === 'augment');
            expect(updateCandidate).toBeDefined();
          });

          // NEW delta-only resources with different conditions (critical bug cases)
          expect(resultManager.getBuiltResource('new.localized')).toSucceedAndSatisfy((localizedResource) => {
            expect(localizedResource.id).toBe('new.localized');
            const newCandidate = localizedResource.candidates.find((c) => c.mergeMethod === 'replace');
            expect(newCandidate).toBeDefined();
            // Should preserve the Canadian territory condition
            expect(newCandidate?.conditions).toBeDefined();
          });

          expect(resultManager.getBuiltResource('delta.global')).toSucceedAndSatisfy((globalResource) => {
            expect(globalResource.id).toBe('delta.global');
            const newCandidate = globalResource.candidates.find((c) => c.mergeMethod === 'replace');
            expect(newCandidate).toBeDefined();
          });

          // Baseline-only resource with complex conditions
          expect(resultManager.getBuiltResource('regional.content')).toSucceedAndSatisfy(
            (regionalResource) => {
              expect(regionalResource.id).toBe('regional.content');
              // Should handle baseline-only scenario with complex conditions
            }
          );

          // Verify discovery found resources with various condition sets
          expect(mockLogger.info).toHaveBeenCalledWith(
            expect.stringMatching(/Discovered \d+ resources in delta resolver/)
          );
        });
      });
    });

    describe('Resource processing verification', () => {
      test('should process delta-only resources as NEW with full/replace merge method', () => {
        // Test that NEW resources (delta-only) get the correct processing

        const baselineManager = TsRes.Resources.ResourceManagerBuilder.create({
          qualifiers,
          resourceTypes
        }).orThrow();

        // Baseline has only resource.existing
        baselineManager
          .addLooseCandidate({
            id: 'resource.existing',
            json: { status: 'baseline' },
            conditions: { language: 'en' },
            resourceTypeName: 'json'
          })
          .orThrow();

        const baselineResolver = TsRes.Runtime.ResourceResolver.create({
          resourceManager: baselineManager,
          qualifierTypes,
          contextQualifierProvider: contextProvider
        }).orThrow();

        const deltaManager = TsRes.Resources.ResourceManagerBuilder.create({
          qualifiers,
          resourceTypes
        }).orThrow();

        // Delta has resource.existing (updated) AND resource.new (delta-only)
        deltaManager
          .addLooseCandidate({
            id: 'resource.existing',
            json: { status: 'updated in delta' },
            conditions: { language: 'en' },
            resourceTypeName: 'json'
          })
          .orThrow();

        deltaManager
          .addLooseCandidate({
            id: 'resource.new',
            json: {
              status: 'completely new',
              features: ['feature1', 'feature2'],
              metadata: { created: '2024-01-01', priority: 'high' }
            },
            conditions: { language: 'en' },
            resourceTypeName: 'json'
          })
          .orThrow();

        const deltaResolver = TsRes.Runtime.ResourceResolver.create({
          resourceManager: deltaManager,
          qualifierTypes,
          contextQualifierProvider: contextProvider
        }).orThrow();

        const processingGenerator = DeltaGenerator.create({
          baselineResolver,
          deltaResolver,
          resourceManager: baselineManager,
          logger: mockLogger
        }).orThrow();

        expect(processingGenerator.generate()).toSucceedAndSatisfy((resultManager) => {
          // CRITICAL: Verify the NEW resource has correct processing
          expect(resultManager.getBuiltResource('resource.new')).toSucceedAndSatisfy((newResource) => {
            expect(newResource.id).toBe('resource.new');
            expect(newResource.candidates.length).toBeGreaterThan(0);

            // NEW resources should use 'replace' merge method for full replacement
            const replaceCandidate = newResource.candidates.find((c) => c.mergeMethod === 'replace');
            expect(replaceCandidate).toBeDefined();
            expect(replaceCandidate).toMatchObject({
              mergeMethod: 'replace',
              conditions: expect.any(Object),
              // Should have the full resource value, not a diff
              json: expect.objectContaining({
                status: 'completely new',
                features: ['feature1', 'feature2'],
                metadata: expect.objectContaining({
                  created: '2024-01-01',
                  priority: 'high'
                })
              })
            });

            // Should NOT have augment candidates for NEW resources
            const augmentCandidates = newResource.candidates.filter((c) => c.mergeMethod === 'augment');
            expect(augmentCandidates).toHaveLength(0);
          });

          // Verify the UPDATED resource has correct processing
          expect(resultManager.getBuiltResource('resource.existing')).toSucceedAndSatisfy(
            (updatedResource) => {
              expect(updatedResource.id).toBe('resource.existing');

              // UPDATED resources should use 'augment' merge method for partial updates
              const augmentCandidate = updatedResource.candidates.find((c) => c.mergeMethod === 'augment');
              expect(augmentCandidate).toBeDefined();
              expect(augmentCandidate).toMatchObject({
                mergeMethod: 'augment',
                conditions: expect.any(Object)
              });
            }
          );

          // Verify logging shows correct resource processing
          expect(mockLogger.detail).toHaveBeenCalledWith(
            expect.stringMatching(/Processing resource: resource\.new/)
          );
          expect(mockLogger.detail).toHaveBeenCalledWith(
            expect.stringMatching(/Processing resource: resource\.existing/)
          );
        });
      });

      test('should process overlapping resources as UPDATED with partial/augment when different', () => {
        // Test overlapping resources that have changes get augment merge method

        const bothManager = TsRes.Resources.ResourceManagerBuilder.create({
          qualifiers,
          resourceTypes
        }).orThrow();

        const originalData = {
          title: 'Original Title',
          description: 'Original description',
          config: { theme: 'light', version: 1 }
        };

        // Both baseline and delta have the same resource, but delta has changes
        bothManager
          .addLooseCandidate({
            id: 'shared.resource',
            json: originalData,
            conditions: { language: 'en' },
            resourceTypeName: 'json'
          })
          .orThrow();

        const baselineResolver = TsRes.Runtime.ResourceResolver.create({
          resourceManager: bothManager,
          qualifierTypes,
          contextQualifierProvider: contextProvider
        }).orThrow();

        const deltaManager = TsRes.Resources.ResourceManagerBuilder.create({
          qualifiers,
          resourceTypes
        }).orThrow();

        const updatedData = {
          title: 'Updated Title', // Changed
          description: 'Original description', // Same
          config: { theme: 'dark', version: 2 }, // Changed nested object
          newField: 'added in delta' // New field
        };

        deltaManager
          .addLooseCandidate({
            id: 'shared.resource',
            json: updatedData,
            conditions: { language: 'en' },
            resourceTypeName: 'json'
          })
          .orThrow();

        const deltaResolver = TsRes.Runtime.ResourceResolver.create({
          resourceManager: deltaManager,
          qualifierTypes,
          contextQualifierProvider: contextProvider
        }).orThrow();

        const updateGenerator = DeltaGenerator.create({
          baselineResolver,
          deltaResolver,
          resourceManager: bothManager,
          logger: mockLogger
        }).orThrow();

        expect(updateGenerator.generate()).toSucceedAndSatisfy((resultManager) => {
          expect(resultManager.getBuiltResource('shared.resource')).toSucceedAndSatisfy((updatedResource) => {
            expect(updatedResource.id).toBe('shared.resource');
            expect(updatedResource.candidates.length).toBeGreaterThan(0);

            // UPDATED resources should use 'augment' merge method
            const augmentCandidate = updatedResource.candidates.find((c) => c.mergeMethod === 'augment');
            expect(augmentCandidate).toBeDefined();
            expect(augmentCandidate).toMatchObject({
              mergeMethod: 'augment',
              conditions: expect.any(Object)
            });

            // The augment value should contain the DIFF, not the full value
            // (Implementation detail: the diff should only include changed fields)
            expect(augmentCandidate?.json).toBeDefined();

            // Should NOT have replace candidates for UPDATED resources
            const replaceCandidates = updatedResource.candidates.filter((c) => c.mergeMethod === 'replace');
            expect(replaceCandidates).toHaveLength(0);
          });

          // Verify logging shows changes were detected
          expect(mockLogger.detail).toHaveBeenCalledWith(
            expect.stringMatching(/shared\.resource.*Changes detected/)
          );
        });
      });

      test('should handle identical resources appropriately when skipUnchanged option is used', () => {
        // Test that identical resources are handled according to skipUnchanged option

        const identicalManager = TsRes.Resources.ResourceManagerBuilder.create({
          qualifiers,
          resourceTypes
        }).orThrow();

        const identicalData = {
          message: 'Identical content',
          config: { setting: 'value', number: 42 },
          list: ['item1', 'item2', 'item3']
        };

        // Both baseline and delta have exactly the same resource
        identicalManager
          .addLooseCandidate({
            id: 'identical.resource',
            json: identicalData,
            conditions: { language: 'en' },
            resourceTypeName: 'json'
          })
          .orThrow();

        const identicalResolver = TsRes.Runtime.ResourceResolver.create({
          resourceManager: identicalManager,
          qualifierTypes,
          contextQualifierProvider: contextProvider
        }).orThrow();

        const identicalGenerator = DeltaGenerator.create({
          baselineResolver: identicalResolver,
          deltaResolver: identicalResolver, // Same resolver = identical resources
          resourceManager: identicalManager,
          logger: mockLogger
        }).orThrow();

        // Test with skipUnchanged = true
        expect(identicalGenerator.generate({ skipUnchanged: true })).toSucceedAndSatisfy((resultWithSkip) => {
          const identicalResult = resultWithSkip.getBuiltResource('identical.resource');

          // When skipUnchanged=true, identical resources might be skipped entirely
          if (identicalResult.isSuccess()) {
            // If it exists, verify it's marked appropriately
            const resource = identicalResult.value;
            expect(resource.id).toBe('identical.resource');
          }

          // Should log that the resource was skipped
          expect(mockLogger.detail).toHaveBeenCalledWith(
            expect.stringMatching(/identical\.resource.*No changes detected, skipping/)
          );
        });

        // Test with skipUnchanged = false
        expect(identicalGenerator.generate({ skipUnchanged: false })).toSucceedAndSatisfy(
          (resultWithoutSkip) => {
            // When skipUnchanged=false, resource should still be processed but marked as unchanged
            expect(resultWithoutSkip.getBuiltResource('identical.resource')).toSucceedAndSatisfy(
              (unchangedResource) => {
                expect(unchangedResource.id).toBe('identical.resource');
                // Implementation detail: unchanged resources might still get candidates for consistency
              }
            );
          }
        );
      });

      test('should extract and apply correct conditions from delta resolver context', () => {
        // Test that delta-only resources get conditions extracted from the delta resolver context

        const baselineManager = TsRes.Resources.ResourceManagerBuilder.create({
          qualifiers,
          resourceTypes
        }).orThrow();

        // Baseline has no resources - this is pure delta-only scenario
        const emptyBaselineResolver = TsRes.Runtime.ResourceResolver.create({
          resourceManager: baselineManager,
          qualifierTypes,
          contextQualifierProvider: contextProvider
        }).orThrow();

        const deltaManager = TsRes.Resources.ResourceManagerBuilder.create({
          qualifiers,
          resourceTypes
        }).orThrow();

        // Delta has resources with specific conditions
        const conditionalDeltaResources: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[] = [
          {
            id: 'localized.message',
            json: { text: 'Hello, Canada!' },
            conditions: { language: 'en', territory: 'CA' }, // Specific conditions
            resourceTypeName: 'json'
          },
          {
            id: 'language.only',
            json: { text: 'English text' },
            conditions: { language: 'en' }, // Language-only condition
            resourceTypeName: 'json'
          }
        ];

        conditionalDeltaResources.forEach((resource) => {
          deltaManager.addLooseCandidate(resource).orThrow();
        });

        const deltaResolver = TsRes.Runtime.ResourceResolver.create({
          resourceManager: deltaManager,
          qualifierTypes,
          contextQualifierProvider: contextProvider
        }).orThrow();

        const contextGenerator = DeltaGenerator.create({
          baselineResolver: emptyBaselineResolver,
          deltaResolver,
          resourceManager: baselineManager,
          logger: mockLogger
        }).orThrow();

        // Generate with specific context to test condition extraction
        const contextOptions = {
          context: { language: 'en', territory: 'CA' }
        };

        expect(contextGenerator.generate(contextOptions)).toSucceedAndSatisfy((resultManager) => {
          // Verify delta-only resources have correct conditions
          expect(resultManager.getBuiltResource('localized.message')).toSucceedAndSatisfy(
            (localizedResource) => {
              expect(localizedResource.id).toBe('localized.message');

              const replaceCandidate = localizedResource.candidates.find((c) => c.mergeMethod === 'replace');
              expect(replaceCandidate).toBeDefined();

              // Conditions should be extracted from the delta resolver context
              expect(replaceCandidate?.conditions).toBeDefined();

              // Should include both language and territory conditions from the original resource
              if (replaceCandidate?.conditions) {
                const conditions = replaceCandidate.conditions;
                expect(conditions).toMatchObject(
                  expect.objectContaining({
                    // Conditions should match what was in the delta resource
                    language: 'en',
                    territory: 'CA'
                  })
                );
              }
            }
          );

          expect(resultManager.getBuiltResource('language.only')).toSucceedAndSatisfy((languageResource) => {
            expect(languageResource.id).toBe('language.only');

            const replaceCandidate = languageResource.candidates.find((c) => c.mergeMethod === 'replace');
            expect(replaceCandidate).toBeDefined();
            expect(replaceCandidate?.conditions).toBeDefined();

            if (replaceCandidate?.conditions) {
              const conditions = replaceCandidate.conditions;
              expect(conditions).toMatchObject(
                expect.objectContaining({
                  language: 'en'
                })
              );
            }
          });
        });
      });
    });

    describe('Edge cases and robustness', () => {
      test('should handle resources with identical IDs but different resource types', () => {
        // Edge case: same ID but different resource types in baseline vs delta
        // This is a potential real-world scenario that should be handled gracefully

        const baselineManager = TsRes.Resources.ResourceManagerBuilder.create({
          qualifiers,
          resourceTypes
        }).orThrow();

        baselineManager
          .addLooseCandidate({
            id: 'multi.type.resource',
            json: { type: 'json', content: 'JSON content' },
            conditions: { language: 'en' },
            resourceTypeName: 'json'
          })
          .orThrow();

        const baselineResolver = TsRes.Runtime.ResourceResolver.create({
          resourceManager: baselineManager,
          qualifierTypes,
          contextQualifierProvider: contextProvider
        }).orThrow();

        const deltaManager = TsRes.Resources.ResourceManagerBuilder.create({
          qualifiers,
          resourceTypes
        }).orThrow();

        // Same ID, still JSON type but different structure - should work
        deltaManager
          .addLooseCandidate({
            id: 'multi.type.resource',
            json: { type: 'json-updated', content: 'Updated JSON content', version: 2 },
            conditions: { language: 'en' },
            resourceTypeName: 'json'
          })
          .orThrow();

        // Add a completely new resource with different ID
        deltaManager
          .addLooseCandidate({
            id: 'delta.unique',
            json: { unique: true, deltaOnly: 'yes' },
            conditions: { language: 'en' },
            resourceTypeName: 'json'
          })
          .orThrow();

        const deltaResolver = TsRes.Runtime.ResourceResolver.create({
          resourceManager: deltaManager,
          qualifierTypes,
          contextQualifierProvider: contextProvider
        }).orThrow();

        const typeTestGenerator = DeltaGenerator.create({
          baselineResolver,
          deltaResolver,
          resourceManager: baselineManager,
          logger: mockLogger
        }).orThrow();

        expect(typeTestGenerator.generate()).toSucceedAndSatisfy((resultManager) => {
          // Should handle the same-ID resource as an update
          expect(resultManager.getBuiltResource('multi.type.resource')).toSucceedAndSatisfy(
            (multiTypeResource) => {
              expect(multiTypeResource.id).toBe('multi.type.resource');
              const augmentCandidate = multiTypeResource.candidates.find((c) => c.mergeMethod === 'augment');
              expect(augmentCandidate).toBeDefined();
            }
          );

          // Should handle the delta-unique resource as NEW
          expect(resultManager.getBuiltResource('delta.unique')).toSucceedAndSatisfy((uniqueResource) => {
            expect(uniqueResource.id).toBe('delta.unique');
            const replaceCandidate = uniqueResource.candidates.find((c) => c.mergeMethod === 'replace');
            expect(replaceCandidate).toBeDefined();
          });
        });
      });

      test('should handle empty resource ID lists and fall back to discovery', () => {
        // Edge case: empty resource ID array should trigger discovery mode

        const fallbackBaselineManager = TsRes.Resources.ResourceManagerBuilder.create({
          qualifiers,
          resourceTypes
        }).orThrow();

        fallbackBaselineManager
          .addLooseCandidate({
            id: 'baseline.resource',
            json: { source: 'baseline' },
            conditions: { language: 'en' },
            resourceTypeName: 'json'
          })
          .orThrow();

        const fallbackBaselineResolver = TsRes.Runtime.ResourceResolver.create({
          resourceManager: fallbackBaselineManager,
          qualifierTypes,
          contextQualifierProvider: contextProvider
        }).orThrow();

        const fallbackDeltaManager = TsRes.Resources.ResourceManagerBuilder.create({
          qualifiers,
          resourceTypes
        }).orThrow();

        fallbackDeltaManager
          .addLooseCandidate({
            id: 'delta.resource', // Different resource in delta
            json: { source: 'delta', new: true },
            conditions: { language: 'en' },
            resourceTypeName: 'json'
          })
          .orThrow();

        const fallbackDeltaResolver = TsRes.Runtime.ResourceResolver.create({
          resourceManager: fallbackDeltaManager,
          qualifierTypes,
          contextQualifierProvider: contextProvider
        }).orThrow();

        const fallbackGenerator = DeltaGenerator.create({
          baselineResolver: fallbackBaselineResolver,
          deltaResolver: fallbackDeltaResolver,
          resourceManager: fallbackBaselineManager,
          logger: mockLogger
        }).orThrow();

        // Test with empty array - should fall back to discovery
        const emptyResourceIdOptions = {
          resourceIds: [] // Empty array
        };

        expect(fallbackGenerator.generate(emptyResourceIdOptions)).toSucceedAndSatisfy((resultManager) => {
          // Should discover and process the delta resource despite empty resourceIds
          expect(resultManager.getBuiltResource('delta.resource')).toSucceedAndSatisfy((deltaResource) => {
            expect(deltaResource.id).toBe('delta.resource');
            const replaceCandidate = deltaResource.candidates.find((c) => c.mergeMethod === 'replace');
            expect(replaceCandidate).toBeDefined();
          });

          // Should also process baseline resources
          expect(resultManager.getBuiltResource('baseline.resource')).toSucceedAndSatisfy(
            (baselineResource) => {
              expect(baselineResource.id).toBe('baseline.resource');
            }
          );

          // Should log that it fell back to discovery mode
          expect(mockLogger.info).toHaveBeenCalledWith('Discovering resources from delta resolver');
        });
      });

      test('should handle very large sets of delta-only resources efficiently', () => {
        // Edge case: performance with many delta-only resources

        const largeBaselineManager = TsRes.Resources.ResourceManagerBuilder.create({
          qualifiers,
          resourceTypes
        }).orThrow();

        // Baseline has just one resource
        largeBaselineManager
          .addLooseCandidate({
            id: 'baseline.single',
            json: { type: 'baseline' },
            conditions: { language: 'en' },
            resourceTypeName: 'json'
          })
          .orThrow();

        const largeBaselineResolver = TsRes.Runtime.ResourceResolver.create({
          resourceManager: largeBaselineManager,
          qualifierTypes,
          contextQualifierProvider: contextProvider
        }).orThrow();

        const largeDeltaManager = TsRes.Resources.ResourceManagerBuilder.create({
          qualifiers,
          resourceTypes
        }).orThrow();

        // Delta has many new resources (delta-only)
        const manyDeltaResources: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[] = [];
        for (let i = 0; i < 50; i++) {
          // 50 delta-only resources
          manyDeltaResources.push({
            id: `delta.bulk.resource.${i}`,
            json: {
              index: i,
              data: `Delta resource ${i}`,
              metadata: { created: 'bulk-test', batch: Math.floor(i / 10) }
            },
            conditions: { language: 'en' },
            resourceTypeName: 'json'
          });
        }

        manyDeltaResources.forEach((resource) => {
          largeDeltaManager.addLooseCandidate(resource).orThrow();
        });

        const largeDeltaResolver = TsRes.Runtime.ResourceResolver.create({
          resourceManager: largeDeltaManager,
          qualifierTypes,
          contextQualifierProvider: contextProvider
        }).orThrow();

        const largeSetGenerator = DeltaGenerator.create({
          baselineResolver: largeBaselineResolver,
          deltaResolver: largeDeltaResolver,
          resourceManager: largeBaselineManager,
          logger: mockLogger
        }).orThrow();

        const startTime = Date.now();

        expect(largeSetGenerator.generate()).toSucceedAndSatisfy((resultManager) => {
          const endTime = Date.now();
          const duration = endTime - startTime;

          // Should complete in reasonable time (less than 2 seconds for 50 resources)
          expect(duration).toBeLessThan(2000);

          // Should discover and process all 50 delta-only resources
          for (let i = 0; i < 50; i++) {
            expect(resultManager.getBuiltResource(`delta.bulk.resource.${i}`)).toSucceedAndSatisfy(
              (bulkResource) => {
                expect(bulkResource.id).toBe(`delta.bulk.resource.${i}`);
                const replaceCandidate = bulkResource.candidates.find((c) => c.mergeMethod === 'replace');
                expect(replaceCandidate).toBeDefined();
              }
            );
          }

          // Should also process the baseline resource
          expect(resultManager.getBuiltResource('baseline.single')).toSucceedAndSatisfy(
            (baselineResource) => {
              expect(baselineResource.id).toBe('baseline.single');
            }
          );

          // Should log discovery of many resources
          expect(mockLogger.info).toHaveBeenCalledWith(
            expect.stringMatching(/Discovered \d+ resources in delta resolver/)
          );

          // Should show processing statistics
          expect(mockLogger.info).toHaveBeenCalledWith(expect.stringMatching(/Processed \d+ resources:/));
        });
      });

      test('should handle resources with complex nested conditional logic', () => {
        // Edge case: resources with deeply nested conditions and complex structures

        const complexBaselineManager = TsRes.Resources.ResourceManagerBuilder.create({
          qualifiers,
          resourceTypes
        }).orThrow();

        const complexBaselineResolver = TsRes.Runtime.ResourceResolver.create({
          resourceManager: complexBaselineManager,
          qualifierTypes,
          contextQualifierProvider: contextProvider
        }).orThrow();

        const complexDeltaManager = TsRes.Resources.ResourceManagerBuilder.create({
          qualifiers,
          resourceTypes
        }).orThrow();

        // Delta-only resources with complex nested structures
        const complexDeltaResources: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[] = [
          {
            id: 'complex.nested.config',
            json: {
              application: {
                ui: {
                  theme: {
                    primary: '#007bff',
                    secondary: '#6c757d',
                    variants: {
                      light: { background: '#ffffff', text: '#000000' },
                      dark: { background: '#000000', text: '#ffffff' }
                    }
                  },
                  layout: {
                    header: { height: '60px', sticky: true },
                    sidebar: { width: '250px', collapsible: true },
                    content: { padding: '20px', maxWidth: '1200px' }
                  }
                },
                features: {
                  authentication: { enabled: true, provider: 'oauth2' },
                  analytics: { enabled: false, trackingId: null },
                  notifications: {
                    enabled: true,
                    channels: ['email', 'push', 'sms'],
                    templates: {
                      welcome: { subject: 'Welcome!', body: 'Thanks for joining.' },
                      reminder: { subject: 'Reminder', body: "Don't forget..." }
                    }
                  }
                }
              }
            },
            conditions: { language: 'en', territory: 'US' },
            resourceTypeName: 'json'
          },
          {
            id: 'complex.multilevel.array',
            json: {
              categories: [
                {
                  id: 1,
                  name: 'Electronics',
                  subcategories: [
                    { id: 11, name: 'Computers', items: ['laptop', 'desktop', 'tablet'] },
                    { id: 12, name: 'Phones', items: ['smartphone', 'landline'] }
                  ]
                },
                {
                  id: 2,
                  name: 'Books',
                  subcategories: [
                    { id: 21, name: 'Fiction', items: ['novel', 'short-story'] },
                    { id: 22, name: 'Non-fiction', items: ['biography', 'history'] }
                  ]
                }
              ],
              metadata: {
                version: '2.0',
                lastUpdated: '2024-01-01T00:00:00Z',
                tags: ['ecommerce', 'catalog', 'hierarchy']
              }
            },
            conditions: { language: 'en' },
            resourceTypeName: 'json'
          }
        ];

        complexDeltaResources.forEach((resource) => {
          complexDeltaManager.addLooseCandidate(resource).orThrow();
        });

        const complexDeltaResolver = TsRes.Runtime.ResourceResolver.create({
          resourceManager: complexDeltaManager,
          qualifierTypes,
          contextQualifierProvider: contextProvider
        }).orThrow();

        const complexGenerator = DeltaGenerator.create({
          baselineResolver: complexBaselineResolver, // Empty baseline
          deltaResolver: complexDeltaResolver,
          resourceManager: complexBaselineManager,
          logger: mockLogger
        }).orThrow();

        expect(complexGenerator.generate()).toSucceedAndSatisfy((resultManager) => {
          // Should handle complex nested config resource
          expect(resultManager.getBuiltResource('complex.nested.config')).toSucceedAndSatisfy(
            (configResource) => {
              expect(configResource.id).toBe('complex.nested.config');

              const replaceCandidate = configResource.candidates.find((c) => c.mergeMethod === 'replace');
              expect(replaceCandidate).toBeDefined();

              // Should preserve the full complex structure
              expect(replaceCandidate?.json).toEqual(
                expect.objectContaining({
                  application: expect.objectContaining({
                    ui: expect.objectContaining({
                      theme: expect.objectContaining({
                        primary: '#007bff',
                        variants: expect.objectContaining({
                          light: expect.objectContaining({ background: '#ffffff' }),
                          dark: expect.objectContaining({ background: '#000000' })
                        })
                      })
                    }),
                    features: expect.objectContaining({
                      notifications: expect.objectContaining({
                        templates: expect.objectContaining({
                          welcome: expect.objectContaining({ subject: 'Welcome!' })
                        })
                      })
                    })
                  })
                })
              );

              // Should preserve complex conditions
              expect(replaceCandidate?.conditions).toEqual(
                expect.objectContaining({
                  language: 'en',
                  territory: 'US'
                })
              );
            }
          );

          // Should handle complex array resource
          expect(resultManager.getBuiltResource('complex.multilevel.array')).toSucceedAndSatisfy(
            (arrayResource) => {
              expect(arrayResource.id).toBe('complex.multilevel.array');

              const replaceCandidate = arrayResource.candidates.find((c) => c.mergeMethod === 'replace');
              expect(replaceCandidate).toBeDefined();

              // Should preserve complex array structure
              expect(replaceCandidate?.json).toEqual(
                expect.objectContaining({
                  categories: expect.arrayContaining([
                    expect.objectContaining({
                      name: 'Electronics',
                      subcategories: expect.arrayContaining([
                        expect.objectContaining({
                          name: 'Computers',
                          items: expect.arrayContaining(['laptop', 'desktop', 'tablet'])
                        })
                      ])
                    })
                  ]),
                  metadata: expect.objectContaining({
                    tags: expect.arrayContaining(['ecommerce', 'catalog', 'hierarchy'])
                  })
                })
              );
            }
          );

          // Should discover both complex resources
          expect(mockLogger.info).toHaveBeenCalledWith(
            expect.stringMatching(/Discovered 2 resources in delta resolver/)
          );
        });
      });
    });
  });

  // TODO: Delete merge type tests - these are placeholders for future functionality
  // Delete merge type is not yet implemented in ts-res, so these tests are expected to fail
  describe('Delete merge type placeholder tests (expected to fail)', () => {
    test.failing('should use delete merge type for deleted resources when implemented', () => {
      // This test is a placeholder for when delete merge type is implemented
      // Currently, deletions are handled using 'augment' with null values

      const deletedResourceData: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[] = [
        {
          id: 'greeting.hello',
          json: { message: 'Hello' },
          conditions: { language: 'en' },
          resourceTypeName: 'json'
        }
      ];

      // Create manager with a resource that will be "deleted" in delta context
      const managerWithResourceResult = resourceManager.clone({ candidates: deletedResourceData });
      expect(managerWithResourceResult).toSucceed();

      const managerWithResource = managerWithResourceResult.orThrow();

      // Create baseline resolver (has the resource)
      const baselineResolverResult = TsRes.Runtime.ResourceResolver.create({
        resourceManager: managerWithResource,
        qualifierTypes,
        contextQualifierProvider: contextProvider
      });
      expect(baselineResolverResult).toSucceed();

      const baselineResolver = baselineResolverResult.orThrow();

      // Create delta resolver (resource should be "deleted" - not resolvable)
      // In the future, this should create a candidate with mergeMethod: 'delete'
      const deltaResolver = baselineResolver; // Placeholder - would be different in real scenario

      const generatorResult = DeltaGenerator.create({
        resourceManager: managerWithResource,
        baselineResolver,
        deltaResolver,
        logger: mockLogger
      });
      expect(generatorResult).toSucceed();

      const generator = generatorResult.orThrow();
      const deltaResult = generator.generate();
      expect(deltaResult).toSucceed();

      const deltaManager = deltaResult.orThrow();

      // In the future, this should verify that a candidate was created with mergeMethod: 'delete'
      // For now, this test will fail because delete merge type is not implemented
      const resource = deltaManager.getBuiltResource('greeting.hello');
      expect(resource).toSucceedAndSatisfy((builtResource) => {
        // This would check for a candidate with mergeMethod: 'delete' when implemented
        const deleteCandidates = builtResource.candidates.filter(
          (c) => c.mergeMethod === ('delete' as any) // Cast needed since 'delete' is not a valid merge method yet
        );
        expect(deleteCandidates).toHaveLength(1); // This will fail - delete merge type not implemented
      });
    });

    test.failing('should properly handle resource deletion with delete merge type', () => {
      // Another placeholder test for delete merge type functionality

      // Create a scenario where a resource exists in baseline but should be deleted in delta
      const resourceData: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[] = [
        {
          id: 'temp.resource',
          json: { value: 'temporary' },
          conditions: { language: 'en' },
          resourceTypeName: 'json'
        }
      ];

      const managerWithTempResource = resourceManager.clone({ candidates: resourceData }).orThrow();

      const baselineResolver = TsRes.Runtime.ResourceResolver.create({
        resourceManager: managerWithTempResource,
        qualifierTypes,
        contextQualifierProvider: contextProvider
      }).orThrow();

      // In a real deletion scenario, delta resolver would not have this resource
      // or would have explicit deletion instructions
      const deltaResolver = TsRes.Runtime.ResourceResolver.create({
        resourceManager: resourceManager, // No temp.resource here
        qualifierTypes,
        contextQualifierProvider: contextProvider
      }).orThrow();

      const generator = DeltaGenerator.create({
        resourceManager: managerWithTempResource,
        baselineResolver,
        deltaResolver,
        logger: mockLogger
      }).orThrow();

      const deltaManager = generator.generate().orThrow();

      // When delete merge type is implemented, we should be able to verify
      // that the generated manager contains proper deletion candidates
      const deletedResource = deltaManager.getBuiltResource('temp.resource');
      expect(deletedResource).toSucceedAndSatisfy((resource) => {
        // This check will fail until delete merge type is implemented
        const hasDeleteCandidate = resource.candidates.some((c) => (c as any).mergeMethod === 'delete');
        expect(hasDeleteCandidate).toBe(true); // Will fail - not implemented yet
      });
    });

    test.failing('should generate proper conditions for delete candidates', () => {
      // Placeholder test for verifying that delete candidates get proper conditions
      // derived from the delta resolver context

      const baselineData: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[] = [
        {
          id: 'conditional.resource',
          json: { message: 'Exists in baseline' },
          conditions: { language: 'en', territory: 'US' },
          resourceTypeName: 'json'
        }
      ];

      const baselineManager = resourceManager.clone({ candidates: baselineData }).orThrow();
      const baselineResolver = TsRes.Runtime.ResourceResolver.create({
        resourceManager: baselineManager,
        qualifierTypes,
        contextQualifierProvider: contextProvider
      }).orThrow();

      // Delta context where this resource should be deleted
      const deltaResolver = TsRes.Runtime.ResourceResolver.create({
        resourceManager: resourceManager, // Resource not present
        qualifierTypes,
        contextQualifierProvider: contextProvider
      }).orThrow();

      const generator = DeltaGenerator.create({
        resourceManager: baselineManager,
        baselineResolver,
        deltaResolver,
        logger: mockLogger
      }).orThrow();

      const deltaManager = generator.generate().orThrow();

      // When implemented, delete candidates should have conditions matching delta context
      const resource = deltaManager.getBuiltResource('conditional.resource');
      expect(resource).toSucceedAndSatisfy((builtResource) => {
        const deleteCandidate = builtResource.candidates.find((c) => (c as any).mergeMethod === 'delete');
        expect(deleteCandidate).toBeDefined(); // Will fail - delete not implemented

        // When implemented, should verify conditions are extracted from delta context
        if (deleteCandidate) {
          expect(deleteCandidate.conditions).toBeDefined();
          // Would check specific condition values extracted from delta resolver context
        }
      });
    });
  });
});
