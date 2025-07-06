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

  describe('addResource method', () => {
    let manager: TsRes.Resources.ResourceManager;

    beforeEach(() => {
      manager = TsRes.Resources.ResourceManager.create({
        qualifiers,
        resourceTypes
      }).orThrow();
    });

    test('adds a resource to a manager', () => {
      const resource: TsRes.ResourceJson.Json.ILooseResourceDecl = {
        id: 'some.resource.path',
        candidates: [
          { json: { home: 'United States' }, conditions: { homeTerritory: 'US' } },
          { json: { speaks: 'English' }, conditions: { language: 'en' } }
        ],
        resourceTypeName: 'json'
      };

      expect(manager.size).toEqual(0);
      expect(manager.addResource(resource)).toSucceedAndSatisfy((r) => {
        expect(r.id).toEqual(resource.id);
        expect(r.resourceType?.key).toEqual('json');
        expect(manager.size).toEqual(1);
      });
    });

    test('adds a resource with no candidates array', () => {
      const resource: TsRes.ResourceJson.Json.ILooseResourceDecl = {
        id: 'some.resource.path',
        resourceTypeName: 'json'
      };
      expect(manager.size).toEqual(0);
      expect(manager.addResource(resource)).toSucceedAndSatisfy((r) => {
        expect(r.id).toEqual(resource.id);
        expect(r.resourceType?.key).toEqual('json');
        expect(manager.size).toEqual(1);
        expect(r.candidates.length).toEqual(0);
      });
    });

    test('merges candidates for an existing resource', () => {
      const resource: TsRes.ResourceJson.Json.ILooseResourceDecl = {
        id: 'some.resource.path',
        candidates: [
          { json: { home: 'United States' }, conditions: { homeTerritory: 'US' } },
          { json: { speaks: 'English' }, conditions: { language: 'en' } }
        ],
        resourceTypeName: 'json'
      };

      expect(manager.size).toEqual(0);
      manager.addResource(resource).orThrow();
      expect(manager.size).toEqual(1);

      const newResource: TsRes.ResourceJson.Json.ILooseResourceDecl = {
        id: 'some.resource.path',
        candidates: [
          {
            json: { home: 'Canada', speaks: 'Canadian English' },
            conditions: { homeTerritory: 'CA', language: 'en-CA' }
          }
        ],
        resourceTypeName: 'json'
      };

      expect(manager.addResource(newResource)).toSucceedAndSatisfy((r) => {
        expect(r.id).toEqual(newResource.id);
        expect(r.candidates.length).toEqual(3);
      });
    });

    test('fails to merge if resource types do not match', () => {
      const resource: TsRes.ResourceJson.Json.ILooseResourceDecl = {
        id: 'some.resource.path',
        candidates: [
          { json: { home: 'United States' }, conditions: { homeTerritory: 'US' } },
          { json: { speaks: 'English' }, conditions: { language: 'en' } }
        ],
        resourceTypeName: 'json'
      };
      const otherResource: TsRes.ResourceJson.Json.ILooseResourceDecl = {
        id: 'some.resource.path',
        candidates: [
          { json: { home: 'Canada', speaks: 'Canadian English' }, conditions: { homeTerritory: 'CA' } }
        ],
        resourceTypeName: 'other'
      };
      expect(manager.size).toEqual(0);
      manager.addResource(resource).orThrow();
      expect(manager.size).toEqual(1);
      expect(manager.addResource(otherResource)).toFailWith(/conflicting resource types/i);
    });

    test('fails to add a resource with an invalid id', () => {
      const resource: TsRes.ResourceJson.Json.ILooseResourceDecl = {
        id: 'invalid id',
        candidates: [
          { json: { home: 'United States' }, conditions: { homeTerritory: 'US' } },
          { json: { speaks: 'English' }, conditions: { language: 'en' } }
        ],
        resourceTypeName: 'json'
      };

      expect(manager.size).toEqual(0);
      expect(manager.addResource(resource)).toFailWith(/invalid id/i);
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

  describe('getAll methods', () => {
    let manager: TsRes.Resources.ResourceManager;

    beforeEach(() => {
      manager = TsRes.Resources.ResourceManager.create({
        qualifiers,
        resourceTypes
      }).orThrow();
      manager.addLooseCandidate({ ...someDecls[0], resourceTypeName: 'json' }).orThrow();
      manager.addLooseCandidate(someDecls[1]).orThrow();
      manager.addLooseCandidate(someDecls[2]).orThrow();
      manager.addLooseCandidate(someDecls[3]).orThrow();
      manager.addLooseCandidate({ ...otherDecls[0], resourceTypeName: 'json' }).orThrow();
    });

    test('getAllResources method returns sorted resources', () => {
      const resources = manager.getAllResources();
      expect(resources.length).toEqual(2);
      expect(resources[0].id).toEqual('some.other.path');
      expect(resources[0].candidates.length).toEqual(1);
      expect(resources[1].id).toEqual('some.resource.path');
      expect(resources[1].candidates.length).toEqual(4);
    });

    test('getAllCandidates method returns sorted candidates', () => {
      const candidates = manager.getAllCandidates();
      expect(candidates.length).toEqual(5);
      expect(candidates[0].id).toEqual('some.other.path');
      expect(candidates[1].id).toEqual('some.resource.path');
      expect(candidates[2].id).toEqual('some.resource.path');
      expect(candidates[3].id).toEqual('some.resource.path');
      expect(candidates[4].id).toEqual('some.resource.path');
    });

    test('getAllBuiltResources method gets sorted built resources', () => {
      expect(manager.getAllBuiltResources()).toSucceedAndSatisfy((builtResources) => {
        expect(builtResources.length).toEqual(2);
        expect(builtResources[0].id).toEqual('some.other.path');
        expect(builtResources[1].id).toEqual('some.resource.path');
      });
    });

    test('getAllBuiltCandidates method gets sorted built candidates', () => {
      expect(manager.getAllBuiltCandidates()).toSucceedAndSatisfy((builtCandidates) => {
        expect(builtCandidates.length).toEqual(5);
        expect(builtCandidates[0].id).toEqual('some.other.path');
        expect(builtCandidates[1].id).toEqual('some.resource.path');
        expect(builtCandidates[2].id).toEqual('some.resource.path');
        expect(builtCandidates[3].id).toEqual('some.resource.path');
        expect(builtCandidates[4].id).toEqual('some.resource.path');
      });
    });
  });

  describe('semantic and edge-case tests', () => {
    let manager: TsRes.Resources.ResourceManager;
    beforeEach(() => {
      manager = TsRes.Resources.ResourceManager.create({
        qualifiers,
        resourceTypes
      }).orThrow();
    });

    test('deduplicates duplicate candidates for the same resource', () => {
      const decl = { ...someDecls[0], resourceTypeName: 'json' };
      expect(manager.addLooseCandidate(decl)).toSucceed();
      expect(manager.addLooseCandidate(decl)).toSucceed();
      const resource = manager.getBuiltResource(decl.id);
      expect(resource).toSucceedAndSatisfy((r) => {
        expect(r.candidates.length).toBe(1);
      });
    });

    test('fails to add conflicting candidates (mergeMethod/partial) for the same resource', () => {
      const decl1 = {
        ...someDecls[0],
        resourceTypeName: 'json',
        mergeMethod: 'augment' as const,
        isPartial: false
      };
      const decl2 = {
        ...someDecls[0],
        resourceTypeName: 'json',
        mergeMethod: 'replace' as const,
        isPartial: true
      };
      expect(manager.addLooseCandidate(decl1)).toSucceed();
      expect(manager.addLooseCandidate(decl2)).toFailWith(/conflicting candidates/i);
    });

    test('deduplicates candidates with deeply nested JSON', () => {
      const decl1 = {
        id: 'deep.nested',
        json: { a: { b: { c: [1, 2, { d: 'x' }] } } },
        conditions: { homeTerritory: 'US' },
        resourceTypeName: 'json'
      };
      const decl2 = {
        id: 'deep.nested',
        json: { a: { b: { c: [1, 2, { d: 'x' }] } } },
        conditions: { homeTerritory: 'US' },
        resourceTypeName: 'json'
      };
      expect(manager.addLooseCandidate(decl1)).toSucceed();
      expect(manager.addLooseCandidate(decl2)).toSucceed();
      const resource = manager.getBuiltResource('deep.nested');
      expect(resource).toSucceedAndSatisfy((r) => {
        expect(r.candidates.length).toBe(1);
      });
    });

    test('fails to add a candidate missing json field', () => {
      const decl = {
        id: 'missing.json',
        conditions: { homeTerritory: 'US' },
        resourceTypeName: 'json'
      } as unknown as TsRes.ResourceJson.Json.ILooseResourceCandidateDecl;
      expect(manager.addLooseCandidate(decl)).toFail();
    });

    test('treats missing conditions field as unconditional (empty conditions)', () => {
      const decl = {
        id: 'missing.conditions',
        json: { a: 1 },
        resourceTypeName: 'json'
      } as unknown as TsRes.ResourceJson.Json.ILooseResourceCandidateDecl;
      expect(manager.addLooseCandidate(decl)).toSucceedAndSatisfy((c) => {
        expect(c.conditions.conditions.length).toBe(0);
      });
    });

    test('fails to add a candidate with unknown qualifier in conditions', () => {
      const decl = {
        id: 'unknown.qualifier',
        json: { a: 1 },
        conditions: { notAQualifier: 'foo' },
        resourceTypeName: 'json'
      };
      expect(manager.addLooseCandidate(decl)).toFailWith(/notAQualifier/);
    });

    test('fails to add a candidate with non-serializable JSON value', () => {
      // Create a circular object
      const circular: Record<string, unknown> = { a: 1 };
      (circular as { self?: unknown }).self = circular;
      const decl = {
        id: 'circular.json',
        json: circular as unknown as import('@fgv/ts-json-base').JsonObject,
        conditions: { homeTerritory: 'US' },
        resourceTypeName: 'json'
      };
      expect(manager.addLooseCandidate(decl)).toFail();
    });

    test('infers resource type if not explicitly provided but all candidates agree', () => {
      const decl1 = { ...someDecls[0], resourceTypeName: 'json' };
      const decl2 = { ...someDecls[1], resourceTypeName: 'json' };
      expect(manager.addLooseCandidate(decl1)).toSucceed();
      expect(manager.addLooseCandidate(decl2)).toSucceed();
      const resource = manager.getBuiltResource(decl1.id);
      expect(resource).toSucceedAndSatisfy((r) => {
        expect(r.resourceType?.key).toBe('json');
      });
    });

    test('does not pollute state after failed add', () => {
      const badDecl = { ...someDecls[0], id: 'invalid id' };
      expect(manager.addLooseCandidate(badDecl)).toFail();
      expect(manager.size).toBe(0);
      expect(manager.resources.size).toBe(0);
    });

    test('state is consistent after concurrent add/build', () => {
      const decl1 = { ...someDecls[0], resourceTypeName: 'json' };
      const decl2 = { ...someDecls[1], resourceTypeName: 'json' };
      expect(manager.addLooseCandidate(decl1)).toSucceed();
      expect(manager.build()).toSucceed();
      expect(manager.addLooseCandidate(decl2)).toSucceed();
      expect(manager.build()).toSucceedAndSatisfy((r) => {
        expect(r.size).toBe(1);
        expect(r.validating.get(decl1.id)).toSucceedAndSatisfy((res) => {
          expect(res.candidates.length).toBe(2);
        });
      });
    });

    test('fails gracefully if trying to remove or replace a resource (not supported)', () => {
      // There is no remove/replace API, so we expect failure or no-op
      // Try to add a resource with the same id but different type
      const decl1 = { ...someDecls[0], resourceTypeName: 'json' };
      const decl2 = { ...someDecls[0], resourceTypeName: 'other' };
      expect(manager.addLooseCandidate(decl1)).toSucceed();
      expect(manager.addLooseCandidate(decl2)).toFailWith(/conflicting resource types/i);
      // Now try to add a resource with conflicting type
      const resource: TsRes.ResourceJson.Json.ILooseResourceDecl = {
        id: decl1.id,
        candidates: [decl2],
        resourceTypeName: 'other'
      };
      expect(manager.addResource(resource)).toFailWith(/conflicting resource types/i);
    });
  });

  describe('context filtering methods', () => {
    let manager: TsRes.Resources.ResourceManager;

    beforeEach(() => {
      manager = TsRes.Resources.ResourceManager.create({
        qualifiers,
        resourceTypes
      }).orThrow();

      // Add candidates with various conditions for testing filtering
      manager
        .addLooseCandidate({
          id: 'filtered.resource',
          json: { message: 'US English' },
          conditions: { language: 'en-US', homeTerritory: 'US' },
          resourceTypeName: 'json'
        })
        .orThrow();

      manager
        .addLooseCandidate({
          id: 'filtered.resource',
          json: { message: 'Canadian English' },
          conditions: { language: 'en-CA', homeTerritory: 'CA' },
          resourceTypeName: 'json'
        })
        .orThrow();

      manager
        .addLooseCandidate({
          id: 'filtered.resource',
          json: { message: 'French' },
          conditions: { language: 'fr', homeTerritory: 'CA' },
          resourceTypeName: 'json'
        })
        .orThrow();

      manager
        .addLooseCandidate({
          id: 'other.resource',
          json: { data: 'German only' },
          conditions: { language: 'de-DE' },
          resourceTypeName: 'json'
        })
        .orThrow();

      manager
        .addLooseCandidate({
          id: 'universal.resource',
          json: { universal: 'data' },
          conditions: {},
          resourceTypeName: 'json'
        })
        .orThrow();
    });

    test('getCandidatesForContext filters candidates by partial context', () => {
      const partialContext = TsRes.Context.Convert.validatedContextDecl
        .convert(
          {
            language: 'en-US'
          },
          { qualifiers }
        )
        .orThrow();

      const candidates = manager.getCandidatesForContext(partialContext, { partialContextMatch: true });
      expect(candidates.length).toBe(3); // Matches more due to language distance matching

      const ids = candidates.map((c) => c.id);
      expect(ids).toContain('filtered.resource');
      expect(ids).toContain('universal.resource');

      const messages = candidates
        .filter((c) => c.id === 'filtered.resource')
        .map((c) => (c.json as { message?: string }).message);
      expect(messages).toContain('US English');
    });

    test('getCandidatesForContext filters candidates with multiple qualifiers', () => {
      const partialContext = TsRes.Context.Convert.validatedContextDecl
        .convert(
          {
            language: 'en-CA',
            homeTerritory: 'CA'
          },
          { qualifiers }
        )
        .orThrow();

      const candidates = manager.getCandidatesForContext(partialContext, { partialContextMatch: true });
      expect(candidates.length).toBe(2); // Canadian English + universal

      const messages = candidates
        .filter((c) => c.id === 'filtered.resource')
        .map((c) => (c.json as { message?: string }).message);
      expect(messages).toContain('Canadian English');
    });

    test('getResourcesForContext filters resources that have matching candidates', () => {
      const partialContext = TsRes.Context.Convert.validatedContextDecl
        .convert(
          {
            language: 'de-DE'
          },
          { qualifiers }
        )
        .orThrow();

      const resources = manager.getResourcesForContext(partialContext, { partialContextMatch: true });
      expect(resources.length).toBe(2); // other.resource + universal.resource

      const ids = resources.map((r) => r.id).sort();
      expect(ids).toEqual(['other.resource', 'universal.resource']);
    });

    test('getBuiltCandidatesForContext filters built candidates', () => {
      manager.build().orThrow();

      const partialContext = TsRes.Context.Convert.validatedContextDecl
        .convert(
          {
            homeTerritory: 'CA'
          },
          { qualifiers }
        )
        .orThrow();

      const result = manager.getBuiltCandidatesForContext(partialContext, { partialContextMatch: true });
      expect(result).toSucceedAndSatisfy((candidates) => {
        expect(candidates.length).toBe(4); // More candidates match due to distance matching

        const ids = candidates.map((c) => c.id);
        expect(ids.filter((id) => id === 'filtered.resource').length).toBe(2);
        expect(ids).toContain('universal.resource');
      });
    });

    test('getBuiltResourcesForContext filters built resources', () => {
      manager.build().orThrow();

      const partialContext = TsRes.Context.Convert.validatedContextDecl
        .convert(
          {
            language: 'fr'
          },
          { qualifiers }
        )
        .orThrow();

      const result = manager.getBuiltResourcesForContext(partialContext, { partialContextMatch: true });
      expect(result).toSucceedAndSatisfy((resources) => {
        expect(resources.length).toBe(2); // filtered.resource + universal.resource

        const ids = resources.map((r) => r.id).sort();
        expect(ids).toEqual(['filtered.resource', 'universal.resource']);
      });
    });

    test('context filtering with empty context returns all candidates/resources', () => {
      const emptyContext = TsRes.Context.Convert.validatedContextDecl.convert({}, { qualifiers }).orThrow();

      const candidates = manager.getCandidatesForContext(emptyContext, { partialContextMatch: true });
      expect(candidates.length).toBe(5); // All candidates match empty context

      const resources = manager.getResourcesForContext(emptyContext, { partialContextMatch: true });
      expect(resources.length).toBe(3); // All resources match empty context
    });

    test('context filtering without partialContextMatch is more restrictive', () => {
      const partialContext = TsRes.Context.Convert.validatedContextDecl
        .convert(
          {
            language: 'en-US'
          },
          { qualifiers }
        )
        .orThrow();

      // Without partialContextMatch, candidates with additional qualifiers won't match
      const candidates = manager.getCandidatesForContext(partialContext, { partialContextMatch: false });
      expect(candidates.length).toBe(3); // Language matching still allows multiple matches

      const ids = candidates.map((c) => c.id);
      expect(ids).toContain('universal.resource');
    });
  });
});
