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
import { FileTree } from '@fgv/ts-utils';
import * as TsRes from '../../../index';
import { IImportableFsItem } from '../../../packlets/import';

const resourceFiles: FileTree.IInMemoryFile[] = [
  {
    path: 'resources.json',
    contents: { helloMyNameIs: 'default resources' }
  },
  {
    path: '/US/resources.json',
    contents: { helloMyNameIs: 'resources for US' }
  },
  {
    path: '/home=CA/resources.json',
    contents: { helloMyNameIs: 'resources for CA' }
  },
  {
    path: '/resources.home=PR/language=es-419.json',
    contents: { helloMyNameIs: 'resources for PR in es-419' }
  },
  {
    path: '/resources.home=PR/language=en.json',
    contents: { helloMyNameIs: 'resources for PR in English' }
  },
  {
    path: '/resources.home=MX.json',
    contents: { helloMyNameIs: 'resources for MX' }
  },
  {
    path: '/US/resources.language=en-US.json',
    contents: { helloMyNameIs: 'resources for en-US in US' }
  },
  {
    path: '/resources/AQ.json',
    contents: { helloMyNameIs: 'resources for AQ' }
  },
  {
    path: '/resources/language=fr.json',
    contents: { helloMyNameIs: 'resources for fr' }
  },
  {
    path: '/resources/home=CA,language=fr.json',
    contents: { helloMyNameIs: 'resources for CA in fr' }
  },
  {
    path: '/broken/resources.home=Antarctica/language=en-US.json',
    contents: { helloMyNameIs: 'resources for Antarctica' }
  },
  {
    path: '/broken/resources/home=Mars.json',
    contents: { helloMyNameIs: 'resources for Mars' }
  },
  {
    path: '/resources.home=PR/readme.txt',
    contents: 'This is a readme file'
  }
];

