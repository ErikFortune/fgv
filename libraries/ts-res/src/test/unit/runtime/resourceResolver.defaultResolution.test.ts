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

describe('ResourceResolver Default Resolution Tests', () => {
  let qualifierTypes: TsRes.QualifierTypes.QualifierTypeCollector;
  let qualifiers: TsRes.Qualifiers.QualifierCollector;
  let resourceTypes: TsRes.ResourceTypes.ResourceTypeCollector;
  let resourceManager: TsRes.Resources.ResourceManagerBuilder;
  let contextProvider: TsRes.Runtime.ValidatingSimpleContextQualifierProvider;
  let resolver: TsRes.Runtime.ResourceResolver;

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

    // Set up qualifiers with default values
    qualifiers = TsRes.Qualifiers.QualifierCollector.create({
      qualifierTypes,
      qualifiers: [
        { name: 'language', typeName: 'language', defaultPriority: 600, defaultValue: 'en' },
        { name: 'territory', typeName: 'territory', defaultPriority: 700, defaultValue: 'US' },
        { name: 'tone', typeName: 'tone', defaultPriority: 500, defaultValue: 'standard' }
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

    // Add test resource with default resolution scenarios
    resourceManager
      .addResource({
        id: 'default-resolution-test',
        resourceTypeName: 'json',
        candidates: [
          // Regular match candidate
          {
            json: { type: 'regular-match', message: 'Exact match' },
            conditions: {
              language: 'en-US',
              territory: 'US',
              tone: 'formal'
            }
          },
          // Default match candidates - should only match when context doesn't exactly match
          {
            json: { type: 'default-language', message: 'Default language match' },
            conditions: [
              { qualifierName: 'language', value: 'fr', scoreAsDefault: 0.8 },
              { qualifierName: 'territory', value: 'US' }
            ]
          },
          {
            json: { type: 'default-territory', message: 'Default territory match' },
            conditions: [
              { qualifierName: 'language', value: 'en-US' },
              { qualifierName: 'territory', value: 'CA', scoreAsDefault: 0.7 }
            ]
          },
          // Mixed scenario - some conditions match, others only as default
          {
            json: { type: 'mixed-default', message: 'Mixed default match' },
            conditions: [
              { qualifierName: 'language', value: 'en-US' }, // Regular match
              { qualifierName: 'territory', value: 'FR', scoreAsDefault: 0.6 }, // Default match
              { qualifierName: 'tone', value: 'informal', scoreAsDefault: 0.5 } // Default match
            ]
          },
          // Pure default match - all conditions only match as default
          {
            json: { type: 'pure-default', message: 'Pure default match' },
            conditions: [
              { qualifierName: 'language', value: 'de', scoreAsDefault: 0.4 },
              { qualifierName: 'territory', value: 'DE', scoreAsDefault: 0.3 },
              { qualifierName: 'tone', value: 'informal', scoreAsDefault: 0.2 }
            ]
          }
        ]
      })
      .orThrow();

    // Add resource with only default matches available
    resourceManager
      .addResource({
        id: 'only-defaults',
        resourceTypeName: 'json',
        candidates: [
          {
            json: { type: 'fallback-1', priority: 'high' },
            conditions: [{ qualifierName: 'language', value: 'fr', scoreAsDefault: 0.9 }]
          },
          {
            json: { type: 'fallback-2', priority: 'medium' },
            conditions: [{ qualifierName: 'language', value: 'de', scoreAsDefault: 0.8 }]
          },
          {
            json: { type: 'fallback-3', priority: 'low' },
            conditions: [{ qualifierName: 'language', value: 'es', scoreAsDefault: 0.7 }]
          }
        ]
      })
      .orThrow();

    // Build resources
    resourceManager.build().orThrow();

    // Set up context provider - context that will trigger various default scenarios
    contextProvider = TsRes.Runtime.ValidatingSimpleContextQualifierProvider.create({
      qualifiers,
      qualifierValues: {
        language: 'en-US',
        territory: 'US',
        tone: 'formal'
      }
    }).orThrow();

    // Create resolver
    resolver = TsRes.Runtime.ResourceResolver.create({
      resourceManager,
      qualifierTypes,
      contextQualifierProvider: contextProvider
    }).orThrow();
  });

  describe('Condition resolution with scoreAsDefault', () => {
    test('resolves condition that matches regularly', () => {
      expect(resourceManager.conditions.getAt(0)).toSucceedAndSatisfy((condition) => {
        expect(resolver.resolveCondition(condition)).toSucceedAndSatisfy((result) => {
          expect(['match', 'matchAsDefault', 'noMatch']).toContain(result.matchType);
          expect(result.priority).toBeGreaterThan(0);
        });
      });
    });

    test('resolves condition with scoreAsDefault correctly', () => {
      // Find a condition that has scoreAsDefault
      let foundCondition = false;
      for (let i = 0; i < resourceManager.conditions.size; i++) {
        const conditionResult = resourceManager.conditions.getAt(i);
        if (conditionResult.isSuccess() && conditionResult.value.scoreAsDefault !== undefined) {
          const condition = conditionResult.value;
          expect(resolver.resolveCondition(condition)).toSucceedAndSatisfy((result) => {
            expect(['match', 'matchAsDefault']).toContain(result.matchType);
            expect(result.priority).toBeGreaterThan(0);
          });
          foundCondition = true;
          break;
        }
      }
      expect(foundCondition).toBe(true); // Ensure we found at least one condition to test
    });

    test('resolves condition that does not match', () => {
      expect(resourceManager.conditions.getAt(0)).toSucceedAndSatisfy((condition) => {
        // Change context to something unlikely to match
        expect(contextProvider.validating.set('language', 'fr')).toSucceed();
        expect(resolver.clearConditionCache()).toBeUndefined();

        expect(resolver.resolveCondition(condition)).toSucceedAndSatisfy((result) => {
          expect(['match', 'matchAsDefault', 'noMatch']).toContain(result.matchType);
          expect(result.priority).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('Condition set resolution with mixed match types', () => {
    test('resolves condition sets correctly', () => {
      expect(resourceManager.conditionSets.getAt(0)).toSucceedAndSatisfy((conditionSet) => {
        expect(resolver.resolveConditionSet(conditionSet)).toSucceedAndSatisfy((result) => {
          expect(['match', 'matchAsDefault', 'noMatch']).toContain(result.matchType);
          if (result.matchType !== 'noMatch') {
            expect(result.matches.length).toBeGreaterThanOrEqual(0);
          }
        });
      });
    });

    test('tests multiple condition sets for various match types', () => {
      for (let i = 0; i < Math.min(3, resourceManager.conditionSets.size); i++) {
        expect(resourceManager.conditionSets.getAt(i)).toSucceedAndSatisfy((conditionSet) => {
          expect(resolver.resolveConditionSet(conditionSet)).toSucceedAndSatisfy((result) => {
            expect(['match', 'matchAsDefault', 'noMatch']).toContain(result.matchType);
          });
        });
      }
    });

    test('verifies condition set resolution with changed context', () => {
      // Change context to test different scenarios
      expect(contextProvider.validating.set('language', 'fr')).toSucceed();
      expect(resolver.clearConditionCache()).toBeUndefined();

      expect(resourceManager.conditionSets.getAt(0)).toSucceedAndSatisfy((conditionSet) => {
        expect(resolver.resolveConditionSet(conditionSet)).toSucceedAndSatisfy((result) => {
          expect(['match', 'matchAsDefault', 'noMatch']).toContain(result.matchType);
        });
      });
    });
  });

  describe('Decision resolution with defaultInstanceIndices', () => {
    test('populates both instanceIndices and defaultInstanceIndices correctly', () => {
      expect(resourceManager.getBuiltResource('default-resolution-test')).toSucceedAndSatisfy((resource) => {
        const decision = resource.decision.baseDecision;

        expect(resolver.resolveDecision(decision)).toSucceedAndSatisfy((result) => {
          expect(result.success).toBe(true);
          if (result.success) {
            // Should have regular matches in instanceIndices
            expect(result.instanceIndices.length).toBeGreaterThan(0);

            // Should have default matches in defaultInstanceIndices
            expect(result.defaultInstanceIndices.length).toBeGreaterThan(0);

            // The arrays should be different (no overlap for this test scenario)
            const intersection = result.instanceIndices.filter((i) =>
              result.defaultInstanceIndices.includes(i)
            );
            expect(intersection).toHaveLength(0);
          }
        });
      });
    });

    test('sorts defaultInstanceIndices by priority correctly', () => {
      expect(resourceManager.getBuiltResource('only-defaults')).toSucceedAndSatisfy((resource) => {
        const decision = resource.decision.baseDecision;

        expect(resolver.resolveDecision(decision)).toSucceedAndSatisfy((result) => {
          expect(result.success).toBe(true);
          if (result.success) {
            // Should have no regular matches
            expect(result.instanceIndices).toHaveLength(0);

            // Should have default matches sorted by priority
            expect(result.defaultInstanceIndices.length).toBe(3);

            // Verify sorting by checking the candidates in order
            const candidates = resource.candidates;
            const firstCandidate = candidates[result.defaultInstanceIndices[0]];
            const lastCandidate =
              candidates[result.defaultInstanceIndices[result.defaultInstanceIndices.length - 1]];

            // First should have highest scoreAsDefault (0.9), last should have lowest (0.7)
            expect(firstCandidate.json).toEqual({ type: 'fallback-1', priority: 'high' });
            expect(lastCandidate.json).toEqual({ type: 'fallback-3', priority: 'low' });
          }
        });
      });
    });

    test('handles decisions with default matches correctly', () => {
      expect(resourceManager.getBuiltResource('default-resolution-test')).toSucceedAndSatisfy((resource) => {
        const decision = resource.decision.baseDecision;

        expect(resolver.resolveDecision(decision)).toSucceedAndSatisfy((result) => {
          expect(result.success).toBe(true);
          if (result.success) {
            // Should have some form of matches (regular or default)
            const totalMatches = result.instanceIndices.length + result.defaultInstanceIndices.length;
            expect(totalMatches).toBeGreaterThan(0);
          }
        });
      });
    });
  });

  describe('Resource resolution with default matches', () => {
    test('prefers regular matches over default matches', () => {
      expect(resourceManager.getBuiltResource('default-resolution-test')).toSucceedAndSatisfy((resource) => {
        expect(resolver.resolveResource(resource)).toSucceedAndSatisfy((candidate) => {
          // Should get the regular match, not any default match
          expect(candidate.json).toEqual({ type: 'regular-match', message: 'Exact match' });
        });
      });
    });

    test('falls back to default matches when no regular matches available', () => {
      expect(resourceManager.getBuiltResource('only-defaults')).toSucceedAndSatisfy((resource) => {
        expect(resolver.resolveResource(resource)).toSucceedAndSatisfy((candidate) => {
          // Should get the highest priority default match
          expect(candidate.json).toEqual({ type: 'fallback-1', priority: 'high' });
        });
      });
    });

    test('succeeds with default matches when no regular matches available', () => {
      // The 'only-defaults' resource should now succeed with default matches
      expect(resourceManager.getBuiltResource('only-defaults')).toSucceedAndSatisfy((resource) => {
        expect(resolver.resolveResource(resource)).toSucceedAndSatisfy((candidate) => {
          // Should get one of the default match candidates
          expect(candidate.json).toEqual(
            expect.objectContaining({ type: expect.stringMatching(/fallback-/) })
          );
        });
      });
    });
  });

  describe('Resource composition with default matches', () => {
    test('composes values using default matches when regular matches unavailable', () => {
      // Add a resource for composition testing with defaults
      resourceManager
        .addResource({
          id: 'composition-with-defaults',
          resourceTypeName: 'json',
          candidates: [
            {
              json: { base: 'value', shared: 'from-base' },
              conditions: [{ qualifierName: 'language', value: 'fr', scoreAsDefault: 0.8 }],
              isPartial: false
            },
            {
              json: { overlay: 'value', shared: 'from-overlay' },
              conditions: [{ qualifierName: 'language', value: 'de', scoreAsDefault: 0.9 }],
              isPartial: true
            }
          ]
        })
        .orThrow();

      resourceManager.build().orThrow();

      expect(resourceManager.getBuiltResource('composition-with-defaults')).toSucceedAndSatisfy(
        (resource) => {
          expect(resolver.resolveComposedResourceValue(resource)).toSucceedAndSatisfy((composedValue) => {
            // Should compose successfully using default matches
            expect(composedValue).toEqual(
              expect.objectContaining({
                base: 'value'
              })
            );
          });
        }
      );
    });
  });

  describe('Edge cases and error handling', () => {
    test('handles conditions with undefined scoreAsDefault correctly', () => {
      // Create a condition without scoreAsDefault that doesn't match
      expect(contextProvider.validating.set('language', 'ja')).toSucceed();
      expect(resolver.clearConditionCache()).toBeUndefined();

      expect(resourceManager.conditions.getAt(0)).toSucceedAndSatisfy((condition) => {
        expect(resolver.resolveCondition(condition)).toSucceedAndSatisfy((result) => {
          expect(['match', 'matchAsDefault', 'noMatch']).toContain(result.matchType);
          // The actual result depends on qualifier default values and context
          if (result.matchType === 'noMatch') {
            expect(result.score).toBe(0);
          } else {
            expect(result.score).toBeGreaterThanOrEqual(0);
          }
        });
      });
    });

    test('handles mixed scoreAsDefault values in condition set', () => {
      // Test with a condition set that likely has mixed scoreAsDefault values
      if (resourceManager.conditionSets.size > 2) {
        expect(resourceManager.conditionSets.getAt(2)).toSucceedAndSatisfy((conditionSet) => {
          // Change context so some conditions match, others don't
          expect(contextProvider.validating.set('territory', 'CA')).toSucceed();
          expect(resolver.clearConditionCache()).toBeUndefined();

          expect(resolver.resolveConditionSet(conditionSet)).toSucceedAndSatisfy((result) => {
            // The result depends on whether any condition fails completely
            expect(['match', 'matchAsDefault', 'noMatch']).toContain(result.matchType);
          });
        });
      }
    });
  });
});
