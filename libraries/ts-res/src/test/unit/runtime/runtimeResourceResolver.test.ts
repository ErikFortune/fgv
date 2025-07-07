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

describe('RuntimeResourceResolver class', () => {
  let qualifierTypes: TsRes.QualifierTypes.QualifierTypeCollector;
  let qualifiers: TsRes.Qualifiers.QualifierCollector;
  let resourceTypes: TsRes.ResourceTypes.ResourceTypeCollector;
  let resourceManager: TsRes.Resources.ResourceManager;
  let contextProvider: TsRes.Runtime.ValidatingSimpleContextQualifierProvider;
  let resolver: TsRes.Runtime.RuntimeResourceResolver;

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
    resourceManager = TsRes.Resources.ResourceManager.create({
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

    // Build resources to create decisions
    resourceManager.build().orThrow();

    // Set up context provider using ValidatingSimpleContextQualifierProvider to eliminate type casting
    contextProvider = TsRes.Runtime.ValidatingSimpleContextQualifierProvider.create({
      qualifiers,
      qualifierValues: {
        language: 'en',
        territory: 'US',
        tone: 'formal'
      }
    }).orThrow();

    // Create resolver
    resolver = TsRes.Runtime.RuntimeResourceResolver.create({
      resourceManager,
      qualifierTypes,
      contextQualifierProvider: contextProvider
    }).orThrow();
  });

  describe('create static method', () => {
    test('creates a runtime resource resolver', () => {
      expect(
        TsRes.Runtime.RuntimeResourceResolver.create({
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
  });

  describe('resolveResource method', () => {
    test('resolves the best matching candidate value', () => {
      const resource = resourceManager.getBuiltResource('greeting').orThrow();

      // Should get the best match based on context: en + US + formal tone
      // The "Hello World!" candidate matches language=en and territory=US (highest specificity)
      expect(resolver.resolveResource(resource)).toSucceedWith({ text: 'Hello World!' });
    });

    test('resolves to formal tone candidate when multiple candidates match partially', () => {
      // Change context to remove territory match - no type casting needed!
      contextProvider.validating.remove('territory').orThrow();

      const resource = resourceManager.getBuiltResource('greeting').orThrow();

      // Should get "Hello!" (en + formal tone) over "Hi there!" (en + standard tone)
      expect(resolver.resolveResource(resource)).toSucceedWith({ text: 'Hello!' });
    });

    test('resolves to the only matching candidate', () => {
      // Change context to French - no type casting needed!
      contextProvider.validating.set('language', 'fr').orThrow();
      contextProvider.validating.remove('territory').orThrow();

      const resource = resourceManager.getBuiltResource('greeting').orThrow();

      // Should get "Bonjour!" (only French candidate)
      expect(resolver.resolveResource(resource)).toSucceedWith({ text: 'Bonjour!' });
    });

    test('fails when no candidates match', () => {
      // Change context to a language with no candidates
      contextProvider.validating.set('language', 'de').orThrow();

      const resource = resourceManager.getBuiltResource('greeting').orThrow();

      expect(resolver.resolveResource(resource)).toFailWith(/No matching candidates found/);
    });

    test('fails when decision resolution fails', () => {
      // Create a resource with invalid decision index to force failure
      const resource = resourceManager.getBuiltResource('greeting').orThrow();

      // Clear the decision cache and manually break the decision system
      resolver.clearConditionCache();

      // Remove required qualifier from context to cause decision failure
      contextProvider.clear();

      expect(resolver.resolveResource(resource)).toFail();
    });

    test('fails when invalid candidate index is found', () => {
      // Create a resource with mocked candidates array that is shorter than expected
      const resource = resourceManager.getBuiltResource('greeting').orThrow();
      // Manually corrupt the candidates array to force an invalid index scenario
      const originalCandidates = resource.candidates;
      (resource as unknown as { candidates: readonly TsRes.Resources.ResourceCandidate[] }).candidates = []; // Empty candidates array
      expect(resolver.resolveResource(resource)).toFailWith(/Invalid candidate index/);
      // Restore original candidates
      (resource as unknown as { candidates: readonly TsRes.Resources.ResourceCandidate[] }).candidates =
        originalCandidates;
    });
  });

  describe('resolveAllResourceValues method', () => {
    test('resolves all matching candidate values in priority order', () => {
      const resource = resourceManager.getBuiltResource('greeting').orThrow();

      expect(resolver.resolveAllResourceValues(resource)).toSucceedAndSatisfy((values) => {
        expect(values).toBeInstanceOf(Array);
        expect(values.length).toBeGreaterThan(0);

        // First value should be the best match
        expect(values[0]).toEqual({ text: 'Hello World!' });

        // Should contain other matching candidates in priority order
        expect(values).toContainEqual({ text: 'Hello!' });
      });
    });

    test('resolves multiple matching candidates for partial context', () => {
      // Remove territory to get multiple matches, but keep en + high priority match
      contextProvider.validating.remove('territory').orThrow();

      const resource = resourceManager.getBuiltResource('greeting').orThrow();

      expect(resolver.resolveAllResourceValues(resource)).toSucceedAndSatisfy((values) => {
        expect(values).toBeInstanceOf(Array);
        expect(values.length).toBeGreaterThanOrEqual(1);

        // Should get the best English match (formal tone)
        expect(values[0]).toEqual({ text: 'Hello!' });

        // Should not contain French candidate
        expect(values).not.toContainEqual({ text: 'Bonjour!' });
      });
    });

    test('resolves single matching candidate', () => {
      // Change context to French - no type casting needed!
      contextProvider.validating.set('language', 'fr').orThrow();
      contextProvider.validating.remove('territory').orThrow();

      const resource = resourceManager.getBuiltResource('greeting').orThrow();

      expect(resolver.resolveAllResourceValues(resource)).toSucceedAndSatisfy((values) => {
        expect(values).toHaveLength(1);
        expect(values[0]).toEqual({ text: 'Bonjour!' });
      });
    });

    test('fails when no candidates match', () => {
      // Change context to a language with no candidates
      contextProvider.validating.set('language', 'de').orThrow();

      const resource = resourceManager.getBuiltResource('greeting').orThrow();

      expect(resolver.resolveAllResourceValues(resource)).toFailWith(/No matching candidates found/);
    });

    test('fails when decision resolution fails', () => {
      const resource = resourceManager.getBuiltResource('greeting').orThrow();

      // Clear context to cause decision failure
      contextProvider.clear();

      expect(resolver.resolveAllResourceValues(resource)).toFail();
    });

    test('fails when invalid candidate index is found', () => {
      // Create a resource with mocked candidates array that is shorter than expected
      const resource = resourceManager.getBuiltResource('greeting').orThrow();
      // Manually corrupt the candidates array to force an invalid index scenario
      const originalCandidates = resource.candidates;
      (resource as unknown as { candidates: readonly TsRes.Resources.ResourceCandidate[] }).candidates = []; // Empty candidates array
      expect(resolver.resolveAllResourceValues(resource)).toFailWith(/Invalid candidate index/);
      // Restore original candidates
      (resource as unknown as { candidates: readonly TsRes.Resources.ResourceCandidate[] }).candidates =
        originalCandidates;
    });
  });

  describe('caching behavior', () => {
    test('caches decision resolution results', () => {
      const resource = resourceManager.getBuiltResource('greeting').orThrow();

      // First resolution
      const result1 = resolver.resolveResource(resource);
      expect(result1).toSucceedWith({ text: 'Hello World!' });

      // Second resolution should use cached result
      const result2 = resolver.resolveResource(resource);
      expect(result2).toSucceedWith({ text: 'Hello World!' });
    });

    test('clears cache and re-resolves when context changes', () => {
      const resource = resourceManager.getBuiltResource('greeting').orThrow();

      // Initial resolution
      expect(resolver.resolveResource(resource)).toSucceedWith({ text: 'Hello World!' });

      // Change context and clear cache
      contextProvider.validating.set('language', 'fr').orThrow();
      contextProvider.validating.remove('territory').orThrow();
      resolver.clearConditionCache();

      // Should get different result
      expect(resolver.resolveResource(resource)).toSucceedWith({ text: 'Bonjour!' });
    });
  });

  describe('cache size properties', () => {
    test('returns correct cache sizes', () => {
      expect(resolver.conditionCacheSize).toBe(resourceManager.conditions.size);
      expect(resolver.conditionSetCacheSize).toBe(resourceManager.conditionSets.size);
      expect(resolver.decisionCacheSize).toBe(resourceManager.decisions.size);
    });
  });

  describe('error handling in condition and decision resolution', () => {
    test('handles condition without valid index', () => {
      // Create a condition without a valid index
      const condition = resourceManager.conditions.getAt(0).orThrow();
      const mockCondition = { ...condition, index: undefined };
      expect(resolver.resolveCondition(mockCondition as TsRes.Conditions.Condition)).toFailWith(
        /does not have a valid index/
      );
    });

    test('handles condition set without valid index', () => {
      // Create a condition set without a valid index
      const conditionSet = resourceManager.conditionSets.getAt(0).orThrow();
      const mockConditionSet = { ...conditionSet, index: undefined };
      expect(resolver.resolveConditionSet(mockConditionSet as TsRes.Conditions.ConditionSet)).toFailWith(
        /does not have a valid index/
      );
    });

    test('handles decision without valid index', () => {
      // Create a decision without a valid index
      const decision = resourceManager.decisions.getAt(0).orThrow();
      const mockDecision = { ...decision, index: undefined };
      expect(resolver.resolveDecision(mockDecision as TsRes.Decisions.AbstractDecision)).toFailWith(
        /does not have a valid index/
      );
    });
  });
});
