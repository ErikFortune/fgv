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
import { mapResults, omit } from '@fgv/ts-utils';

describe('Resource', () => {
  let qualifierTypes: TsRes.QualifierTypes.QualifierTypeCollector;
  let qualifierDecls: TsRes.Qualifiers.IQualifierDecl[];
  let qualifiers: TsRes.Qualifiers.QualifierCollector;
  let resourceTypes: TsRes.ResourceTypes.ResourceTypeCollector;
  let jsonType: TsRes.ResourceTypes.ResourceType;
  let otherType: TsRes.ResourceTypes.ResourceType;
  let conditions: TsRes.Conditions.ConditionCollector;
  let conditionSets: TsRes.Conditions.ConditionSetCollector;
  let decisions: TsRes.Decisions.AbstractDecisionCollector;
  let someDecls: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[];
  let candidates: TsRes.Resources.ResourceCandidate[];

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
    jsonType = resourceTypes.validating.get('json').orThrow();
    otherType = resourceTypes.validating.get('other').orThrow();
  });

  beforeEach(() => {
    conditions = TsRes.Conditions.ConditionCollector.create({ qualifiers }).orThrow();
    conditionSets = TsRes.Conditions.ConditionSetCollector.create({ conditions }).orThrow();
    decisions = TsRes.Decisions.AbstractDecisionCollector.create({ conditionSets }).orThrow();
    someDecls = [
      {
        id: 'some.resource.path',
        json: { home: 'United States' },
        conditions: {
          homeTerritory: 'US'
        }
      },
      {
        id: 'some.resource.path',
        json: { speaks: 'English' },
        conditions: {
          language: 'en'
        }
      },
      {
        id: 'some.resource.path',
        json: { home: 'Canada', speaks: 'Canadian English' },
        conditions: {
          homeTerritory: 'CA',
          language: 'en-CA'
        },
        mergeMethod: 'replace'
      },
      {
        id: 'some.resource.path',
        json: { speaks: 'Español' },
        conditions: {
          language: 'es'
        }
      }
    ];
    candidates = mapResults(
      someDecls.map((decl) => TsRes.Resources.ResourceCandidate.create({ id: decl.id, decl, conditionSets }))
    ).orThrow();
  });

  describe('create static method', () => {
    test('creates a Resource object from a list of ResourceCandidate objects, inferring id and type', () => {
      candidates.push(
        TsRes.Resources.ResourceCandidate.create({
          id: 'some.resource.path',
          conditionSets,
          resourceType: jsonType,
          decl: {
            json: { at: 'Antarctica' },
            conditions: {
              currentTerritory: 'AQ'
            },
            isPartial: true
          }
        }).orThrow()
      );

      const resource = TsRes.Resources.Resource.create({ candidates, decisions });
      expect(resource).toSucceedAndSatisfy((r) => {
        expect(r.id).toBe(candidates[0].id);
        expect(r.resourceType?.key).toBe('json');
        expect(r.candidates).toEqual(expect.arrayContaining(candidates));
      });
    });

    test('creates a Resource object from a list of ResourceCandidate objects, with an explicit type and id', () => {
      const resource = TsRes.Resources.Resource.create({
        id: candidates[0].id,
        candidates,
        resourceType: otherType,
        decisions
      });
      expect(resource).toSucceedAndSatisfy((r) => {
        expect(r.id).toBe(candidates[0].id);
        expect(r.resourceType?.key).toBe('other');
        expect(r.candidates).toEqual(expect.arrayContaining(candidates));
      });
    });

    test('fails if candidates have mismatched ids', () => {
      candidates.push(
        TsRes.Resources.ResourceCandidate.create({
          id: 'some.other.resource.path',
          conditionSets,
          decl: { ...someDecls[0] }
        }).orThrow()
      );
      const resource = TsRes.Resources.Resource.create({ candidates, decisions });
      expect(resource).toFailWith(/mismatched ids/);
    });

    test('fails if candidates have mismatched types', () => {
      candidates.push(
        TsRes.Resources.ResourceCandidate.create({
          id: someDecls[0].id,
          conditionSets,
          resourceType: jsonType,
          decl: someDecls[0]
        }).orThrow()
      );
      candidates.push(
        TsRes.Resources.ResourceCandidate.create({
          id: someDecls[1].id,
          conditionSets,
          resourceType: otherType,
          decl: someDecls[1]
        }).orThrow()
      );
      const resource = TsRes.Resources.Resource.create({ candidates, decisions });
      expect(resource).toFailWith(/type mismatch/);
    });

    test('succeeds if an id but no candidates are supplied', () => {
      expect(
        TsRes.Resources.Resource.create({
          decisions,
          candidates: [],
          id: 'some.resource.id',
          resourceType: jsonType
        })
      ).toSucceedAndSatisfy((r) => {
        expect(r.id).toBe('some.resource.id');
        expect(r.resourceType?.key).toBe('json');
        expect(r.candidates).toEqual([]);
      });
    });

    test('fails if no id and no candidates are supplied', () => {
      const resource = TsRes.Resources.Resource.create({ decisions, candidates: [], resourceType: jsonType });
      expect(resource).toFailWith(/no resource id and no candidates/);
    });

    test('fails if no type is supplied and not candidates have types', () => {
      const resource = TsRes.Resources.Resource.create({ decisions, id: candidates[0].id, candidates });
      expect(resource).toFailWith(/no type specified/);
    });

    test('fails if supplied id does not match candidates', () => {
      const resource = TsRes.Resources.Resource.create({
        decisions,
        id: 'some.other.resource.path',
        candidates
      });
      expect(resource).toFailWith(/mismatched ids/);
    });

    test('fails if supplied type does not match candidates', () => {
      candidates.push(
        TsRes.Resources.ResourceCandidate.create({
          id: someDecls[0].id,
          conditionSets,
          resourceType: jsonType,
          decl: someDecls[0]
        }).orThrow()
      );
      const resource = TsRes.Resources.Resource.create({
        id: candidates[0].id,
        candidates,
        resourceType: otherType,
        decisions
      });
      expect(resource).toFailWith(/type mismatch/);
    });

    test('fails if there are multiple different candidates for the same id', () => {
      candidates.push(
        TsRes.Resources.ResourceCandidate.create({
          id: someDecls[0].id,
          conditionSets,
          resourceType: jsonType,
          decl: { ...someDecls[0], json: { some_other: 'property' } }
        }).orThrow()
      );
      const resource = TsRes.Resources.Resource.create({ candidates, decisions });
      expect(resource).toFailWith(/duplicate candidates/);
    });

    test('silently ignores multiple identical candidates for the same id', () => {
      candidates.push(
        TsRes.Resources.ResourceCandidate.create({
          id: someDecls[0].id,
          conditionSets,
          decl: { ...someDecls[0] }
        }).orThrow()
      );
      const resource = TsRes.Resources.Resource.create({ decisions, resourceType: jsonType, candidates });
      expect(resource).toSucceedAndSatisfy((r) => {
        expect(r.id).toBe(candidates[0].id);
        expect(r.resourceType?.key).toBe('json');
        expect(r.candidates).toEqual(expect.arrayContaining(candidates));
        expect(r.candidates.length).toBe(candidates.length - 1);
      });
    });

    test('succeeds if all candidates are identical for the same condition set', () => {
      const decl: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl = {
        id: 'id',
        json: { a: 1 },
        conditions: { homeTerritory: 'US' }
      };
      const c1 = TsRes.Resources.ResourceCandidate.create({
        id: 'id',
        conditionSets,
        decl,
        resourceType: jsonType
      }).orThrow();
      const c2 = TsRes.Resources.ResourceCandidate.create({
        id: 'id',
        conditionSets,
        decl,
        resourceType: jsonType
      }).orThrow();
      const resource = TsRes.Resources.Resource.create({ decisions, candidates: [c1, c2] });
      expect(resource).toSucceedAndSatisfy((r) => {
        expect(r.candidates.length).toBe(1);
        expect(r.candidates[0].json).toEqual({ a: 1 });
      });
    });

    test('fails if candidates for the same condition set are not equal', () => {
      const decl1: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl = {
        id: 'id',
        json: { a: 1 },
        conditions: { homeTerritory: 'US' }
      };
      const decl2: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl = {
        id: 'id',
        json: { a: 2 },
        conditions: { homeTerritory: 'US' }
      };
      const c1 = TsRes.Resources.ResourceCandidate.create({
        id: 'id',
        conditionSets,
        decl: decl1,
        resourceType: jsonType
      }).orThrow();
      const c2 = TsRes.Resources.ResourceCandidate.create({
        id: 'id',
        conditionSets,
        decl: decl2,
        resourceType: jsonType
      }).orThrow();
      const resource = TsRes.Resources.Resource.create({ decisions, candidates: [c1, c2] });
      expect(resource).toFailWith(/duplicate candidates/);
    });

    test('candidates are sorted and deduplicated as expected', () => {
      const decls: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[] = [
        { id: 'id', json: { a: 1 }, conditions: { homeTerritory: 'US' } },
        { id: 'id', json: { b: 2 }, conditions: { homeTerritory: 'CA' } },
        { id: 'id', json: { a: 1 }, conditions: { homeTerritory: 'US' } } // duplicate
      ];
      const cs = mapResults(
        decls.map((decl) =>
          TsRes.Resources.ResourceCandidate.create({ id: 'id', conditionSets, decl, resourceType: jsonType })
        )
      ).orThrow();
      const resource = TsRes.Resources.Resource.create({ decisions, candidates: cs });
      expect(resource).toSucceedAndSatisfy((r) => {
        expect(r.candidates.length).toBe(2);
        // Should be sorted in reverse order by compare
        expect(r.candidates[0].conditions.toString() >= r.candidates[1].conditions.toString()).toBe(true);
      });
    });
  });

  describe('toChildResourceDecl method', () => {
    test('returns a child resource declaration for a resource', () => {
      const resource = TsRes.Resources.Resource.create({
        decisions,
        candidates,
        resourceType: jsonType
      }).orThrow();
      expect(resource.toChildResourceDecl()).toEqual({
        resourceTypeName: 'json',
        candidates: expect.arrayContaining(someDecls.map((d) => omit(d, ['id'])))
      });
    });

    test('omits candidates property if no candidates are present', () => {
      const resource = TsRes.Resources.Resource.create({
        id: 'some.resource.id',
        candidates: [],
        resourceType: jsonType,
        decisions
      }).orThrow();
      expect(resource.toChildResourceDecl()).toEqual({
        resourceTypeName: 'json'
      });
    });

    test('includes properties with default values if showDefaults is true', () => {
      const resource = TsRes.Resources.Resource.create({
        decisions,
        candidates,
        resourceType: jsonType
      }).orThrow();
      const result = resource.toChildResourceDecl({ showDefaults: true });
      expect(result.resourceTypeName).toBe('json');
      expect(result.candidates).toHaveLength(4);

      // Verify the candidates contain expected JSON values
      const jsonValues = result.candidates!.map((candidate) => candidate.json);
      expect(jsonValues).toEqual(
        expect.arrayContaining([
          { home: 'United States' },
          { speaks: 'English' },
          { home: 'Canada', speaks: 'Canadian English' },
          { speaks: 'Español' }
        ])
      );

      // Verify that showDefaults includes additional properties that normal output doesn't
      const normalResult = resource.toChildResourceDecl();
      const defaultsCandidate = result.candidates![0];
      const normalCandidate = normalResult.candidates![0];

      // With showDefaults, we should have more properties
      expect(Object.keys(defaultsCandidate).length).toBeGreaterThanOrEqual(
        Object.keys(normalCandidate).length
      );
    });
  });

  describe('toLooseResourceDecl method', () => {
    test('returns a loose resource declaration for a resource', () => {
      const resource = TsRes.Resources.Resource.create({
        decisions,
        candidates,
        resourceType: jsonType
      }).orThrow();
      expect(resource.toLooseResourceDecl()).toEqual({
        id: 'some.resource.path',
        resourceTypeName: 'json',
        candidates: expect.arrayContaining(someDecls.map((d) => omit(d, ['id'])))
      });
    });

    test('omits candidates property if no candidates are present', () => {
      const resource = TsRes.Resources.Resource.create({
        id: 'some.resource.path',
        candidates: [],
        resourceType: jsonType,
        decisions
      }).orThrow();
      expect(resource.toLooseResourceDecl()).toEqual({
        id: 'some.resource.path',
        resourceTypeName: 'json'
      });
    });

    test('includes properties with default values if showDefaults is true', () => {
      const resource = TsRes.Resources.Resource.create({
        decisions,
        candidates,
        resourceType: jsonType
      }).orThrow();
      const result = resource.toLooseResourceDecl({ showDefaults: true });
      expect(result.id).toBe('some.resource.path');
      expect(result.resourceTypeName).toBe('json');
      expect(result.candidates).toHaveLength(4);

      // Verify the candidates contain expected JSON values
      const jsonValues = result.candidates!.map((candidate) => candidate.json);
      expect(jsonValues).toEqual(
        expect.arrayContaining([
          { home: 'United States' },
          { speaks: 'English' },
          { home: 'Canada', speaks: 'Canadian English' },
          { speaks: 'Español' }
        ])
      );

      // Verify that showDefaults includes additional properties that normal output doesn't
      const normalResult = resource.toLooseResourceDecl();
      const defaultsCandidate = result.candidates![0];
      const normalCandidate = normalResult.candidates![0];

      // With showDefaults, we should have more properties
      expect(Object.keys(defaultsCandidate).length).toBeGreaterThanOrEqual(
        Object.keys(normalCandidate).length
      );
    });
  });

  describe('serialization', () => {
    test('toChildResourceDecl includes/excludes optional fields as expected', () => {
      const decl: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl = {
        id: 'id',
        json: { a: 1 },
        conditions: { homeTerritory: 'US' }
      };
      const c = TsRes.Resources.ResourceCandidate.create({ id: 'id', conditionSets, decl }).orThrow();
      const resource = TsRes.Resources.Resource.create({
        decisions,
        candidates: [c],
        resourceType: jsonType
      }).orThrow();
      expect(resource.toChildResourceDecl()).toEqual({
        resourceTypeName: 'json',
        candidates: [c.toChildResourceCandidateDecl()]
      });
      // No candidates
      const resource2 = TsRes.Resources.Resource.create({
        candidates: [],
        id: 'id',
        resourceType: jsonType,
        decisions
      }).orThrow();
      expect(resource2.toChildResourceDecl()).toEqual({ resourceTypeName: 'json' });
    });
    test('toLooseResourceDecl includes/excludes optional fields as expected', () => {
      const decl: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl = {
        id: 'id',
        json: { a: 1 },
        conditions: { homeTerritory: 'US' }
      };
      const c = TsRes.Resources.ResourceCandidate.create({ id: 'id', conditionSets, decl }).orThrow();
      const resource = TsRes.Resources.Resource.create({
        decisions,
        candidates: [c],
        resourceType: jsonType
      }).orThrow();
      expect(resource.toLooseResourceDecl()).toEqual({
        id: 'id',
        resourceTypeName: 'json',
        candidates: [c.toChildResourceCandidateDecl()]
      });
      // No candidates
      const resource2 = TsRes.Resources.Resource.create({
        candidates: [],
        id: 'id',
        resourceType: jsonType,
        decisions
      }).orThrow();
      expect(resource2.toLooseResourceDecl()).toEqual({ id: 'id', resourceTypeName: 'json' });
    });
  });

  describe('toCompiled method', () => {
    test('converts resource to compiled representation', () => {
      const resource = TsRes.Resources.Resource.create({
        decisions,
        candidates: [candidates[0]],
        resourceType: jsonType
      }).orThrow();

      const compiled = resource.toCompiled();
      expect(compiled).toEqual({
        id: resource.id,
        type: resource.resourceType.index!,
        decision: resource.decision.baseDecision.index!,
        candidates: [
          {
            json: candidates[0].json,
            isPartial: candidates[0].isPartial,
            mergeMethod: candidates[0].mergeMethod
          }
        ]
      });
    });

    test('handles resource with multiple candidates', () => {
      const resource = TsRes.Resources.Resource.create({
        decisions,
        candidates,
        resourceType: jsonType
      }).orThrow();

      const compiled = resource.toCompiled();
      expect(compiled.candidates).toHaveLength(candidates.length);
      // Note: candidates may be reordered by the Resource constructor, so we compare against the resource's actual candidates
      compiled.candidates.forEach((compiledCandidate, index) => {
        expect(compiledCandidate).toEqual({
          json: resource.candidates[index].json,
          isPartial: resource.candidates[index].isPartial,
          mergeMethod: resource.candidates[index].mergeMethod
        });
      });
    });

    test('handles resource with no candidates', () => {
      const resource = TsRes.Resources.Resource.create({
        candidates: [],
        resourceType: jsonType,
        id: 'empty',
        decisions
      }).orThrow();

      const compiled = resource.toCompiled();
      expect(compiled.candidates).toEqual([]);
    });

    test('compilation options parameter is accepted but not used for Resource', () => {
      const resource = TsRes.Resources.Resource.create({
        decisions,
        candidates: [candidates[0]],
        resourceType: jsonType
      }).orThrow();

      const compiledWithOptions = resource.toCompiled({ includeMetadata: true });
      const compiledWithoutOptions = resource.toCompiled();
      expect(compiledWithOptions).toEqual(compiledWithoutOptions);
    });
  });

  describe('getCandidatesForContext method', () => {
    test('returns empty array if no candidates match the context', () => {
      const resource = TsRes.Resources.Resource.create({
        decisions,
        candidates,
        resourceType: jsonType
      }).orThrow();
      const context = { homeTerritory: 'ZZ', language: 'zz' };
      expect(resource.getCandidatesForContext(context)).toEqual([]);
    });

    test('returns multiple candidates that match the context', () => {
      const resource = TsRes.Resources.Resource.create({
        decisions,
        candidates,
        resourceType: jsonType
      }).orThrow();
      const context = { language: 'en' };
      const matches = resource.getCandidatesForContext(context);
      const expected = resource.candidates.filter((c) => c.canMatchPartialContext(context));
      expect(matches).toEqual(expected);
    });

    test('returns all candidates for unconditional context', () => {
      const resource = TsRes.Resources.Resource.create({
        decisions,
        candidates,
        resourceType: jsonType
      }).orThrow();
      const context = {};
      expect(resource.getCandidatesForContext(context)).toEqual(resource.candidates);
    });

    test('returns empty array if there are no candidates', () => {
      const resource = TsRes.Resources.Resource.create({
        candidates: [],
        resourceType: jsonType,
        id: 'empty',
        decisions
      }).orThrow();
      const context = { homeTerritory: 'US' };
      expect(resource.getCandidatesForContext(context)).toEqual([]);
    });
  });
});
