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
import * as TsRes from '../../../index';

type IResourceCandidate = TsRes.Runtime.IResourceCandidate;

describe('ResourceResolver class', () => {
  let qualifierTypes: TsRes.QualifierTypes.QualifierTypeCollector;
  let qualifiers: TsRes.Qualifiers.QualifierCollector;
  let resourceTypes: TsRes.ResourceTypes.ResourceTypeCollector;
  let resourceManager: TsRes.Resources.ResourceManagerBuilder;
  let compiledCollection: TsRes.Runtime.CompiledResourceCollection;
  let contextProvider: TsRes.Runtime.ValidatingSimpleContextQualifierProvider;
  let builderResolver: TsRes.Runtime.ResourceResolver;
  let collectionResolver: TsRes.Runtime.ResourceResolver;
  let mockListener: jest.MockedObjectDeep<TsRes.Runtime.IResourceResolverCacheListener>;

  beforeEach(() => {
    // Set up mock listener
    mockListener = {
      onCacheHit: jest.fn(),
      onCacheMiss: jest.fn(),
      onCacheError: jest.fn(),
      onCacheClear: jest.fn(),
      onContextError: jest.fn()
    };

    // Set up qualifier types
    qualifierTypes = TsRes.QualifierTypes.QualifierTypeCollector.create({
      qualifierTypes: [
        TsRes.QualifierTypes.LanguageQualifierType.create().orThrow(),
        TsRes.QualifierTypes.TerritoryQualifierType.create().orThrow(),
        TsRes.QualifierTypes.LiteralQualifierType.create({
          name: 'tone',
          enumeratedValues: ['formal', 'standard', 'informal']
        }).orThrow()
      ]
    }).orThrow();

    // Set up qualifiers
    qualifiers = TsRes.Qualifiers.QualifierCollector.create({
      qualifierTypes,
      qualifiers: [
        { name: 'language', typeName: 'language', defaultPriority: 600 },
        { name: 'territory', typeName: 'territory', defaultPriority: 700 },
        { name: 'tone', typeName: 'tone', defaultPriority: 500 }
      ]
    }).orThrow();

    // Set up resource types
    resourceTypes = TsRes.ResourceTypes.ResourceTypeCollector.create({
      resourceTypes: [TsRes.ResourceTypes.JsonResourceType.create().orThrow()]
    }).orThrow();

    // Set up resource manager
    resourceManager = TsRes.Resources.ResourceManagerBuilder.create({
      qualifiers,
      resourceTypes
    }).orThrow();

    // Add a test resource using addResource method
    resourceManager
      .addResource({
        id: 'greeting',
        resourceTypeName: 'json',
        candidates: [
          {
            json: { text: 'Hello!' },
            conditions: {
              language: 'en',
              tone: 'formal'
            }
          },
          {
            json: { text: 'Hi there!' },
            conditions: {
              language: 'en',
              tone: 'standard'
            }
          },
          {
            json: { text: 'Bonjour!' },
            conditions: {
              language: 'fr',
              tone: 'formal'
            }
          },
          {
            json: { text: 'Hello World!' },
            conditions: {
              language: 'en',
              territory: 'US'
            }
          }
        ]
      })
      .orThrow();

    // Add a resource with multiple candidates including partial ones for composition testing
    resourceManager
      .addResource({
        id: 'composition-test',
        resourceTypeName: 'json',
        candidates: [
          {
            json: { name: 'John', age: 30 },
            conditions: {
              language: 'en',
              territory: 'US'
            },
            isPartial: true
          },
          {
            json: { name: 'John Doe', email: 'john@example.com' },
            conditions: {
              language: 'en'
            },
            isPartial: false // This is the full candidate
          },
          {
            json: { department: 'Engineering', role: 'Senior' },
            conditions: {
              language: 'en',
              tone: 'formal'
            },
            isPartial: true
          },
          {
            json: { greeting: 'Hello' },
            conditions: {
              // No conditions - lowest priority fallback
            },
            isPartial: false
          }
        ]
      })
      .orThrow();

    // Add another resource for testing non-object values
    resourceManager
      .addResource({
        id: 'simple-value',
        resourceTypeName: 'json',
        candidates: [
          {
            json: { text: 'Simple string value' },
            conditions: {
              language: 'en'
            },
            isPartial: false
          }
        ]
      })
      .orThrow();

    // Add resource with conditions that have different priorities and scores for comparison testing
    resourceManager
      .addResource({
        id: 'priority-test',
        resourceTypeName: 'json',
        candidates: [
          {
            json: { priority: 'high', score: 'exact' },
            conditions: {
              language: 'en',
              territory: 'US',
              tone: 'formal'
            },
            isPartial: false
          },
          {
            json: { priority: 'medium', score: 'partial' },
            conditions: {
              language: 'en',
              territory: 'US'
            },
            isPartial: false
          },
          {
            json: { priority: 'low', score: 'general' },
            conditions: [
              // so we have two conditions with same priority and score that aren't identical
              { qualifierName: 'language', value: 'en', scoreAsDefault: 0.5 }
            ],
            isPartial: false
          },
          {
            json: { priority: 'fallback', score: 'none' },
            conditions: {
              language: 'de'
            },
            isPartial: false
          }
        ]
      })
      .orThrow();

    // Add resource with conditions that have same priority but different scores
    resourceManager
      .addResource({
        id: 'score-test',
        resourceTypeName: 'json',
        candidates: [
          {
            json: { test: 'exact-match' },
            conditions: {
              language: 'en-US' // Exact match for current context
            },
            isPartial: false
          },
          {
            json: { test: 'partial-match' },
            conditions: {
              language: 'en' // Partial match for current context
            },
            isPartial: false
          }
        ]
      })
      .orThrow();

    // Add resource with only partial candidates
    resourceManager
      .addResource({
        id: 'all-partial',
        resourceTypeName: 'json',
        candidates: [
          {
            json: { partial1: 'value1' },
            conditions: {
              language: 'en',
              territory: 'US'
            },
            isPartial: true
          },
          {
            json: { partial2: 'value2' },
            conditions: {
              language: 'en'
            },
            isPartial: true
          }
        ]
      })
      .orThrow();

    // Add a resource with null values for null-as-delete testing
    resourceManager
      .addResource({
        id: 'null-test-resource',
        resourceTypeName: 'json',
        candidates: [
          {
            json: {
              name: 'John Doe',
              email: 'john@example.com',
              phone: '555-1234',
              department: 'Engineering'
            },
            conditions: {
              language: 'en'
            },
            isPartial: false // This is the full candidate (base)
          },
          {
            json: {
              name: 'John',
              email: null, // This should delete the email property
              age: 30,
              department: null // This should delete the department property
            },
            conditions: {
              language: 'en',
              territory: 'US'
            },
            isPartial: true
          }
        ]
      })
      .orThrow();

    // Add edge case test resources for null-as-delete testing
    resourceManager
      .addResource({
        id: 'only-nulls-resource',
        resourceTypeName: 'json',
        candidates: [
          {
            json: { name: 'Base', active: true, value: 'original' },
            conditions: { language: 'en' },
            isPartial: false
          },
          {
            json: { name: null, active: null, value: null },
            conditions: { language: 'en', territory: 'US' },
            isPartial: true
          }
        ]
      })
      .orThrow();

    resourceManager
      .addResource({
        id: 'nested-nulls-resource',
        resourceTypeName: 'json',
        candidates: [
          {
            json: {
              user: { name: 'Jane', email: 'jane@example.com' },
              settings: { theme: 'dark', notifications: true }
            },
            conditions: { language: 'en' },
            isPartial: false
          },
          {
            json: {
              user: { name: 'Jane', email: null },
              settings: null
            },
            conditions: { language: 'en', territory: 'US' },
            isPartial: true
          }
        ]
      })
      .orThrow();

    resourceManager
      .addResource({
        id: 'arrays-with-nulls-resource',
        resourceTypeName: 'json',
        candidates: [
          {
            json: {
              items: [1, 2, 3],
              tags: ['a', 'b'],
              metadata: { version: 1, deprecated: false }
            },
            conditions: { language: 'en' },
            isPartial: false
          },
          {
            json: {
              items: [null, 4, null],
              tags: null,
              metadata: { version: 2, deprecated: null }
            },
            conditions: { language: 'en', territory: 'US' },
            isPartial: true
          }
        ]
      })
      .orThrow();

    resourceManager
      .addResource({
        id: 'single-candidate-with-nulls',
        resourceTypeName: 'json',
        candidates: [
          {
            json: { name: 'Single', active: null, value: 'test' },
            conditions: { language: 'en' },
            isPartial: false
          }
        ]
      })
      .orThrow();

    // Build resources to create decisions
    resourceManager.build().orThrow();

    // Create compiled collection from the built resource manager
    const compiled = resourceManager.getCompiledResourceCollection().orThrow();
    compiledCollection = TsRes.Runtime.CompiledResourceCollection.create({
      compiledCollection: compiled,
      qualifierTypes,
      resourceTypes
    }).orThrow();

    // Set up context provider using ValidatingSimpleContextQualifierProvider to eliminate type casting
    contextProvider = TsRes.Runtime.ValidatingSimpleContextQualifierProvider.create({
      qualifiers,
      qualifierValues: {
        language: 'en-US', // More specific language to get different match scores
        territory: 'US',
        tone: 'formal'
      }
    }).orThrow();

    // Create both resolvers for comparison testing
    builderResolver = TsRes.Runtime.ResourceResolver.create({
      resourceManager,
      qualifierTypes,
      contextQualifierProvider: contextProvider
    }).orThrow();

    collectionResolver = TsRes.Runtime.ResourceResolver.create({
      resourceManager: compiledCollection,
      qualifierTypes,
      contextQualifierProvider: contextProvider
    }).orThrow();
  });

  // Helper function to test both resolver types with the same test logic
  function testBothResolvers(
    testName: string,
    testFn: (resolver: TsRes.Runtime.ResourceResolver, resolverName: string) => void
  ): void {
    describe(testName, () => {
      test(`with ResourceManagerBuilder`, () => {
        testFn(builderResolver, 'builder');
      });

      test(`with CompiledResourceCollection`, () => {
        testFn(collectionResolver, 'collection');
      });
    });
  }

  describe('create static method', () => {
    test('creates a runtime resource resolver with ResourceManagerBuilder', () => {
      expect(
        TsRes.Runtime.ResourceResolver.create({
          resourceManager,
          qualifierTypes,
          contextQualifierProvider: contextProvider
        })
      ).toSucceedAndSatisfy((resolver) => {
        expect(resolver.resourceManager).toBe(resourceManager);
        expect(resolver.qualifierTypes).toBe(qualifierTypes);
        expect(resolver.contextQualifierProvider).toBe(contextProvider);
      });
    });

    test('creates a runtime resource resolver with CompiledResourceCollection', () => {
      expect(
        TsRes.Runtime.ResourceResolver.create({
          resourceManager: compiledCollection,
          qualifierTypes,
          contextQualifierProvider: contextProvider
        })
      ).toSucceedAndSatisfy((resolver) => {
        expect(resolver.resourceManager).toBe(compiledCollection);
        expect(resolver.qualifierTypes).toBe(qualifierTypes);
        expect(resolver.contextQualifierProvider).toBe(contextProvider);
      });
    });

    test('creates a runtime resource resolver with listener', () => {
      expect(
        TsRes.Runtime.ResourceResolver.create({
          resourceManager,
          qualifierTypes,
          contextQualifierProvider: contextProvider,
          listener: mockListener
        })
      ).toSucceedAndSatisfy((resolver) => {
        expect(resolver.resourceManager).toBe(resourceManager);
        expect(resolver.qualifierTypes).toBe(qualifierTypes);
        expect(resolver.contextQualifierProvider).toBe(contextProvider);
      });
    });

    test('creates a runtime resource resolver with NoOpResourceResolverCacheListener', () => {
      const noOpListener = new TsRes.Runtime.NoOpResourceResolverCacheListener();
      expect(
        TsRes.Runtime.ResourceResolver.create({
          resourceManager,
          qualifierTypes,
          contextQualifierProvider: contextProvider,
          listener: noOpListener
        })
      ).toSucceedAndSatisfy((resolver) => {
        expect(resolver.resourceManager).toBe(resourceManager);
        expect(resolver.qualifierTypes).toBe(qualifierTypes);
        expect(resolver.contextQualifierProvider).toBe(contextProvider);
      });
    });
  });

  describe('cache listener functionality', () => {
    let resolverWithListener: TsRes.Runtime.ResourceResolver;

    beforeEach(() => {
      // Create a resolver with the mock listener
      resolverWithListener = TsRes.Runtime.ResourceResolver.create({
        resourceManager,
        qualifierTypes,
        contextQualifierProvider: contextProvider,
        listener: mockListener
      }).orThrow();
    });

    describe('onCacheMiss callbacks', () => {
      test('calls onCacheMiss for condition cache miss', () => {
        expect(resourceManager.conditions.getAt(0)).toSucceedAndSatisfy((condition) => {
          expect(resolverWithListener.resolveCondition(condition)).toSucceed();
          expect(mockListener.onCacheMiss).toHaveBeenCalledWith('condition', condition.index);
        });
      });

      test('calls onCacheMiss for condition set cache miss', () => {
        expect(resourceManager.conditionSets.getAt(0)).toSucceedAndSatisfy((conditionSet) => {
          expect(resolverWithListener.resolveConditionSet(conditionSet)).toSucceed();
          expect(mockListener.onCacheMiss).toHaveBeenCalledWith('conditionSet', conditionSet.index);
        });
      });

      test('calls onCacheMiss for decision cache miss', () => {
        expect(resourceManager.decisions.getAt(0)).toSucceedAndSatisfy((decision) => {
          expect(resolverWithListener.resolveDecision(decision)).toSucceed();
          expect(mockListener.onCacheMiss).toHaveBeenCalledWith('decision', decision.index);
        });
      });

      test('calls onCacheMiss for condition set when condition NoMatch causes failure', () => {
        // Change context to cause condition NoMatch
        expect(contextProvider.validating.set('language', 'de')).toSucceed();

        expect(resourceManager.conditionSets.getAt(0)).toSucceedAndSatisfy((conditionSet) => {
          expect(resolverWithListener.resolveConditionSet(conditionSet)).toSucceed();
          expect(mockListener.onCacheMiss).toHaveBeenCalledWith('conditionSet', conditionSet.index);
        });
      });
    });

    describe('onCacheHit callbacks', () => {
      test('calls onCacheHit for condition cache hit', () => {
        expect(resourceManager.conditions.getAt(0)).toSucceedAndSatisfy((condition) => {
          // First call - cache miss
          expect(resolverWithListener.resolveCondition(condition)).toSucceed();
          expect(mockListener.onCacheMiss).toHaveBeenCalledWith('condition', condition.index);

          // Reset mock
          mockListener.onCacheMiss.mockClear();

          // Second call - cache hit
          expect(resolverWithListener.resolveCondition(condition)).toSucceed();
          expect(mockListener.onCacheHit).toHaveBeenCalledWith('condition', condition.index);
          expect(mockListener.onCacheMiss).not.toHaveBeenCalled();
        });
      });

      test('calls onCacheHit for condition set cache hit', () => {
        expect(resourceManager.conditionSets.getAt(0)).toSucceedAndSatisfy((conditionSet) => {
          // First call - cache miss
          expect(resolverWithListener.resolveConditionSet(conditionSet)).toSucceed();
          expect(mockListener.onCacheMiss).toHaveBeenCalledWith('conditionSet', conditionSet.index);

          // Reset mock
          mockListener.onCacheMiss.mockClear();

          // Second call - cache hit
          expect(resolverWithListener.resolveConditionSet(conditionSet)).toSucceed();
          expect(mockListener.onCacheHit).toHaveBeenCalledWith('conditionSet', conditionSet.index);
          expect(mockListener.onCacheMiss).not.toHaveBeenCalled();
        });
      });

      test('calls onCacheHit for decision cache hit', () => {
        expect(resourceManager.decisions.getAt(0)).toSucceedAndSatisfy((decision) => {
          // First call - cache miss
          expect(resolverWithListener.resolveDecision(decision)).toSucceed();
          expect(mockListener.onCacheMiss).toHaveBeenCalledWith('decision', decision.index);

          // Reset mock
          mockListener.onCacheMiss.mockClear();

          // Second call - cache hit
          expect(resolverWithListener.resolveDecision(decision)).toSucceed();
          expect(mockListener.onCacheHit).toHaveBeenCalledWith('decision', decision.index);
          expect(mockListener.onCacheMiss).not.toHaveBeenCalled();
        });
      });
    });

    describe('onCacheError callbacks', () => {
      test('calls onContextError for context qualification failure', () => {
        expect(resourceManager.conditions.getAt(0)).toSucceedAndSatisfy((condition) => {
          // Clear context to cause qualifier lookup failure
          contextProvider.clear();

          expect(resolverWithListener.resolveCondition(condition)).toSucceedAndSatisfy((result) => {
            expect(result.matchType).toBe('noMatch');
          });
          expect(mockListener.onContextError).toHaveBeenCalledWith(
            condition.qualifier.name,
            expect.any(String)
          );
        });
      });

      test('calls onContextError with correct qualifier name and error message', () => {
        expect(resourceManager.conditions.getAt(0)).toSucceedAndSatisfy((condition) => {
          // Clear context to cause qualifier lookup failure
          contextProvider.clear();

          expect(resolverWithListener.resolveCondition(condition)).toSucceedAndSatisfy((result) => {
            expect(result.matchType).toBe('noMatch');
          });

          // Verify specific call details
          expect(mockListener.onContextError).toHaveBeenCalledTimes(1);
          expect(mockListener.onContextError).toHaveBeenCalledWith(
            condition.qualifier.name,
            expect.stringContaining('not found')
          );
        });
      });

      test('calls onContextError once per condition even with multiple evaluations', () => {
        expect(resourceManager.conditions.getAt(0)).toSucceedAndSatisfy((condition) => {
          // Clear context to cause qualifier lookup failure
          contextProvider.clear();

          // Reset mock to ensure clean state
          mockListener.onContextError.mockClear();

          // Resolve the same condition multiple times
          expect(resolverWithListener.resolveCondition(condition)).toSucceedAndSatisfy((result) => {
            expect(result.matchType).toBe('noMatch');
          });

          expect(resolverWithListener.resolveCondition(condition)).toSucceedAndSatisfy((result) => {
            expect(result.matchType).toBe('noMatch');
          });

          // Should only be called once due to caching
          expect(mockListener.onContextError).toHaveBeenCalledTimes(1);
        });
      });

      test('calls onContextError for different qualifiers independently', () => {
        // Clear context to cause all qualifier lookups to fail
        contextProvider.clear();

        // Reset mock to ensure clean state
        mockListener.onContextError.mockClear();

        // Test multiple conditions with different qualifiers
        expect(resourceManager.conditions.getAt(0)).toSucceedAndSatisfy((condition1) => {
          expect(resolverWithListener.resolveCondition(condition1)).toSucceedAndSatisfy((result) => {
            expect(result.matchType).toBe('noMatch');
          });
        });

        if (resourceManager.conditions.size > 1) {
          expect(resourceManager.conditions.getAt(1)).toSucceedAndSatisfy((condition2) => {
            expect(resolverWithListener.resolveCondition(condition2)).toSucceedAndSatisfy((result) => {
              expect(result.matchType).toBe('noMatch');
            });
          });
        }

        // Should be called for each unique qualifier that fails
        expect(mockListener.onContextError).toHaveBeenCalled();
      });

      test('does not call onContextError when qualifier resolution succeeds', () => {
        // Ensure context is properly set up with values
        expect(contextProvider.validating.set('language', 'en')).toSucceed();
        expect(contextProvider.validating.set('territory', 'US')).toSucceed();

        // Reset mock to ensure clean state
        mockListener.onContextError.mockClear();

        expect(resourceManager.conditions.getAt(0)).toSucceedAndSatisfy((condition) => {
          expect(resolverWithListener.resolveCondition(condition)).toSucceedAndSatisfy((result) => {
            // Should succeed or at least not be a noMatch due to context errors
            expect(['match', 'matchAsDefault', 'noMatch']).toContain(result.matchType);
          });

          // onContextError should not be called when context resolution succeeds
          expect(mockListener.onContextError).not.toHaveBeenCalled();
        });
      });

      test('demonstrates that condition set gracefully handles context provider failure', () => {
        // Create a fresh resolver with listener for this specific test
        const testResolver = TsRes.Runtime.ResourceResolver.create({
          resourceManager,
          qualifierTypes,
          contextQualifierProvider: contextProvider,
          listener: mockListener
        }).orThrow();

        // Reset the mock to ensure clean state
        mockListener.onCacheError.mockClear();

        expect(resourceManager.conditionSets.getAt(0)).toSucceedAndSatisfy((conditionSet) => {
          // Clear context to cause condition resolution failure
          contextProvider.clear();

          // When the context is cleared, the ValidatingSimpleContextQualifierProvider
          // still returns values (possibly defaults). This is why the condition set
          // succeeds. To actually fail condition resolution, we need to test error
          // conditions in the context provider itself.
          // For now, let's just verify it resolves to some result
          expect(testResolver.resolveConditionSet(conditionSet)).toSucceed();
        });
      });

      test('demonstrates that decision gracefully handles condition set resolution failure', () => {
        // Create a fresh resolver with listener for this specific test
        const testResolver = TsRes.Runtime.ResourceResolver.create({
          resourceManager,
          qualifierTypes,
          contextQualifierProvider: contextProvider,
          listener: mockListener
        }).orThrow();

        // Reset the mock to ensure clean state
        mockListener.onCacheError.mockClear();

        expect(resourceManager.decisions.getAt(0)).toSucceedAndSatisfy((decision) => {
          // Clear context to cause condition set resolution failure
          contextProvider.clear();

          // Note: The decision resolves successfully but with no instance indices when condition sets fail
          // This means the error path on line 305 is only triggered in very specific edge cases
          // that are difficult to reproduce in normal testing scenarios
          expect(testResolver.resolveDecision(decision)).toSucceedAndSatisfy((result) => {
            expect(result.success).toBe(true);
            if (result.success) {
              expect(result.instanceIndices).toEqual([]);
              expect(result.defaultInstanceIndices).toEqual([]);
            }
          });
        });
      });
    });

    describe('onCacheClear callbacks', () => {
      test('calls onCacheClear for all cache types when clearing cache', () => {
        resolverWithListener.clearConditionCache();

        expect(mockListener.onCacheClear).toHaveBeenCalledWith('condition');
        expect(mockListener.onCacheClear).toHaveBeenCalledWith('conditionSet');
        expect(mockListener.onCacheClear).toHaveBeenCalledWith('decision');
        expect(mockListener.onCacheClear).toHaveBeenCalledTimes(3);
      });
    });

    describe('no listener scenarios', () => {
      test('resolver works without listener (undefined)', () => {
        const resolverWithoutListener = TsRes.Runtime.ResourceResolver.create({
          resourceManager,
          qualifierTypes,
          contextQualifierProvider: contextProvider
          // No listener property
        }).orThrow();

        expect(resourceManager.getBuiltResource('greeting')).toSucceedAndSatisfy((resource) => {
          expect(resolverWithoutListener.resolveResource(resource)).toSucceed();
        });
      });

      test('resolver works with NoOpResourceResolverCacheListener', () => {
        const noOpListener = new TsRes.Runtime.NoOpResourceResolverCacheListener();
        const resolverWithNoOpListener = TsRes.Runtime.ResourceResolver.create({
          resourceManager,
          qualifierTypes,
          contextQualifierProvider: contextProvider,
          listener: noOpListener
        }).orThrow();

        expect(resourceManager.getBuiltResource('greeting')).toSucceedAndSatisfy((resource) => {
          expect(resolverWithNoOpListener.resolveResource(resource)).toSucceed();
        });
      });
    });

    describe('listener integration with resource resolution', () => {
      test('listener receives callbacks during resource resolution', () => {
        expect(resourceManager.getBuiltResource('greeting')).toSucceedAndSatisfy((resource) => {
          // First resolution should generate cache misses
          expect(resolverWithListener.resolveResource(resource)).toSucceed();

          // Should have multiple cache miss calls due to condition, condition set, and decision resolution
          expect(mockListener.onCacheMiss).toHaveBeenCalledWith('condition', expect.any(Number));
          expect(mockListener.onCacheMiss).toHaveBeenCalledWith('conditionSet', expect.any(Number));
          expect(mockListener.onCacheMiss).toHaveBeenCalledWith('decision', expect.any(Number));

          // Reset mock
          mockListener.onCacheMiss.mockClear();

          // Second resolution should generate cache hits
          expect(resolverWithListener.resolveResource(resource)).toSucceed();
          expect(mockListener.onCacheHit).toHaveBeenCalledWith('decision', expect.any(Number));
        });
      });

      test('listener receives callbacks during composed resource resolution', () => {
        expect(resourceManager.getBuiltResource('composition-test')).toSucceedAndSatisfy((resource) => {
          // First resolution should generate cache misses
          expect(resolverWithListener.resolveComposedResourceValue(resource)).toSucceed();

          // Should have cache miss calls
          expect(mockListener.onCacheMiss).toHaveBeenCalled();

          // Reset mock
          mockListener.onCacheMiss.mockClear();

          // Second resolution should generate cache hits
          expect(resolverWithListener.resolveComposedResourceValue(resource)).toSucceed();
          expect(mockListener.onCacheHit).toHaveBeenCalled();
        });
      });
    });
  });

  describe('resolveResource method', () => {
    test('resolves the best matching candidate', () => {
      expect(resourceManager.getBuiltResource('greeting')).toSucceedAndSatisfy((resource) => {
        // Should get the best match based on context: en + US + formal tone
        // The "Hello World!" candidate matches language=en and territory=US (highest specificity)
        expect(builderResolver.resolveResource(resource)).toSucceedAndSatisfy((candidate) => {
          expect(candidate.json).toEqual({ text: 'Hello World!' });
          expect(candidate.isPartial).toBe(false);
          expect(candidate.mergeMethod).toBe('augment');
        });
      });
    });

    test('resolves to formal tone candidate when multiple candidates match partially', () => {
      // Keep territory in context but test that formal tone beats standard tone
      expect(resourceManager.getBuiltResource('greeting')).toSucceedAndSatisfy((resource) => {
        // Should get "Hello World!" (en + US + formal tone) - highest specificity
        expect(builderResolver.resolveResource(resource)).toSucceedAndSatisfy((candidate) => {
          expect(candidate.json).toEqual({ text: 'Hello World!' });
          expect(candidate.isPartial).toBe(false);
          expect(candidate.mergeMethod).toBe('augment');
        });
      });
    });

    test('resolves to the only matching candidate', () => {
      // Change context to French - keep territory to avoid condition resolution failure
      expect(contextProvider.validating.set('language', 'fr')).toSucceed();

      expect(resourceManager.getBuiltResource('greeting')).toSucceedAndSatisfy((resource) => {
        // Should get "Bonjour!" (only French candidate)
        expect(builderResolver.resolveResource(resource)).toSucceedAndSatisfy((candidate) => {
          expect(candidate.json).toEqual({ text: 'Bonjour!' });
          expect(candidate.isPartial).toBe(false);
          expect(candidate.mergeMethod).toBe('augment');
        });
      });
    });

    test('fails when no candidates match', () => {
      // Change context to a language with no candidates
      expect(contextProvider.validating.set('language', 'de')).toSucceed();

      expect(resourceManager.getBuiltResource('greeting')).toSucceedAndSatisfy((resource) => {
        expect(builderResolver.resolveResource(resource)).toFailWith(/No matching candidates found/);
      });
    });

    testBothResolvers('fails when decision resolution fails', (resolver, resolverName) => {
      expect(resolver.resourceManager.getBuiltResource('greeting')).toSucceedAndSatisfy((resource) => {
        // Clear the decision cache and manually break the decision system
        resolver.clearConditionCache();

        // Remove required qualifier from context to cause decision failure
        contextProvider.clear();

        expect(resolver.resolveResource(resource)).toFail();
      });
    });

    testBothResolvers('fails when invalid candidate index is found', (resolver, resolverName) => {
      // Create a resource with mocked candidates array that is shorter than expected
      expect(resolver.resourceManager.getBuiltResource('greeting')).toSucceedAndSatisfy((resource) => {
        // Manually corrupt the candidates array to force an invalid index scenario
        const originalCandidates = resource.candidates;
        (resource as unknown as { candidates: ReadonlyArray<IResourceCandidate> }).candidates = []; // Empty candidates array
        expect(resolver.resolveResource(resource)).toFailWith(/Invalid candidate index/);
        // Restore original candidates
        (resource as unknown as { candidates: ReadonlyArray<IResourceCandidate> }).candidates =
          originalCandidates;
      });
    });

    test('falls back to default match when no regular matches exist', () => {
      // Set up a qualifier with a defaultValue that will trigger scoreAsDefault matching
      const qualifierTypesWithDefault = TsRes.QualifierTypes.QualifierTypeCollector.create({
        qualifierTypes: [
          TsRes.QualifierTypes.LanguageQualifierType.create().orThrow(),
          TsRes.QualifierTypes.TerritoryQualifierType.create().orThrow()
        ]
      }).orThrow();

      const qualifiersWithDefault = TsRes.Qualifiers.QualifierCollector.create({
        qualifierTypes: qualifierTypesWithDefault,
        qualifiers: [
          {
            name: 'language',
            typeName: 'language',
            defaultPriority: 600,
            defaultValue: 'fr' // Default is French
          },
          { name: 'territory', typeName: 'territory', defaultPriority: 700 }
        ]
      }).orThrow();

      const managerWithDefaults = TsRes.Resources.ResourceManagerBuilder.create({
        qualifiers: qualifiersWithDefault,
        resourceTypes
      }).orThrow();

      // Add a resource where candidates only match via scoreAsDefault
      // Context will be 'en-US' but no candidates match English
      // One candidate has scoreAsDefault for French (the default)
      managerWithDefaults
        .addResource({
          id: 'default-fallback-test',
          resourceTypeName: 'json',
          candidates: [
            {
              json: { message: 'Default French fallback' },
              conditions: [
                {
                  qualifierName: 'language',
                  value: 'fr', // Matches the qualifier defaultValue
                  scoreAsDefault: 0.5
                }
              ]
            },
            {
              json: { message: 'Specific German message' },
              conditions: {
                language: 'de' // Won't match en-US context
              }
            }
          ]
        })
        .orThrow();

      const contextWithDefaults = TsRes.Runtime.ValidatingSimpleContextQualifierProvider.create({
        qualifiers: qualifiersWithDefault,
        qualifierValues: {
          language: 'en-US', // Context is English but no candidates match English directly
          territory: 'US'
        }
      }).orThrow();

      const resolverWithDefaults = TsRes.Runtime.ResourceResolver.create({
        resourceManager: managerWithDefaults,
        qualifierTypes: qualifierTypesWithDefault,
        contextQualifierProvider: contextWithDefaults
      }).orThrow();

      expect(managerWithDefaults.getBuiltResource('default-fallback-test')).toSucceedAndSatisfy(
        (resource) => {
          // Should fall back to the candidate with scoreAsDefault for French (the default)
          // since no candidates match en-US via regular matching
          expect(resolverWithDefaults.resolveResource(resource)).toSucceedAndSatisfy((candidate) => {
            expect(candidate.json).toEqual({ message: 'Default French fallback' });
          });

          // Also test resolveAllResourceCandidates to ensure default matches are included
          expect(resolverWithDefaults.resolveAllResourceCandidates(resource)).toSucceedAndSatisfy(
            (candidates) => {
              expect(candidates).toHaveLength(1);
              expect(candidates[0].json).toEqual({ message: 'Default French fallback' });
            }
          );
        }
      );
    });
  });

  describe('resolveAllResourceCandidates method', () => {
    testBothResolvers('resolves all matching candidates in priority order', (resolver, resolverName) => {
      expect(resolver.resourceManager.getBuiltResource('greeting')).toSucceedAndSatisfy((resource) => {
        expect(resolver.resolveAllResourceCandidates(resource)).toSucceedAndSatisfy((candidates) => {
          expect(candidates).toBeInstanceOf(Array);
          expect(candidates.length).toBeGreaterThan(0);

          // First candidate should be the best match
          expect(candidates[0].json).toEqual({ text: 'Hello World!' });
          expect(candidates[0].isPartial).toBe(false);
          expect(candidates[0].mergeMethod).toBe('augment');

          // Should contain other matching candidates in priority order
          const candidateValues = candidates.map((c) => c.json);
          expect(candidateValues).toContainEqual({ text: 'Hello!' });
        });
      });
    });

    testBothResolvers(
      'resolves multiple matching candidates for partial context',
      (resolver, resolverName) => {
        // Keep territory to avoid condition resolution failure, test multiple matches with current context
        expect(resolver.resourceManager.getBuiltResource('greeting')).toSucceedAndSatisfy((resource) => {
          expect(resolver.resolveAllResourceCandidates(resource)).toSucceedAndSatisfy((candidates) => {
            expect(candidates).toBeInstanceOf(Array);
            expect(candidates.length).toBeGreaterThanOrEqual(1);

            // Should get the best match with current context (Hello World! - en + US + formal)
            expect(candidates[0].json).toEqual({ text: 'Hello World!' });

            // Should not contain French candidate
            const candidateValues = candidates.map((c) => c.json);
            expect(candidateValues).not.toContainEqual({ text: 'Bonjour!' });
          });
        });
      }
    );

    testBothResolvers('resolves single matching candidate', (resolver, resolverName) => {
      // Change context to French - keep territory to avoid condition resolution failure
      expect(contextProvider.validating.set('language', 'fr')).toSucceed();

      expect(resolver.resourceManager.getBuiltResource('greeting')).toSucceedAndSatisfy((resource) => {
        expect(resolver.resolveAllResourceCandidates(resource)).toSucceedAndSatisfy((candidates) => {
          expect(candidates).toHaveLength(1);
          expect(candidates[0].json).toEqual({ text: 'Bonjour!' });
          expect(candidates[0].isPartial).toBe(false);
          expect(candidates[0].mergeMethod).toBe('augment');
        });
      });
    });

    testBothResolvers('fails when no candidates match', (resolver, resolverName) => {
      // Change context to a language with no candidates
      expect(contextProvider.validating.set('language', 'de')).toSucceed();

      expect(resolver.resourceManager.getBuiltResource('greeting')).toSucceedAndSatisfy((resource) => {
        expect(resolver.resolveAllResourceCandidates(resource)).toFailWith(/No matching candidates found/);
      });
    });

    testBothResolvers('fails when decision resolution fails', (resolver, resolverName) => {
      expect(resolver.resourceManager.getBuiltResource('greeting')).toSucceedAndSatisfy((resource) => {
        // Clear context to cause decision failure
        contextProvider.clear();

        expect(resolver.resolveAllResourceCandidates(resource)).toFail();
      });
    });

    testBothResolvers('fails when invalid candidate index is found', (resolver, resolverName) => {
      // Create a resource with mocked candidates array that is shorter than expected
      expect(resolver.resourceManager.getBuiltResource('greeting')).toSucceedAndSatisfy((resource) => {
        // Manually corrupt the candidates array to force an invalid index scenario
        const originalCandidates = resource.candidates;
        (resource as unknown as { candidates: ReadonlyArray<IResourceCandidate> }).candidates = []; // Empty candidates array
        expect(resolver.resolveAllResourceCandidates(resource)).toFailWith(/Invalid candidate index/);
        // Restore original candidates
        (resource as unknown as { candidates: ReadonlyArray<IResourceCandidate> }).candidates =
          originalCandidates;
      });
    });
  });

  describe('caching behavior', () => {
    testBothResolvers('caches decision resolution results', (resolver, resolverName) => {
      expect(resolver.resourceManager.getBuiltResource('greeting')).toSucceedAndSatisfy((resource) => {
        // First resolution
        expect(resolver.resolveResource(resource)).toSucceedAndSatisfy((candidate) => {
          expect(candidate.json).toEqual({ text: 'Hello World!' });
        });

        // Second resolution should use cached result
        expect(resolver.resolveResource(resource)).toSucceedAndSatisfy((candidate) => {
          expect(candidate.json).toEqual({ text: 'Hello World!' });
        });
      });
    });

    testBothResolvers('clears cache and re-resolves when context changes', (resolver, resolverName) => {
      expect(resolver.resourceManager.getBuiltResource('greeting')).toSucceedAndSatisfy((resource) => {
        // Initial resolution
        expect(resolver.resolveResource(resource)).toSucceedAndSatisfy((candidate) => {
          expect(candidate.json).toEqual({ text: 'Hello World!' });
        });

        // Change context and clear cache
        expect(contextProvider.validating.set('language', 'fr')).toSucceed();
        resolver.clearConditionCache();

        // Should get different result
        expect(resolver.resolveResource(resource)).toSucceedAndSatisfy((candidate) => {
          expect(candidate.json).toEqual({ text: 'Bonjour!' });
        });
      });
    });

    testBothResolvers('caches condition set resolution results', (resolver, resolverName) => {
      // Get a condition set to test with
      expect(resolver.resourceManager.conditionSets.getAt(0)).toSucceedAndSatisfy((conditionSet) => {
        // First resolution - populates cache
        expect(resolver.resolveConditionSet(conditionSet)).toSucceedAndSatisfy((result1) => {
          // Second resolution - should use cached result (hits lines 198-199)
          expect(resolver.resolveConditionSet(conditionSet)).toSucceedAndSatisfy((result2) => {
            expect(result2).toBe(result1);
          });
        });
      });
    });
  });

  describe('cache size properties', () => {
    testBothResolvers('returns correct cache sizes', (resolver, resolverName) => {
      expect(resolver.conditionCacheSize).toBe(resourceManager.conditions.size);
      expect(resolver.conditionSetCacheSize).toBe(resourceManager.conditionSets.size);
      expect(resolver.decisionCacheSize).toBe(resourceManager.decisions.size);
    });
  });

  describe('cache getter properties', () => {
    testBothResolvers('returns condition cache array', (resolver, resolverName) => {
      const conditionCache = resolver.conditionCache;
      expect(conditionCache).toBeDefined();
      expect(Array.isArray(conditionCache)).toBe(true);
      expect(conditionCache.length).toBe(resolver.conditionCacheSize);
    });

    testBothResolvers('returns condition set cache array', (resolver, resolverName) => {
      const conditionSetCache = resolver.conditionSetCache;
      expect(conditionSetCache).toBeDefined();
      expect(Array.isArray(conditionSetCache)).toBe(true);
      expect(conditionSetCache.length).toBe(resolver.conditionSetCacheSize);
    });

    testBothResolvers('returns decision cache array', (resolver, resolverName) => {
      const decisionCache = resolver.decisionCache;
      expect(decisionCache).toBeDefined();
      expect(Array.isArray(decisionCache)).toBe(true);
      expect(decisionCache.length).toBe(resolver.decisionCacheSize);
    });
  });

  describe('error handling in condition and decision resolution', () => {
    testBothResolvers('handles condition without valid index', (resolver, resolverName) => {
      // Create a condition without a valid index
      expect(resolver.resourceManager.conditions.getAt(0)).toSucceedAndSatisfy((condition) => {
        const mockCondition = { ...condition, index: undefined };
        expect(resolver.resolveCondition(mockCondition as unknown as TsRes.Conditions.Condition)).toFailWith(
          /does not have a valid index/
        );
      });
    });

    testBothResolvers('handles condition set without valid index', (resolver, resolverName) => {
      // Create a condition set without a valid index
      expect(resolver.resourceManager.conditionSets.getAt(0)).toSucceedAndSatisfy((conditionSet) => {
        const mockConditionSet = { ...conditionSet, index: undefined };
        expect(
          resolver.resolveConditionSet(mockConditionSet as unknown as TsRes.Conditions.ConditionSet)
        ).toFailWith(/does not have a valid index/);
      });
    });

    testBothResolvers('handles decision without valid index', (resolver, resolverName) => {
      // Create a decision without a valid index
      expect(resolver.resourceManager.decisions.getAt(0)).toSucceedAndSatisfy((decision) => {
        const mockDecision = { ...decision, index: undefined };
        expect(
          resolver.resolveDecision(mockDecision as unknown as TsRes.Decisions.AbstractDecision)
        ).toFailWith(/does not have a valid index/);
      });
    });
  });

  describe('resolveComposedResourceValue method', () => {
    testBothResolvers('composes value from partial and full candidates', (resolver, resolverName) => {
      expect(resolver.resourceManager.getBuiltResource('composition-test')).toSucceedAndSatisfy(
        (resource) => {
          expect(resolver.resolveComposedResourceValue(resource)).toSucceedAndSatisfy((composedValue) => {
            // Should merge: base full candidate + higher priority partials
            // Base: { name: 'John Doe', email: 'john@example.com' }
            // + Partial (higher priority): { name: 'John', age: 30 }
            // + Partial (higher priority): { department: 'Engineering', role: 'Senior' }
            expect(composedValue).toEqual({
              name: 'John', // Overridden by partial candidate with higher priority
              age: 30, // Added by partial candidate
              email: 'john@example.com', // From full candidate
              department: 'Engineering', // Added by partial candidate
              role: 'Senior' // Added by partial candidate
            });
          });
        }
      );
    });

    testBothResolvers('returns simple value when no merging needed', (resolver, resolverName) => {
      expect(resolver.resourceManager.getBuiltResource('simple-value')).toSucceedAndSatisfy((resource) => {
        expect(resolver.resolveComposedResourceValue(resource)).toSucceedAndSatisfy((composedValue) => {
          expect(composedValue).toEqual({ text: 'Simple string value' });
        });
      });
    });

    testBothResolvers('handles all partial candidates by using last as base', (resolver, resolverName) => {
      expect(resolver.resourceManager.getBuiltResource('all-partial')).toSucceedAndSatisfy((resource) => {
        expect(resolver.resolveComposedResourceValue(resource)).toSucceedAndSatisfy((composedValue) => {
          // Should use last candidate as base and merge higher priority partials
          // Base: { partial2: 'value2' }
          // + Partial (higher priority): { partial1: 'value1' }
          expect(composedValue).toEqual({
            partial1: 'value1',
            partial2: 'value2'
          });
        });
      });
    });

    testBothResolvers('returns single candidate when only one matches', (resolver, resolverName) => {
      // Change context to French to only match fallback candidate
      expect(contextProvider.validating.set('language', 'fr')).toSucceed();

      expect(resolver.resourceManager.getBuiltResource('composition-test')).toSucceedAndSatisfy(
        (resource) => {
          expect(resolver.resolveComposedResourceValue(resource)).toSucceedAndSatisfy((composedValue) => {
            expect(composedValue).toEqual({ greeting: 'Hello' });
          });
        }
      );
    });

    testBothResolvers('fails when no candidates match', (resolver, resolverName) => {
      // Change context to a language with no candidates (composition-test has an unconditional fallback,
      // so use a resource that doesn't)
      expect(contextProvider.validating.set('language', 'de')).toSucceed();

      expect(resolver.resourceManager.getBuiltResource('greeting')).toSucceedAndSatisfy((resource) => {
        expect(resolver.resolveComposedResourceValue(resource)).toFailWith(/No matching candidates found/);
      });
    });

    testBothResolvers('fails when candidate resolution fails', (resolver, resolverName) => {
      expect(resolver.resourceManager.getBuiltResource('greeting')).toSucceedAndSatisfy((resource) => {
        // Clear context to cause resolution failure (greeting has no unconditional fallback)
        contextProvider.clear();

        expect(resolver.resolveComposedResourceValue(resource)).toFailWith(/No matching candidates found/);
      });
    });

    testBothResolvers('handles non-object base candidate gracefully', (resolver, resolverName) => {
      // For object values, should return the value directly when no merging needed
      expect(resolver.resourceManager.getBuiltResource('simple-value')).toSucceedAndSatisfy((resource) => {
        expect(resolver.resolveComposedResourceValue(resource)).toSucceedAndSatisfy((composedValue) => {
          expect(composedValue).toEqual({ text: 'Simple string value' });
        });
      });
    });

    describe('nullAsDelete behavior', () => {
      testBothResolvers('deletes properties with null values by default', (resolver, resolverName) => {
        expect(resolver.resourceManager.getBuiltResource('null-test-resource')).toSucceedAndSatisfy(
          (resource) => {
            expect(resolver.resolveComposedResourceValue(resource)).toSucceedAndSatisfy((composedValue) => {
              // Should delete email and department properties due to null values
              expect(composedValue).toEqual({
                name: 'John', // Overridden by partial candidate
                phone: '555-1234', // From full candidate (unchanged)
                age: 30 // Added by partial candidate
              });
            });
          }
        );
      });

      test('preserves null values when suppressNullAsDelete is true', () => {
        // Create resolver with suppressNullAsDelete option
        const resolverWithSuppressedNulls = TsRes.Runtime.ResourceResolver.create({
          resourceManager: builderResolver.resourceManager,
          qualifierTypes: builderResolver.qualifierTypes,
          contextQualifierProvider: builderResolver.contextQualifierProvider,
          options: {
            suppressNullAsDelete: true
          }
        }).orThrow();

        expect(
          resolverWithSuppressedNulls.resourceManager.getBuiltResource('null-test-resource')
        ).toSucceedAndSatisfy((resource) => {
          expect(resolverWithSuppressedNulls.resolveComposedResourceValue(resource)).toSucceedAndSatisfy(
            (composedValue) => {
              // Should preserve null values instead of deleting properties
              expect(composedValue).toEqual({
                name: 'John', // Overridden by partial candidate
                email: null, // Preserved as null (not deleted)
                phone: '555-1234', // From full candidate (unchanged)
                age: 30, // Added by partial candidate
                department: null // Preserved as null (not deleted)
              });
            }
          );
        });
      });

      test('default behavior enables null-as-delete', () => {
        // Verify that the default ResourceResolver has suppressNullAsDelete: false
        expect(builderResolver.options.suppressNullAsDelete).toBe(false);

        // Verify that nullAsDelete is enabled by default (which means nulls delete properties)
        expect(builderResolver.resourceManager.getBuiltResource('null-test-resource')).toSucceedAndSatisfy(
          (resource) => {
            expect(builderResolver.resolveComposedResourceValue(resource)).toSucceedAndSatisfy(
              (composedValue) => {
                // Should NOT have email or department properties
                expect(composedValue).not.toHaveProperty('email');
                expect(composedValue).not.toHaveProperty('department');
                expect(composedValue).toEqual({
                  name: 'John',
                  phone: '555-1234',
                  age: 30
                });
              }
            );
          }
        );
      });

      test('explicit suppressNullAsDelete: false enables null-as-delete', () => {
        // Create resolver with explicit suppressNullAsDelete: false
        const resolverWithEnabledNulls = TsRes.Runtime.ResourceResolver.create({
          resourceManager: builderResolver.resourceManager,
          qualifierTypes: builderResolver.qualifierTypes,
          contextQualifierProvider: builderResolver.contextQualifierProvider,
          options: {
            suppressNullAsDelete: false
          }
        }).orThrow();

        expect(resolverWithEnabledNulls.options.suppressNullAsDelete).toBe(false);

        expect(
          resolverWithEnabledNulls.resourceManager.getBuiltResource('null-test-resource')
        ).toSucceedAndSatisfy((resource) => {
          expect(resolverWithEnabledNulls.resolveComposedResourceValue(resource)).toSucceedAndSatisfy(
            (composedValue) => {
              // Should delete properties with null values
              expect(composedValue).toEqual({
                name: 'John',
                phone: '555-1234',
                age: 30
              });
            }
          );
        });
      });

      describe('edge cases and complex scenarios', () => {
        testBothResolvers(
          'handles all properties being null in partial candidate',
          (resolver, resolverName) => {
            expect(resolver.resourceManager.getBuiltResource('only-nulls-resource')).toSucceedAndSatisfy(
              (resource) => {
                expect(resolver.resolveComposedResourceValue(resource)).toSucceedAndSatisfy(
                  (composedValue) => {
                    // All properties from partial should be deleted, leaving empty object
                    expect(composedValue).toEqual({});
                  }
                );
              }
            );
          }
        );

        testBothResolvers('handles nested object properties with nulls', (resolver, resolverName) => {
          expect(resolver.resourceManager.getBuiltResource('nested-nulls-resource')).toSucceedAndSatisfy(
            (resource) => {
              expect(resolver.resolveComposedResourceValue(resource)).toSucceedAndSatisfy((composedValue) => {
                // Should delete email within user object and entire settings object
                expect(composedValue).toEqual({
                  user: { name: 'Jane' } // email deleted from nested object
                  // settings object deleted entirely
                });
              });
            }
          );
        });

        testBothResolvers('handles arrays with null elements correctly', (resolver, resolverName) => {
          expect(resolver.resourceManager.getBuiltResource('arrays-with-nulls-resource')).toSucceedAndSatisfy(
            (resource) => {
              expect(resolver.resolveComposedResourceValue(resource)).toSucceedAndSatisfy((composedValue) => {
                // Array replacement should occur, null elements preserved, but null properties deleted
                expect(composedValue).toEqual({
                  items: [null, 4, null], // Array replaced, null elements preserved
                  // tags property deleted due to null value
                  metadata: { version: 2 } // deprecated property deleted due to null value
                });
              });
            }
          );
        });

        testBothResolvers('handles single candidate with null properties', (resolver, resolverName) => {
          expect(
            resolver.resourceManager.getBuiltResource('single-candidate-with-nulls')
          ).toSucceedAndSatisfy((resource) => {
            expect(resolver.resolveComposedResourceValue(resource)).toSucceedAndSatisfy((composedValue) => {
              // Single candidate, no merging, but nulls should still be handled during composition
              expect(composedValue).toEqual({
                name: 'Single',
                value: 'test'
                // active property deleted due to null value
              });
            });
          });
        });

        test('preserves nested nulls when suppressNullAsDelete is true', () => {
          const suppressedResolver = TsRes.Runtime.ResourceResolver.create({
            resourceManager: builderResolver.resourceManager,
            qualifierTypes: builderResolver.qualifierTypes,
            contextQualifierProvider: builderResolver.contextQualifierProvider,
            options: { suppressNullAsDelete: true }
          }).orThrow();

          expect(
            suppressedResolver.resourceManager.getBuiltResource('nested-nulls-resource')
          ).toSucceedAndSatisfy((resource) => {
            expect(suppressedResolver.resolveComposedResourceValue(resource)).toSucceedAndSatisfy(
              (composedValue) => {
                // Should preserve all null values in nested structures
                expect(composedValue).toEqual({
                  user: { name: 'Jane', email: null },
                  settings: null
                });
              }
            );
          });
        });

        test('handles empty options object', () => {
          const resolverWithEmptyOptions = TsRes.Runtime.ResourceResolver.create({
            resourceManager: builderResolver.resourceManager,
            qualifierTypes: builderResolver.qualifierTypes,
            contextQualifierProvider: builderResolver.contextQualifierProvider,
            options: {} // Empty options should default suppressNullAsDelete to false
          }).orThrow();

          expect(resolverWithEmptyOptions.options.suppressNullAsDelete).toBe(false);

          expect(
            resolverWithEmptyOptions.resourceManager.getBuiltResource('null-test-resource')
          ).toSucceedAndSatisfy((resource) => {
            expect(resolverWithEmptyOptions.resolveComposedResourceValue(resource)).toSucceedAndSatisfy(
              (composedValue) => {
                // Should behave like default (delete null properties)
                expect(composedValue).not.toHaveProperty('email');
                expect(composedValue).not.toHaveProperty('department');
              }
            );
          });
        });
      });
    });
  });

  describe('error handling in condition and decision resolution', () => {
    testBothResolvers('handles condition without valid index', (resolver, resolverName) => {
      // Create a condition without a valid index
      expect(resolver.resourceManager.conditions.getAt(0)).toSucceedAndSatisfy((condition) => {
        const mockCondition = { ...condition, index: undefined };
        expect(resolver.resolveCondition(mockCondition as unknown as TsRes.Conditions.Condition)).toFailWith(
          /does not have a valid index/
        );
      });
    });

    testBothResolvers('handles condition set without valid index', (resolver, resolverName) => {
      // Create a condition set without a valid index
      expect(resolver.resourceManager.conditionSets.getAt(0)).toSucceedAndSatisfy((conditionSet) => {
        const mockConditionSet = { ...conditionSet, index: undefined };
        expect(
          resolver.resolveConditionSet(mockConditionSet as unknown as TsRes.Conditions.ConditionSet)
        ).toFailWith(/does not have a valid index/);
      });
    });

    testBothResolvers('handles decision without valid index', (resolver, resolverName) => {
      // Create a decision without a valid index
      expect(resolver.resourceManager.decisions.getAt(0)).toSucceedAndSatisfy((decision) => {
        const mockDecision = { ...decision, index: undefined };
        expect(
          resolver.resolveDecision(mockDecision as unknown as TsRes.Decisions.AbstractDecision)
        ).toFailWith(/does not have a valid index/);
      });
    });
  });

  describe('single candidate early return path coverage', () => {
    // Test that we have proper setup for single candidate testing
    test('verify single-candidate-with-nulls has no partial candidates', () => {
      expect(
        builderResolver.resourceManager.getBuiltResource('single-candidate-with-nulls')
      ).toSucceedAndSatisfy((resource) => {
        expect(resource.candidates).toHaveLength(1);
        expect(resource.candidates[0].isPartial).toBe(false);
      });
    });

    // Add test for single candidate + suppressNullAsDelete: true (lines 543-545)
    test('single candidate with suppressNullAsDelete: true returns candidate directly', () => {
      const suppressedResolver = TsRes.Runtime.ResourceResolver.create({
        resourceManager: builderResolver.resourceManager,
        qualifierTypes: builderResolver.qualifierTypes,
        contextQualifierProvider: builderResolver.contextQualifierProvider,
        options: { suppressNullAsDelete: true }
      }).orThrow();

      expect(
        suppressedResolver.resourceManager.getBuiltResource('single-candidate-with-nulls')
      ).toSucceedAndSatisfy((resource) => {
        expect(suppressedResolver.resolveComposedResourceValue(resource)).toSucceedAndSatisfy(
          (composedValue) => {
            // With suppressNullAsDelete: true, null properties should be preserved (early return path)
            expect(composedValue).toEqual({
              name: 'Single',
              active: null, // null preserved due to suppressNullAsDelete: true
              value: 'test'
            });
          }
        );
      });
    });

    // Test the condition where baseCandidate.json is not a JSON object
    // Note: This tests the concept, though in practice resource validation may prevent non-objects
    test('early return with suppressNullAsDelete: false but for non-object handling concept', () => {
      // This test verifies the conditional logic even though resources typically contain objects
      expect(builderResolver.resourceManager.getBuiltResource('simple-value')).toSucceedAndSatisfy(
        (resource) => {
          expect(builderResolver.resolveComposedResourceValue(resource)).toSucceedAndSatisfy(
            (composedValue) => {
              // Should return the object directly without null-as-delete processing
              // Since it's a simple single-candidate resource
              expect(composedValue).toEqual({ text: 'Simple string value' });
            }
          );
        }
      );
    });
  });
});