describe('FsItemImporter', () => {
  let qualifierTypes: TsRes.QualifierTypes.QualifierTypeCollector;
  let qualifiers: TsRes.Qualifiers.QualifierCollector;
  let resourceTypes: TsRes.ResourceTypes.ResourceTypeCollector;

  let files: FileTree.IInMemoryFile[];
  let tree: FileTree.FileTree;
  let importer: TsRes.Import.Importers.FsItemImporter;
  let manager: TsRes.Resources.ResourceManager;

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

    files = JSON.parse(JSON.stringify(resourceFiles));
    tree = FileTree.inMemory(files).orThrow();
    importer = TsRes.Import.Importers.FsItemImporter.create({ qualifiers }).orThrow();

    resourceTypes = TsRes.ResourceTypes.ResourceTypeCollector.create({
      resourceTypes: [
        TsRes.ResourceTypes.JsonResourceType.create().orThrow(),
        TsRes.ResourceTypes.JsonResourceType.create({ key: 'other' }).orThrow()
      ]
    }).orThrow();

    manager = TsRes.Resources.ResourceManager.create({ qualifiers, resourceTypes }).orThrow();
  });

  describe('create static method', () => {
    test('creates a new FsItemImporter with supplied qualifiers', () => {
      expect(TsRes.Import.Importers.FsItemImporter.create({ qualifiers })).toSucceedAndSatisfy(
        (newImporter) => {
          expect(newImporter.qualifiers).toBe(qualifiers);
          expect(newImporter.types).toEqual(['fsItem']);
        }
      );
    });
  });

  describe('import', () => {
    test('imports an unconditional file path', () => {
      const fsItem = TsRes.Import.FsItem.createForPath('/US/resources.json', qualifiers, tree).orThrow();
      const importable: IImportableFsItem = { type: 'fsItem', item: fsItem };

      expect(importer.import(importable, manager)).toSucceedAndSatisfy((results) => {
        expect(results.length).toEqual(1);
        expect(results[0].type).toEqual('json');
        if (TsRes.Import.isImportable(results[0]) && results[0].type === 'json') {
          expect(results[0].json).toEqual({ helloMyNameIs: 'resources for US' });
          expect(results[0].context?.conditions.length).toEqual(0);
        }
      });
    });

    test('imports a conditional file path', () => {
      const fsItem = TsRes.Import.FsItem.createForPath('/resources.home=MX.json', qualifiers, tree).orThrow();
      const importable: IImportableFsItem = { type: 'fsItem', item: fsItem };

      expect(importer.import(importable, manager)).toSucceedAndSatisfy((results) => {
        expect(results.length).toEqual(1);
        expect(results[0].type).toEqual('json');
        if (TsRes.Import.isImportable(results[0]) && results[0].type === 'json') {
          expect(results[0].json).toEqual({ helloMyNameIs: 'resources for MX' });
          expect(results[0].context?.conditions.length).toEqual(1);
          expect(results[0].context?.conditions[0].qualifierName).toEqual('homeTerritory');
          expect(results[0].context?.conditions[0].value).toEqual('MX');
        }
      });
    });

    test('imports an unconditional directory path', () => {
      const fsItem = TsRes.Import.FsItem.createForPath('/resources', qualifiers, tree).orThrow();
      const importable: IImportableFsItem = { type: 'fsItem', item: fsItem };

      expect(importer.import(importable, manager)).toSucceedAndSatisfy((results) => {
        const importables = results.filter((r) => TsRes.Import.isImportable(r));
        const names = importables.map((i) => (i.type === 'fsItem' ? i.item.item.name : 'unknown')).sort();
        expect(importables.length).toEqual(3);
        expect(names).toEqual(['AQ.json', 'home=CA,language=fr.json', 'language=fr.json']);
        expect(importables.every((i) => i.context?.conditions.length === 0)).toBe(true);
      });
    });

    test('imports a conditional directory path', () => {
      const fsItem = TsRes.Import.FsItem.createForPath('/home=CA', qualifiers, tree).orThrow();
      const importable: IImportableFsItem = { type: 'fsItem', item: fsItem };

      expect(importer.import(importable, manager)).toSucceedAndSatisfy((results) => {
        const importables = results.filter((r) => TsRes.Import.isImportable(r));
        const names = importables.map((i) => (i.type === 'fsItem' ? i.item.item.name : 'unknown')).sort();
        expect(importables.length).toEqual(1);
        expect(names).toEqual(['resources.json']);
        expect(
          importables.every((i) => {
            return (
              i.context?.conditions.length === 1 &&
              i.context.conditions[0].qualifierName === 'homeTerritory' &&
              i.context.conditions[0].value === 'CA'
            );
          })
        ).toBe(true);
      });
    });

    test('merges importable context with conditions from the item being imported', () => {
      const fsItem = TsRes.Import.FsItem.createForPath(
        '/US/resources.language=en-US.json',
        qualifiers,
        tree
      ).orThrow();
      const importable: TsRes.Import.Importable = {
        type: 'fsItem',
        item: fsItem,
        context: TsRes.Import.ImportContext.create({
          baseId: 'some.resource.path',
          conditions: [
            // simulate the conditions we would have inherited from the directory
            { qualifierName: 'homeTerritory', value: 'US' }
          ]
        }).orThrow()
      };
      expect(importer.import(importable, manager)).toSucceedAndSatisfy((results) => {
        expect(results.length).toEqual(1);
        expect(results[0].type).toEqual('json');
        if (TsRes.Import.isImportable(results[0]) && results[0].type === 'json') {
          expect(results[0].json).toEqual({ helloMyNameIs: 'resources for en-US in US' });
          expect(results[0].context?.baseId).toEqual('some.resource.path.resources');
          expect(results[0].context?.conditions.length).toEqual(2);
          expect(results[0].context?.conditions[0].qualifierName).toEqual('homeTerritory');
          expect(results[0].context?.conditions[0].value).toEqual('US');
          expect(results[0].context?.conditions[1].qualifierName).toEqual('language');
          expect(results[0].context?.conditions[1].value).toEqual('en-US');
        }
      });
    });

    test('succeeds with no importables and with detail skipped for a non-json file', () => {
      const fsItem = TsRes.Import.FsItem.createForPath(
        '/resources.home=PR/readme.txt',
        qualifiers,
        tree
      ).orThrow();
      const importable: TsRes.Import.Importable = { type: 'fsItem', item: fsItem };
      importer = TsRes.Import.Importers.FsItemImporter.create({
        qualifiers
      }).orThrow();
      const importResult = importer.import(importable, manager);
      expect(importResult).toSucceedAndSatisfy((results) => {
        expect(results.length).toEqual(0);
      });
      expect(importResult.detail).toEqual('skipped');
    });

    test('fails to import a directory with invalid children', () => {
      const fsItem = TsRes.Import.FsItem.createForPath('/broken', qualifiers, tree).orThrow();
      const importable: TsRes.Import.Importable = { type: 'fsItem', item: fsItem };
      expect(importer.import(importable, manager)).toFailWithDetail(/invalid condition value/i, 'failed');
    });

    test('fails for a malformed fsItem importable', () => {
      const importable: TsRes.Import.IImportable = { type: 'fsItem' };
      expect(importer.import(importable, manager)).toFailWith(/malformed fsItem importable/i);
    });

    test('fails with detail skipped for an unknown importable type', () => {
      const importable: TsRes.Import.IImportable = { type: 'unknown' };
      expect(importer.import(importable, manager)).toFailWithDetail(/invalid importable type/i, 'skipped');
    });
  });
});
