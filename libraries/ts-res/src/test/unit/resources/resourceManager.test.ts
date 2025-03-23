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

describe('ResourceManager', () => {
  let qualifierTypes: TsRes.QualifierTypes.QualifierTypeCollector;
  let qualifierDecls: TsRes.Qualifiers.IQualifierDecl[];
  let qualifiers: TsRes.Qualifiers.QualifierCollector;
  let resourceTypes: TsRes.ResourceTypes.ResourceTypeCollector;
  let someDecls: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[];
  let otherDecls: TsRes.ResourceJson.Json.ILooseResourceCandidateDecl[];

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
      },
      {
        id: 'some.resource.path',
        json: { speaks: 'Esperanto' }
      }
    ];
    otherDecls = [
      {
        id: 'some.other.path',
        json: { home: 'United States' },
        conditions: {
          homeTerritory: 'US'
        }
      },
      {
        id: 'some.other.path',
        json: { speaks: 'English' },
        conditions: { language: 'en' }
      }
    ];
  });

  describe('static create method', () => {
    test('creates a new empty resource manager', () => {
      const manager = TsRes.Resources.ResourceManager.create({
        qualifiers,
        resourceTypes
      });
      expect(manager).toSucceedAndSatisfy((m) => {
        expect(m.qualifiers).toBe(qualifiers);
        expect(m.resourceTypes).toBe(resourceTypes);
        expect(m.size).toEqual(0);
        expect(m.conditions.size).toEqual(0);
        expect(m.conditionSets.size).toEqual(1);
        expect(m.decisions.size).toEqual(2);
        expect(m.resources.size).toEqual(0);
      });
    });
  });

  describe('addLooseCandidate method', () => {
    let manager: TsRes.Resources.ResourceManager;

    beforeEach(() => {
      manager = TsRes.Resources.ResourceManager.create({
        qualifiers,
        resourceTypes
      }).orThrow();
    });

    test('adds a candidate to an empty manager for a new resource', () => {
      expect(manager.size).toEqual(0);
      const result = manager.addLooseCandidate(someDecls[0]);
      expect(result).toSucceedAndSatisfy((c) => {
        expect(c.id).toEqual(someDecls[0].id);
        expect(manager.size).toEqual(1);
        expect(manager.resources.size).toEqual(1);
      });
      expect(manager.size).toEqual(1);
    });

    test('adds an additional candidate to the manager for an existing resource', () => {
      expect(manager.size).toEqual(0);
      manager.addLooseCandidate(someDecls[0]).orThrow();
      expect(manager.size).toEqual(1);
      const result = manager.addLooseCandidate(someDecls[1]);
      expect(result).toSucceedAndSatisfy((c) => {
        expect(c.id).toEqual(someDecls[1].id);
        expect(manager.size).toEqual(1);
        expect(manager.resources.size).toEqual(1);
      });
    });

    test('adds a candidate for a new resource in a manager', () => {
      expect(manager.size).toEqual(0);
      manager.addLooseCandidate(someDecls[0]).orThrow();
      expect(manager.size).toEqual(1);
      expect(manager.addLooseCandidate(otherDecls[0])).toSucceedAndSatisfy((c) => {
        expect(c.id).toEqual(otherDecls[0].id);
        expect(manager.size).toEqual(2);
      });
    });

    test('adds an unconditional candidate to a manager', () => {
      const unconditional = {
        id: 'some.resource.path',
        json: { speaks: 'Esperanto' }
      };
      expect(manager.size).toEqual(0);
      expect(manager.addLooseCandidate(unconditional)).toSucceedAndSatisfy((c) => {
        expect(c.id).toEqual(unconditional.id);
        expect(c.conditions.conditions.length).toEqual(0);
        expect(manager.size).toEqual(1);
      });
    });

    test('fails for a candidate with an invalid id', () => {
      const result = manager.addLooseCandidate({ ...someDecls[0], id: 'invalid id' });
      expect(result).toFailWith(/invalid id/i);
    });

    test('fails for a candidate with an unknown resource type', () => {
      const result = manager.addLooseCandidate({ ...someDecls[0], resourceTypeName: 'unknown' });
      expect(result).toFailWith(/not found/i);
    });
  });

  describe('getBuiltResource method', () => {
    let manager: TsRes.Resources.ResourceManager;

    beforeEach(() => {
      manager = TsRes.Resources.ResourceManager.create({
        qualifiers,
        resourceTypes
      }).orThrow();
    });

    test('gets a built resource by id', () => {
      manager.addLooseCandidate({ ...someDecls[0], resourceTypeName: 'json' }).orThrow();
      manager.addLooseCandidate(someDecls[1]).orThrow();
      manager.addLooseCandidate(someDecls[2]).orThrow();
      manager.addLooseCandidate(someDecls[3]).orThrow();

      const resource = manager.getBuiltResource('some.resource.path');
      expect(resource).toSucceedAndSatisfy((r) => {
        expect(r.id).toEqual('some.resource.path');
        expect(r.candidates.length).toEqual(4);
      });
    });

    test('fails to get a built resource by id if it does not exist', () => {
      manager.addLooseCandidate({ ...someDecls[0], resourceTypeName: 'json' }).orThrow();
      manager.addLooseCandidate(someDecls[1]).orThrow();
      manager.addLooseCandidate(someDecls[2]).orThrow();
      manager.addLooseCandidate(someDecls[3]).orThrow();

      const resource = manager.getBuiltResource('some.other.path');
      expect(resource).toFailWith(/not found/i);
    });
  });

  describe('build method', () => {
    let manager: TsRes.Resources.ResourceManager;

    beforeEach(() => {
      manager = TsRes.Resources.ResourceManager.create({
        qualifiers,
        resourceTypes
      }).orThrow();
    });

    test('builds all resources in a resource manager', () => {
      manager.addLooseCandidate({ ...someDecls[0], resourceTypeName: 'json' }).orThrow();
      manager.addLooseCandidate(someDecls[1]).orThrow();
      manager.addLooseCandidate(someDecls[2]).orThrow();
      manager.addLooseCandidate(someDecls[3]).orThrow();
      manager.addLooseCandidate({ ...otherDecls[0], resourceTypeName: 'json' }).orThrow();

      expect(manager.build()).toSucceedAndSatisfy((r) => {
        expect(r.size).toEqual(2);
        expect(r.validating.get(someDecls[0].id)).toSucceedAndSatisfy((resource) => {
          expect(resource.id).toEqual(someDecls[0].id);
          expect(resource.candidates.length).toEqual(4);
        });
        expect(r.validating.get(otherDecls[0].id)).toSucceedAndSatisfy((resource) => {
          expect(resource.id).toEqual(otherDecls[0].id);
          expect(resource.candidates.length).toEqual(1);
        });
      });
    });
  });
});
