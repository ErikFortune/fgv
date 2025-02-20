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
import { mapResults } from '@fgv/ts-utils';

describe('Resource', () => {
  let qualifierTypes: TsRes.QualifierTypes.QualifierTypeCollector;
  let qualifierDecls: TsRes.Qualifiers.IQualifierDecl[];
  let qualifiers: TsRes.Qualifiers.QualifierCollector;
  let resourceTypes: TsRes.ResourceTypes.ResourceTypeCollector;
  let jsonType: TsRes.ResourceTypes.ResourceType;
  let otherType: TsRes.ResourceTypes.ResourceType;
  let conditions: TsRes.Conditions.ConditionCollector;
  let conditionSets: TsRes.Conditions.ConditionSetCollector;
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
      someDecls.map((decl) =>
        TsRes.Resources.ResourceCandidate.create({ decl, conditionSets, resourceTypes })
      )
    ).orThrow();
  });

  describe('create static method', () => {
    test('creates a Resource object from a list of ResourceCandidate objects, inferring id and type', () => {
      candidates.push(
        TsRes.Resources.ResourceCandidate.create({
          conditionSets,
          resourceTypes,
          decl: {
            id: 'some.resource.path',
            json: { at: 'Antarctica' },
            conditions: {
              currentTerritory: 'AQ'
            },
            isPartial: true,
            resourceTypeName: jsonType.key
          }
        }).orThrow()
      );

      const resource = TsRes.Resources.Resource.create({ candidates });
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
        resourceType: otherType
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
          conditionSets,
          resourceTypes,
          decl: { ...someDecls[0], id: 'some.other.resource.path' }
        }).orThrow()
      );
      const resource = TsRes.Resources.Resource.create({ candidates });
      expect(resource).toFailWith(/mismatched ids/);
    });

    test('fails if candidates have mismatched types', () => {
      candidates.push(
        TsRes.Resources.ResourceCandidate.create({
          conditionSets,
          resourceTypes,
          decl: { ...someDecls[0], resourceTypeName: jsonType.key }
        }).orThrow()
      );
      candidates.push(
        TsRes.Resources.ResourceCandidate.create({
          conditionSets,
          resourceTypes,
          decl: { ...someDecls[1], resourceTypeName: otherType.key }
        }).orThrow()
      );
      const resource = TsRes.Resources.Resource.create({ candidates });
      expect(resource).toFailWith(/type mismatch/);
    });

    test('fails if no candidates are supplied', () => {
      expect(TsRes.Resources.Resource.create({ candidates: [] })).toFailWith(
        /resource constructor: no candidates/i
      );
      expect(TsRes.Resources.Resource.create({ id: 'foo', candidates: [] })).toFailWith(
        /foo: no candidates/i
      );
    });

    test('fails if no type is supplied and not candidates have types', () => {
      const resource = TsRes.Resources.Resource.create({ id: candidates[0].id, candidates });
      expect(resource).toFailWith(/no type specified/);
    });

    test('fails if supplied id does not match candidates', () => {
      const resource = TsRes.Resources.Resource.create({ id: 'some.other.resource.path', candidates });
      expect(resource).toFailWith(/mismatched ids/);
    });

    test('fails if supplied type does not match candidates', () => {
      candidates.push(
        TsRes.Resources.ResourceCandidate.create({
          conditionSets,
          resourceTypes,
          decl: { ...someDecls[0], resourceTypeName: jsonType.key }
        }).orThrow()
      );
      const resource = TsRes.Resources.Resource.create({
        id: candidates[0].id,
        candidates,
        resourceType: otherType
      });
      expect(resource).toFailWith(/type mismatch/);
    });

    test('fails if there are multiple different candidates for the same id', () => {
      candidates.push(
        TsRes.Resources.ResourceCandidate.create({
          conditionSets,
          resourceTypes,
          decl: { ...someDecls[0], json: { some_other: 'property' }, resourceTypeName: jsonType.key }
        }).orThrow()
      );
      const resource = TsRes.Resources.Resource.create({ candidates });
      expect(resource).toFailWith(/duplicate candidates/);
    });

    test('silently ignores multiple identical candidates for the same id', () => {
      candidates.push(
        TsRes.Resources.ResourceCandidate.create({
          conditionSets,
          resourceTypes,
          decl: { ...someDecls[0] }
        }).orThrow()
      );
      const resource = TsRes.Resources.Resource.create({ resourceType: jsonType, candidates });
      expect(resource).toSucceedAndSatisfy((r) => {
        expect(r.id).toBe(candidates[0].id);
        expect(r.resourceType?.key).toBe('json');
        expect(r.candidates).toEqual(expect.arrayContaining(candidates));
        expect(r.candidates.length).toBe(candidates.length - 1);
      });
    });
  });
});
