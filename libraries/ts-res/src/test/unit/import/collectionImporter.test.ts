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
import { ResourceManager } from '../../../packlets/resources';

describe('CollectionImporter', () => {
  let qualifierTypes: TsRes.QualifierTypes.QualifierTypeCollector;
  let qualifiers: TsRes.Qualifiers.QualifierCollector;
  let resourceTypes: TsRes.ResourceTypes.ResourceTypeCollector;
  let manager: ResourceManager;

  let context: TsRes.Import.ImportContext;
  let collectionJson: TsRes.ResourceJson.Json.IResourceCollectionDecl;
  let treeJson: TsRes.ResourceJson.Json.IResourceTreeRootDecl;
  let collection: TsRes.ResourceJson.ResourceDeclCollection;
  let tree: TsRes.ResourceJson.ResourceDeclTree;
  let importer: TsRes.Import.Importers.CollectionImporter;

  beforeEach(() => {
    qualifierTypes = TsRes.QualifierTypes.QualifierTypeCollector.create({
      qualifierTypes: [
        TsRes.QualifierTypes.LanguageQualifierType.create().orThrow(),
        TsRes.QualifierTypes.TerritoryQualifierType.create().orThrow(),
        TsRes.QualifierTypes.LiteralQualifierType.create().orThrow()
      ]
    }).orThrow();

    const qualifierDecls: TsRes.Qualifiers.IQualifierDecl[] = [
      {
        name: 'homeTerritory',
        typeName: 'territory',
        defaultPriority: 800,
        token: 'home',
        tokenIsOptional: true
      },
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

    manager = TsRes.Resources.ResourceManager.create({ qualifiers, resourceTypes }).orThrow();

    context = TsRes.Import.ImportContext.create({
      baseId: 'some.resource.id',
      conditions: [{ qualifierName: 'some_thing', value: 'thing' }]
    }).orThrow();
    importer = TsRes.Import.Importers.CollectionImporter.create().orThrow();

    collectionJson = {
      candidates: [
        {
          id: 'foo',
          json: { myNameIs: 'language en-US' },
          conditions: { language: 'en-US' }
        },
        {
          id: 'bar',
          json: { myNameIs: 'home AQ' },
          conditions: { homeTerritory: { value: 'AQ', priority: 200 } }
        }
      ],
      resources: [
        {
          id: 'baz',
          resourceTypeName: 'json',
          candidates: [
            {
              json: { myNameIs: 'geo CA' },
              conditions: { currentTerritory: 'CA' }
            },
            {
              json: { myNameIs: 'language es-419' },
              conditions: { language: { value: 'es-419', priority: 200 } }
            }
          ]
        }
      ]
    };
    treeJson = {
      baseName: 'base',
      resources: {
        foo: {
          resourceTypeName: 'json',
          candidates: [
            {
              json: { myNameIs: 'foo' },
              conditions: { foo: 'bar' }
            }
          ]
        },
        bar: {
          resourceTypeName: 'json',
          candidates: [
            {
              json: { myNameIs: 'bar' },
              conditions: { foo: { value: 'baz', priority: 100 } },
              isPartial: true
            }
          ]
        }
      }
    };
    collection = TsRes.ResourceJson.ResourceDeclCollection.create(collectionJson).orThrow();
    tree = TsRes.ResourceJson.ResourceDeclTree.create(treeJson).orThrow();
  });

  describe('create', () => {
    test('creates an importer for collections and trees', () => {
      expect(importer.types).toEqual(['resourceCollection', 'resourceTree']);
    });
  });

  describe('import method', () => {
    test('returns a new importable for a resource collection decl', () => {
      const importable: TsRes.Import.Importable = { type: 'resourceCollection', collection };
      const importResult = importer.import(importable, manager);
      expect(importResult).toSucceedAndSatisfy((importables) => {
        expect(importables.length).toEqual(0);
        expect(manager.size).toEqual(3);
        expect(manager.resources.validating.has('foo')).toBe(true);
        expect(manager.resources.validating.has('bar')).toBe(true);
        expect(manager.resources.validating.has('baz')).toBe(true);
      });
      expect(importResult.detail).toEqual('consumed');
    });

    test('returns a new importable for a resource tree decl', () => {
      const importable: TsRes.Import.Importable = { type: 'resourceTree', tree };
      const importResult = importer.import(importable, manager);
      expect(importResult).toSucceedAndSatisfy((importables) => {
        expect(importables.length).toEqual(0);
        expect(manager.size).toEqual(2);
        expect(manager.resources.validating.has('base.foo')).toBe(true);
        expect(manager.resources.validating.has('base.bar')).toBe(true);
      });
      expect(importResult.detail).toEqual('consumed');
    });

    xtest('imports a resource collection merging in a supplied context', () => {
      const importable: TsRes.Import.Importable = { type: 'resourceCollection', collection, context };
      const importResult = importer.import(importable, manager);
      expect(importResult).toSucceedAndSatisfy((importables) => {
        expect(importables.length).toEqual(0);
        expect(manager.size).toEqual(3);
        expect(manager.resources.validating.has('foo')).toBe(true);
        expect(manager.resources.validating.has('bar')).toBe(true);
        expect(manager.resources.validating.has('baz')).toBe(true);
        expect(manager.resources.validating.get('foo')).toSucceedAndSatisfy((r) => {
          expect(r.candidates.length).toEqual(1);
          expect(r.candidates[0].conditions.size).toEqual(2);
          expect(r.candidates[0].conditions.conditions[0].toString()).toEqual('language-en-US@600');
          expect(r.candidates[0].conditions.conditions[1].toString()).toEqual('some_thing-thing@500');
        });
      });
      expect(importResult.detail).toEqual('consumed');
    });

    test('fails if the importable is not a resource collection or tree', () => {
      const importable: TsRes.Import.Importable = { type: 'path', path: 'some/path' };
      const importResult = importer.import(importable, manager);
      expect(importResult).toFailWith(/not a valid resource collection importable/i);
    });

    test('fails for an unknown importable', () => {
      const importable: TsRes.Import.IImportable = { type: 'unknown' };
      const importResult = importer.import(importable, manager);
      expect(importResult).toFailWith(/not a valid resource collection importable/i);
    });
  });
});
