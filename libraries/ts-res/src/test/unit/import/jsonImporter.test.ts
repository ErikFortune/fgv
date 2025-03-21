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

describe('jsonImporter', () => {
  let qualifierTypes: TsRes.QualifierTypes.QualifierTypeCollector;
  let qualifiers: TsRes.Qualifiers.QualifierCollector;
  let resourceTypes: TsRes.ResourceTypes.ResourceTypeCollector;
  let manager: ResourceManager;

  let context: TsRes.Import.ImportContext;
  let importable: TsRes.Import.IImportableJson;
  let importer: TsRes.Import.Importers.JsonImporter;

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
      conditions: [
        { qualifierName: 'currentTerritory', value: 'US' },
        { qualifierName: 'language', value: 'en' }
      ]
    }).orThrow();
    importable = { type: 'json', json: { helloMyNameIs: 'importable' }, context };
    importer = TsRes.Import.Importers.JsonImporter.create().orThrow();
  });

  describe('create', () => {
    test('creates an importer for json type importables', () => {
      expect(importer.types).toEqual(['json']);
    });
  });

  describe('import', () => {
    test('imports a valid JSON object with name and conditions from context', () => {
      expect(manager.resources.has(context.baseId!)).toBe(false);
      expect(importer.import(importable, manager)).toSucceedWithDetail([], 'consumed');
      expect(manager.resources.get(context.baseId!)).toSucceedAndSatisfy((resource) => {
        expect(resource.id).toEqual(context.baseId);
        expect(resource.candidates.length).toEqual(1);
        expect(resource.candidates[0].json).toEqual(importable.json);
        expect(resource.candidates[0].conditions.conditions[0].qualifier.name).toEqual(
          importable.context!.conditions![0].qualifierName
        );
        expect(resource.candidates[0].conditions.conditions[0].value).toEqual(
          importable.context!.conditions![0].value
        );
        expect(resource.candidates[0].conditions.conditions[1].qualifier.name).toEqual(
          importable.context!.conditions![1].qualifierName
        );
        expect(resource.candidates[0].conditions.conditions[1].value).toEqual(
          importable.context!.conditions![1].value
        );
      });
    });

    test('fails for an item with an invalid id', () => {
      const badIdContext = TsRes.Import.ImportContext.create({}).orThrow();
      const badImportable = { type: 'json', json: { helloMyNameIs: 'importable' }, context: badIdContext };
      expect(importer.import(badImportable, manager)).toFailWithDetail(/invalid id/i, 'failed');
    });

    test('fails for an unknown importable type', () => {
      const badImportable = { type: 'unknown', json: { helloMyNameIs: 'importable' }, context };
      expect(importer.import(badImportable, manager)).toFailWithDetail(
        /not a valid JSON importable/i,
        'failed'
      );
    });

    test('fails for a known non-json importable type', () => {
      const badImportable = { type: 'path', path: 'some/path', context };
      expect(importer.import(badImportable, manager)).toFailWithDetail(
        /not a valid JSON importable/i,
        'failed'
      );
    });

    test('fails for JSON importable with a non-object payload', () => {
      const badImportable = { type: 'json', json: 'not an object', context };
      expect(importer.import(badImportable, manager)).toFailWithDetail(/not a valid json object/i, 'failed');
    });
  });
});
