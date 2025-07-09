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
import { ImportManager } from '../../../packlets/import';

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
    path: '/broken/US/resources.json',
    contents: 'not a json object'
  },
  {
    path: '/resources.home=PR/readme.txt',
    contents: 'This is a readme file'
  }
];

describe('ImportManager', () => {
  let qualifierTypes: TsRes.QualifierTypes.QualifierTypeCollector;
  let qualifiers: TsRes.Qualifiers.QualifierCollector;
  let resourceTypes: TsRes.ResourceTypes.ResourceTypeCollector;

  let files: FileTree.IInMemoryFile[];
  let tree: FileTree.FileTree;
  let resourceManager: TsRes.Resources.ResourceManagerBuilder;
  let importers: TsRes.Import.Importers.IImporter[];
  let importManager: TsRes.Import.ImportManager;

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
    importers = [...ImportManager.getDefaultImporters(qualifiers, tree)];

    resourceTypes = TsRes.ResourceTypes.ResourceTypeCollector.create({
      resourceTypes: [
        TsRes.ResourceTypes.JsonResourceType.create().orThrow(),
        TsRes.ResourceTypes.JsonResourceType.create({ key: 'other' }).orThrow()
      ]
    }).orThrow();

    resourceManager = TsRes.Resources.ResourceManagerBuilder.create({ qualifiers, resourceTypes }).orThrow();
    importManager = TsRes.Import.ImportManager.create({ resources: resourceManager, importers }).orThrow();
  });

  describe('getDefaultImporters static method', () => {
    test('returns a list of default importers', () => {
      const defaultImporters = ImportManager.getDefaultImporters(qualifiers);
      expect(defaultImporters.length).toEqual(4);
      const pathImporter = defaultImporters.find((i) => i instanceof TsRes.Import.Importers.PathImporter);
      expect(pathImporter).toBeDefined();
      expect(pathImporter!.tree.hal).toBeInstanceOf(FileTree.FsFileTreeAccessors);
      expect(pathImporter?.qualifiers).toBe(qualifiers);
      expect(defaultImporters.find((i) => i instanceof TsRes.Import.Importers.FsItemImporter)).toBeDefined();
      expect(defaultImporters.find((i) => i instanceof TsRes.Import.Importers.JsonImporter)).toBeDefined();
      expect(
        defaultImporters.find((i) => i instanceof TsRes.Import.Importers.CollectionImporter)
      ).toBeDefined();
    });

    test('returns a list of default importers using a supplied file tree for paths', () => {
      const defaultImporters = ImportManager.getDefaultImporters(qualifiers, tree);
      expect(defaultImporters.length).toEqual(4);
      const pathImporter = defaultImporters.find((i) => i instanceof TsRes.Import.Importers.PathImporter);
      expect(pathImporter).toBeDefined();
      expect(pathImporter!.tree.hal).toBeInstanceOf(FileTree.InMemoryTreeAccessors);
      expect(pathImporter?.qualifiers).toBe(qualifiers);
      expect(defaultImporters.find((i) => i instanceof TsRes.Import.Importers.FsItemImporter)).toBeDefined();
      expect(defaultImporters.find((i) => i instanceof TsRes.Import.Importers.JsonImporter)).toBeDefined();
      expect(
        defaultImporters.find((i) => i instanceof TsRes.Import.Importers.CollectionImporter)
      ).toBeDefined();
    });
  });

  describe('create static method', () => {
    test('creates an import manager with the supplied resource manager, default importers and empty context', () => {
      expect(TsRes.Import.ImportManager.create({ resources: resourceManager })).toSucceedAndSatisfy(
        (manager) => {
          expect(manager.resources).toBe(resourceManager);
          expect(manager.initialContext.conditions.length).toEqual(0);
          expect(manager.importers.length).toEqual(importers.length);
        }
      );
    });

    test('creates an import manager with the supplied resource manager, importers and empty context', () => {
      expect(
        TsRes.Import.ImportManager.create({ resources: resourceManager, importers })
      ).toSucceedAndSatisfy((manager) => {
        expect(manager.resources).toBe(resourceManager);
        expect(manager.initialContext.conditions.length).toEqual(0);
        expect(manager.importers.length).toEqual(importers.length);
        expect(manager.importers).toEqual(importers);
      });
    });

    test('creates an import manager with the supplied resource manager, importers and context', () => {
      const context = TsRes.Import.ImportContext.create({
        baseId: 'some.resource.id',
        conditions: [
          { qualifierName: 'currentTerritory', value: 'US' },
          { qualifierName: 'language', value: 'en' }
        ]
      }).orThrow();
      expect(
        TsRes.Import.ImportManager.create({ resources: resourceManager, importers, initialContext: context })
      ).toSucceedAndSatisfy((manager) => {
        expect(manager.resources).toBe(resourceManager);
        expect(manager.initialContext).toBe(context);
        expect(manager.importers.length).toEqual(importers.length);
        expect(manager.importers).toEqual(importers);
      });
    });
  });

  describe('importFromFileSystem method', () => {
    test('imports a file that exists', () => {
      expect(importManager.importFromFileSystem('resources.json')).toSucceedAndSatisfy(() => {
        expect(resourceManager.resources.validating.has('resources')).toBe(true);
        expect(resourceManager.resources.validating.get('resources')).toSucceedAndSatisfy((resource) => {
          expect(resource.id).toEqual('resources');
          expect(resource.candidates.length).toEqual(1);
          expect(resource.candidates[0].json).toEqual({ helloMyNameIs: 'default resources' });
          expect(resource.candidates[0].conditions.conditions.length).toEqual(0);
        });
      });
    });

    test('imports a directory that exists', () => {
      expect(importManager.importFromFileSystem('resources')).toSucceedAndSatisfy(() => {
        expect(resourceManager.resources.validating.has('resources')).toBe(true);
        expect(resourceManager.resources.validating.get('resources')).toSucceedAndSatisfy((resource) => {
          expect(resource.id).toEqual('resources');
          expect(resource.candidates.length).toEqual(3);
          expect(resource.candidates[0].json).toEqual({ helloMyNameIs: 'resources for CA in fr' });
          expect(resource.candidates[0].conditions.conditions.length).toEqual(2);
          expect(resource.candidates[1].json).toEqual({ helloMyNameIs: 'resources for AQ' });
          expect(resource.candidates[1].conditions.conditions.length).toEqual(1);
          expect(resource.candidates[2].json).toEqual({ helloMyNameIs: 'resources for fr' });
          expect(resource.candidates[2].conditions.conditions.length).toEqual(1);
        });
      });
    });

    test('fails for a file with an unsupported file type', () => {
      expect(importManager.importFromFileSystem('/resources.home=PR/readme.txt')).toFailWith(
        /no matching importer/i
      );
    });

    test('silently ignores a file with an unsupported file type if file type is ignored', () => {
      importers[0] = TsRes.Import.Importers.PathImporter.create({
        qualifiers,
        tree,
        ignoreFileTypes: ['.txt']
      }).orThrow();
      importManager = TsRes.Import.ImportManager.create({ resources: resourceManager, importers }).orThrow();
      expect(importManager.importFromFileSystem('/resources.home=PR/readme.txt')).toSucceedAndSatisfy(() => {
        expect(resourceManager.resources.size).toEqual(0);
      });
    });

    test('fails for an malformed file', () => {
      expect(importManager.importFromFileSystem('/broken/US/resources.json')).toFailWith(
        /not a valid json object/i
      );
    });
  });
});
