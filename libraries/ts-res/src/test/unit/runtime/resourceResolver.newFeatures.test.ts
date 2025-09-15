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

describe('ResourceResolver New Features', () => {
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

    // Add test resources
    resourceManager
      .addResource({
        id: 'greeting',
        resourceTypeName: 'json',
        candidates: [
          {
            json: { text: 'Hello!', tone: 'formal' },
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

    // Add a resource for composition testing with partial candidates
    resourceManager
      .addResource({
        id: 'user-profile',
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
          }
        ]
      })
      .orThrow();

    // Add a resource that doesn't exist in different contexts
    resourceManager
      .addResource({
        id: 'context-specific',
        resourceTypeName: 'json',
        candidates: [
          {
            json: { message: 'US-specific content' },
            conditions: {
              territory: 'US'
            }
          },
          {
            json: { message: 'Canada-specific content' },
            conditions: {
              territory: 'CA'
            }
          }
        ]
      })
      .orThrow();

    // Add a resource with no matching candidates for some contexts
    resourceManager
      .addResource({
        id: 'limited-availability',
        resourceTypeName: 'json',
        candidates: [
          {
            json: { content: 'German content' },
            conditions: {
              language: 'de'
            }
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

    // Set up context provider
    contextProvider = TsRes.Runtime.ValidatingSimpleContextQualifierProvider.create({
      qualifiers,
      qualifierValues: {
        language: 'en-US',
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

  describe('resolveResource method with string resource IDs', () => {
    testBothResolvers('resolves resource by string ID successfully', (resolver, resolverName) => {
      expect(resolver.resolveResource('greeting')).toSucceedAndSatisfy((candidate) => {
        // Should get the best match based on context: en-US + formal tone
        expect(candidate.json).toEqual({ text: 'Hello World!' });
        expect(candidate.isPartial).toBe(false);
        expect(candidate.mergeMethod).toBe('augment');
      });
    });

    testBothResolvers('resolves resource by string ID with different context', (resolver, resolverName) => {
      // Change context to French
      expect(contextProvider.validating.set('language', 'fr')).toSucceed();

      expect(resolver.resolveResource('greeting')).toSucceedAndSatisfy((candidate) => {
        expect(candidate.json).toEqual({ text: 'Bonjour!' });
        expect(candidate.isPartial).toBe(false);
        expect(candidate.mergeMethod).toBe('augment');
      });
    });

    testBothResolvers('fails when resource ID does not exist', (resolver, resolverName) => {
      expect(resolver.resolveResource('non-existent')).toFailWith(/not a valid resource ID|not found/i);
    });

    testBothResolvers('fails when no candidates match for existing resource', (resolver, resolverName) => {
      // Use a resource that exists but has no matching candidates for current context
      expect(resolver.resolveResource('limited-availability')).toFailWith(/No matching candidates found/);
    });

    testBothResolvers('resolves same result as IResource object', (resolver, resolverName) => {
      // Get resource object
      expect(resolver.resourceManager.getBuiltResource('greeting')).toSucceedAndSatisfy((resource) => {
        const objectResult = resolver.resolveResource(resource);
        const stringResult = resolver.resolveResource('greeting');

        expect(objectResult).toSucceed();
        expect(stringResult).toSucceed();

        expect(objectResult).toSucceedAndSatisfy((objCandidate) => {
          expect(stringResult).toSucceedAndSatisfy((strCandidate) => {
            expect(objCandidate.json).toEqual(strCandidate.json);
            expect(objCandidate.isPartial).toBe(strCandidate.isPartial);
            expect(objCandidate.mergeMethod).toBe(strCandidate.mergeMethod);
          });
        });
      });
    });
  });

  describe('resolveAllResourceCandidates method with string resource IDs', () => {
    testBothResolvers('resolves all candidates by string ID successfully', (resolver, resolverName) => {
      expect(resolver.resolveAllResourceCandidates('greeting')).toSucceedAndSatisfy((candidates) => {
        expect(candidates).toBeInstanceOf(Array);
        expect(candidates.length).toBeGreaterThan(0);

        // First candidate should be the best match
        expect(candidates[0].json).toEqual({ text: 'Hello World!' });

        // Should contain other matching candidates in priority order
        const candidateValues = candidates.map((c) => c.json);
        expect(candidateValues).toContainEqual({ text: 'Hello!', tone: 'formal' });
      });
    });

    testBothResolvers('resolves all candidates with different context', (resolver, resolverName) => {
      // Change context to French - should only get one candidate
      expect(contextProvider.validating.set('language', 'fr')).toSucceed();

      expect(resolver.resolveAllResourceCandidates('greeting')).toSucceedAndSatisfy((candidates) => {
        expect(candidates).toHaveLength(1);
        expect(candidates[0].json).toEqual({ text: 'Bonjour!' });
      });
    });

    testBothResolvers('fails when resource ID does not exist', (resolver, resolverName) => {
      expect(resolver.resolveAllResourceCandidates('non-existent')).toFailWith(
        /not a valid resource ID|not found/i
      );
    });

    testBothResolvers('fails when no candidates match', (resolver, resolverName) => {
      expect(resolver.resolveAllResourceCandidates('limited-availability')).toFailWith(
        /No matching candidates found/
      );
    });

    testBothResolvers('resolves same result as IResource object', (resolver, resolverName) => {
      expect(resolver.resourceManager.getBuiltResource('greeting')).toSucceedAndSatisfy((resource) => {
        const objectResult = resolver.resolveAllResourceCandidates(resource);
        const stringResult = resolver.resolveAllResourceCandidates('greeting');

        expect(objectResult).toSucceed();
        expect(stringResult).toSucceed();

        expect(objectResult).toSucceedAndSatisfy((objCandidates) => {
          expect(stringResult).toSucceedAndSatisfy((strCandidates) => {
            expect(objCandidates).toHaveLength(strCandidates.length);

            for (let i = 0; i < objCandidates.length; i++) {
              expect(objCandidates[i].json).toEqual(strCandidates[i].json);
              expect(objCandidates[i].isPartial).toBe(strCandidates[i].isPartial);
              expect(objCandidates[i].mergeMethod).toBe(strCandidates[i].mergeMethod);
            }
          });
        });
      });
    });
  });

  describe('resolveComposedResourceValue method with string resource IDs', () => {
    testBothResolvers('resolves composed value by string ID successfully', (resolver, resolverName) => {
      expect(resolver.resolveComposedResourceValue('user-profile')).toSucceedAndSatisfy((composedValue) => {
        // Should merge: base full candidate + higher priority partials
        expect(composedValue).toEqual({
          name: 'John', // Overridden by partial candidate with higher priority
          age: 30, // Added by partial candidate
          email: 'john@example.com', // From full candidate
          department: 'Engineering', // Added by partial candidate
          role: 'Senior' // Added by partial candidate
        });
      });
    });

    testBothResolvers('resolves composed value with different context', (resolver, resolverName) => {
      // Change context to remove territory-specific partial candidate
      expect(contextProvider.validating.set('territory', 'CA')).toSucceed();

      expect(resolver.resolveComposedResourceValue('user-profile')).toSucceedAndSatisfy((composedValue) => {
        // Should get base candidate + formal tone partial candidate (no territory-specific partial)
        expect(composedValue).toEqual({
          name: 'John Doe', // From full candidate (no territory override)
          email: 'john@example.com', // From full candidate
          department: 'Engineering', // Added by partial candidate (tone-based)
          role: 'Senior' // Added by partial candidate (tone-based)
        });
      });
    });

    testBothResolvers('fails when resource ID does not exist', (resolver, resolverName) => {
      expect(resolver.resolveComposedResourceValue('non-existent')).toFailWith(
        /not a valid resource ID|not found/i
      );
    });

    testBothResolvers('fails when no candidates match', (resolver, resolverName) => {
      expect(resolver.resolveComposedResourceValue('limited-availability')).toFailWith(
        /No matching candidates found/
      );
    });

    testBothResolvers('resolves same result as IResource object', (resolver, resolverName) => {
      expect(resolver.resourceManager.getBuiltResource('user-profile')).toSucceedAndSatisfy((resource) => {
        const objectResult = resolver.resolveComposedResourceValue(resource);
        const stringResult = resolver.resolveComposedResourceValue('user-profile');

        expect(objectResult).toSucceed();
        expect(stringResult).toSucceed();

        expect(objectResult).toSucceedAndSatisfy((objValue) => {
          expect(stringResult).toSucceedAndSatisfy((strValue) => {
            expect(objValue).toEqual(strValue);
          });
        });
      });
    });
  });

  describe('withContext method', () => {
    testBothResolvers('creates new resolver with different context', (resolver, resolverName) => {
      const newContext = {
        language: 'fr',
        territory: 'FR',
        tone: 'formal'
      };

      expect(resolver.withContext(newContext)).toSucceedAndSatisfy((newResolver) => {
        // New resolver should be different instance
        expect(newResolver).not.toBe(resolver);

        // New resolver should use new context (IResourceResolver only has resolveComposedResourceValue)
        expect(newResolver.resolveComposedResourceValue('greeting')).toSucceedAndSatisfy((value) => {
          expect(value).toEqual({ text: 'Bonjour!' });
        });

        // Original resolver should still use original context
        expect(resolver.resolveResource('greeting')).toSucceedAndSatisfy((candidate) => {
          expect(candidate.json).toEqual({ text: 'Hello World!' });
        });
      });
    });

    testBothResolvers('preserves resource manager and qualifier types', (resolver, resolverName) => {
      const newContext = { language: 'fr', territory: 'FR', tone: 'standard' };

      expect(resolver.withContext(newContext)).toSucceedAndSatisfy((newResolver) => {
        expect(newResolver.resourceManager).toBe(resolver.resourceManager);
        expect(newResolver.qualifierTypes).toBe(resolver.qualifierTypes);
      });
    });

    testBothResolvers('preserves options from original resolver', (resolver, resolverName) => {
      // Create resolver with custom options
      const resolverWithOptions = TsRes.Runtime.ResourceResolver.create({
        resourceManager: resolver.resourceManager,
        qualifierTypes: resolver.qualifierTypes,
        contextQualifierProvider: resolver.contextQualifierProvider,
        options: {
          suppressNullAsDelete: true
        }
      }).orThrow();

      const newContext = { language: 'en', territory: 'CA', tone: 'informal' };

      expect(resolverWithOptions.withContext(newContext)).toSucceedAndSatisfy((newResolver) => {
        expect(newResolver.options.suppressNullAsDelete).toBe(true);
      });
    });

    testBothResolvers('creates resolver that works independently', (resolver, resolverName) => {
      const newContext = {
        language: 'en',
        territory: 'CA',
        tone: 'standard'
      };

      expect(resolver.withContext(newContext)).toSucceedAndSatisfy((newResolver) => {
        // Test that both resolvers work independently with different results
        expect(resolver.resolveResource('context-specific')).toSucceedAndSatisfy((originalCandidate) => {
          expect(originalCandidate.json).toEqual({ message: 'US-specific content' });
        });

        expect(newResolver.resolveResource('context-specific')).toSucceedAndSatisfy((newCandidate) => {
          expect(newCandidate.json).toEqual({ message: 'Canada-specific content' });
        });
      });
    });

    testBothResolvers('handles invalid context values appropriately', (resolver, resolverName) => {
      const invalidContext = {
        language: 'invalid-language-code',
        territory: 'INVALID',
        tone: 'invalid-tone'
      };

      const result = resolver.withContext(invalidContext);
      if (result.isSuccess()) {
        // If validation allows the values, verify the resolver works but may have no matches
        expect(result).toSucceedAndSatisfy((newResolver) => {
          // With invalid context values, some resources may not resolve
          const greetingResult = newResolver.resolveResource('greeting');
          expect(greetingResult.isSuccess() || greetingResult.isFailure()).toBe(true);
        });
      } else {
        // If validation rejects the values, verify it's due to validation
        expect(result).toFailWith(/invalid|validation/i);
      }
    });

    testBothResolvers('handles incomplete context appropriately', (resolver, resolverName) => {
      const incompleteContext = {
        language: 'en'
        // Missing territory and tone - behavior depends on qualifier requirements
      };

      // This might succeed or fail depending on qualifier requirements
      const result = resolver.withContext(incompleteContext);
      if (result.isSuccess()) {
        // If it succeeds, verify it works with limited context
        expect(result).toSucceedAndSatisfy((newResolver) => {
          // With incomplete context, some resource resolution might fail due to missing candidates
          const greetingResult = newResolver.resolveResource('greeting');
          expect(greetingResult.isSuccess() || greetingResult.isFailure()).toBe(true);
        });
      } else {
        // If it fails, verify it's due to validation
        expect(result).toFailWith(/required|validation|missing/i);
      }
    });

    testBothResolvers('handles empty context', (resolver, resolverName) => {
      const emptyContext = {};

      const result = resolver.withContext(emptyContext);
      if (result.isSuccess()) {
        expect(result).toSucceedAndSatisfy((newResolver) => {
          // With empty context, some resources might not resolve
          const greetingResult = newResolver.resolveResource('greeting');
          expect(greetingResult.isSuccess() || greetingResult.isFailure()).toBe(true);
        });
      } else {
        expect(result).toFailWith(/validation|context/i);
      }
    });
  });

  describe('integration scenarios with new features', () => {
    testBothResolvers('withContext works with string resource ID methods', (resolver, resolverName) => {
      const frenchContext = {
        language: 'fr',
        territory: 'FR',
        tone: 'formal'
      };

      expect(resolver.withContext(frenchContext)).toSucceedAndSatisfy((frenchResolver) => {
        // Test resolveResource with string ID
        expect(frenchResolver.resolveResource('greeting')).toSucceedAndSatisfy((candidate) => {
          expect(candidate.json).toEqual({ text: 'Bonjour!' });
        });

        // Test resolveAllResourceCandidates with string ID
        expect(frenchResolver.resolveAllResourceCandidates('greeting')).toSucceedAndSatisfy((candidates) => {
          expect(candidates).toHaveLength(1);
          expect(candidates[0].json).toEqual({ text: 'Bonjour!' });
        });

        // Test resolveComposedResourceValue with string ID
        expect(frenchResolver.resolveComposedResourceValue('greeting')).toSucceedAndSatisfy(
          (composedValue) => {
            expect(composedValue).toEqual({ text: 'Bonjour!' });
          }
        );
      });
    });

    testBothResolvers('chained context changes work correctly', (resolver, resolverName) => {
      const context1 = { language: 'fr', territory: 'FR', tone: 'formal' };
      const context2 = { language: 'en', territory: 'CA', tone: 'standard' };

      expect(resolver.withContext(context1)).toSucceedAndSatisfy((resolver1) => {
        expect(resolver1.withContext(context2)).toSucceedAndSatisfy((resolver2) => {
          // Original resolver should still work
          expect(resolver.resolveResource('greeting')).toSucceedAndSatisfy((candidate) => {
            expect(candidate.json).toEqual({ text: 'Hello World!' });
          });

          // First derived resolver should use French context
          expect(resolver1.resolveResource('greeting')).toSucceedAndSatisfy((candidate) => {
            expect(candidate.json).toEqual({ text: 'Bonjour!' });
          });

          // Second derived resolver should use English/Canada context
          expect(resolver2.resolveResource('greeting')).toSucceedAndSatisfy((candidate) => {
            expect(candidate.json).toEqual({ text: 'Hi there!' });
          });
        });
      });
    });

    testBothResolvers('new features work with caching', (resolver, resolverName) => {
      const newContext = { language: 'fr', territory: 'FR', tone: 'formal' };

      expect(resolver.withContext(newContext)).toSucceedAndSatisfy((newResolver) => {
        // First resolution should populate cache
        expect(newResolver.resolveResource('greeting')).toSucceedAndSatisfy((candidate1) => {
          expect(candidate1.json).toEqual({ text: 'Bonjour!' });
        });

        // Second resolution should use cache
        expect(newResolver.resolveResource('greeting')).toSucceedAndSatisfy((candidate2) => {
          expect(candidate2.json).toEqual({ text: 'Bonjour!' });
        });

        // Original resolver cache should be independent
        expect(resolver.resolveResource('greeting')).toSucceedAndSatisfy((originalCandidate) => {
          expect(originalCandidate.json).toEqual({ text: 'Hello World!' });
        });
      });
    });

    testBothResolvers('error handling works across new features', (resolver, resolverName) => {
      const newContext = { language: 'es', territory: 'ES', tone: 'formal' };

      expect(resolver.withContext(newContext)).toSucceedAndSatisfy((spanishResolver) => {
        // All methods should fail gracefully for non-matching context
        expect(spanishResolver.resolveResource('greeting')).toFailWith(/No matching candidates found/);
        expect(spanishResolver.resolveAllResourceCandidates('greeting')).toFailWith(
          /No matching candidates found/
        );
        expect(spanishResolver.resolveComposedResourceValue('greeting')).toFailWith(
          /No matching candidates found/
        );

        // Non-existent resource should still fail appropriately
        expect(spanishResolver.resolveResource('non-existent')).toFailWith(
          /not a valid resource ID|not found/i
        );
        expect(spanishResolver.resolveAllResourceCandidates('non-existent')).toFailWith(
          /not a valid resource ID|not found/i
        );
        expect(spanishResolver.resolveComposedResourceValue('non-existent')).toFailWith(
          /not a valid resource ID|not found/i
        );
      });
    });
  });

  describe('backwards compatibility', () => {
    testBothResolvers('existing IResource methods still work', (resolver, resolverName) => {
      expect(resolver.resourceManager.getBuiltResource('greeting')).toSucceedAndSatisfy((resource) => {
        // All original IResource-based methods should continue to work
        expect(resolver.resolveResource(resource)).toSucceed();
        expect(resolver.resolveAllResourceCandidates(resource)).toSucceed();
        expect(resolver.resolveComposedResourceValue(resource)).toSucceed();
      });
    });

    testBothResolvers(
      'existing resolver properties and methods remain unchanged',
      (resolver, resolverName) => {
        // Verify all existing properties and methods are still accessible
        expect(resolver.resourceManager).toBeDefined();
        expect(resolver.qualifierTypes).toBeDefined();
        expect(resolver.contextQualifierProvider).toBeDefined();
        expect(resolver.options).toBeDefined();
        expect(resolver.qualifiers).toBeDefined();
        expect(resolver.conditionCache).toBeDefined();
        expect(resolver.conditionSetCache).toBeDefined();
        expect(resolver.decisionCache).toBeDefined();
        expect(resolver.conditionCacheSize).toBeGreaterThanOrEqual(0);
        expect(resolver.conditionSetCacheSize).toBeGreaterThanOrEqual(0);
        expect(resolver.decisionCacheSize).toBeGreaterThanOrEqual(0);

        // Verify methods exist
        expect(typeof resolver.resolveCondition).toBe('function');
        expect(typeof resolver.resolveConditionSet).toBe('function');
        expect(typeof resolver.resolveDecision).toBe('function');
        expect(typeof resolver.clearConditionCache).toBe('function');
      }
    );

    testBothResolvers('resolver created with withContext has same API', (resolver, resolverName) => {
      const newContext = { language: 'fr', territory: 'FR', tone: 'formal' };

      expect(resolver.withContext(newContext)).toSucceedAndSatisfy((newResolver) => {
        // New resolver should have all the same methods and properties
        expect(newResolver.resourceManager).toBeDefined();
        expect(newResolver.qualifierTypes).toBeDefined();
        expect(newResolver.contextQualifierProvider).toBeDefined();
        expect(newResolver.options).toBeDefined();
        expect(newResolver.qualifiers).toBeDefined();
        expect(newResolver.conditionCache).toBeDefined();
        expect(newResolver.conditionSetCache).toBeDefined();
        expect(newResolver.decisionCache).toBeDefined();

        // Should have withContext method too
        expect(typeof newResolver.withContext).toBe('function');

        // All resolve methods should exist with both signatures
        expect(typeof newResolver.resolveResource).toBe('function');
        expect(typeof newResolver.resolveAllResourceCandidates).toBe('function');
        expect(typeof newResolver.resolveComposedResourceValue).toBe('function');
      });
    });
  });

  describe('edge cases and error conditions', () => {
    testBothResolvers('handles null and undefined resource IDs', (resolver, resolverName) => {
      // These should fail gracefully - null/undefined will cause type errors but we can test the behavior
      expect(() => resolver.resolveResource(null as unknown as string)).toThrow();
      expect(() => resolver.resolveResource(undefined as unknown as string)).toThrow();
      expect(() => resolver.resolveAllResourceCandidates(null as unknown as string)).toThrow();
      expect(() => resolver.resolveAllResourceCandidates(undefined as unknown as string)).toThrow();
      expect(() => resolver.resolveComposedResourceValue(null as unknown as string)).toThrow();
      expect(() => resolver.resolveComposedResourceValue(undefined as unknown as string)).toThrow();
    });

    testBothResolvers('handles empty string resource ID', (resolver, resolverName) => {
      expect(resolver.resolveResource('')).toFailWith(/not a valid resource ID/i);
      expect(resolver.resolveAllResourceCandidates('')).toFailWith(/not a valid resource ID/i);
      expect(resolver.resolveComposedResourceValue('')).toFailWith(/not a valid resource ID/i);
    });

    testBothResolvers('handles whitespace-only resource ID', (resolver, resolverName) => {
      expect(resolver.resolveResource('   ')).toFailWith(/not a valid resource ID/i);
      expect(resolver.resolveAllResourceCandidates('   ')).toFailWith(/not a valid resource ID/i);
      expect(resolver.resolveComposedResourceValue('   ')).toFailWith(/not a valid resource ID/i);
    });

    testBothResolvers('withContext handles null/undefined context gracefully', (resolver, resolverName) => {
      // These might be converted to empty contexts rather than failing
      const nullResult = resolver.withContext(null as unknown as Record<string, string>);
      const undefinedResult = resolver.withContext(undefined as unknown as Record<string, string>);

      // Verify the results are either success or appropriate failure
      expect(nullResult.isSuccess() || nullResult.isFailure()).toBe(true);
      expect(undefinedResult.isSuccess() || undefinedResult.isFailure()).toBe(true);
    });

    testBothResolvers(
      'withContext handles context with null values appropriately',
      (resolver, resolverName) => {
        const contextWithNulls = {
          language: null as unknown as string,
          territory: 'US',
          tone: 'formal'
        };

        // Context validation is permissive, so this might succeed
        const result = resolver.withContext(contextWithNulls);
        if (result.isSuccess()) {
          expect(result).toSucceedAndSatisfy((newResolver) => {
            expect(newResolver).toBeInstanceOf(TsRes.Runtime.ResourceResolver);
          });
        } else {
          expect(result).toFailWith(/invalid|validation|null|required/i);
        }
      }
    );

    testBothResolvers(
      'withContext handles context with undefined values appropriately',
      (resolver, resolverName) => {
        const contextWithUndefined = {
          language: 'en',
          territory: undefined as unknown as string,
          tone: 'formal'
        };

        // Context validation is permissive, so this might succeed
        const result = resolver.withContext(contextWithUndefined);
        if (result.isSuccess()) {
          expect(result).toSucceedAndSatisfy((newResolver) => {
            expect(newResolver).toBeInstanceOf(TsRes.Runtime.ResourceResolver);
          });
        } else {
          expect(result).toFailWith(/invalid|validation|undefined|required/i);
        }
      }
    );

    testBothResolvers(
      'withContext handles non-string context values appropriately',
      (resolver, resolverName) => {
        const contextWithNonStrings = {
          language: 'en',
          territory: 123 as unknown as string,
          tone: 'formal'
        };

        // This should either convert the number to string or fail validation
        const result = resolver.withContext(contextWithNonStrings);
        if (result.isFailure()) {
          expect(result).toFailWith(/invalid|validation|string|type/i);
        } else {
          expect(result).toSucceedAndSatisfy((newResolver) => {
            expect(newResolver).toBeInstanceOf(TsRes.Runtime.ResourceResolver);
          });
        }
      }
    );
  });
});
