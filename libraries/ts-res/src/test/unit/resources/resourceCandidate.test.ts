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

describe('ResourceCandidate', () => {
  let qualifierTypes: TsRes.QualifierTypes.QualifierTypeCollector;
  let qualifierDecls: TsRes.Qualifiers.IQualifierDecl[];
  let qualifiers: TsRes.Qualifiers.QualifierCollector;
  let resourceTypes: TsRes.ResourceTypes.ResourceTypeCollector;
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
    test('creates a new ResourceCandidate with no parent conditions', () => {
      const resourceType = resourceTypes.validating.get('json').orThrow();
      const decl: TsRes.ResourceJson.Json.IChildResourceCandidateDecl = {
        json: { some: 'json' },
        conditions: {
          homeTerritory: 'US',
          language: 'en'
        },
        isPartial: true,
        mergeMethod: 'replace'
      };
      expect(conditions.size).toBe(0);
      expect(conditionSets.size).toBe(1);
      expect(
        TsRes.Resources.ResourceCandidate.create({
          id: 'some.resource.path',
          conditionSets,
          resourceType,
          decl
        })
      ).toSucceedAndSatisfy((c) => {
        expect(c.id).toBe('some.resource.path');
        expect(c.json).toEqual(decl.json);
        expect(c.isPartial).toBe(true);
        expect(c.mergeMethod).toBe('replace');
        expect(c.conditions.size).toBe(2);
        expect(conditions.size).toBe(2);
        expect(conditionSets.size).toBe(2);
        expect(c.resourceType?.key).toBe('json');
      });
    });

    test('defaults to non-partial and augment merge method', () => {
      const decl: TsRes.ResourceJson.Json.IChildResourceCandidateDecl = {
        json: { some: 'json' },
        conditions: {
          homeTerritory: 'US',
          language: 'en'
        }
      };
      expect(conditions.size).toBe(0);
      expect(conditionSets.size).toBe(1);
      expect(
        TsRes.Resources.ResourceCandidate.create({
          id: 'some.resource.path',
          conditionSets,
          decl
        })
      ).toSucceedAndSatisfy((c) => {
        expect(c.id).toBe('some.resource.path');
        expect(c.json).toEqual(decl.json);
        expect(c.isPartial).toBe(false);
        expect(c.mergeMethod).toBe('augment');
        expect(c.conditions.size).toBe(2);
        expect(conditions.size).toBe(2);
        expect(conditionSets.size).toBe(2);
        expect(c.resourceType?.key).toBeUndefined();
      });
    });

    test('merges parent conditions with declared conditions', () => {
      const parentConditions = [
        conditions.validating.add({ qualifierName: 'currentTerritory', value: 'AQ' }).orThrow()
      ];

      const decl: TsRes.ResourceJson.Normalized.ILooseResourceCandidateDecl =
        TsRes.ResourceJson.Convert.looseResourceCandidateDecl.convert(someDecls[0]).orThrow();
      const numDeclConditions = decl.conditions?.length ?? 0;
      expect(conditions.size).toBe(1);
      expect(conditionSets.size).toBe(1);
      expect(
        TsRes.Resources.ResourceCandidate.create({
          id: decl.id,
          conditionSets,
          decl,
          parentConditions
        })
      ).toSucceedAndSatisfy((c) => {
        expect(c.id).toBe(decl.id);
        expect(c.json).toEqual(decl.json);
        expect(c.isPartial).toBe(false);
        expect(c.mergeMethod).toBe('augment');
        expect(c.conditions.size).toBe(numDeclConditions + parentConditions.length);
        expect(c.resourceType?.key).toBeUndefined();
        expect(conditions.size).toBe(numDeclConditions + parentConditions.length);
        expect(conditionSets.size).toBe(2);
      });
    });

    test('fails if the resource ID is invalid', () => {
      const decl: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl = someDecls[0];
      expect(
        TsRes.Resources.ResourceCandidate.create({
          id: 'resource ids cannot contain spaces or punctuation!',
          conditionSets,
          decl
        })
      ).toFailWith(/not a valid resource id/i);
    });

    test('fails if the declaration cannot be normalized', () => {
      const decl: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl = {
        ...someDecls[0],
        conditions: { 'bogus name': 'bogus' }
      };
      expect(
        TsRes.Resources.ResourceCandidate.create({
          id: decl.id,
          conditionSets,
          decl
        })
      ).toFailWith(/not a valid qualifier name/i);
    });
  });

  describe('validateResourceTypes static method', () => {
    test('succeeds if all candidates are undefined or have the same resource', () => {
      someDecls[0] = { ...someDecls[0], resourceTypeName: 'json' };
      someDecls[3] = { ...someDecls[3], resourceTypeName: 'json' };
      const candidates = mapResults(
        someDecls.map((decl) => {
          const resourceType = decl.resourceTypeName
            ? resourceTypes.validating.get(decl.resourceTypeName).orThrow()
            : undefined;
          return TsRes.Resources.ResourceCandidate.create({
            id: decl.id,
            conditionSets,
            decl,
            resourceType
          });
        })
      ).orThrow();
      const expectedType = resourceTypes.validating.get('json').orThrow();
      expect(TsRes.Resources.ResourceCandidate.validateResourceTypes(candidates)).toSucceedWith(expectedType);
    });

    test('succeeds if all candidates are undefined or match the supplied expected resource type', () => {
      someDecls[0] = { ...someDecls[0], resourceTypeName: 'json' };
      someDecls[3] = { ...someDecls[3], resourceTypeName: 'json' };
      const candidates = mapResults(
        someDecls.map((decl) => {
          const resourceType = decl.resourceTypeName
            ? resourceTypes.validating.get(decl.resourceTypeName).orThrow()
            : undefined;
          return TsRes.Resources.ResourceCandidate.create({
            id: decl.id,
            conditionSets,
            decl,
            resourceType
          });
        })
      ).orThrow();
      const expectedType = resourceTypes.validating.get('json').orThrow();
      expect(TsRes.Resources.ResourceCandidate.validateResourceTypes(candidates, expectedType)).toSucceedWith(
        expectedType
      );
    });

    test('succeeds with undefined if all candidates are undefined and no expected resource type is supplied', () => {
      const candidates = mapResults(
        someDecls.map((decl) =>
          TsRes.Resources.ResourceCandidate.create({
            id: decl.id,
            conditionSets,
            decl
          })
        )
      ).orThrow();
      expect(TsRes.Resources.ResourceCandidate.validateResourceTypes(candidates)).toSucceedWith(undefined);
    });

    test('succeeds with supplied expected resource type if all candidates are undefined', () => {
      const candidates = mapResults(
        someDecls.map((decl) =>
          TsRes.Resources.ResourceCandidate.create({
            id: decl.id,
            conditionSets,
            decl
          })
        )
      ).orThrow();
      const expectedType = resourceTypes.validating.get('json').orThrow();
      expect(TsRes.Resources.ResourceCandidate.validateResourceTypes(candidates, expectedType)).toSucceedWith(
        expectedType
      );
    });

    test('fails if any candidates specify conflicting resource types', () => {
      someDecls[0] = { ...someDecls[0], resourceTypeName: 'json' };
      someDecls[3] = { ...someDecls[3], resourceTypeName: 'other' };
      const candidates = mapResults(
        someDecls.map((decl) => {
          const resourceType = decl.resourceTypeName
            ? resourceTypes.validating.get(decl.resourceTypeName).orThrow()
            : undefined;
          return TsRes.Resources.ResourceCandidate.create({
            id: decl.id,
            conditionSets,
            decl,
            resourceType
          });
        })
      ).orThrow();
      expect(TsRes.Resources.ResourceCandidate.validateResourceTypes(candidates)).toFailWith(
        /resource type mismatch/i
      );
    });

    test('fails if candidates specify conflicting resource types with expected resource type', () => {
      someDecls[0] = { ...someDecls[0], resourceTypeName: 'other' };
      someDecls[3] = { ...someDecls[3], resourceTypeName: 'other' };
      const candidates = mapResults(
        someDecls.map((decl) => {
          const resourceType = decl.resourceTypeName
            ? resourceTypes.validating.get(decl.resourceTypeName).orThrow()
            : undefined;
          return TsRes.Resources.ResourceCandidate.create({
            id: decl.id,
            conditionSets,
            decl,
            resourceType
          });
        })
      ).orThrow();
      const expectedType = resourceTypes.validating.get('json').orThrow();
      expect(TsRes.Resources.ResourceCandidate.validateResourceTypes(candidates, expectedType)).toFailWith(
        /resource type mismatch/i
      );
    });
  });

  describe('compare static method', () => {
    test('compares candidates by condition priority', () => {
      const candidates = mapResults(
        someDecls.map((decl) =>
          TsRes.Resources.ResourceCandidate.create({
            id: decl.id,
            conditionSets,
            decl
          })
        )
      ).orThrow();
      const expectedOrder = Array.from(candidates).sort(TsRes.Resources.ResourceCandidate.compare).reverse();
      let last = expectedOrder.shift();
      let next = expectedOrder.shift();
      while (last && next) {
        expect(TsRes.Conditions.ConditionSet.compare(last.conditions, next.conditions)).toBeGreaterThan(0);
        last = next;
        next = expectedOrder.shift();
      }
    });
  });

  describe('equal static method', () => {
    let decl: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl;
    beforeEach(() => {
      decl = {
        id: 'some.resource.path',
        json: { home: 'United States' },
        conditions: {
          homeTerritory: 'US'
        },
        isPartial: true,
        mergeMethod: 'replace'
      };
    });
    test('matches for identical candidates', () => {
      const candidate = TsRes.Resources.ResourceCandidate.create({
        id: decl.id,
        conditionSets,
        decl
      }).orThrow();
      expect(TsRes.Resources.ResourceCandidate.equal(candidate, candidate)).toBe(true);
    });

    test('matches for candidates with identical contents', () => {
      const candidate1 = TsRes.Resources.ResourceCandidate.create({
        id: decl.id,
        conditionSets,
        decl
      }).orThrow();
      const candidate2 = TsRes.Resources.ResourceCandidate.create({
        id: decl.id,
        conditionSets,
        decl
      }).orThrow();
      expect(TsRes.Resources.ResourceCandidate.equal(candidate1, candidate2)).toBe(true);
    });

    test('matches candidates with identical normalized contents', () => {
      const candidate1 = TsRes.Resources.ResourceCandidate.create({
        id: decl.id,
        conditionSets,
        decl: { ...decl, json: { this: 'that', other: 'thing' } }
      }).orThrow();
      const candidate2 = TsRes.Resources.ResourceCandidate.create({
        id: decl.id,
        conditionSets,
        decl: { ...decl, json: { other: 'thing', this: 'that' } }
      }).orThrow();
      expect(TsRes.Resources.ResourceCandidate.equal(candidate1, candidate2)).toBe(true);
    });

    test('does not match for candidates with different IDs', () => {
      const candidate1 = TsRes.Resources.ResourceCandidate.create({
        id: decl.id,
        conditionSets,
        decl
      }).orThrow();
      const candidate2 = TsRes.Resources.ResourceCandidate.create({
        id: 'other.resource.path',
        conditionSets,
        decl
      }).orThrow();
      expect(TsRes.Resources.ResourceCandidate.equal(candidate1, candidate2)).toBe(false);
    });

    test('does not match for candidates with different conditions', () => {
      const candidate1 = TsRes.Resources.ResourceCandidate.create({
        id: decl.id,
        conditionSets,
        decl
      }).orThrow();
      const candidate2 = TsRes.Resources.ResourceCandidate.create({
        id: decl.id,
        conditionSets,
        decl: { ...decl, conditions: { homeTerritory: 'CA' } }
      }).orThrow();
      expect(TsRes.Resources.ResourceCandidate.equal(candidate1, candidate2)).toBe(false);
    });

    test('does not match for candidates with different partial flags', () => {
      const candidate1 = TsRes.Resources.ResourceCandidate.create({
        id: decl.id,
        conditionSets,
        decl
      }).orThrow();
      const candidate2 = TsRes.Resources.ResourceCandidate.create({
        id: decl.id,
        conditionSets,
        decl: { ...decl, isPartial: false }
      }).orThrow();
      expect(TsRes.Resources.ResourceCandidate.equal(candidate1, candidate2)).toBe(false);
    });

    test('does not match for candidates with different merge methods', () => {
      const candidate1 = TsRes.Resources.ResourceCandidate.create({
        id: decl.id,
        conditionSets,
        decl
      }).orThrow();
      const candidate2 = TsRes.Resources.ResourceCandidate.create({
        id: decl.id,
        conditionSets,
        decl: { ...decl, mergeMethod: 'augment' }
      }).orThrow();
      expect(TsRes.Resources.ResourceCandidate.equal(candidate1, candidate2)).toBe(false);
    });

    test('does not match for candidates with different JSON', () => {
      const candidate1 = TsRes.Resources.ResourceCandidate.create({
        id: decl.id,
        conditionSets,
        decl
      }).orThrow();
      const candidate2 = TsRes.Resources.ResourceCandidate.create({
        id: decl.id,
        conditionSets,
        decl: { ...decl, json: { other: 'json' } }
      }).orThrow();
      expect(TsRes.Resources.ResourceCandidate.equal(candidate1, candidate2)).toBe(false);
    });
  });
});
