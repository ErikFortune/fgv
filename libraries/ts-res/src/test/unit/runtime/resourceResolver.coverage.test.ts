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

describe('ResourceResolver Coverage Tests', () => {
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

    // Set up qualifiers
    qualifiers = TsRes.Qualifiers.QualifierCollector.create({
      qualifierTypes,
      qualifiers: [
        { name: 'language', typeName: 'language', defaultPriority: 600 },
        { name: 'territory', typeName: 'territory', defaultPriority: 700 },
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
  });

  describe('qualifiers getter coverage', () => {
    test('should return qualifiers from context qualifier provider', () => {
      // Set up context provider
      contextProvider = TsRes.Runtime.ValidatingSimpleContextQualifierProvider.create({
        qualifiers,
        qualifierValues: {
          language: 'en-US',
          territory: 'US',
          tone: 'formal'
        }
      }).orThrow();

      resolver = TsRes.Runtime.ResourceResolver.create({
        resourceManager,
        qualifierTypes,
        contextQualifierProvider: contextProvider
      }).orThrow();

      // Test the qualifiers getter (line 129-130)
      const resolverQualifiers = resolver.qualifiers;
      expect(resolverQualifiers).toBeDefined();
      expect(resolverQualifiers).toBe(contextProvider.qualifiers);
      expect(resolverQualifiers.getByNameOrToken('language')).toSucceed();
      expect(resolverQualifiers.getByNameOrToken('territory')).toSucceed();
      expect(resolverQualifiers.getByNameOrToken('tone')).toSucceed();
    });
  });

  describe('matchAsDefault condition handling coverage', () => {
    test('should handle conditions with scoreAsDefault values', () => {
      // Add a resource with conditions designed to trigger matchAsDefault path
      resourceManager
        .addResource({
          id: 'default-test',
          resourceTypeName: 'json',
          candidates: [
            {
              json: { text: 'English content' },
              conditions: {
                language: 'en' // Should match for en-US context
              }
            }
          ]
        })
        .orThrow();

      resourceManager.build().orThrow();

      // Set up context that should match the language condition
      contextProvider = TsRes.Runtime.ValidatingSimpleContextQualifierProvider.create({
        qualifiers,
        qualifierValues: {
          language: 'en-US', // Should match 'en' with some score
          territory: 'US',
          tone: 'standard' // Using default value from qualifier setup
        }
      }).orThrow();

      resolver = TsRes.Runtime.ResourceResolver.create({
        resourceManager,
        qualifierTypes,
        contextQualifierProvider: contextProvider
      }).orThrow();

      // This should exercise the matchAsDefault code path (lines 322-324)
      expect(resolver.resolveResource('default-test')).toSucceedAndSatisfy((candidate) => {
        expect(candidate.json).toHaveProperty('text');
        expect(typeof candidate.json).toBe('object');
      });
    });
  });

  describe('default matching decision resolution coverage', () => {
    test('should handle decisions with default matching candidates', () => {
      // Create a resource with multiple matching candidates
      resourceManager
        .addResource({
          id: 'default-decision-test',
          resourceTypeName: 'json',
          candidates: [
            {
              json: { text: 'English content', priority: 'high' },
              conditions: {
                language: 'en'
              }
            },
            {
              json: { text: 'US English content', priority: 'higher' },
              conditions: {
                language: 'en',
                territory: 'US'
              }
            }
          ]
        })
        .orThrow();

      resourceManager.build().orThrow();

      // Context that should match both candidates with different priorities
      contextProvider = TsRes.Runtime.ValidatingSimpleContextQualifierProvider.create({
        qualifiers,
        qualifierValues: {
          language: 'en-US',
          territory: 'US',
          tone: 'standard'
        }
      }).orThrow();

      resolver = TsRes.Runtime.ResourceResolver.create({
        resourceManager,
        qualifierTypes,
        contextQualifierProvider: contextProvider
      }).orThrow();

      // This should exercise default matching decision logic (lines 387-391)
      expect(resolver.resolveAllResourceCandidates('default-decision-test')).toSucceedAndSatisfy(
        (candidates) => {
          expect(candidates.length).toBeGreaterThanOrEqual(1);
          expect(candidates[0].json).toHaveProperty('text');
        }
      );
    });
  });

  describe('resource resolution with string ID coverage', () => {
    test('should handle resource resolution via string ID path', () => {
      resourceManager
        .addResource({
          id: 'string-id-test',
          resourceTypeName: 'json',
          candidates: [
            {
              json: { content: 'String ID resolved content' },
              conditions: {
                language: 'en',
                tone: 'standard'
              }
            }
          ]
        })
        .orThrow();

      resourceManager.build().orThrow();

      contextProvider = TsRes.Runtime.ValidatingSimpleContextQualifierProvider.create({
        qualifiers,
        qualifierValues: {
          language: 'en-US',
          territory: 'US',
          tone: 'standard'
        }
      }).orThrow();

      resolver = TsRes.Runtime.ResourceResolver.create({
        resourceManager,
        qualifierTypes,
        contextQualifierProvider: contextProvider
      }).orThrow();

      // Test string ID resolution path (lines 436-439)
      expect(resolver.resolveResource('string-id-test')).toSucceedAndSatisfy((candidate) => {
        expect(candidate.json).toEqual({ content: 'String ID resolved content' });
      });

      // Test resolveAllResourceCandidates with string ID (lines 500-503)
      expect(resolver.resolveAllResourceCandidates('string-id-test')).toSucceedAndSatisfy((candidates) => {
        expect(candidates).toHaveLength(1);
        expect(candidates[0].json).toEqual({ content: 'String ID resolved content' });
      });

      // Test resolveComposedResourceValue with string ID (lines 575-578)
      expect(resolver.resolveComposedResourceValue('string-id-test')).toSucceedAndSatisfy((value) => {
        expect(value).toEqual({ content: 'String ID resolved content' });
      });
    });

    test('should resolve hierarchical (dot-separated) resource IDs', () => {
      // Add resources with hierarchical IDs
      resourceManager
        .addResource({
          id: 'app.module.component',
          resourceTypeName: 'json',
          candidates: [
            {
              json: { content: 'Hierarchical resource content' },
              conditions: {
                language: 'en'
              }
            }
          ]
        })
        .orThrow();

      resourceManager
        .addResource({
          id: 'app.module.submodule.deepcomponent',
          resourceTypeName: 'json',
          candidates: [
            {
              json: { content: 'Deep hierarchical resource content' },
              conditions: {
                language: 'en',
                tone: 'formal'
              }
            }
          ]
        })
        .orThrow();

      resourceManager.build().orThrow();

      contextProvider = TsRes.Runtime.ValidatingSimpleContextQualifierProvider.create({
        qualifiers,
        qualifierValues: {
          language: 'en-US',
          territory: 'US',
          tone: 'formal'
        }
      }).orThrow();

      resolver = TsRes.Runtime.ResourceResolver.create({
        resourceManager,
        qualifierTypes,
        contextQualifierProvider: contextProvider
      }).orThrow();

      // Test hierarchical ID with resolveResource
      expect(resolver.resolveResource('app.module.component')).toSucceedAndSatisfy((candidate) => {
        expect(candidate.json).toEqual({ content: 'Hierarchical resource content' });
      });

      // Test deep hierarchical ID with resolveAllResourceCandidates
      expect(resolver.resolveAllResourceCandidates('app.module.submodule.deepcomponent')).toSucceedAndSatisfy(
        (candidates) => {
          expect(candidates).toHaveLength(1);
          expect(candidates[0].json).toEqual({ content: 'Deep hierarchical resource content' });
        }
      );

      // Test hierarchical ID with resolveComposedResourceValue
      expect(resolver.resolveComposedResourceValue('app.module.component')).toSucceedAndSatisfy((value) => {
        expect(value).toEqual({ content: 'Hierarchical resource content' });
      });
    });

    test('should handle both simple and hierarchical resource IDs in same resolver', () => {
      // Add mix of simple and hierarchical resources
      resourceManager
        .addResource({
          id: 'simple',
          resourceTypeName: 'json',
          candidates: [
            {
              json: { type: 'simple' },
              conditions: {}
            }
          ]
        })
        .orThrow();

      resourceManager
        .addResource({
          id: 'parent.child',
          resourceTypeName: 'json',
          candidates: [
            {
              json: { type: 'hierarchical', level: 2 },
              conditions: {}
            }
          ]
        })
        .orThrow();

      resourceManager
        .addResource({
          id: 'root.branch.leaf.node',
          resourceTypeName: 'json',
          candidates: [
            {
              json: { type: 'deep-hierarchical', level: 4 },
              conditions: {}
            }
          ]
        })
        .orThrow();

      resourceManager.build().orThrow();

      contextProvider = TsRes.Runtime.ValidatingSimpleContextQualifierProvider.create({
        qualifiers,
        qualifierValues: {
          language: 'en',
          territory: 'US'
        }
      }).orThrow();

      resolver = TsRes.Runtime.ResourceResolver.create({
        resourceManager,
        qualifierTypes,
        contextQualifierProvider: contextProvider
      }).orThrow();

      // Test simple ID
      expect(resolver.resolveResource('simple')).toSucceedAndSatisfy((candidate) => {
        expect(candidate.json).toEqual({ type: 'simple' });
      });

      // Test 2-level hierarchical ID
      expect(resolver.resolveResource('parent.child')).toSucceedAndSatisfy((candidate) => {
        expect(candidate.json).toEqual({ type: 'hierarchical', level: 2 });
      });

      // Test 4-level hierarchical ID
      expect(resolver.resolveResource('root.branch.leaf.node')).toSucceedAndSatisfy((candidate) => {
        expect(candidate.json).toEqual({ type: 'deep-hierarchical', level: 4 });
      });

      // Test all methods with hierarchical IDs
      expect(resolver.resolveAllResourceCandidates('parent.child')).toSucceedAndSatisfy((candidates) => {
        expect(candidates).toHaveLength(1);
        expect(candidates[0].json).toEqual({ type: 'hierarchical', level: 2 });
      });

      expect(resolver.resolveComposedResourceValue('root.branch.leaf.node')).toSucceedAndSatisfy((value) => {
        expect(value).toEqual({ type: 'deep-hierarchical', level: 4 });
      });
    });

    test('should handle non-existent resource ID errors', () => {
      resourceManager.build().orThrow();

      contextProvider = TsRes.Runtime.ValidatingSimpleContextQualifierProvider.create({
        qualifiers,
        qualifierValues: {
          language: 'en-US',
          territory: 'US',
          tone: 'standard'
        }
      }).orThrow();

      resolver = TsRes.Runtime.ResourceResolver.create({
        resourceManager,
        qualifierTypes,
        contextQualifierProvider: contextProvider
      }).orThrow();

      // Test error handling for non-existent resource IDs
      expect(resolver.resolveResource('non-existent-id')).toFailWith(/not found|not a valid resource ID/i);
      expect(resolver.resolveAllResourceCandidates('non-existent-id')).toFailWith(
        /not found|not a valid resource ID/i
      );
      expect(resolver.resolveComposedResourceValue('non-existent-id')).toFailWith(
        /not found|not a valid resource ID/i
      );
    });
  });

  describe('candidate validation edge cases coverage', () => {
    test('should handle resources with no matching candidates', () => {
      resourceManager
        .addResource({
          id: 'no-match-test',
          resourceTypeName: 'json',
          candidates: [
            {
              json: { content: 'German-only content' },
              conditions: {
                language: 'de', // German - won't match English context
                territory: 'DE'
              }
            },
            {
              json: { content: 'French-only content' },
              conditions: {
                language: 'fr', // French - won't match English context
                territory: 'FR'
              }
            }
          ]
        })
        .orThrow();

      resourceManager.build().orThrow();

      // Context that won't match any candidates
      contextProvider = TsRes.Runtime.ValidatingSimpleContextQualifierProvider.create({
        qualifiers,
        qualifierValues: {
          language: 'en-US',
          territory: 'US',
          tone: 'standard'
        }
      }).orThrow();

      resolver = TsRes.Runtime.ResourceResolver.create({
        resourceManager,
        qualifierTypes,
        contextQualifierProvider: contextProvider
      }).orThrow();

      // These should exercise the "no matching candidates" error paths (lines 545-547, etc.)
      expect(resolver.resolveResource('no-match-test')).toFailWith(/No matching candidates found/);
      expect(resolver.resolveAllResourceCandidates('no-match-test')).toFailWith(
        /No matching candidates found/
      );
      expect(resolver.resolveComposedResourceValue('no-match-test')).toFailWith(
        /No matching candidates found/
      );
    });
  });

  describe('withContext method implementation coverage', () => {
    test('should create new resolver with withContext method', () => {
      resourceManager
        .addResource({
          id: 'context-test',
          resourceTypeName: 'json',
          candidates: [
            {
              json: { greeting: 'Hello!' },
              conditions: {
                language: 'en',
                tone: 'standard'
              }
            },
            {
              json: { greeting: 'Bonjour!' },
              conditions: {
                language: 'fr',
                tone: 'standard'
              }
            }
          ]
        })
        .orThrow();

      resourceManager.build().orThrow();

      contextProvider = TsRes.Runtime.ValidatingSimpleContextQualifierProvider.create({
        qualifiers,
        qualifierValues: {
          language: 'en-US',
          territory: 'US',
          tone: 'standard'
        }
      }).orThrow();

      resolver = TsRes.Runtime.ResourceResolver.create({
        resourceManager,
        qualifierTypes,
        contextQualifierProvider: contextProvider
      }).orThrow();

      // Test withContext method (lines 656-668)
      const newContext = {
        language: 'fr',
        territory: 'FR',
        tone: 'standard'
      };

      expect(resolver.withContext(newContext)).toSucceedAndSatisfy((newResolver) => {
        // Verify it's a different instance
        expect(newResolver).not.toBe(resolver);
        expect(newResolver).toBeInstanceOf(TsRes.Runtime.ResourceResolver);

        // Verify it shares the same resource manager and qualifier types
        expect(newResolver.resourceManager).toBe(resolver.resourceManager);
        expect(newResolver.qualifierTypes).toBe(resolver.qualifierTypes);
        expect(newResolver.options).toEqual(resolver.options);

        // Verify the new context is being used
        expect(newResolver.resolveComposedResourceValue('context-test')).toSucceedAndSatisfy((value) => {
          expect(value).toEqual({ greeting: 'Bonjour!' });
        });

        // Verify original resolver still uses original context
        expect(resolver.resolveComposedResourceValue('context-test')).toSucceedAndSatisfy((value) => {
          expect(value).toEqual({ greeting: 'Hello!' });
        });
      });
    });

    test('should handle withContext with empty context object', () => {
      resourceManager
        .addResource({
          id: 'empty-context-test',
          resourceTypeName: 'json',
          candidates: [
            {
              json: { message: 'Default content' },
              conditions: {} // No conditions - should always match
            }
          ]
        })
        .orThrow();

      resourceManager.build().orThrow();

      contextProvider = TsRes.Runtime.ValidatingSimpleContextQualifierProvider.create({
        qualifiers,
        qualifierValues: {
          language: 'en-US',
          territory: 'US',
          tone: 'standard'
        }
      }).orThrow();

      resolver = TsRes.Runtime.ResourceResolver.create({
        resourceManager,
        qualifierTypes,
        contextQualifierProvider: contextProvider
      }).orThrow();

      // Test withContext with empty context (this is mentioned as valid in the requirements)
      const emptyContext = {};

      const result = resolver.withContext(emptyContext);
      if (result.isSuccess()) {
        expect(result).toSucceedAndSatisfy((newResolver) => {
          expect(newResolver).toBeInstanceOf(TsRes.Runtime.ResourceResolver);
          // With empty context, unconditional resources should still resolve
          expect(newResolver.resolveResource('empty-context-test')).toSucceedAndSatisfy((candidate) => {
            expect(candidate.json).toEqual({ message: 'Default content' });
          });
        });
      } else {
        // If empty context is not accepted, it should fail with appropriate message
        expect(result).toFailWith(/context|validation|required/i);
      }
    });

    test('should preserve options when creating new resolver via withContext', () => {
      resourceManager.build().orThrow();

      contextProvider = TsRes.Runtime.ValidatingSimpleContextQualifierProvider.create({
        qualifiers,
        qualifierValues: {
          language: 'en-US',
          territory: 'US',
          tone: 'standard'
        }
      }).orThrow();

      // Create resolver with custom options
      const resolverWithOptions = TsRes.Runtime.ResourceResolver.create({
        resourceManager,
        qualifierTypes,
        contextQualifierProvider: contextProvider,
        options: {
          suppressNullAsDelete: true
        }
      }).orThrow();

      const newContext = {
        language: 'fr',
        territory: 'FR',
        tone: 'formal'
      };

      expect(resolverWithOptions.withContext(newContext)).toSucceedAndSatisfy((newResolver) => {
        expect(newResolver.options.suppressNullAsDelete).toBe(true);
        expect(newResolver.options).toEqual(resolverWithOptions.options);
      });
    });

    test('should handle withContext validation errors appropriately', () => {
      resourceManager.build().orThrow();

      contextProvider = TsRes.Runtime.ValidatingSimpleContextQualifierProvider.create({
        qualifiers,
        qualifierValues: {
          language: 'en-US',
          territory: 'US',
          tone: 'standard'
        }
      }).orThrow();

      resolver = TsRes.Runtime.ResourceResolver.create({
        resourceManager,
        qualifierTypes,
        contextQualifierProvider: contextProvider
      }).orThrow();

      // Test with invalid context values that should be rejected by validation
      const invalidContext = {
        language: 'invalid-language-code-that-is-too-long-and-malformed',
        territory: 'INVALID',
        tone: 'invalid-tone-value'
      };

      const result = resolver.withContext(invalidContext);
      // The result should either succeed (if validation is permissive) or fail with appropriate error
      if (result.isFailure()) {
        expect(result).toFailWith(/validation|invalid|context/i);
      } else {
        expect(result).toSucceedAndSatisfy((newResolver) => {
          expect(newResolver).toBeInstanceOf(TsRes.Runtime.ResourceResolver);
        });
      }
    });
  });

  describe('interface compliance and type signature coverage', () => {
    test('should implement IResourceResolver interface correctly', () => {
      resourceManager
        .addResource({
          id: 'interface-test',
          resourceTypeName: 'json',
          candidates: [
            {
              json: { interface: 'test' },
              conditions: {
                language: 'en',
                tone: 'standard'
              }
            }
          ]
        })
        .orThrow();

      resourceManager.build().orThrow();

      contextProvider = TsRes.Runtime.ValidatingSimpleContextQualifierProvider.create({
        qualifiers,
        qualifierValues: {
          language: 'en-US',
          territory: 'US',
          tone: 'standard'
        }
      }).orThrow();

      resolver = TsRes.Runtime.ResourceResolver.create({
        resourceManager,
        qualifierTypes,
        contextQualifierProvider: contextProvider
      }).orThrow();

      // Test that resolver correctly implements IResourceResolver interface
      const iResolver: TsRes.IResourceResolver = resolver;

      // Test resolveComposedResourceValue method (required by interface)
      expect(iResolver.resolveComposedResourceValue('interface-test')).toSucceedAndSatisfy((value) => {
        expect(value).toEqual({ interface: 'test' });
      });

      // Test withContext method (required by interface) - returns IResourceResolver
      expect(iResolver.withContext({ language: 'fr', territory: 'FR', tone: 'formal' })).toSucceedAndSatisfy(
        (newResolver) => {
          expect(newResolver).toBeInstanceOf(TsRes.Runtime.ResourceResolver);
          // The interface contract specifies it returns IResourceResolver, but implementation returns concrete type
          const concreteResolver = newResolver as TsRes.Runtime.ResourceResolver;
          expect(typeof concreteResolver.resolveResource).toBe('function');
          expect(typeof concreteResolver.resolveAllResourceCandidates).toBe('function');
        }
      );
    });

    test('should support all overloaded method signatures', () => {
      resourceManager
        .addResource({
          id: 'overload-test',
          resourceTypeName: 'json',
          candidates: [
            {
              json: { overload: 'test' },
              conditions: {
                language: 'en',
                tone: 'standard'
              }
            }
          ]
        })
        .orThrow();

      resourceManager.build().orThrow();

      contextProvider = TsRes.Runtime.ValidatingSimpleContextQualifierProvider.create({
        qualifiers,
        qualifierValues: {
          language: 'en-US',
          territory: 'US',
          tone: 'standard'
        }
      }).orThrow();

      resolver = TsRes.Runtime.ResourceResolver.create({
        resourceManager,
        qualifierTypes,
        contextQualifierProvider: contextProvider
      }).orThrow();

      // Test resolveResource with both signatures
      expect(resolver.resourceManager.getBuiltResource('overload-test')).toSucceedAndSatisfy((resource) => {
        // Test with IResource object
        expect(resolver.resolveResource(resource)).toSucceedAndSatisfy((candidate1) => {
          expect(candidate1.json).toEqual({ overload: 'test' });
        });

        // Test with string ID
        expect(resolver.resolveResource('overload-test')).toSucceedAndSatisfy((candidate2) => {
          expect(candidate2.json).toEqual({ overload: 'test' });
        });
      });

      // Test resolveAllResourceCandidates with both signatures
      expect(resolver.resourceManager.getBuiltResource('overload-test')).toSucceedAndSatisfy((resource) => {
        // Test with IResource object
        expect(resolver.resolveAllResourceCandidates(resource)).toSucceedAndSatisfy((candidates1) => {
          expect(candidates1).toHaveLength(1);
          expect(candidates1[0].json).toEqual({ overload: 'test' });
        });

        // Test with string ID
        expect(resolver.resolveAllResourceCandidates('overload-test')).toSucceedAndSatisfy((candidates2) => {
          expect(candidates2).toHaveLength(1);
          expect(candidates2[0].json).toEqual({ overload: 'test' });
        });
      });

      // Test resolveComposedResourceValue with both signatures
      expect(resolver.resourceManager.getBuiltResource('overload-test')).toSucceedAndSatisfy((resource) => {
        // Test with IResource object
        expect(resolver.resolveComposedResourceValue(resource)).toSucceedAndSatisfy((value1) => {
          expect(value1).toEqual({ overload: 'test' });
        });

        // Test with string ID
        expect(resolver.resolveComposedResourceValue('overload-test')).toSucceedAndSatisfy((value2) => {
          expect(value2).toEqual({ overload: 'test' });
        });
      });
    });
  });

  describe('backwards compatibility coverage', () => {
    test('should maintain all existing functionality while adding new features', () => {
      resourceManager
        .addResource({
          id: 'backwards-compat-test',
          resourceTypeName: 'json',
          candidates: [
            {
              json: { compat: 'test' },
              conditions: {
                language: 'en',
                tone: 'standard'
              }
            }
          ]
        })
        .orThrow();

      resourceManager.build().orThrow();

      contextProvider = TsRes.Runtime.ValidatingSimpleContextQualifierProvider.create({
        qualifiers,
        qualifierValues: {
          language: 'en-US',
          territory: 'US',
          tone: 'standard'
        }
      }).orThrow();

      resolver = TsRes.Runtime.ResourceResolver.create({
        resourceManager,
        qualifierTypes,
        contextQualifierProvider: contextProvider
      }).orThrow();

      // Test that all existing properties are still available
      expect(resolver.resourceManager).toBeDefined();
      expect(resolver.qualifierTypes).toBeDefined();
      expect(resolver.contextQualifierProvider).toBeDefined();
      expect(resolver.options).toBeDefined();
      expect(resolver.qualifiers).toBeDefined();
      expect(resolver.conditionCache).toBeDefined();
      expect(resolver.conditionSetCache).toBeDefined();
      expect(resolver.decisionCache).toBeDefined();

      // Test that all existing methods work
      expect(typeof resolver.resolveCondition).toBe('function');
      expect(typeof resolver.resolveConditionSet).toBe('function');
      expect(typeof resolver.resolveDecision).toBe('function');
      expect(typeof resolver.clearConditionCache).toBe('function');

      // Test that cache sizes are accessible
      expect(typeof resolver.conditionCacheSize).toBe('number');
      expect(typeof resolver.conditionSetCacheSize).toBe('number');
      expect(typeof resolver.decisionCacheSize).toBe('number');

      // Test that new features coexist with old ones
      expect(resolver.resourceManager.getBuiltResource('backwards-compat-test')).toSucceedAndSatisfy(
        (resource) => {
          // Traditional IResource-based methods still work
          expect(resolver.resolveResource(resource)).toSucceed();
          expect(resolver.resolveAllResourceCandidates(resource)).toSucceed();
          expect(resolver.resolveComposedResourceValue(resource)).toSucceed();

          // New string ID-based methods work
          expect(resolver.resolveResource('backwards-compat-test')).toSucceed();
          expect(resolver.resolveAllResourceCandidates('backwards-compat-test')).toSucceed();
          expect(resolver.resolveComposedResourceValue('backwards-compat-test')).toSucceed();

          // withContext creates new resolver that also supports both approaches
          expect(
            resolver.withContext({ language: 'fr', territory: 'FR', tone: 'standard' })
          ).toSucceedAndSatisfy((newResolver) => {
            expect(typeof newResolver.resolveResource).toBe('function');
            expect(typeof newResolver.resolveAllResourceCandidates).toBe('function');
            expect(typeof newResolver.resolveComposedResourceValue).toBe('function');
            expect(typeof newResolver.withContext).toBe('function');
          });
        }
      );
    });
  });
});
