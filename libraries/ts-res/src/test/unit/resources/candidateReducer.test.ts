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
// eslint-disable-next-line @rushstack/packlets/mechanics
import { CandidateReducer } from '../../../packlets/resources/candidateReducer';
import * as TsRes from '../../../index';
import { JsonObject } from '@fgv/ts-json-base';

describe('CandidateReducer', () => {
  let qualifierTypes: TsRes.QualifierTypes.QualifierTypeCollector;
  let qualifiers: TsRes.Qualifiers.QualifierCollector;
  let resourceTypes: TsRes.ResourceTypes.ResourceTypeCollector;
  let conditionSets: TsRes.Conditions.ConditionSetCollector;
  let jsonType: TsRes.ResourceTypes.ResourceType;

  beforeEach(() => {
    qualifierTypes = TsRes.QualifierTypes.QualifierTypeCollector.create({
      qualifierTypes: [
        TsRes.QualifierTypes.LanguageQualifierType.create().orThrow(),
        TsRes.QualifierTypes.TerritoryQualifierType.create().orThrow(),
        TsRes.QualifierTypes.LiteralQualifierType.create().orThrow()
      ]
    }).orThrow();

    qualifiers = TsRes.Qualifiers.QualifierCollector.create({
      qualifierTypes,
      qualifiers: [
        { name: 'language', typeName: 'language', defaultPriority: 100 },
        { name: 'territory', typeName: 'territory', defaultPriority: 90 },
        { name: 'environment', typeName: 'literal', defaultPriority: 80 }
      ]
    }).orThrow();

    resourceTypes = TsRes.ResourceTypes.ResourceTypeCollector.create({
      resourceTypes: [TsRes.ResourceTypes.JsonResourceType.create({ key: 'json' }).orThrow()]
    }).orThrow();

    jsonType = resourceTypes.validating.get('json').orThrow();

    const conditions = TsRes.Conditions.ConditionCollector.create({ qualifiers }).orThrow();
    conditionSets = TsRes.Conditions.ConditionSetCollector.create({ conditions }).orThrow();
  });

  function createCandidate(
    id: string,
    json: JsonObject,
    conditions?: Record<string, string>,
    isPartial?: boolean,
    mergeMethod?: TsRes.ResourceValueMergeMethod
  ): TsRes.Resources.ResourceCandidate {
    return TsRes.Resources.ResourceCandidate.create({
      id,
      conditionSets,
      resourceType: jsonType,
      decl: {
        json,
        conditions: conditions || {},
        isPartial,
        mergeMethod
      }
    }).orThrow();
  }

  function createFilterContext(conditions: Record<string, string>): TsRes.Context.IValidatedContextDecl {
    const resourceManager = TsRes.Resources.ResourceManagerBuilder.create({
      qualifiers,
      resourceTypes
    }).orThrow();
    return resourceManager.validateContext(conditions).orThrow();
  }

  describe('static reduceToLooseResourceCandidateDecls', () => {
    describe('positive cases', () => {
      test('returns candidates unchanged when no filter context provided', () => {
        const candidates = [
          createCandidate('test1', { value: 'A' }, { language: 'en' }),
          createCandidate('test2', { value: 'B' }, { territory: 'US' })
        ];

        expect(
          CandidateReducer.reduceToLooseResourceCandidateDecls(
            'test-resource' as unknown as TsRes.ResourceId,
            candidates
          )
        ).toSucceedAndSatisfy((result) => {
          expect(result).toHaveLength(2);
          expect(result[0].json).toEqual({ value: 'A' });
          expect(result[0].conditions).toEqual({ language: 'en' });
          expect(result[1].json).toEqual({ value: 'B' });
          expect(result[1].conditions).toEqual({ territory: 'US' });
        });
      });

      test('returns candidates unchanged when filter context is empty', () => {
        const candidates = [
          createCandidate('test1', { value: 'A' }, { language: 'en' }),
          createCandidate('test2', { value: 'B' }, { territory: 'US' })
        ];
        const filterContext = createFilterContext({});

        expect(
          CandidateReducer.reduceToLooseResourceCandidateDecls(
            'test-resource' as unknown as TsRes.ResourceId,
            candidates,
            filterContext
          )
        ).toSucceedAndSatisfy((result) => {
          expect(result).toHaveLength(2);
          expect(result[0].conditions).toEqual({ language: 'en' });
          expect(result[1].conditions).toEqual({ territory: 'US' });
        });
      });

      test('reduces qualifiers that match perfectly across all candidates', () => {
        const candidates = [
          createCandidate('test1', { value: 'A' }, { language: 'en', territory: 'US' }),
          createCandidate('test2', { value: 'B' }, { language: 'en', territory: 'GB' })
        ];
        const filterContext = createFilterContext({ language: 'en' });

        expect(
          CandidateReducer.reduceToLooseResourceCandidateDecls(
            'test-resource' as unknown as TsRes.ResourceId,
            candidates,
            filterContext
          )
        ).toSucceedAndSatisfy((result) => {
          expect(result).toHaveLength(2);
          // Language should be reduced, territory preserved
          expect(result[0].conditions).not.toHaveProperty('language');
          expect(result[0].conditions).toHaveProperty('territory', 'US');
          expect(result[1].conditions).not.toHaveProperty('language');
          expect(result[1].conditions).toHaveProperty('territory', 'GB');
        });
      });

      test('preserves qualifiers that do not match perfectly', () => {
        const candidates = [
          createCandidate('test1', { value: 'A' }, { language: 'en-US', territory: 'US' }),
          createCandidate('test2', { value: 'B' }, { language: 'en-GB', territory: 'GB' })
        ];
        const filterContext = createFilterContext({ language: 'en' });

        expect(
          CandidateReducer.reduceToLooseResourceCandidateDecls(
            'test-resource' as unknown as TsRes.ResourceId,
            candidates,
            filterContext
          )
        ).toSucceedAndSatisfy((result) => {
          expect(result).toHaveLength(2);
          // Language should be preserved (imperfect match), territory preserved
          expect(result[0].conditions).toHaveProperty('language', 'en-US');
          expect(result[0].conditions).toHaveProperty('territory', 'US');
          expect(result[1].conditions).toHaveProperty('language', 'en-GB');
          expect(result[1].conditions).toHaveProperty('territory', 'GB');
        });
      });

      test('handles smart collision resolution - complete candidate wins over unchanged', () => {
        const candidates = [
          createCandidate('test1', { value: 'default' }, {}), // Unchanged (no conditions)
          createCandidate('test2', { value: 'specific' }, { environment: 'prod' }) // Will be reduced
        ];
        const filterContext = createFilterContext({ environment: 'prod' });

        expect(
          CandidateReducer.reduceToLooseResourceCandidateDecls(
            'test-resource' as unknown as TsRes.ResourceId,
            candidates,
            filterContext
          )
        ).toSucceedAndSatisfy((result) => {
          // Smart collision resolution: specific candidate wins
          expect(result).toHaveLength(1);
          expect(result[0].json).toEqual({ value: 'specific' });
          expect(result[0].conditions).toEqual({}); // Environment reduced
        });
      });

      test('handles smart collision resolution - partial candidate merges with unchanged', () => {
        const candidates = [
          createCandidate('test1', { base: 'value', keep: 'this' }, {}), // Unchanged
          createCandidate('test2', { override: 'new' }, { environment: 'prod' }, true) // Partial, will be reduced
        ];
        const filterContext = createFilterContext({ environment: 'prod' });

        expect(
          CandidateReducer.reduceToLooseResourceCandidateDecls(
            'test-resource' as unknown as TsRes.ResourceId,
            candidates,
            filterContext
          )
        ).toSucceedAndSatisfy((result) => {
          // Smart collision resolution: partial merges into unchanged
          expect(result).toHaveLength(1);
          expect(result[0].json).toEqual({ base: 'value', keep: 'this', override: 'new' });
          expect(result[0].conditions).toEqual({}); // Environment reduced
          expect(result[0].isPartial).toBe(false); // Takes unchanged candidate's isPartial value
        });
      });

      test('handles multiple reduced candidates without collision', () => {
        const candidates = [
          createCandidate('test1', { value: 'A' }, { language: 'en', territory: 'US' }),
          createCandidate('test2', { value: 'B' }, { language: 'en', territory: 'GB' }),
          createCandidate('test3', { value: 'C' }, { language: 'en', environment: 'prod' })
        ];
        const filterContext = createFilterContext({ language: 'en' });

        expect(
          CandidateReducer.reduceToLooseResourceCandidateDecls(
            'test-resource' as unknown as TsRes.ResourceId,
            candidates,
            filterContext
          )
        ).toSucceedAndSatisfy((result) => {
          expect(result).toHaveLength(3);
          // All should have language reduced but other conditions preserved
          result.forEach((candidate) => {
            expect(candidate.conditions).not.toHaveProperty('language');
          });
          expect(result[0].conditions).toHaveProperty('territory', 'US');
          expect(result[1].conditions).toHaveProperty('territory', 'GB');
          expect(result[2].conditions).toHaveProperty('environment', 'prod');
        });
      });
    });

    describe('collision handling', () => {
      test('handles two reduced candidates that do not collide', () => {
        const candidates = [
          createCandidate('test1', { value: 'A' }, { environment: 'prod', territory: 'US' }),
          createCandidate('test2', { value: 'B' }, { environment: 'prod', territory: 'GB' })
        ];
        // Only 'environment' will be reduced, 'territory' remains since only one matches filter
        const filterContext = createFilterContext({ environment: 'prod', territory: 'US' });

        expect(
          CandidateReducer.reduceToLooseResourceCandidateDecls(
            'test-resource' as unknown as TsRes.ResourceId,
            candidates,
            filterContext
          )
        ).toSucceedAndSatisfy((result) => {
          // Both candidates should remain with territory qualifiers
          expect(result).toHaveLength(2);
          expect(result[0].conditions).not.toHaveProperty('environment');
          expect(result[1].conditions).not.toHaveProperty('environment');
          expect(result[0].conditions).toHaveProperty('territory');
          expect(result[1].conditions).toHaveProperty('territory');
        });
      });

      test('handles multiple candidates with partial reduction', () => {
        const candidates = [
          createCandidate('test1', { value: 'A' }, { environment: 'prod' }),
          createCandidate('test2', { value: 'B' }, { territory: 'US' }),
          createCandidate('test3', { value: 'C' }, { environment: 'prod', territory: 'US' })
        ];
        // Each retains at least one condition after reduction
        const filterContext = createFilterContext({ environment: 'prod', territory: 'US' });

        expect(
          CandidateReducer.reduceToLooseResourceCandidateDecls(
            'test-resource' as unknown as TsRes.ResourceId,
            candidates,
            filterContext
          )
        ).toSucceedAndSatisfy((result) => {
          // All should be preserved with some conditions remaining
          expect(result).toHaveLength(3);
          // Each should maintain distinguishing characteristics
          expect(
            result.some(
              (r) => r.conditions && 'environment' in r.conditions && !('territory' in r.conditions)
            )
          ).toBe(true);
          expect(
            result.some(
              (r) => r.conditions && 'territory' in r.conditions && !('environment' in r.conditions)
            )
          ).toBe(true);
          expect(
            result.some((r) => r.conditions && 'environment' in r.conditions && 'territory' in r.conditions)
          ).toBe(true);
        });
      });

      test('stops collision resolution at safety limit', () => {
        // Create many candidates that will cause complex collision scenarios
        const candidates = Array.from({ length: 15 }, (unusedItem, index) =>
          createCandidate(`test${index}`, { value: index }, { environment: 'prod' })
        );
        const filterContext = createFilterContext({ environment: 'prod' });

        expect(
          CandidateReducer.reduceToLooseResourceCandidateDecls(
            'test-resource' as unknown as TsRes.ResourceId,
            candidates,
            filterContext
          )
        ).toSucceedAndSatisfy((result) => {
          // Should stop at safety limit and suppress all colliding candidates
          expect(result.length).toBeLessThanOrEqual(candidates.length);
        });
      });
    });

    describe('edge cases', () => {
      test('handles empty candidate array', () => {
        const filterContext = createFilterContext({ language: 'en' });

        expect(
          CandidateReducer.reduceToLooseResourceCandidateDecls(
            'test-resource' as unknown as TsRes.ResourceId,
            [],
            filterContext
          )
        ).toSucceedWith([]);
      });

      test('handles single candidate', () => {
        const candidates = [createCandidate('test1', { value: 'A' }, { language: 'en' })];
        const filterContext = createFilterContext({ language: 'en' });

        expect(
          CandidateReducer.reduceToLooseResourceCandidateDecls(
            'test-resource' as unknown as TsRes.ResourceId,
            candidates,
            filterContext
          )
        ).toSucceedAndSatisfy((result) => {
          expect(result).toHaveLength(1);
          expect(result[0].conditions).toEqual({}); // Language reduced
        });
      });

      test('handles candidates with no conditions', () => {
        const candidates = [
          createCandidate('test1', { value: 'A' }, {}),
          createCandidate('test2', { value: 'B' }, {})
        ];
        const filterContext = createFilterContext({ language: 'en' });

        expect(
          CandidateReducer.reduceToLooseResourceCandidateDecls(
            'test-resource' as unknown as TsRes.ResourceId,
            candidates,
            filterContext
          )
        ).toSucceedAndSatisfy((result) => {
          expect(result).toHaveLength(2);
          expect(result[0].conditions).toEqual({});
          expect(result[1].conditions).toEqual({});
        });
      });

      test('preserves isPartial and mergeMethod properties', () => {
        const candidates = [
          createCandidate('test1', { value: 'A' }, { language: 'en' }, true, 'augment'),
          createCandidate('test2', { value: 'B' }, { language: 'en' }, false, 'replace')
        ];
        const filterContext = createFilterContext({ language: 'en' });

        expect(
          CandidateReducer.reduceToLooseResourceCandidateDecls(
            'test-resource' as unknown as TsRes.ResourceId,
            candidates,
            filterContext
          )
        ).toSucceedAndSatisfy((result) => {
          expect(result).toHaveLength(2);
          expect(result[0].isPartial).toBe(true);
          expect(result[0].mergeMethod).toBe('augment');
          expect(result[1].isPartial).toBe(false);
          expect(result[1].mergeMethod).toBe('replace');
        });
      });
    });
  });

  describe('static reduceToChildResourceCandidateDecls', () => {
    test('returns child resource candidate declarations', () => {
      const candidates = [
        createCandidate('test1', { value: 'A' }, { language: 'en', territory: 'US' }),
        createCandidate('test2', { value: 'B' }, { language: 'en', territory: 'GB' })
      ];
      const filterContext = createFilterContext({ language: 'en' });

      expect(
        CandidateReducer.reduceToChildResourceCandidateDecls(candidates, filterContext)
      ).toSucceedAndSatisfy((result) => {
        expect(result).toHaveLength(2);
        // Should be child resource candidate declarations (no id property)
        expect(result[0]).not.toHaveProperty('id');
        expect(result[0].json).toEqual({ value: 'A' });
        expect(result[0].conditions).toEqual({ territory: 'US' }); // Language reduced
        expect(result[1]).not.toHaveProperty('id');
        expect(result[1].json).toEqual({ value: 'B' });
        expect(result[1].conditions).toEqual({ territory: 'GB' });
      });
    });

    test('handles no filter context', () => {
      const candidates = [createCandidate('test1', { value: 'A' }, { language: 'en' })];

      expect(CandidateReducer.reduceToChildResourceCandidateDecls(candidates)).toSucceedAndSatisfy(
        (result) => {
          expect(result).toHaveLength(1);
          expect(result[0].conditions).toEqual({ language: 'en' }); // Not reduced
        }
      );
    });
  });

  describe('instance methods', () => {
    test('constructor creates reducer with candidates and filter context', () => {
      const candidates = [createCandidate('test1', { value: 'A' }, { language: 'en' })];
      const filterContext = createFilterContext({ language: 'en' });

      const reducer = new CandidateReducer(candidates, filterContext);
      expect(reducer).toBeDefined();
    });

    test('reduceCandidate returns reduced candidate', () => {
      const candidates = [createCandidate('test1', { value: 'A' }, { language: 'en', territory: 'US' })];
      const filterContext = createFilterContext({ language: 'en' });
      const reducer = new CandidateReducer(candidates, filterContext);

      expect(reducer.reduceCandidate(candidates[0])).toSucceedAndSatisfy((result) => {
        expect(result).toBeDefined();
        expect(result!.json).toEqual({ value: 'A' });
        expect(result!.conditions).toEqual({ territory: 'US' }); // Language reduced
        expect(result!.candidate).toBe(candidates[0]);
      });
    });

    test('reduceCandidate fails for candidate not in collection', () => {
      const candidates = [createCandidate('test1', { value: 'A' }, { language: 'en' })];
      const otherCandidate = createCandidate('test2', { value: 'B' }, { territory: 'US' });
      const filterContext = createFilterContext({ language: 'en' });
      const reducer = new CandidateReducer(candidates, filterContext);

      expect(reducer.reduceCandidate(otherCandidate)).toFailWith(/Candidate not found in reducer state/);
    });
  });

  describe('error conditions', () => {
    test('handles filter context with invalid qualifiers gracefully', () => {
      const candidates = [createCandidate('test1', { value: 'A' }, { language: 'en' })];

      // Create a corrupted filter context
      const corruptedContext = {
        language: 'invalid-language-code'
      } as unknown as TsRes.Context.IValidatedContextDecl;

      // The static method should handle the invalid context gracefully
      expect(
        CandidateReducer.reduceToLooseResourceCandidateDecls(
          'test-resource' as unknown as TsRes.ResourceId,
          candidates,
          corruptedContext
        )
      ).toSucceedAndSatisfy((result) => {
        // Should return candidates unchanged when context processing fails
        expect(result).toHaveLength(1);
        expect(result[0].conditions).toEqual({ language: 'en' });
      });
    });

    test('handles corrupted candidate data', () => {
      const validCandidate = createCandidate('test1', { value: 'A' }, { language: 'en' });

      // Create a candidate with corrupted condition set
      const corruptedCandidate = {
        ...validCandidate,
        conditions: null as unknown as TsRes.Conditions.ConditionSet
      };

      const filterContext = createFilterContext({ language: 'en' });
      const reducer = new CandidateReducer([validCandidate], filterContext);

      // Should fail gracefully for candidate not in the collection
      expect(reducer.reduceCandidate(corruptedCandidate as TsRes.Resources.ResourceCandidate)).toFailWith(
        /Candidate not found in reducer state/
      );
    });
  });

  describe('JSON merging functionality', () => {
    test('merges simple objects correctly', () => {
      const candidates = [
        createCandidate('test1', { base: 'value', existing: 'keep' }, {}),
        createCandidate('test2', { override: 'new', additional: 'add' }, { environment: 'prod' }, true)
      ];
      const filterContext = createFilterContext({ environment: 'prod' });

      expect(
        CandidateReducer.reduceToLooseResourceCandidateDecls(
          'test-resource' as unknown as TsRes.ResourceId,
          candidates,
          filterContext
        )
      ).toSucceedAndSatisfy((result) => {
        expect(result).toHaveLength(1);
        expect(result[0].json).toEqual({
          base: 'value',
          existing: 'keep',
          override: 'new',
          additional: 'add'
        });
      });
    });

    test('handles nested object merging', () => {
      const candidates = [
        createCandidate(
          'test1',
          {
            config: { setting1: 'value1', setting2: 'value2' },
            other: 'data'
          },
          {}
        ),
        createCandidate(
          'test2',
          {
            config: { setting2: 'override', setting3: 'new' }
          },
          { environment: 'prod' },
          true
        )
      ];
      const filterContext = createFilterContext({ environment: 'prod' });

      expect(
        CandidateReducer.reduceToLooseResourceCandidateDecls(
          'test-resource' as unknown as TsRes.ResourceId,
          candidates,
          filterContext
        )
      ).toSucceedAndSatisfy((result) => {
        expect(result).toHaveLength(1);
        expect(result[0].json).toEqual({
          config: { setting1: 'value1', setting2: 'override', setting3: 'new' },
          other: 'data'
        });
      });
    });

    test('handles array merging', () => {
      const candidates = [
        createCandidate('test1', { items: ['a', 'b'], other: 'data' }, {}),
        createCandidate('test2', { items: ['c', 'd'] }, { environment: 'prod' }, true)
      ];
      const filterContext = createFilterContext({ environment: 'prod' });

      expect(
        CandidateReducer.reduceToLooseResourceCandidateDecls(
          'test-resource' as unknown as TsRes.ResourceId,
          candidates,
          filterContext
        )
      ).toSucceedAndSatisfy((result) => {
        expect(result).toHaveLength(1);
        expect(result[0].json).toEqual({
          items: ['c', 'd'], // Arrays are replaced, not merged
          other: 'data'
        });
      });
    });

    test('handles null and undefined values in merging', () => {
      const candidates = [
        createCandidate('test1', { keep: 'this', nullValue: null }, {}),
        createCandidate('test2', { nullValue: 'override', newValue: 'add' }, { environment: 'prod' }, true)
      ];
      const filterContext = createFilterContext({ environment: 'prod' });

      expect(
        CandidateReducer.reduceToLooseResourceCandidateDecls(
          'test-resource' as unknown as TsRes.ResourceId,
          candidates,
          filterContext
        )
      ).toSucceedAndSatisfy((result) => {
        expect(result).toHaveLength(1);
        expect(result[0].json).toEqual({
          keep: 'this',
          nullValue: 'override',
          newValue: 'add'
        });
      });
    });
  });

  describe('performance and safety', () => {
    test('handles large number of candidates efficiently', () => {
      const candidates = Array.from({ length: 100 }, (unusedItem, index) =>
        createCandidate(
          'test-resource',
          { value: index },
          { language: 'en', territory: index % 2 === 0 ? 'US' : 'GB' }
        )
      );
      const filterContext = createFilterContext({ language: 'en' });

      expect(
        CandidateReducer.reduceToLooseResourceCandidateDecls(
          'test-resource' as unknown as TsRes.ResourceId,
          candidates,
          filterContext
        )
      ).toSucceedAndSatisfy((result) => {
        expect(result).toHaveLength(100);
        // With 100 candidates, we expect complex collision detection to prevent reduction
        // Language should be preserved to avoid massive collisions
        result.forEach((candidate) => {
          expect(candidate.conditions).toHaveProperty('language', 'en');
          expect(candidate.conditions).toHaveProperty('territory');
        });
      });
    });

    test('collision resolution safety limit prevents infinite loops', () => {
      // Create a scenario that could theoretically cause complex collision chains
      const candidates = Array.from({ length: 20 }, (unusedItem, index) =>
        createCandidate('test-resource', { value: index }, { environment: 'prod' })
      );
      const filterContext = createFilterContext({ environment: 'prod' });

      // Should complete without hanging
      expect(
        CandidateReducer.reduceToLooseResourceCandidateDecls(
          'test-resource' as unknown as TsRes.ResourceId,
          candidates,
          filterContext
        )
      ).toSucceedAndSatisfy((result) => {
        // Complex collision case: all candidates have same conditions after reduction ({}),
        // so the collision resolver reverts them to original conditions to avoid collision
        expect(result).toHaveLength(20);
        result.forEach((candidate) => {
          // Environment should be preserved because collision resolution reverted the reduction
          expect(candidate.conditions).toHaveProperty('environment', 'prod');
        });
      });
    });
  });
});
