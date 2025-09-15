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

describe('ResourceManagerBuilder - Clone Method', () => {
  let qualifierTypes: TsRes.QualifierTypes.QualifierTypeCollector;
  let qualifierDecls: TsRes.Qualifiers.IQualifierDecl[];
  let qualifiers: TsRes.Qualifiers.QualifierCollector;
  let resourceTypes: TsRes.ResourceTypes.ResourceTypeCollector;

  beforeAll(() => {
    qualifierTypes = TsRes.QualifierTypes.QualifierTypeCollector.create({
      qualifierTypes: [
        TsRes.QualifierTypes.LanguageQualifierType.create().orThrow(),
        TsRes.QualifierTypes.TerritoryQualifierType.create().orThrow(),
        TsRes.QualifierTypes.LiteralQualifierType.create().orThrow()
      ]
    }).orThrow();
    qualifierDecls = [
      { name: 'homeTerritory', typeName: 'territory', defaultPriority: 800 },
      { name: 'currentTerritory', typeName: 'territory', defaultPriority: 700 },
      { name: 'language', typeName: 'language', defaultPriority: 600 },
      { name: 'some_thing', typeName: 'literal', defaultPriority: 500 }
    ];

    qualifiers = TsRes.Qualifiers.QualifierCollector.create({
      qualifierTypes,
      qualifiers: qualifierDecls
    }).orThrow();

    resourceTypes = TsRes.ResourceTypes.ResourceTypeCollector.create({
      resourceTypes: [
        TsRes.ResourceTypes.JsonResourceType.create().orThrow(),
        TsRes.ResourceTypes.JsonResourceType.create({ key: 'other' }).orThrow()
      ]
    }).orThrow();
  });

  describe('clone method with IResourceManagerCloneOptions', () => {
    let sourceManager: TsRes.Resources.ResourceManagerBuilder;

    beforeEach(() => {
      sourceManager = TsRes.Resources.ResourceManagerBuilder.create({
        qualifiers,
        resourceTypes
      }).orThrow();

      // Add some original resources to the source manager
      sourceManager
        .addLooseCandidate({
          id: 'test.resource',
          json: { message: 'original hello' },
          conditions: { language: 'en' },
          resourceTypeName: 'json'
        })
        .orThrow();

      sourceManager
        .addLooseCandidate({
          id: 'test.resource',
          json: { message: 'original bonjour' },
          conditions: { language: 'fr' },
          resourceTypeName: 'json'
        })
        .orThrow();

      sourceManager
        .addLooseCandidate({
          id: 'other.resource',
          json: { value: 'original other' },
          conditions: { homeTerritory: 'US' },
          resourceTypeName: 'json'
        })
        .orThrow();
    });

    describe('basic cloning functionality', () => {
      test('clones manager without candidates option', () => {
        const cloneResult = sourceManager.clone();

        expect(cloneResult).toSucceedAndSatisfy((clonedManager) => {
          expect(clonedManager.size).toBe(sourceManager.size);
          expect(clonedManager.numCandidates).toBe(sourceManager.numCandidates);

          // Verify the cloned manager has the same resources
          const originalResourceIds = Array.from(sourceManager.resources.keys());
          const clonedResourceIds = Array.from(clonedManager.resources.keys());
          expect(clonedResourceIds.sort()).toEqual(originalResourceIds.sort());
        });
      });

      test('clones manager with empty candidates array', () => {
        const cloneResult = sourceManager.clone({
          candidates: []
        });

        expect(cloneResult).toSucceedAndSatisfy((clonedManager) => {
          expect(clonedManager.size).toBe(sourceManager.size);
          expect(clonedManager.numCandidates).toBe(sourceManager.numCandidates);
        });
      });
    });

    describe('adding new candidates without collision', () => {
      test('adds new candidate for existing resource with different conditions', () => {
        const editCandidates: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[] = [
          {
            id: 'test.resource',
            json: { message: 'edit hola' },
            conditions: { language: 'es' }, // Different condition from existing candidates
            resourceTypeName: 'json'
          }
        ];

        const cloneResult = sourceManager.clone({
          candidates: editCandidates
        });

        expect(cloneResult).toSucceedAndSatisfy((clonedManager) => {
          expect(clonedManager.size).toBe(sourceManager.size); // Same number of resources
          expect(clonedManager.numCandidates).toBe(sourceManager.numCandidates + 1); // One more candidate

          // Get the resource and verify it has all three candidates
          const testResource = clonedManager.resources.get('test.resource' as TsRes.ResourceId);
          expect(testResource).toSucceedAndSatisfy((resource) => {
            const candidates = resource.candidates;
            expect(candidates.length).toBe(3); // Original 2 + 1 edit

            const messages = candidates.map(
              (c: TsRes.Resources.ResourceCandidate) => (c.json as { message: string }).message
            );
            expect(messages).toContain('original hello');
            expect(messages).toContain('original bonjour');
            expect(messages).toContain('edit hola');
          });
        });
      });

      test('adds candidate for new resource not in source manager', () => {
        const editCandidates: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[] = [
          {
            id: 'new.resource',
            json: { content: 'brand new' },
            conditions: { language: 'en' },
            resourceTypeName: 'json'
          }
        ];

        const cloneResult = sourceManager.clone({
          candidates: editCandidates
        });

        expect(cloneResult).toSucceedAndSatisfy((clonedManager) => {
          expect(clonedManager.size).toBe(sourceManager.size + 1); // One more resource
          expect(clonedManager.numCandidates).toBe(sourceManager.numCandidates + 1); // One more candidate

          // Verify the new resource exists
          const newResource = clonedManager.resources.get('new.resource' as TsRes.ResourceId);
          expect(newResource).toSucceedAndSatisfy((resource) => {
            const candidates = resource.candidates;
            expect(candidates.length).toBe(1);
            expect(candidates[0].json).toEqual({ content: 'brand new' });
          });
        });
      });
    });

    describe('collision detection and replacement', () => {
      test('replaces existing candidate when condition sets match exactly', () => {
        const editCandidates: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[] = [
          {
            id: 'test.resource',
            json: { message: 'edit hello replaced' },
            conditions: { language: 'en' }, // Same condition as existing candidate
            resourceTypeName: 'json'
          }
        ];

        const cloneResult = sourceManager.clone({
          candidates: editCandidates
        });

        expect(cloneResult).toSucceedAndSatisfy((clonedManager) => {
          expect(clonedManager.size).toBe(sourceManager.size); // Same number of resources
          expect(clonedManager.numCandidates).toBe(sourceManager.numCandidates); // Same number of candidates (replacement)

          // Get the resource and verify the replacement occurred
          const testResource = clonedManager.resources.get('test.resource' as TsRes.ResourceId);
          expect(testResource).toSucceedAndSatisfy((resource) => {
            const candidates = resource.candidates;
            expect(candidates.length).toBe(2); // Still 2 candidates

            const messages = candidates.map(
              (c: TsRes.Resources.ResourceCandidate) => (c.json as { message: string }).message
            );
            expect(messages).toContain('edit hello replaced'); // New message
            expect(messages).toContain('original bonjour'); // Unchanged
            expect(messages).not.toContain('original hello'); // Replaced
          });
        });
      });

      test('handles multiple collisions and additions in same edit', () => {
        const editCandidates: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[] = [
          {
            id: 'test.resource',
            json: { message: 'edit english replaced' },
            conditions: { language: 'en' }, // Collision - replace existing
            resourceTypeName: 'json'
          },
          {
            id: 'test.resource',
            json: { message: 'edit spanish added' },
            conditions: { language: 'es' }, // No collision - add new
            resourceTypeName: 'json'
          },
          {
            id: 'other.resource',
            json: { value: 'edit US replaced' },
            conditions: { homeTerritory: 'US' }, // Collision - replace existing
            resourceTypeName: 'json'
          }
        ];

        const cloneResult = sourceManager.clone({
          candidates: editCandidates
        });

        expect(cloneResult).toSucceedAndSatisfy((clonedManager) => {
          expect(clonedManager.size).toBe(sourceManager.size); // Same number of resources
          expect(clonedManager.numCandidates).toBe(sourceManager.numCandidates + 1); // +1 for new Spanish candidate

          // Verify test.resource changes
          const testResource = clonedManager.resources.get('test.resource' as TsRes.ResourceId);
          expect(testResource).toSucceedAndSatisfy((resource) => {
            const candidates = resource.candidates;
            expect(candidates.length).toBe(3); // French + replaced English + new Spanish

            const messages = candidates.map(
              (c: TsRes.Resources.ResourceCandidate) => (c.json as { message: string }).message
            );
            expect(messages).toContain('edit english replaced');
            expect(messages).toContain('original bonjour');
            expect(messages).toContain('edit spanish added');
            expect(messages).not.toContain('original hello');
          });

          // Verify other.resource changes
          const otherResource = clonedManager.resources.get('other.resource' as TsRes.ResourceId);
          expect(otherResource).toSucceedAndSatisfy((resource) => {
            const candidates = resource.candidates;
            expect(candidates.length).toBe(1); // Only the replaced candidate
            expect(candidates[0].json).toEqual({ value: 'edit US replaced' });
          });
        });
      });
    });

    describe('different condition set formats', () => {
      test('handles condition sets as arrays', () => {
        const editCandidates: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[] = [
          {
            id: 'test.resource',
            json: { message: 'array format' },
            conditions: [{ qualifierName: 'language', value: 'en' }],
            resourceTypeName: 'json'
          }
        ];

        const cloneResult = sourceManager.clone({
          candidates: editCandidates
        });

        expect(cloneResult).toSucceedAndSatisfy((clonedManager) => {
          const testResource = clonedManager.resources.get('test.resource' as TsRes.ResourceId);
          expect(testResource).toSucceedAndSatisfy((resource) => {
            const candidates = resource.candidates;
            const messages = candidates.map(
              (c: TsRes.Resources.ResourceCandidate) => (c.json as { message: string }).message
            );
            expect(messages).toContain('array format');
            expect(messages).not.toContain('original hello'); // Should be replaced
          });
        });
      });

      test('handles unconditional candidates', () => {
        const editCandidates: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[] = [
          {
            id: 'test.resource',
            json: { message: 'unconditional' },
            // No conditions - should be unconditional
            resourceTypeName: 'json'
          }
        ];

        const cloneResult = sourceManager.clone({
          candidates: editCandidates
        });

        expect(cloneResult).toSucceedAndSatisfy((clonedManager) => {
          const testResource = clonedManager.resources.get('test.resource' as TsRes.ResourceId);
          expect(testResource).toSucceedAndSatisfy((resource) => {
            const candidates = resource.candidates;
            expect(candidates.length).toBe(3); // Original 2 + new unconditional

            const messages = candidates.map(
              (c: TsRes.Resources.ResourceCandidate) => (c.json as { message: string }).message
            );
            expect(messages).toContain('unconditional');
            expect(messages).toContain('original hello');
            expect(messages).toContain('original bonjour');
          });
        });
      });

      test('handles complex condition sets with multiple qualifiers', () => {
        const editCandidates: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[] = [
          {
            id: 'test.resource',
            json: { message: 'complex conditions' },
            conditions: {
              language: 'en',
              homeTerritory: 'US'
            },
            resourceTypeName: 'json'
          }
        ];

        const cloneResult = sourceManager.clone({
          candidates: editCandidates
        });

        expect(cloneResult).toSucceedAndSatisfy((clonedManager) => {
          const testResource = clonedManager.resources.get('test.resource' as TsRes.ResourceId);
          expect(testResource).toSucceedAndSatisfy((resource) => {
            const candidates = resource.candidates;
            expect(candidates.length).toBe(3); // Original 2 + new complex

            const messages = candidates.map(
              (c: TsRes.Resources.ResourceCandidate) => (c.json as { message: string }).message
            );
            expect(messages).toContain('complex conditions');
            expect(messages).toContain('original hello');
            expect(messages).toContain('original bonjour');
          });
        });
      });
    });

    describe('merge method and metadata preservation', () => {
      test('preserves merge method from edit candidate', () => {
        const editCandidates: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[] = [
          {
            id: 'test.resource',
            json: { message: 'with merge method' },
            conditions: { language: 'de' },
            mergeMethod: 'replace',
            resourceTypeName: 'json'
          }
        ];

        const cloneResult = sourceManager.clone({
          candidates: editCandidates
        });

        expect(cloneResult).toSucceedAndSatisfy((clonedManager) => {
          const testResource = clonedManager.resources.get('test.resource' as TsRes.ResourceId);
          expect(testResource).toSucceedAndSatisfy((resource) => {
            const candidates = resource.candidates;
            const germanCandidate = candidates.find(
              (c) => (c.json as { message: string }).message === 'with merge method'
            );
            expect(germanCandidate!.mergeMethod).toBe('replace');
          });
        });
      });

      test('preserves partial flag from edit candidate', () => {
        const editCandidates: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[] = [
          {
            id: 'test.resource',
            json: { message: 'partial candidate' },
            conditions: { language: 'it' },
            isPartial: true,
            resourceTypeName: 'json'
          }
        ];

        const cloneResult = sourceManager.clone({
          candidates: editCandidates
        });

        expect(cloneResult).toSucceedAndSatisfy((clonedManager) => {
          const testResource = clonedManager.resources.get('test.resource' as TsRes.ResourceId);
          expect(testResource).toSucceedAndSatisfy((resource) => {
            const candidates = resource.candidates;
            const italianCandidate = candidates.find(
              (c) => (c.json as { message: string }).message === 'partial candidate'
            );
            expect(italianCandidate!.isPartial).toBe(true);
          });
        });
      });
    });

    describe('error conditions and edge cases', () => {
      test('fails with invalid resource ID in edit candidates', () => {
        const editCandidates: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[] = [
          {
            id: '', // Invalid empty resource ID
            json: { message: 'invalid id' },
            conditions: { language: 'en' },
            resourceTypeName: 'json'
          }
        ];

        const cloneResult = sourceManager.clone({
          candidates: editCandidates
        });

        expect(cloneResult).toFailWith(/invalid resource id/i);
      });

      test('fails with invalid qualifier name in conditions', () => {
        const editCandidates: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[] = [
          {
            id: 'test.resource',
            json: { message: 'invalid qualifier' },
            conditions: {
              invalidQualifier: 'value' // Qualifier not defined in qualifiers collection
            },
            resourceTypeName: 'json'
          }
        ];

        const cloneResult = sourceManager.clone({
          candidates: editCandidates
        });

        expect(cloneResult).toFailWith(/not found|unknown/i);
      });

      test('fails with invalid qualifier value for type', () => {
        const editCandidates: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[] = [
          {
            id: 'test.resource',
            json: { message: 'invalid value' },
            conditions: {
              language: 'invalid-language-tag' // Invalid BCP47 language tag
            },
            resourceTypeName: 'json'
          }
        ];

        const cloneResult = sourceManager.clone({
          candidates: editCandidates
        });

        expect(cloneResult).toFailWith(/invalid.*language/i);
      });

      test('handles empty conditions object', () => {
        const editCandidates: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[] = [
          {
            id: 'test.resource',
            json: { message: 'empty conditions' },
            conditions: {}, // Empty conditions object - should be treated as unconditional
            resourceTypeName: 'json'
          }
        ];

        const cloneResult = sourceManager.clone({
          candidates: editCandidates
        });

        expect(cloneResult).toSucceedAndSatisfy((clonedManager) => {
          const testResource = clonedManager.resources.get('test.resource' as TsRes.ResourceId);
          expect(testResource).toSucceedAndSatisfy((resource) => {
            const candidates = resource.candidates;
            expect(candidates.length).toBe(3); // Original 2 + new unconditional

            const messages = candidates.map(
              (c: TsRes.Resources.ResourceCandidate) => (c.json as { message: string }).message
            );
            expect(messages).toContain('empty conditions');
          });
        });
      });

      test('handles undefined conditions (unconditional)', () => {
        const editCandidates: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[] = [
          {
            id: 'test.resource',
            json: { message: 'undefined conditions' },
            // conditions is undefined - should be treated as unconditional
            resourceTypeName: 'json'
          }
        ];

        const cloneResult = sourceManager.clone({
          candidates: editCandidates
        });

        expect(cloneResult).toSucceedAndSatisfy((clonedManager) => {
          const testResource = clonedManager.resources.get('test.resource' as TsRes.ResourceId);
          expect(testResource).toSucceedAndSatisfy((resource) => {
            const candidates = resource.candidates;
            expect(candidates.length).toBe(3); // Original 2 + new unconditional

            const messages = candidates.map(
              (c: TsRes.Resources.ResourceCandidate) => (c.json as { message: string }).message
            );
            expect(messages).toContain('undefined conditions');
          });
        });
      });

      test('handles empty conditions array', () => {
        const editCandidates: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[] = [
          {
            id: 'test.resource',
            json: { message: 'empty array conditions' },
            conditions: [], // Empty conditions array - should be treated as unconditional
            resourceTypeName: 'json'
          }
        ];

        const cloneResult = sourceManager.clone({
          candidates: editCandidates
        });

        expect(cloneResult).toSucceedAndSatisfy((clonedManager) => {
          const testResource = clonedManager.resources.get('test.resource' as TsRes.ResourceId);
          expect(testResource).toSucceedAndSatisfy((resource) => {
            const candidates = resource.candidates;
            expect(candidates.length).toBe(3); // Original 2 + new unconditional

            const messages = candidates.map(
              (c: TsRes.Resources.ResourceCandidate) => (c.json as { message: string }).message
            );
            expect(messages).toContain('empty array conditions');
          });
        });
      });

      test('fails with malformed condition in array format', () => {
        const editCandidates: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[] = [
          {
            id: 'test.resource',
            json: { message: 'malformed condition' },
            conditions: [
              { qualifierName: 'language' } // Missing value property
            ] as TsRes.ResourceJson.Json.ILooseConditionDecl[],
            resourceTypeName: 'json'
          }
        ];

        const cloneResult = sourceManager.clone({
          candidates: editCandidates
        });

        expect(cloneResult).toFailWith(/value.*not found|missing.*value|value.*required/i);
      });

      test('handles resource type mismatch gracefully', () => {
        const editCandidates: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[] = [
          {
            id: 'test.resource',
            json: { message: 'type mismatch' },
            conditions: { language: 'en' },
            resourceTypeName: 'other' // Different resource type from existing resource
          }
        ];

        const cloneResult = sourceManager.clone({
          candidates: editCandidates
        });

        // Should succeed because the candidate gets merged into the same resource
        // regardless of resourceTypeName on the candidate
        expect(cloneResult).toSucceedAndSatisfy((clonedManager) => {
          const testResource = clonedManager.resources.get('test.resource' as TsRes.ResourceId);
          expect(testResource).toSucceedAndSatisfy((resource) => {
            const candidates = resource.candidates;
            const messages = candidates.map(
              (c: TsRes.Resources.ResourceCandidate) => (c.json as { message: string }).message
            );
            expect(messages).toContain('type mismatch');
          });
        });
      });

      test('handles very large number of edit candidates', () => {
        const editCandidates: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[] = [];

        // Create 100 candidates with different conditions
        for (let i = 0; i < 100; i++) {
          editCandidates.push({
            id: `testresource${i}`,
            json: { index: i },
            conditions: {
              language: i % 2 === 0 ? 'en' : 'fr',
              homeTerritory: i % 3 === 0 ? 'US' : 'CA'
            },
            resourceTypeName: 'json'
          });
        }

        const cloneResult = sourceManager.clone({
          candidates: editCandidates
        });

        expect(cloneResult).toSucceedAndSatisfy((clonedManager) => {
          expect(clonedManager.size).toBe(sourceManager.size + 100); // All new resources
          expect(clonedManager.numCandidates).toBe(sourceManager.numCandidates + 100);
        });
      });
    });

    describe('integration with different resource types', () => {
      test('applies edits to resources with different resource types', () => {
        // Add a resource with 'other' resource type to source manager
        sourceManager
          .addLooseCandidate({
            id: 'typed.resource',
            json: { content: 'other type' },
            conditions: { language: 'en' },
            resourceTypeName: 'other'
          })
          .orThrow();

        const editCandidates: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[] = [
          {
            id: 'typed.resource',
            json: { content: 'edited other type' },
            conditions: { language: 'en' }, // Same condition - should replace
            resourceTypeName: 'json'
          }
        ];

        const cloneResult = sourceManager.clone({
          candidates: editCandidates
        });

        expect(cloneResult).toSucceedAndSatisfy((clonedManager) => {
          const typedResource = clonedManager.resources.get('typed.resource' as TsRes.ResourceId);
          expect(typedResource).toSucceedAndSatisfy((resource) => {
            const candidates = resource.candidates;
            expect(candidates.length).toBe(1); // Replaced the original
            expect(candidates[0].json).toEqual({ content: 'edited other type' });
          });
        });
      });
    });

    describe('condition set collision edge cases', () => {
      test('detects collision with same conditions in different order', () => {
        // Add a candidate with multiple conditions
        sourceManager
          .addLooseCandidate({
            id: 'multi.resource',
            json: { value: 'original multi' },
            conditions: {
              language: 'en',
              homeTerritory: 'US'
            },
            resourceTypeName: 'json'
          })
          .orThrow();

        const editCandidates: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[] = [
          {
            id: 'multi.resource',
            json: { value: 'edited multi' },
            conditions: {
              homeTerritory: 'US', // Same conditions but in different order
              language: 'en'
            },
            resourceTypeName: 'json'
          }
        ];

        const cloneResult = sourceManager.clone({
          candidates: editCandidates
        });

        expect(cloneResult).toSucceedAndSatisfy((clonedManager) => {
          const multiResource = clonedManager.resources.get('multi.resource' as TsRes.ResourceId);
          expect(multiResource).toSucceedAndSatisfy((resource) => {
            const candidates = resource.candidates;
            expect(candidates.length).toBe(1); // Should be replaced, not added
            expect(candidates[0].json).toEqual({ value: 'edited multi' });
          });
        });
      });

      test('no collision when one condition is subset of another', () => {
        // Add a candidate with multiple conditions
        sourceManager
          .addLooseCandidate({
            id: 'subset.resource',
            json: { value: 'original subset' },
            conditions: {
              language: 'en',
              homeTerritory: 'US'
            },
            resourceTypeName: 'json'
          })
          .orThrow();

        const editCandidates: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[] = [
          {
            id: 'subset.resource',
            json: { value: 'edited subset' },
            conditions: {
              language: 'en' // Subset of original conditions
            },
            resourceTypeName: 'json'
          }
        ];

        const cloneResult = sourceManager.clone({
          candidates: editCandidates
        });

        expect(cloneResult).toSucceedAndSatisfy((clonedManager) => {
          const subsetResource = clonedManager.resources.get('subset.resource' as TsRes.ResourceId);
          expect(subsetResource).toSucceedAndSatisfy((resource) => {
            const candidates = resource.candidates;
            expect(candidates.length).toBe(2); // Should be added, not replaced

            const values = candidates.map((c) => (c.json as { value: string }).value);
            expect(values).toContain('original subset');
            expect(values).toContain('edited subset');
          });
        });
      });
    });

    describe('cloning with different qualifiers and resource types', () => {
      let compatibleQualifierTypes: TsRes.QualifierTypes.QualifierTypeCollector;
      let compatibleQualifiers: TsRes.Qualifiers.QualifierCollector;
      let compatibleResourceTypes: TsRes.ResourceTypes.ResourceTypeCollector;
      let emptySourceManager: TsRes.Resources.ResourceManagerBuilder;

      beforeEach(() => {
        // Create compatible qualifier types that overlap with original
        compatibleQualifierTypes = TsRes.QualifierTypes.QualifierTypeCollector.create({
          qualifierTypes: [
            TsRes.QualifierTypes.LanguageQualifierType.create().orThrow(),
            TsRes.QualifierTypes.TerritoryQualifierType.create().orThrow(),
            TsRes.QualifierTypes.LiteralQualifierType.create({
              name: 'theme',
              caseSensitive: false,
              enumeratedValues: ['light', 'dark', 'auto']
            }).orThrow()
          ]
        }).orThrow();

        // Create compatible qualifiers - include original qualifiers plus new ones
        const compatibleQualifierDecls = [
          { name: 'language', typeName: 'language', defaultPriority: 900 }, // Same as original
          { name: 'homeTerritory', typeName: 'territory', defaultPriority: 850 }, // Same as original
          { name: 'theme', typeName: 'theme', defaultPriority: 100 } // New qualifier
        ];

        compatibleQualifiers = TsRes.Qualifiers.QualifierCollector.create({
          qualifierTypes: compatibleQualifierTypes,
          qualifiers: compatibleQualifierDecls
        }).orThrow();

        // Create compatible resource types that include original ones
        compatibleResourceTypes = TsRes.ResourceTypes.ResourceTypeCollector.create({
          resourceTypes: [
            TsRes.ResourceTypes.JsonResourceType.create({ key: 'json' }).orThrow(), // Same as original
            TsRes.ResourceTypes.JsonResourceType.create({ key: 'config' }).orThrow(), // Additional type
            TsRes.ResourceTypes.JsonResourceType.create({ key: 'template' }).orThrow() // Additional type
          ]
        }).orThrow();

        // Create an empty source manager for some tests
        emptySourceManager = TsRes.Resources.ResourceManagerBuilder.create({
          qualifiers,
          resourceTypes
        }).orThrow();
      });

      test('clones empty manager with different qualifiers', () => {
        const cloneResult = emptySourceManager.clone({
          qualifiers: compatibleQualifiers
        });

        expect(cloneResult).toSucceedAndSatisfy((clonedManager) => {
          // Verify the cloned manager uses the new qualifiers
          expect(clonedManager.qualifiers).toBe(compatibleQualifiers);
          expect(clonedManager.qualifiers.size).toBe(3);
          expect(clonedManager.qualifiers.get('language' as TsRes.QualifierName)).toSucceed();
          expect(clonedManager.qualifiers.get('homeTerritory' as TsRes.QualifierName)).toSucceed();
          expect(clonedManager.qualifiers.get('theme' as TsRes.QualifierName)).toSucceed();

          // Verify it still uses the original resource types
          expect(clonedManager.resourceTypes).toBe(emptySourceManager.resourceTypes);

          // Should be empty
          expect(clonedManager.size).toBe(0);
        });
      });

      test('clones empty manager with different resource types', () => {
        const cloneResult = emptySourceManager.clone({
          resourceTypes: compatibleResourceTypes
        });

        expect(cloneResult).toSucceedAndSatisfy((clonedManager) => {
          // Verify the cloned manager uses the new resource types
          expect(clonedManager.resourceTypes).toBe(compatibleResourceTypes);
          expect(clonedManager.resourceTypes.size).toBe(3);
          expect(clonedManager.resourceTypes.get('json' as TsRes.ResourceTypeName)).toSucceed();
          expect(clonedManager.resourceTypes.get('config' as TsRes.ResourceTypeName)).toSucceed();
          expect(clonedManager.resourceTypes.get('template' as TsRes.ResourceTypeName)).toSucceed();

          // Verify it still uses the original qualifiers
          expect(clonedManager.qualifiers).toBe(emptySourceManager.qualifiers);

          // Should be empty
          expect(clonedManager.size).toBe(0);
        });
      });

      test('clones with both different qualifiers and resource types', () => {
        const cloneResult = emptySourceManager.clone({
          qualifiers: compatibleQualifiers,
          resourceTypes: compatibleResourceTypes
        });

        expect(cloneResult).toSucceedAndSatisfy((clonedManager) => {
          // Verify the cloned manager uses both new collections
          expect(clonedManager.qualifiers).toBe(compatibleQualifiers);
          expect(clonedManager.resourceTypes).toBe(compatibleResourceTypes);

          // Verify counts
          expect(clonedManager.qualifiers.size).toBe(3);
          expect(clonedManager.resourceTypes.size).toBe(3);

          // Should be empty
          expect(clonedManager.size).toBe(0);
        });
      });

      test('clones populated manager with compatible qualifiers and resource types', () => {
        const cloneResult = sourceManager.clone({
          qualifiers: compatibleQualifiers,
          resourceTypes: compatibleResourceTypes
        });

        expect(cloneResult).toSucceedAndSatisfy((clonedManager) => {
          // Verify configuration
          expect(clonedManager.qualifiers).toBe(compatibleQualifiers);
          expect(clonedManager.resourceTypes).toBe(compatibleResourceTypes);

          // Should preserve existing resources since qualifiers are compatible
          expect(clonedManager.size).toBe(sourceManager.size);
          expect(clonedManager.numCandidates).toBe(sourceManager.numCandidates);
        });
      });

      test('clones with candidates using new qualifiers and resource types', () => {
        const editCandidates: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[] = [
          {
            id: 'new.resource',
            json: { message: 'with new qualifier and resource type' },
            conditions: { theme: 'dark' }, // Using new qualifier
            resourceTypeName: 'config' // Using new resource type
          }
        ];

        const cloneResult = emptySourceManager.clone({
          qualifiers: compatibleQualifiers,
          resourceTypes: compatibleResourceTypes,
          candidates: editCandidates
        });

        expect(cloneResult).toSucceedAndSatisfy((clonedManager) => {
          // Verify configuration
          expect(clonedManager.qualifiers).toBe(compatibleQualifiers);
          expect(clonedManager.resourceTypes).toBe(compatibleResourceTypes);

          // Should have the new resource
          expect(clonedManager.size).toBe(1);
          expect(clonedManager.numCandidates).toBe(1);

          const newResource = clonedManager.resources.get('new.resource' as TsRes.ResourceId);
          expect(newResource).toSucceedAndSatisfy((resource) => {
            const candidates = resource.candidates;
            expect(candidates.length).toBe(1);
            expect(candidates[0].json).toEqual({ message: 'with new qualifier and resource type' });
          });
        });
      });

      test('clone with invalid qualifier reference in candidates fails', () => {
        const editCandidates: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[] = [
          {
            id: 'test.resource',
            json: { message: 'invalid qualifier' },
            conditions: { invalidQualifier: 'value' }, // Non-existent qualifier
            resourceTypeName: 'json'
          }
        ];

        const cloneResult = emptySourceManager.clone({
          qualifiers: compatibleQualifiers,
          candidates: editCandidates
        });

        expect(cloneResult).toFailWith(/qualifier.*not found|unknown.*qualifier/i);
      });

      test('clone with invalid resource type in candidates fails', () => {
        const editCandidates: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[] = [
          {
            id: 'test.resource',
            json: { message: 'invalid resource type' },
            conditions: { language: 'en' },
            resourceTypeName: 'invalidType' // Non-existent resource type
          }
        ];

        const cloneResult = emptySourceManager.clone({
          resourceTypes: compatibleResourceTypes,
          candidates: editCandidates
        });

        expect(cloneResult).toFailWith(/not found/i);
      });

      test('clone preserves original when no overrides provided', () => {
        const cloneResult = sourceManager.clone({
          // No qualifiers or resourceTypes overrides
          candidates: []
        });

        expect(cloneResult).toSucceedAndSatisfy((clonedManager) => {
          // Should preserve original collections
          expect(clonedManager.qualifiers).toBe(sourceManager.qualifiers);
          expect(clonedManager.resourceTypes).toBe(sourceManager.resourceTypes);
          expect(clonedManager.size).toBe(sourceManager.size);
          expect(clonedManager.numCandidates).toBe(sourceManager.numCandidates);
        });
      });

      test('clone with empty alternative collections', () => {
        const emptyQualifiers = TsRes.Qualifiers.QualifierCollector.create({
          qualifierTypes: TsRes.QualifierTypes.QualifierTypeCollector.create({
            qualifierTypes: []
          }).orThrow(),
          qualifiers: []
        }).orThrow();

        const emptyResourceTypes = TsRes.ResourceTypes.ResourceTypeCollector.create({
          resourceTypes: []
        }).orThrow();

        const cloneResult = emptySourceManager.clone({
          qualifiers: emptyQualifiers,
          resourceTypes: emptyResourceTypes
        });

        expect(cloneResult).toSucceedAndSatisfy((clonedManager) => {
          expect(clonedManager.qualifiers).toBe(emptyQualifiers);
          expect(clonedManager.resourceTypes).toBe(emptyResourceTypes);
          expect(clonedManager.qualifiers.size).toBe(0);
          expect(clonedManager.resourceTypes.size).toBe(0);
          // Empty source should result in empty clone
          expect(clonedManager.size).toBe(0);
        });
      });

      test('clone with mixed original and new qualifiers', () => {
        const editCandidates: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[] = [
          {
            id: 'mixed.resource',
            json: { message: 'mixed config' },
            conditions: { language: 'en', theme: 'dark' }, // Mix of original and new qualifiers
            resourceTypeName: 'config' // New resource type
          }
        ];

        const cloneResult = emptySourceManager.clone({
          qualifiers: compatibleQualifiers,
          resourceTypes: compatibleResourceTypes,
          candidates: editCandidates
        });

        expect(cloneResult).toSucceedAndSatisfy((clonedManager) => {
          expect(clonedManager.qualifiers).toBe(compatibleQualifiers);
          expect(clonedManager.resourceTypes).toBe(compatibleResourceTypes);

          const mixedResource = clonedManager.resources.get('mixed.resource' as TsRes.ResourceId);
          expect(mixedResource).toSucceedAndSatisfy((resource) => {
            const candidates = resource.candidates;
            expect(candidates.length).toBe(1);
            expect(candidates[0].json).toEqual({ message: 'mixed config' });
          });
        });
      });
    });
  });
});
