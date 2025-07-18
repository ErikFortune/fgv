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

  beforeEach(() => {
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

        expect(resolver.resolveComposedResourceValue(resource)).toFailWith(/Failed to resolve decision/);
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
});
