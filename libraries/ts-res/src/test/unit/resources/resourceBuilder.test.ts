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

describe('ResourceBuilder', () => {
  let qualifierTypes: TsRes.QualifierTypes.QualifierTypeCollector;
  let qualifierDecls: TsRes.Qualifiers.IQualifierDecl[];
  let qualifiers: TsRes.Qualifiers.QualifierCollector;
  let resourceTypes: TsRes.ResourceTypes.ResourceTypeCollector;
  let jsonType: TsRes.ResourceTypes.ResourceType;
  let otherType: TsRes.ResourceTypes.ResourceType;
  let conditions: TsRes.Conditions.ConditionCollector;
  let conditionSets: TsRes.Conditions.ConditionSetCollector;
  let someDecls: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[];

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
  });

  describe('static create method', () => {
    test('creates a new ResourceBuilder with no types', () => {
      const builder = TsRes.Resources.ResourceBuilder.create({
        id: 'some.resource.path',
        resourceTypes,
        conditionSets
      });
      expect(builder).toSucceedAndSatisfy((b) => {
        expect(b.id).toEqual('some.resource.path');
        expect(b.resourceType).toBeUndefined();
        expect(b.candidates.length).toEqual(0);
      });
    });

    test('creates a new ResourceBuilder with a type', () => {
      const builder = TsRes.Resources.ResourceBuilder.create({
        id: 'some.resource.path',
        resourceTypes,
        conditionSets,
        typeName: 'json'
      });
      expect(builder).toSucceedAndSatisfy((b) => {
        expect(b.id).toEqual('some.resource.path');
        expect(b.resourceType).toEqual(jsonType);
        expect(b.candidates.length).toEqual(0);
      });
    });

    test('fails if type is unknown', () => {
      const builder = TsRes.Resources.ResourceBuilder.create({
        id: 'some.resource.path',
        resourceTypes,
        conditionSets,
        typeName: 'unknown'
      });
      expect(builder).toFailWith(/not found/i);
    });
  });

  describe('addCandidate method', () => {
    let builder: TsRes.Resources.ResourceBuilder;

    beforeEach(() => {
      builder = TsRes.Resources.ResourceBuilder.create({
        id: 'some.resource.path',
        resourceTypes,
        conditionSets
      }).orThrow();
    });

    test('adds a candidate to an empty builder', () => {
      expect(builder.addCandidate(someDecls[0])).toSucceedAndSatisfy((c) => {
        expect(c.id).toEqual('some.resource.path');
        expect(c.json).toEqual({ home: 'United States' });
        expect(c.conditions.toString()).toEqual('homeTerritory-[US]@800');
      });
      expect(builder.candidates.length).toEqual(1);
      expect(builder.resourceType).toBeUndefined();
    });

    test('infers type from a candidate', () => {
      const decl = { ...someDecls[0], resourceTypeName: jsonType.key };
      expect(builder.addCandidate(decl)).toSucceedAndSatisfy((c) => {
        expect(c.id).toEqual('some.resource.path');
        expect(c.json).toEqual({ home: 'United States' });
        expect(c.conditions.toString()).toEqual('homeTerritory-[US]@800');
        expect(c.resourceType).toEqual(jsonType);
      });
      expect(builder.candidates.length).toEqual(1);
      expect(builder.resourceType).toEqual(jsonType);
    });

    test('adds non-conflicting candidates to a builder', () => {
      expect(builder.addCandidate(someDecls[0])).toSucceed();
      expect(builder.addCandidate(someDecls[1])).toSucceed();
      expect(builder.candidates.length).toEqual(2);
    });

    test('fails if a candidate has a conflicting id', () => {
      const decl = { ...someDecls[0], id: 'some.other.resource.path' };
      expect(builder.addCandidate(decl)).toFailWith(/mismatched candidate id/);
    });

    test('fails if a candidate has a conflicting type', () => {
      const decl1 = { ...someDecls[0], resourceTypeName: jsonType.key };
      const decl2 = { ...someDecls[1], resourceTypeName: otherType.key };
      expect(builder.addCandidate(decl1)).toSucceed();
      expect(builder.addCandidate(decl2)).toFailWith(/conflicting resource types/);
    });

    test('fails to add a candidate with an existing condition set and different values', () => {
      const decl = { ...someDecls[0], json: { home: 'Mars' } };
      expect(builder.addCandidate(someDecls[0])).toSucceed();
      expect(builder.addCandidate(decl)).toFailWithDetail(/conflicting/, 'exists');
    });

    test('silently succeeds without adding a candidate with an existing condition set and identical values', () => {
      expect(builder.addCandidate(someDecls[0])).toSucceed();
      expect(builder.addCandidate(someDecls[0])).toSucceed();
      expect(builder.candidates.length).toEqual(1);
    });
  });

  describe('build method', () => {
    let builder: TsRes.Resources.ResourceBuilder;

    beforeEach(() => {
      builder = TsRes.Resources.ResourceBuilder.create({
        id: 'some.resource.path',
        resourceTypes,
        conditionSets
      }).orThrow();
    });

    test('builds a resource with at least one candidate', () => {
      const decl = { ...someDecls[0], resourceTypeName: jsonType.key };
      expect(builder.addCandidate(decl)).toSucceed();
      expect(builder.build()).toSucceedAndSatisfy((r) => {
        expect(r.id).toEqual('some.resource.path');
        expect(r.resourceType).toBe(jsonType);
        expect(r.candidates.length).toEqual(1);
      });
    });

    test('fails to build a resource with no candidates', () => {
      expect(builder.build()).toFailWith(/no candidates/);
    });

    test('fails to build a resource with no type', () => {
      expect(builder.addCandidate(someDecls[0])).toSucceed();
      expect(builder.build()).toFailWith(/no resource type/);
    });
  });
});
